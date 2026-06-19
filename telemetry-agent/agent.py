import psutil
import socket
import json
import requests
import subprocess
import re
import time
import platform
from datetime import datetime, timezone

API_URL = "http://localhost:5000/api/telemetry"


def get_battery_health():
    # system_profiler is macOS-only; skip on Windows/Linux
    if platform.system() == "Darwin":
        try:
            output = subprocess.check_output(
                ["system_profiler", "SPPowerDataType"],
                text=True
            )
            match = re.search(r"Maximum Capacity:\s*(\d+)%", output)
            if match:
                return int(match.group(1))
        except:
            pass

    # Fallback: use psutil battery percent if available
    try:
        bat = psutil.sensors_battery()
        if bat:
            return round(bat.percent)
    except:
        pass

    return 0


def collect_metrics():

    battery = psutil.sensors_battery()

    ramCapacityGB = round(
        psutil.virtual_memory().total / (1024 ** 3),
        2
    )

    osVersion = platform.platform()

    processCount = len(psutil.pids())

    diskIO = psutil.disk_io_counters()

    diskReadMBps = round(
        diskIO.read_bytes / (1024 * 1024),
        2
    )

    diskWriteMBps = round(
        diskIO.write_bytes / (1024 * 1024),
        2
    )

    data = {
        "deviceId": socket.gethostname(),

        "cpuUsage": round(psutil.cpu_percent(interval=1), 2),

        "cpuTemp": 0,

        "ramUsage": round(psutil.virtual_memory().percent, 2),

        "ramCapacityGB": ramCapacityGB,

        "diskUsage": round(psutil.disk_usage("C:\\" if platform.system() == "Windows" else "/").percent, 2),

        "diskReadMBps": diskReadMBps,

        "diskWriteMBps": diskWriteMBps,

        "processCount": processCount,

        "osVersion": osVersion,

        "batteryHealth": get_battery_health(),

        "cpuPower": 0,

        "batteryPower": 0,

        "fanRpm": 0,

        "smartHealth": 0,

        "gpuUsage": 0,

        "gpuTemp": 0,

        "timestamp": datetime.now(timezone.utc).isoformat().replace("+00:00", "Z")
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