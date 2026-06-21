import time
import requests
import psutil
import random
import sys

import platform
import socket

# Get real hardware metadata using cross-platform psutil
real_hostname = socket.gethostname()
real_os = f"{platform.system()} {platform.release()}"
real_cpu = platform.processor() or "Unknown CPU"
ram_gb = round(psutil.virtual_memory().total / (1024**3))
disk_gb = round(psutil.disk_usage('/').total / (1024**3))

manufacturer = "Original Hardware"
model = platform.node()

# If on Windows, use WMI for exact hardware profile
if platform.system() == "Windows":
    try:
        import wmi
        c = wmi.WMI()
        sys_info = c.Win32_ComputerSystem()[0]
        manufacturer = sys_info.Manufacturer.strip()
        model = sys_info.Model.strip()
        real_cpu = c.Win32_Processor()[0].Name.strip()
    except Exception as e:
        print(f"Warning: WMI could not be loaded ({e})")
elif platform.system() == "Darwin":
    manufacturer = "Apple"


# We've updated this to point to YOUR specific mongoose devices PLUS your actual laptop!
DEMO_DEVICES = ["DELL-DEV-001", "DELL-DEV-002", "DELL-DEV-003", f"MY-LAPTOP-{real_hostname}"]

if len(sys.argv) > 1:
    TARGET_DEVICES = [sys.argv[1]]
else:
    TARGET_DEVICES = DEMO_DEVICES

API_URL = "http://localhost:5000/api/telemetry"

def get_real_telemetry(device_id):
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

    # To make the demo look cool, we artificially spike metrics for the failing devices
    if device_id == "DELL-DEV-002":
        ram_percent = 95.0 + random.uniform(-2, 2)
    elif device_id == "DELL-DEV-003":
        cpu_temp = 96.0 + random.uniform(-2, 2)
        cpu_usage = 98.0 + random.uniform(-1, 1)
        ram_percent = ram.percent
    else:
        # MY-LAPTOP and DELL-DEV-001 use 100% REAL data
        ram_percent = ram.percent

    payload = {
        "deviceId": device_id,
        "orgId": "dell-hackathon-2026",
        "hostname": real_hostname if "MY-LAPTOP" in device_id else None,
        "manufacturer": manufacturer if "MY-LAPTOP" in device_id else "Original Hardware",
        "model": model if "MY-LAPTOP" in device_id else platform.node(),
        "cpu": real_cpu,
        "ram": f"{ram_gb} GB",
        "storage": f"{disk_gb} GB",
        "os": real_os,
        "cpuUsage": round(cpu_usage, 1),
        "cpuTemp": round(cpu_temp, 1),
        "ramUsage": round(ram_percent, 1),
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

print(f"Starting Real-Time Telemetry Agent...")
print(f"Streaming data for: {', '.join(TARGET_DEVICES)}")
print(f"Press Ctrl+C to stop.")

while True:
    for device_id in TARGET_DEVICES:
        try:
            data = get_real_telemetry(device_id)
            response = requests.post(API_URL, json=data)
            
            if response.status_code == 201:
                print(f"[SUCCESS] {device_id} -> CPU: {data['cpuUsage']}% | RAM: {data['ramUsage']}% | Temp: {data['cpuTemp']}°C")
            else:
                print(f"[ERROR] Failed to send for {device_id}: {response.text}")
                
        except Exception as e:
            print(f"[NETWORK ERROR] Could not connect to backend: {e}")
            
    # Wait 3 seconds before sending the next batch
    time.sleep(3)
