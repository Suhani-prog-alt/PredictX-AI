import sys
import os
import time

def print_header(title):
    print("="*70)
    print(f" {title} ".center(70, '='))
    print("="*70 + "\n")

print_header("DELL PREDICTIVE MAINTENANCE BACKGROUND MONITOR")
print("Initializing modules and loading ML models. Please wait...")

import pandas as pd
import numpy as np
import joblib
import psutil
import platform
import warnings
from plyer import notification
import argparse

warnings.filterwarnings('ignore')

try:
    model = joblib.load('../model_artifacts/xgb_telemetry_model.joblib')
    model_cols = joblib.load('../model_artifacts/telemetry_feature_columns.joblib')
except Exception as e:
    print(f"Error loading model: {e}")
    sys.exit(1)

parser = argparse.ArgumentParser(description="Dell Predictive Maintenance Dashboard")
parser.add_argument("--interval", type=int, default=2, help="Scanning interval in seconds (default: 2)")
args = parser.parse_args()

interval = args.interval

device_name = platform.node() or "Unknown Dell Device"
os_version = f"{platform.system()} {platform.release()}"

first_run = True

while True:
    try:
        # Auto-detect RAM
        ram_capacity = round(psutil.virtual_memory().total / (1024**3), 2)
        process_count = len(psutil.pids())

        io_start = psutil.disk_io_counters()
        time.sleep(0.1)
        io_end = psutil.disk_io_counters()

        if io_start and io_end:
            disk_read = round(((io_end.read_bytes - io_start.read_bytes) * 10) / (1024**2), 2)
            disk_write = round(((io_end.write_bytes - io_start.write_bytes) * 10) / (1024**2), 2)
        else:
            disk_read, disk_write = 5.0, 5.0

        battery = psutil.sensors_battery()
        battery_health = float(battery.percent) if battery else 100.0

        cpu_temp = 60.0
        if hasattr(psutil, "sensors_temperatures"):
            temps = psutil.sensors_temperatures()
            if temps and 'coretemp' in temps:
                cpu_temp = float(temps['coretemp'][0].current)

        disk_type = "SSD" 

        # Map to features
        input_data = {col: 0.0 for col in model_cols}
        input_data['ramCapacityGB'] = ram_capacity
        input_data['diskReadSpeed'] = disk_read
        input_data['diskWriteSpeed'] = disk_write
        input_data['processCount'] = process_count
        input_data['batteryHealth'] = battery_health
        input_data['cpuTemp'] = cpu_temp

        input_data['cpuUsage'] = psutil.cpu_percent()
        input_data['gpuUsage'] = 10.0
        input_data['gpuTemp'] = 50.0
        input_data['ramUsage'] = psutil.virtual_memory().percent
        input_data['diskUsage'] = psutil.disk_usage('/').percent
        input_data['smartHealth'] = 90.0
        input_data['deviceAgeYears'] = np.nan 
        input_data['lastMaintenanceDays'] = 30.0

        if "11" in os_version:
            input_data['osVersion_Windows 11'] = 1.0
        elif "10" in os_version:
            input_data['osVersion_Windows 10'] = 1.0

        input_data['diskType_SSD'] = 1.0

        # Engineering features
        input_data['cpu_gpu_load_ratio'] = input_data['cpuUsage'] / (input_data['gpuUsage'] + 1e-5)
        input_data['temp_power_ratio_cpu'] = input_data['cpuTemp'] / (50.0 + 1e-5) 
        input_data['disk_activity_score'] = input_data['diskReadSpeed'] + input_data['diskWriteSpeed']

        df_input = pd.DataFrame([input_data])[model_cols]

        fail_prob = float(model.predict_proba(df_input)[0][1])
        health_score = max(0.0, min(100.0, 100.0 - (fail_prob * 100)))

        # Using updated thresholds
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

        if cpu_temp > 95.0:
            root_cause = "Critical Thermal Throttling"
            pred_component = "CPU"
            recommendation = "IMMEDIATE ACTION: Device is dangerously overheating. Reduce workload."
        elif cpu_temp > 85.0 and input_data['cpuUsage'] < 40.0:
            root_cause = "Cooling System Failure"
            pred_component = "Fan / Heatsink"
            recommendation = "ACTION: High temp under low load detected! Clean fan vents."
        elif battery_health < 20.0:
            root_cause = "Battery Low / Degradation"
            pred_component = "Battery"
            recommendation = "WARNING: Battery is critically low. If it drains too fast, consider replacement."
        elif disk_read < 10.0 and disk_write < 10.0 and fail_prob > 0.4:
            root_cause = "I/O Stalling"
            pred_component = disk_type.upper()
            recommendation = "ACTION: Read/write speeds are highly degraded. Backup your data immediately."
        elif ram_capacity < 8.0 and process_count > 200:
            root_cause = "Memory Paging / Thrashing"
            pred_component = "RAM / OS"
            recommendation = "ACTION: Too many active processes for available RAM. Close apps."
        else:
            if risk_level in ["High", "Critical"]:
                root_cause = "General Wear & Tear"
                pred_component = "Motherboard / Generic"
                recommendation = "CRITICAL ACTION: Severe failure signals detected. Schedule maintenance immediately."
            elif risk_level == "Moderate":
                root_cause = "Early Warning Signs"
                pred_component = "Multiple"
                recommendation = "SUGGESTION: Consider refreshing background apps, cleaning cache, or performing basic disk cleanup to improve smoothness."
            else:
                root_cause = "None"
                pred_component = "None"
                recommendation = "System is operating within healthy parameters."

        is_lagging = False
        lag_reason = "None"
        if input_data['cpuUsage'] >= 95.0:
            is_lagging = True
            lag_reason = "CPU Bottleneck"
        elif input_data['ramUsage'] >= 90.0 and input_data['disk_activity_score'] > 20.0:
            is_lagging = True
            lag_reason = "RAM Thrashing"

        # CLEAR SCREEN FOR LIVE DASHBOARD EFFECT
        os.system('cls' if os.name == 'nt' else 'clear')

        # LIVE DASHBOARD OUTPUT
        if risk_level in ["High", "Critical"] or is_lagging:
            print_header(f"🚨 ALERT: {risk_level.upper()} RISK DETECTED 🚨")
        else:
            print_header(f"DELL PREDICTIVE MAINTENANCE DASHBOARD")

        print("--- HARDWARE TELEMETRY ---")
        print(f"Device Name        : {device_name}")
        print(f"OS Version         : {os_version}")
        print(f"RAM Capacity       : {ram_capacity} GB")
        print(f"Disk Activity      : {disk_read:.1f} MB/s Read | {disk_write:.1f} MB/s Write")
        print(f"CPU Temperature    : {cpu_temp} °C")
        print(f"Battery Health     : {battery_health} %")
        print(f"Process Count      : {process_count}")

        print("\n--- ML PREDICTIONS ---")
        print(f"Health Score       : {health_score:.1f} / 100")
        print(f"Failure Probability: {fail_prob*100:.1f} %")
        print(f"Risk Level         : {risk_level}")
        
        lag_display = f"YES ({lag_reason})" if is_lagging else "NO"
        print(f"System Lagging     : {lag_display}")
        
        print(f"Predicted Component: {pred_component}")
        print(f"Root Cause         : {root_cause}")
        print(f"Est. Failure Window: {days_to_fail}")
        
        print("\n" + "="*70)
        print(f"RECOMMENDATION: {recommendation}")
        # Explicit Backup Suggestion as requested
        if risk_level in ["High", "Critical"]:
            print(">>> CRITICAL SUGGESTION: PLEASE TAKE A FULL BACKUP TO THE CLOUD IMMEDIATELY. <<<")
            try:
                notification.notify(
                    title=f"PredictX-AI: {risk_level.upper()} RISK",
                    message="Critical hardware failure signals detected. Check dashboard.",
                    app_name="Dell Predictive Maintenance",
                    timeout=5
                )
            except Exception:
                pass
        print("="*70 + "\n")
        
        if first_run:
            first_run = False
            user_input = input("Enter update interval in seconds (press Enter for default 2s): ")
            if user_input.strip() == "":
                interval = 2
            else:
                try:
                    interval = int(user_input)
                except ValueError:
                    print("Invalid input. Using default 2 seconds.")
                    interval = 2

        print(f"Live Updating Every {interval}s... Press Ctrl+C to Stop.")

        time.sleep(max(0.1, interval - 0.1)) # -0.1 because disk IO check takes 0.1s

    except KeyboardInterrupt:
        print("\nMonitoring stopped by user.")
        break
