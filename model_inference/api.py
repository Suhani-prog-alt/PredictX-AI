import pandas as pd
import numpy as np
import joblib
import psutil
import time
import platform
import warnings
from fastapi import FastAPI
from pydantic import BaseModel
from typing import Optional
import shap

warnings.filterwarnings('ignore')

app = FastAPI(
    title="Dell Predictive Maintenance API",
    description="Machine Learning backend API for predicting hardware failure in Dell systems.",
    version="1.0"
)

# Load Model globally so it runs instantly
try:
    model = joblib.load('../model_artifacts/xgb_telemetry_model.joblib')
    model_cols = joblib.load('../model_artifacts/telemetry_feature_columns.joblib')
    explainer = shap.TreeExplainer(model)
except Exception as e:
    print(f"Error loading ML model on boot: {e}")
    explainer = None

class TelemetryPayload(BaseModel):
    device_name: Optional[str] = "Unknown Dell Device"
    os_version: Optional[str] = "Windows 11"
    ram_capacity: Optional[float] = None
    disk_read: Optional[float] = None
    disk_write: Optional[float] = None
    process_count: Optional[float] = None
    battery_health: Optional[float] = None
    cpu_temp: Optional[float] = None
    cpu_usage: Optional[float] = None
    ram_usage: Optional[float] = None
    disk_usage: Optional[float] = None
    disk_type: Optional[str] = "SSD"

def auto_detect_hardware():
    io_start = psutil.disk_io_counters()
    time.sleep(0.1)
    io_end = psutil.disk_io_counters()

    if io_start and io_end:
        d_read = round(((io_end.read_bytes - io_start.read_bytes) * 10) / (1024**2), 2)
        d_write = round(((io_end.write_bytes - io_start.write_bytes) * 10) / (1024**2), 2)
    else:
        d_read, d_write = 50.0, 40.0

    # Note: psutil only gives charge percentage, not true wear/degradation. Defaulting to 95.0.
    bat_health = 95.0

    c_temp = 60.0
    if hasattr(psutil, "sensors_temperatures"):
        temps = psutil.sensors_temperatures()
        if temps and 'coretemp' in temps:
            c_temp = float(temps['coretemp'][0].current)

    return {
        "ram": round(psutil.virtual_memory().total / (1024**3), 2),
        "processes": len(psutil.pids()),
        "read": d_read,
        "write": d_write,
        "battery": bat_health,
        "temp": c_temp
    }

@app.get("/")
def health_check():
    return {"status": "ok", "message": "ML Engine online"}

@app.post("/predict")
def predict_hardware_health(payload: TelemetryPayload):
    # Use provided values OR auto-detect if None
    hw = auto_detect_hardware() if any(v is None for v in [payload.ram_capacity, payload.disk_read]) else {}

    ram = payload.ram_capacity if payload.ram_capacity is not None else hw.get("ram", 16.0)
    procs = payload.process_count if payload.process_count is not None else hw.get("processes", 150)
    d_read = payload.disk_read if payload.disk_read is not None else hw.get("read", 50.0)
    d_write = payload.disk_write if payload.disk_write is not None else hw.get("write", 40.0)
    bat = payload.battery_health if payload.battery_health is not None else hw.get("battery", 85.0)
    temp = payload.cpu_temp if payload.cpu_temp is not None else hw.get("temp", 65.0)

    # 1. Map to Model Features
    input_data = {col: 0.0 for col in model_cols}
    input_data['ramCapacityGB'] = ram
    input_data['diskReadSpeed'] = d_read
    input_data['diskWriteSpeed'] = d_write
    input_data['processCount'] = procs
    input_data['batteryHealth'] = bat
    input_data['cpuTemp'] = temp

    # Safe defaults
    input_data['cpuUsage'] = payload.cpu_usage if payload.cpu_usage is not None else psutil.cpu_percent()
    input_data['gpuUsage'] = 10.0
    input_data['gpuTemp'] = 50.0
    input_data['ramUsage'] = payload.ram_usage if payload.ram_usage is not None else 50.0
    input_data['diskUsage'] = payload.disk_usage if payload.disk_usage is not None else 60.0
    input_data['smartHealth'] = 90.0
    input_data['deviceAgeYears'] = np.nan 
    input_data['lastMaintenanceDays'] = 30.0

    if "11" in payload.os_version:
        input_data['osVersion_Windows 11'] = 1.0
    elif "10" in payload.os_version:
        input_data['osVersion_Windows 10'] = 1.0

    if payload.disk_type.upper() == "SSD":
        input_data['diskType_SSD'] = 1.0

    # Feature Engineering
    input_data['cpu_gpu_load_ratio'] = input_data['cpuUsage'] / (input_data['gpuUsage'] + 1e-5)
    input_data['temp_power_ratio_cpu'] = input_data['cpuTemp'] / (50.0 + 1e-5) 
    input_data['disk_activity_score'] = input_data['diskReadSpeed'] + input_data['diskWriteSpeed']

    df_input = pd.DataFrame([input_data])[model_cols]

    # 2. Predict using XGBoost
    fail_prob = float(model.predict_proba(df_input)[0][1])

    # 3. Heuristics Diagnostics Engine
    health_score = max(0.0, min(100.0, 100.0 - (fail_prob * 100)))

    if fail_prob < 0.40:
        risk_level = "Low"
        days_to_fail = "Stable"
    elif fail_prob < 0.70:
        risk_level = "Warning"
        days_to_fail = "7 - 30 Days"
    elif fail_prob < 0.95:
        risk_level = "High"
        days_to_fail = "7 - 30 Days"
    else:
        risk_level = "Critical"
        days_to_fail = "7 - 30 Days"

    root_cause = "Unknown"
    pred_component = "Unknown"
    recommendation = "Standard regular maintenance."

    if temp > 95.0:
        root_cause = "Critical Thermal Throttling"
        pred_component = "CPU"
        recommendation = "IMMEDIATE ACTION: Device is dangerously overheating. Reduce workload to prevent damage."
    elif temp > 85.0 and input_data['cpuUsage'] < 40.0:
        root_cause = "Cooling System Failure"
        pred_component = "Fan / Heatsink"
        recommendation = "ACTION: High temperature under low CPU load detected! Clean fan vents or replace thermal paste."
    elif bat < 50.0:
        root_cause = "Battery Degradation"
        pred_component = "Battery"
        recommendation = "WARNING: Battery capacity is critically low."
    elif d_read < 10.0 and d_write < 10.0 and fail_prob > 0.4:
        root_cause = "I/O Stalling"
        pred_component = payload.disk_type.upper()
        recommendation = "ACTION: Read/write speeds are degraded. Backup your data immediately."
    elif ram < 8.0 and procs > 200:
        root_cause = "Memory Paging / Thrashing"
        pred_component = "RAM / OS"
        recommendation = "ACTION: Too many active processes for available RAM."
    else:
        if risk_level in ["High", "Critical"]:
            root_cause = "General Wear & Tear"
            pred_component = "Motherboard / Generic"
            recommendation = "ACTION: Severe failure signals detected. Full diagnostic recommended."
        else:
            root_cause = "None"
            pred_component = "None"
            recommendation = "System is operating within healthy parameters."

    # System Lag Detection Heuristics
    is_lagging = False
    lag_reason = "None"
    if input_data['cpuUsage'] >= 95.0:
        is_lagging = True
        lag_reason = "CPU Bottleneck (Pegged at 100%)"
    elif input_data['ramUsage'] >= 90.0 and input_data['disk_activity_score'] > 20.0:
        is_lagging = True
        lag_reason = "RAM Thrashing (Paging to Disk)"

    # Explainable AI: SHAP Reasons
    shap_reasons = []
    if explainer and fail_prob > 0.15:
        try:
            shap_vals = explainer.shap_values(df_input)
            # shap_vals is typically an array of shape (1, num_features)
            # Find the top 3 positive contributors pushing toward failure
            vals = shap_vals[0] if len(shap_vals.shape) > 1 else shap_vals
            feature_contributions = list(zip(model_cols, vals))
            # Sort by contribution value descending (only keep positive contributors)
            positive_contributors = sorted([f for f in feature_contributions if f[1] > 0], key=lambda x: x[1], reverse=True)
            
            # Map technical column names to readable strings
            readable_names = {
                'cpuTemp': 'High CPU Temperature',
                'diskReadSpeed': 'Elevated Disk Read Activity',
                'diskWriteSpeed': 'Elevated Disk Write Activity',
                'cpuUsage': 'High CPU Utilization',
                'ramUsage': 'High RAM Utilization',
                'batteryHealth': 'Battery Degradation',
                'diskUsage': 'Low Disk Space',
                'processCount': 'High Process Count',
                'smartHealth': 'Low S.M.A.R.T Health Score',
                'gpuUsage': 'High GPU Load',
                'gpuTemp': 'High GPU Temperature',
                'cpu_gpu_load_ratio': 'CPU-GPU Load Imbalance',
                'temp_power_ratio_cpu': 'Inefficient Power-to-Temp Ratio',
                'disk_activity_score': 'Intensive Disk I/O Thrashing'
            }
            
            for feat, val in positive_contributors[:3]:
                name = readable_names.get(feat, feat)
                shap_reasons.append(f"{name} (+{round(val*100, 1)}% risk factor)")
        except Exception as e:
            print(f"SHAP explanation failed: {e}")
            pass
        
    if not shap_reasons and risk_level != "Low":
        shap_reasons.append("Model detected generic degradation patterns.")

    # 4. Return API Response
    return {
        "status": "success",
        "inputs_used": {
            "device_name": payload.device_name,
            "os_version": payload.os_version,
            "ram_gb": ram,
            "cpu_temp": temp,
            "battery_percent": bat,
            "disk_read_mbs": d_read,
            "disk_write_mbs": d_write,
            "processes": procs
        },
        "diagnostics": {
            "health_score": round(health_score, 1),
            "failure_probability_percent": round(fail_prob * 100, 1),
            "risk_level": risk_level,
            "root_cause": root_cause,
            "predicted_component": pred_component,
            "estimated_failure_window": days_to_fail,
            "system_lagging": is_lagging,
            "lag_reason": lag_reason,
            "recommendation": recommendation,
            "shap_reasons": shap_reasons
        }
    }

if __name__ == "__main__":
    import uvicorn
    # Run the API server on port 8000
    uvicorn.run(app, host="0.0.0.0", port=8000)
