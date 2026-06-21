# PredictX-AI: Technical Architecture & System Design

## 1. High-Level Architecture Overview
PredictX-AI uses a decoupled, microservices-oriented architecture to ensure high scalability and separation of concerns. The architecture is split into three main tiers:

1. **Edge/Client Tier**: Hardware telemetry agents running on host devices.
2. **Web Server Tier**: High-throughput REST API for data ingestion and frontend serving.
3. **Intelligence Tier**: Dedicated ML engine for real-time risk scoring and Explainable AI (XAI).

## 2. Component Details

### A. Telemetry Collection Agent (`agent.py`)
- **Technology**: Python, `psutil`, `requests`
- **Function**: Runs on end-user laptops, servers, or workstations. It hooks directly into the OS kernel via `psutil` to extract hardware metrics (CPU, RAM, GPU, Disk I/O, Battery health, thermals) without needing proprietary vendor APIs.
- **Communication**: Streams telemetry payloads via HTTP POST to the Web Server at configurable intervals.

### B. Web Server Backend (Node.js & Express)
- **Technology**: Node.js, Express.js, MongoDB (Mongoose)
- **Function**: The central nervous system of the platform. It handles authentication, data ingestion, and routes inference requests to the Intelligence Tier.
- **Key Features**:
  - **Stateless REST APIs**: Clean API design (`/api/telemetry`, `/api/devices`) allows easy integration with external tools (ServiceNow, Splunk).
  - **Server-Sent Events (SSE)**: Pushes live dashboard updates to the React frontend with zero-polling overhead.
  - **Multi-Tenant Org Management**: Allows different clients to securely isolate their fleet data.

### C. ML Inference Engine (FastAPI & XGBoost)
- **Technology**: Python, FastAPI, XGBoost, SHAP
- **Function**: A dedicated, horizontally scalable inference API. When the Node.js server receives new telemetry, it forwards it here.
- **Key Features**:
  - **XGBoost Classifier**: Ultra-fast predictive modeling, optimized for tabular hardware data.
  - **SHAP (SHapley Additive exPlanations)**: Calculates the exact contribution of every metric (e.g., "High Temp contributed +40% to risk") to provide Explainable AI insights for IT admins.

### D. Frontend Presentation Layer (React.js)
- **Technology**: React, Tailwind CSS, Recharts, Framer Motion
- **Function**: A premium, dark-mode IT operations dashboard.
- **Key Modules**:
  - **Fleet Dashboard**: High-level overview of total devices and risk states.
  - **Maintenance Optimization**: Batches alerts into actionable maintenance windows to reduce truck-roll costs.
  - **MLOps & Training**: Visualizes model performance (Confusion Matrix, Feature Importance).
  - **Interactive Diagnostics**: Self-troubleshooting tool that pings the Database, Backend, and ML Engine to ensure system health.

### E. Mobile Operations App (React Native)
- **Technology**: React Native, Expo, React Navigation (Drawer & Bottom Tabs)
- **Function**: Extends the web dashboard to iOS and Android, empowering IT admins to monitor global fleet health on the go.
- **Key Features**:
  - **Web-Parity UI**: Mirrors the exact "Hacker/Enterprise" aesthetic of the web application (monospace fonts, dark mode, orange accents).
  - **Hybrid Navigation**: Utilizes a combination of Bottom Tabs for quick thumb-reach access, and a comprehensive Drawer Sidebar for deep operations.
  - **Live Telemetry Grid**: Integrates directly with the Node.js API to fetch high-frequency updates on hardware metrics and AI risk predictions.

### F. Privacy-Preserving Federated Learning (Simulation)
- **Technology**: Python, XGBoost, Scikit-Learn (`StandardScaler`)
- **Function**: A standalone Proof-of-Concept (`federated_learning_poc.py`) demonstrating how the ML Engine can scale across multiple enterprise organizations.
- **Key Features**:
  - **Decentralized Data**: Splits a hardware failure dataset between isolated silos (e.g., Bank vs. Hospital).
  - **Mathematical Aggregation**: Trains independent XGBoost models locally and merges their mathematical parameters centrally, achieving a 63.95% F1-Score without ever exposing raw telemetry data.

## 3. Data Flow Execution (Step-by-Step)
1. `agent.py` extracts hardware stats and posts JSON to `Node.js Server`.
2. `Node.js Server` saves raw telemetry to `MongoDB`.
3. `Node.js Server` instantly forwards the telemetry to the `FastAPI ML Engine`.
4. `FastAPI` runs the XGBoost model, calculates SHAP values, and returns a 0-100 `healthScore`, `riskLevel`, and `rootCause`.
5. `Node.js Server` saves the prediction to `MongoDB`.
6. `Node.js Server` pushes the updated prediction to the `React Frontend` via an SSE stream, and mobile app via REST polling.
7. The IT Admin sees the UI update in real-time across both Web and Mobile platforms.
