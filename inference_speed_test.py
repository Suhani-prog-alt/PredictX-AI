import time
import joblib
import pandas as pd
import numpy as np
import warnings
warnings.filterwarnings('ignore')

# 1. Simulate Application Startup (Load Models ONCE)
print("Loading models (App Startup)...")
start_load = time.time()
xgb_telemetry_model_loaded = joblib.load('model_artifacts/xgb_telemetry_model.joblib')
xgb_ai4i_model_loaded = joblib.load('model_artifacts/xgb_ai4i_model.joblib')
telemetry_feature_columns = joblib.load('model_artifacts/telemetry_feature_columns.joblib')
ai4i_feature_columns = joblib.load('model_artifacts/ai4i_feature_columns.joblib')
load_time = time.time() - start_load
print(f"Models loaded in {load_time:.4f} seconds.\n")

# 2. Define Inference Function (Optimized for speed)
def predict_health(telemetry_data):
    # Convert to DataFrame
    df = pd.DataFrame([telemetry_data], columns=telemetry_feature_columns)
    df = df.fillna(0).astype(float)
    
    # Predict
    prob = xgb_telemetry_model_loaded.predict_proba(df)[:, 1][0]
    health_score = (1 - prob) * 100
    
    return prob, health_score

# 3. Create a dummy data point
dummy_telemetry_data = {col: 50.0 for col in telemetry_feature_columns}

# 4. Warm-up run (first run is sometimes slightly slower)
predict_health(dummy_telemetry_data)

# 5. Benchmark Inference Speed
print("Benchmarking prediction time over 100 iterations...")
times = []
for _ in range(100):
    start = time.perf_counter()
    prob, hs = predict_health(dummy_telemetry_data)
    end = time.perf_counter()
    times.append(end - start)

avg_time_sec = sum(times) / len(times)
avg_time_ms = avg_time_sec * 1000

print("-" * 40)
print(f"Average Inference Time: {avg_time_ms:.3f} milliseconds")
print(f"Max Inference Time:     {max(times)*1000:.3f} milliseconds")
print("-" * 40)
print(f"Is this under 5 seconds? {'YES' if avg_time_sec < 5 else 'NO'}")
