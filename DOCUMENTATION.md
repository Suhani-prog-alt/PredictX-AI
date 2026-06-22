# PredictX-AI — Complete Project Documentation

## What is PredictX-AI?

PredictX-AI is a real-time hardware failure prediction and monitoring system.
It collects live hardware telemetry from machines, runs it through an ML model,
predicts failure probability, and displays everything on a live dashboard.

---

## Team Contributions

| Module | Who |
|--------|-----|
| Backend (Node.js + MongoDB) | Kritika & Dhriti |
| Frontend (React Dashboard) | Palak & Dhriti |
| Mobile App (React Native) | Suhani |
| Telemetry Agent (Python) | Shinjineedheer036 |
| ML Model + FastAPI | Suhani |
| Federated Learning PoC | Suhani |

---

## System Architecture

```
[Target Machine]
      |
  agent.py (Python)
  - Collects CPU, RAM, Disk, Battery, Fan, GPU metrics
  - Sends POST /api/telemetry every 10 seconds
      |
      v
[Backend — Node.js / Express]
  - Receives telemetry
  - Saves to MongoDB
  - Calls ML API for prediction
  - Saves prediction to MongoDB
  - Broadcasts real-time update via SSE
      |
      |-----> [ML API — FastAPI / Python]
      |         - XGBoost model inference
      |         - Returns health score, risk level, root cause
      |
      v
[MongoDB]
  - Devices collection
  - Telemetry collection
  - Predictions collection
      |
      v
[Frontend — React / Vite]
  - Connects to backend REST APIs
  - Listens to SSE stream for live updates
  - Displays dashboard, charts, alerts, predictions

[Mobile App — React Native / Expo]
  - Connects to backend REST APIs
  - Displays mobile-optimized live telemetry
  - Provides hardware alerts and prediction metrics on the go
```

---

## Module 1 — Telemetry Agent (`telemetry-agent/agent.py`)

**Language:** Python  
**Who built it:** Shinjineedheer036

### What it does:
Runs on any target machine (Windows/Mac/Linux) and collects hardware metrics every 10 seconds.

### Metrics collected:
| Metric | Source |
|--------|--------|
| CPU Usage (%) | psutil.cpu_percent |
| CPU Temperature (°C) | psutil.sensors_temperatures / estimated |
| RAM Usage (%) | psutil.virtual_memory |
| RAM Capacity (GB) | psutil.virtual_memory.total |
| Disk Usage (%) | psutil.disk_usage |
| Disk Read/Write Speed (MB/s) | psutil.disk_io_counters |
| Battery Health (%) | system_profiler (Mac) / psutil fallback |
| Fan RPM | psutil.sensors_fans / estimated |
| GPU Usage & Temp | Estimated from CPU load |
| CPU Power (W) | Estimated |
| Process Count | psutil.pids |
| OS Version | platform.platform |
| SMART Health | Simulated (95–100) |

### Cross-platform support:
- Windows: uses `C:\` for disk, psutil battery
- Mac: uses `system_profiler` for battery health
- Linux: uses `/` for disk

### How to run:
```bash
cd telemetry-agent
pip install psutil requests
python agent.py
```

---

## Module 2 — Backend (`backend/`)

**Language:** Node.js + Express  
**Database:** MongoDB (Mongoose)  
**Who built it:** Kritika & Dhriti

### Server Setup:
- `server.js` — starts Express server on PORT (default 5000), connects MongoDB
- `app.js` — registers all routes, CORS, JSON middleware, error handler
- `config/db.js` — MongoDB connection via Mongoose

### Models:

**Device** (`models/Device.js`)
```
deviceId, hostname, manufacturer, model, cpu, ram, storage, os
```

**Telemetry** (`models/Telemetry.js`)
```
deviceId, cpuUsage, cpuTemp, ramUsage, ramCapacityGB, diskUsage,
diskReadMBps, diskWriteMBps, processCount, batteryHealth, cpuPower,
batteryPower, fanRpm, smartHealth, gpuUsage, gpuTemp, timestamp
```

**Prediction** (`models/Prediction.js`)
```
deviceId, healthScore, failureProbability, riskLevel,
predictedComponent, rootCause, recommendation[], timestamp
```

### API Endpoints:

**Telemetry**
| Method | Endpoint | What it does |
|--------|----------|--------------|
| POST | /api/telemetry | Receives agent data, saves telemetry, gets ML prediction, saves prediction, broadcasts SSE |

**Dashboard**
| Method | Endpoint | What it does |
|--------|----------|--------------|
| GET | /api/dashboard/summary | Returns total/critical/warning/healthy device counts |
| GET | /api/dashboard/devices | Returns all devices with their latest prediction |
| GET | /api/dashboard/devices/:deviceId | Returns device detail + last 10 telemetry + last 10 predictions |
| GET | /api/dashboard/stream | SSE stream for real-time updates |

**Predictions**
| Method | Endpoint | What it does |
|--------|----------|--------------|
| GET | /api/predictions/:deviceId | All predictions for a device |
| GET | /api/predictions/:deviceId/latest | Most recent prediction |

**History**
| Method | Endpoint | What it does |
|--------|----------|--------------|
| GET | /api/history/:deviceId/telemetry | Paginated telemetry history (?page=1&limit=50) |
| GET | /api/history/:deviceId/predictions | Paginated prediction history |

**SSE Stream**
| Method | Endpoint | What it does |
|--------|----------|--------------|
| GET | /api/stream | Alternative SSE endpoint |

### Services:

**mlService.js** — Calls FastAPI ML API. If ML API is unreachable, falls back to a heuristic engine that calculates risk from telemetry thresholds.

**recommendationService.js** — Generates human-readable action recommendations based on failure probability.

**streamService.js** — Manages SSE client connections. Broadcasts live updates to all connected frontend clients.

### How to run:
```bash
cd backend
npm install
# Create .env file with:
# PORT=5000
# MONGO_URI=mongodb://localhost:27017/predictx
# ML_API=http://127.0.0.1:8000/predict
npm run dev
```

---

## Module 3 — ML Service (`model_inference/api.py`)

**Language:** Python + FastAPI  
**Model:** XGBoost (trained on telemetry + Backblaze + AI4I datasets)  
**Who built it:** Suhani

### What it does:
Receives telemetry data, runs it through a trained XGBoost classifier, and returns a prediction.

### Input (POST /predict):
```json
{
  "device_name": "Dhriti",
  "os_version": "Windows 11",
  "ram_capacity": 16.0,
  "disk_read": 120.5,
  "disk_write": 80.2,
  "process_count": 180,
  "battery_health": 71.0,
  "cpu_temp": 55.0,
  "disk_type": "SSD"
}
```

### Output:
```json
{
  "status": "success",
  "diagnostics": {
    "health_score": 78.5,
    "failure_probability_percent": 21.5,
    "risk_level": "Low",
    "root_cause": "None",
    "predicted_component": "None",
    "estimated_failure_window": "> 365 Days",
    "system_lagging": false,
    "lag_reason": "None",
    "recommendation": "System is operating within healthy parameters."
  }
}
```

### Risk Levels:
| Risk | Failure Probability | Failure Window |
|------|--------------------|--------------:|
| Low | < 40% | > 365 days |
| Moderate | 40–70% | 90–365 days |
| High | 70–95% | 30–90 days |
| Critical | > 95% | 1–14 days |

### Models trained:
- `xgb_telemetry_model.joblib` — main model used for live prediction
- `xgb_backblaze_model.joblib` — trained on Backblaze HDD failure dataset
- `xgb_ai4i_model.joblib` — trained on AI4I manufacturing dataset

### How to run:
```bash
cd model_inference
pip install fastapi uvicorn pandas numpy joblib scikit-learn xgboost
python api.py
# Runs on http://localhost:8000
```

---

## Module 4 — Frontend (`frontend/`)

**Language:** React + Vite  
**Libraries:** Chart.js, react-chartjs-2, Lucide Icons  
**Who built it:** Palak & Dhriti

### Pages / Views:

**Overview** (`Overview.jsx`)
- Summary cards: Total Devices, Critical, Warning, Healthy
- Device status table with risk badges
- Quick navigation to alerts and device detail

**Device List** (`DeviceList.jsx`)
- Lists all registered devices
- Shows latest health score, risk level, failure probability per device
- Click any device → opens Device Analytics

**Device Analytics** (`DeviceDetail.jsx`)
- Hardware profile (CPU, RAM, Storage, OS)
- Live telemetry widgets (CPU temp, CPU usage, RAM, Disk, Fan RPM, Battery)
- ML assessment card (root cause, predicted component, recommendations)
- Time to Failure estimate
- 4 historical charts:
  - Performance History (CPU % + RAM %)
  - Thermal Trend (CPU temp + GPU temp)
  - Failure Probability Trend
  - Power Consumption Trend (CPU power + Battery power)
- Auto-refreshes every 5 seconds + real-time SSE updates

**Alerts** (`Alerts.jsx`)
- Categorized alerts: Critical → Warning → Info
- Each alert shows: device name, affected component, risk score, failure window, root cause
- "Schedule Maintenance" → goes to Maintenance page
- "Emergency Hardware Swap" → goes to Maintenance page
- "View Device" → goes to Device Analytics
- "View Telemetry" → goes to Device Analytics

**Predictions** (`Predictions.jsx`)
- ML prediction results per device
- Health scores and failure probabilities

**System Health** (`SystemHealth.jsx`)
- Backend connectivity status
- Platform and ML service health indicators

**Maintenance Optimization** (`MaintenanceOptimization.jsx`)
- Maintenance scheduling recommendations
- Priority-based maintenance queue

**Telemetry Simulator** (`TelemetrySimulator.jsx`)
- Demo mode — simulates agent data without running Python agent
- Useful for presentations/demos without real hardware

### Real-time Updates:
Frontend connects to `GET /api/dashboard/stream` (SSE) and receives live pushes every time the agent sends new telemetry. No manual refresh needed.

---

## Module 5 — Mobile App (`mobile-app/`)

**Language:** React Native + Expo  
**Libraries:** React Navigation (Drawer/Tabs), Axios  
**Who built it:** Suhani

### Pages / Views:

**Overview** (`OverviewScreen.js`)
- High-level mobile dashboard showing Total Devices, Critical, and Warning counts
- Actionable "Simulate Emergency" capabilities

**Alerts** (`AlertSystemScreen.js`)
- Mobile list of all active device alerts categorized by risk level
- Tap any alert to drill down into device telemetry

**Devices** (`DashboardScreen.js`)
- Complete scrollable registry of all connected devices and hostnames

**Device Analytics** (`AlertManagementScreen.js`)
- Detailed live telemetry grid optimized for mobile screens
- Displays CPU Temp, Disk Read, Process Count, and Risk Status

### Navigation Architecture:
- Uses a hybrid routing setup: a **Drawer Sidebar** (matching the exact Hacker web aesthetic) wrapping **Bottom Tabs** for fast, one-handed operation.

### How to run:
```bash
cd mobile-app
npm install
npx expo start -c
```

---

## Data Flow (End to End)

```
1. agent.py collects metrics from your machine
2. POST to http://localhost:5000/api/telemetry
3. Backend saves Telemetry to MongoDB
4. Backend calls FastAPI ML API → gets prediction
   (if ML API down → heuristic fallback runs locally)
5. Backend saves Prediction to MongoDB
6. Backend broadcasts SSE event to all connected frontends
7. React frontend receives SSE → updates charts and widgets live
8. User sees real-time graphs, health score, TTF, recommendations
```

---

## Environment Variables (`backend/.env`)

```
PORT=5000
MONGO_URI=mongodb://localhost:27017/predictx
ML_API=http://127.0.0.1:8000/predict
```

---

## Running the Full Project

Open 5 terminals:

```bash
# Terminal 1 — Backend
cd backend && npm run dev

# Terminal 2 — ML API
cd model_inference && python api.py

# Terminal 3 — Frontend
cd frontend && npm run dev

# Terminal 4 — Telemetry Agent
cd telemetry-agent && python agent.py

# Terminal 5 — Mobile App
cd mobile-app && npx expo start -c
```

Frontend runs at: `http://localhost:5173`  
Backend runs at: `http://localhost:5000`  
ML API runs at: `http://localhost:8000`

---

## Tech Stack Summary

| Layer | Technology |
|-------|-----------|
| Frontend | React 19, Vite, Chart.js, Lucide Icons |
| Mobile App | React Native, Expo, React Navigation |
| Backend | Node.js, Express 5, Mongoose |
| Database | MongoDB |
| ML API | FastAPI, Python, XGBoost, pandas, scikit-learn |
| Agent | Python, psutil, requests |
| Real-time | Server-Sent Events (SSE) |
| Version Control | Git + GitHub |

---

## Module 5 — Dell OpenManage Vendor Integration (`/vendor-info`)

**Language:** Node.js (Backend) + React (Frontend)  
**Who built it:** Dhriti

### What it does:
Integrates hardware asset records, contract databases, and firmware versions from Dell OpenManage / iDRAC systems. It displays connection logs and alerts administrators when support warranties are expiring.

### API Endpoint (GET /vendor-info):
Fetches Dell OpenManage asset inventory and support contracts.

#### Response Payload (JSON):
```json
{
  "vendorName": "Dell Inc.",
  "assetTag": "JP-8X49-C10",
  "deviceModel": "PowerEdge R750",
  "firmwareVersion": "iDRAC9 v6.10.05.00",
  "warrantyStatus": "Active (ProSupport Plus)",
  "warrantyExpiryDate": "2026-08-15T00:00:00.000Z",
  "connectionStatus": "Connected",
  "openManageVersion": "v4.1.0",
  "lastSyncTime": "2026-06-21T17:40:00.000Z",
  "systemAlerts": 0,
  "hardwareHealth": "Nominal"
}
```

### Dashboard View (`VendorIntegration.jsx`):
- Dell Connectivity Status: Live pulse indicator of OpenManage API integrations.
- Firmware Profile: Tracks iDRAC configuration versions.
- Warranty Status & Expiry tracking.
- Dynamic 60-day warning alert badge for contract renewal.
- API Documentation panel for developers.

---

## Module 6 — Privacy-Preserving Federated Learning (`federated_learning_poc.py`)

**Language:** Python + XGBoost + Scikit-Learn  
**Who built it:** Suhani

### What it does:
Demonstrates that the PredictX-AI prediction model can be trained collaboratively across isolated organizations without exposing any raw telemetry data. It splits the `ai4i2020` dataset into isolated silos, trains independent local models, and then mathematically merges them at a central server.

### Key Optimization Highlights:
- **Feature Scaling (`StandardScaler`)**: Implemented to fix SMOTE's K-Nearest Neighbor distance calculations. Since raw dataset features vary wildly (1500 RPM vs 40 Nm), scaling the features ensures the synthetic minority over-sampling perfectly captures failure boundary conditions.
- **Accuracy Boost**: With scaling and deeper tree parameters (`n_estimators=300`, `max_depth=10`), the Global Federated Model achieves an optimized **63.95% F1-Score** (up from the baseline 49.25%) on a massive 96% imbalanced dataset.
- **Overall Accuracy**: 97.35%.

### How to run:
```bash
python model_inference/federated_learning_poc.py
```

