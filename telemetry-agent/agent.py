import psutil
import socket
import json
import requests
import subprocess
import re
import time
import platform
import random
from datetime import datetime, timezone



API_URL = "http://localhost:5000/api/telemetry"

def get_battery_health():
    # macOS battery health
    if platform.system() == "Darwin":
        try:
            output = subprocess.check_output(["system_profiler", "SPPowerDataType"], text=True)
            match = re.search(r"Maximum Capacity:\s*(\d+)%", output)
            if match:
                return int(match.group(1))
        except:
            pass

    # Windows/Linux battery percentage
    try:
        bat = psutil.sensors_battery()
        if bat:
            return round(bat.percent)
    except:
        pass
    return 0

try:
    import wmi
except ImportError:
    wmi = None

def get_hardware_info():
    info = {
        "manufacturer": "Unknown",
        "model": "Generic Device",
        "cpu": "Unknown CPU",
        "ram": f"{round(psutil.virtual_memory().total / (1024 ** 3), 2)} GB",
        "storage": "Unknown SSD",
        "os": "Unknown OS"
    }

    if platform.system() == "Windows":
        # First try using the Python WMI package if it's installed (more reliable on some PCs)
        if wmi is not None:
            try:
                c = wmi.WMI()
                cs = c.Win32_ComputerSystem()[0]
                cpu_obj = c.Win32_Processor()[0]
                os_obj = c.Win32_OperatingSystem()[0]
                disk = c.Win32_DiskDrive()[0]
                
                info.update({
                    "manufacturer": cs.Manufacturer,
                    "model": cs.Model,
                    "cpu": cpu_obj.Name,
                    "storage": f"{int(disk.Size) // (1024 ** 3)} GB SSD",
                    "os": os_obj.Caption
                })
                return info
            except Exception as e:
                pass # Fallback to wmic
                
        # Fallback to wmic command line
        try:
            model = subprocess.check_output(["wmic", "computersystem", "get", "model"], text=True).split('\n')[1].strip()
            manufacturer = subprocess.check_output(["wmic", "computersystem", "get", "manufacturer"], text=True).split('\n')[1].strip()
            cpu = subprocess.check_output(["wmic", "cpu", "get", "name"], text=True).split('\n')[1].strip()
            disk_bytes = subprocess.check_output(["wmic", "diskdrive", "get", "size"], text=True).split('\n')[1].strip()
            storage = f"{int(disk_bytes) // (1024 ** 3)} GB SSD"
            os_info = subprocess.check_output(["wmic", "os", "get", "caption"], text=True).split('\n')[1].strip()

            info.update({
                "manufacturer": manufacturer,
                "model": model,
                "cpu": cpu,
                "storage": storage,
                "os": os_info
            })
        except:
            info["os"] = f"{platform.system()} {platform.release()}"
    elif platform.system() == "Darwin": # macOS
        try:
            cpu = subprocess.check_output(["sysctl", "-n", "machdep.cpu.brand_string"], text=True).strip()
            model = subprocess.check_output(["sysctl", "-n", "hw.model"], text=True).strip()
            os_ver = subprocess.check_output(["sw_vers", "-productVersion"], text=True).strip()
            info.update({
                "manufacturer": "Apple",
                "model": model,
                "cpu": cpu,
                "storage": "Apple SSD",
                "os": f"macOS {os_ver}"
            })
        except:
            info["os"] = f"{platform.system()} {platform.release()}"
            
    return info

cumulative_reallocated_sectors = 0
loop_count = 0

def collect_metrics():
    global cumulative_reallocated_sectors, loop_count
    
    loop_count += 1
    # For HACKATHON DEMO: Increase reallocated sectors quickly so it fails within a minute
    if loop_count % 3 == 0:
        cumulative_reallocated_sectors += random.randint(1, 3)

    hardware = get_hardware_info()

    battery = psutil.sensors_battery()

    ramCapacityGB = round(
        psutil.virtual_memory().total / (1024 ** 3),
        2
    )

    osVersion = platform.platform()

    processCount = len(psutil.pids())

    diskIO_start = psutil.disk_io_counters()
    time.sleep(0.1)
    diskIO_end = psutil.disk_io_counters()

    diskReadMBps = round(
        ((diskIO_end.read_bytes - diskIO_start.read_bytes) * 10) / (1024 * 1024),
        2
    )

    diskWriteMBps = round(
        ((diskIO_end.write_bytes - diskIO_start.write_bytes) * 10) / (1024 * 1024),
        2
    )

    cpuUsage = round(psutil.cpu_percent(interval=1), 2)

    # CPU Temperature
    cpuTemp = 0.0

    if hasattr(psutil, "sensors_temperatures"):
        try:
            temps = psutil.sensors_temperatures()

            if temps:
                for name, entries in temps.items():
                    if entries:
                        cpuTemp = round(entries[0].current, 1)
                        break

        except:
            pass

    if cpuTemp == 0.0:
        cpuTemp = round(
            40.0 + (cpuUsage * 0.45) + random.uniform(-1.5, 1.5),
            1
        )

    # Fan RPM
    fanRpm = 0

    if hasattr(psutil, "sensors_fans"):
        try:
            fans = psutil.sensors_fans()

            if fans:
                for name, entries in fans.items():
                    if entries:
                        fanRpm = entries[0].current
                        break

        except:
            pass

    if fanRpm == 0:

        if cpuTemp < 52:
            fanRpm = (
                1000
                + int(cpuTemp * 12)
                + random.randint(-40, 40)
            )

        else:
            fanRpm = (
                1500
                + int((cpuTemp - 52) * 85)
                + random.randint(-80, 80)
            )

    fanRpm = max(0, fanRpm)

    # GPU metrics
    gpuUsage = round(
        max(0.0, cpuUsage * 0.35 + random.uniform(-4, 4)),
        1
    )

    gpuTemp = round(
        38.0 + (gpuUsage * 0.38) + random.uniform(-1.2, 1.2),
        1
    )

    # Power
    cpuPower = round(
        10.0 + (cpuUsage * 0.45) + random.uniform(-0.8, 0.8),
        2
    )

    batteryPower = (
        round(
            12.0 + (cpuUsage * 0.15) + random.uniform(-0.5, 0.5),
            2
        )
        if battery and not battery.power_plugged
        else 0.0
    )

    # SMART Health
    smartHealth = random.choice(
        [95, 96, 97, 98, 99, 100]
    )

    # Real Voltage Detection
    try:
        if platform.system() == "Windows":
            # CurrentVoltage often returns a value where lower 7 bits are the voltage in tenths of a volt
            voltage_str = subprocess.check_output(["wmic", "path", "Win32_Processor", "get", "CurrentVoltage"], text=True).split('\n')[1].strip()
            if voltage_str.isdigit():
                val = int(voltage_str)
                # If bit 7 is set (value >= 128), it's a legacy reading. Usually it's just the value / 10.
                base_voltage = (val & 0x7F) / 10.0
            else:
                base_voltage = 1.0 # default fallback
        else:
            base_voltage = 1.0 # fallback for non-Windows
    except:
        base_voltage = 1.0
        
    # Add minor real-time fluctuation based on CPU load (since WMI doesn't update instantly)
    psu_fluctuation = round(base_voltage + (cpuUsage / 100.0) * 0.05 + random.uniform(-0.01, 0.01), 3)

    data = {

        "deviceId": socket.gethostname(),

        "manufacturer": hardware["manufacturer"],
        "model": hardware["model"],
        "cpu": hardware["cpu"],
        "ram": hardware["ram"],
        "storage": hardware["storage"],
        "os": hardware["os"],

        "cpuUsage": cpuUsage,
        "cpuTemp": cpuTemp,

        "ramUsage": round(
            psutil.virtual_memory().percent,
            2
        ),

        "ramCapacityGB": ramCapacityGB,

        "diskUsage": round(
            psutil.disk_usage(
                "C:\\" if platform.system() == "Windows" else "/"
            ).percent,
            2
        ),

        "diskReadMBps": diskReadMBps,
        "diskWriteMBps": diskWriteMBps,

        "processCount": processCount,

        "osVersion": osVersion,

        "batteryHealth": get_battery_health(),

        "cpuPower": cpuPower,
        "batteryPower": batteryPower,

        "fanRpm": fanRpm,

        "smartHealth": smartHealth,
        "smartReallocatedSectors": cumulative_reallocated_sectors,
        "psuVoltageFluctuation": psu_fluctuation,

        "gpuUsage": gpuUsage,
        "gpuTemp": gpuTemp,

        "timestamp": datetime.now(timezone.utc)
        .isoformat()
        .replace("+00:00", "Z")
    }

    return data


while True:

    payload = collect_metrics()

    print(json.dumps(payload, indent=4))

    try:
        response = requests.post(
            API_URL,
            json=payload,
            timeout=5
        )

        print("Status:", response.status_code)
        print("Response:", response.text)

    except Exception as e:
        print("Error:", e)

    print("-" * 50)

    time.sleep(10)