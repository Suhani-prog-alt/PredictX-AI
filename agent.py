import time
import requests
import psutil
import random

# Replace this with the exact Device ID you see in your dashboard for your registered device
DEVICE_ID = "12e735600d2a"
API_URL = "http://localhost:5000/api/telemetry"

def get_real_telemetry():
    # Read real hardware data using psutil
    cpu_usage = psutil.cpu_percent(interval=1)
    ram = psutil.virtual_memory()
    disk = psutil.disk_usage('/')
    
    # Battery info (if available, otherwise fallback)
    battery = psutil.sensors_battery()
    battery_percent = battery.percent if battery else 100
    
    # Temperatures are notoriously hard to get uniformly across OSs in Python, 
    # so we'll estimate a temp based on your real CPU load for this demo
    base_temp = 40
    cpu_temp = base_temp + (cpu_usage * 0.4) + random.uniform(-2, 2)

    payload = {
        "deviceId": DEVICE_ID,
        "cpuUsage": round(cpu_usage, 1),
        "cpuTemp": round(cpu_temp, 1),
        "ramUsage": round(ram.percent, 1),
        "diskUsage": round(disk.percent, 1),
        "batteryHealth": round(battery_percent, 1),
        "cpuPower": round(15 + (cpu_usage * 0.3), 1), # Estimated watts
        "batteryPower": 10,
        "fanRpm": int(2000 + (cpu_usage * 30)), # Estimated RPM based on load
        "smartHealth": 100,
        "gpuUsage": round(cpu_usage * 0.5, 1), # Roughly correlate to CPU for demo
        "gpuTemp": round(cpu_temp - 5, 1),
        "processCount": len(psutil.pids())
    }
    
    return payload

print(f"Starting Real-Time Telemetry Agent for {DEVICE_ID}...")
print(f"Streaming data to {API_URL} every 5 seconds. Press Ctrl+C to stop.")

while True:
    try:
        data = get_real_telemetry()
        response = requests.post(API_URL, json=data)
        
        if response.status_code == 201:
            print(f"[SUCCESS] Sent Real Telemetry -> CPU: {data['cpuUsage']}% | RAM: {data['ramUsage']}% | Temp: {data['cpuTemp']}°C")
        else:
            print(f"[ERROR] Failed to send: {response.text}")
            
    except Exception as e:
        print(f"[NETWORK ERROR] Could not connect to backend: {e}")
        
    # Wait 5 seconds before reading sensors again
    time.sleep(5)
