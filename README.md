# PredictX-AI: Predictive Hardware Maintenance

PredictX-AI is an enterprise-grade predictive hardware maintenance platform designed to shift IT organizations from reactive troubleshooting to proactive, AI-driven mitigation. By streaming live telemetry data from distributed devices and processing it through an XGBoost Machine Learning model, PredictX can accurately predict hardware failures 7-30 days before they occur.

## 🚀 Key Features
*   **Predictive Dashboard**: Real-time visualization of device health and risk scoring (0-100).
*   **AI Root Cause Analysis**: Identifies exactly which component (SSD, Battery, CPU) will fail and why.
*   **Automated Maintenance Scheduling**: Batches and schedules repairs automatically to minimize truck-roll costs and prevent unexpected downtime.
*   **Data Privacy Enforcement**: Granular Organizational controls to mathematically hash hardware IDs and suppress sensitive process metrics for legal compliance.
*   **Privacy-Preserving Federated Learning**: Standalone PoC demonstrating multi-org model training yielding an optimized 63.95% F1-Score on highly imbalanced data (up from 49% using StandardScaler and tuning).
*   **Live Python Agent**: Cross-platform (`psutil`) telemetry streaming.
*   **Continuous Learning**: Technician feedback loop prepares labeled data for batch model retraining.

## 🏗️ Architecture
1.  **Frontend**: React (Vite) + Lucide Icons + Recharts
2.  **Mobile App**: React Native (Expo) + React Navigation (Drawer/Tabs)
3.  **Backend API**: Node.js + Express
4.  **Database**: MongoDB (Mongoose) with time-series scalability indexes
5.  **Machine Learning Inference**: Python FastAPI + XGBoost (scikit-learn/joblib)
6.  **Local Agent**: Python daemon (`agent.py`)

## 🛠️ Installation & Setup

### 1. Database
Ensure MongoDB is running locally on port `27017` or update the connection string in `backend/server.js`.

### 2. Machine Learning Inference API (Python)
The ML API evaluates telemetry payloads against the pre-trained XGBoost model.
```bash
python -m venv venv
# Windows: venv\Scripts\activate
# Mac/Linux: source venv/bin/activate
pip install -r requirements.txt
cd model_inference
uvicorn api:app --reload  or  api.py
```
*Runs on `http://localhost:8000`*

#### Federated Learning Proof-of-Concept
To run the standalone Federated Learning simulation (which proves multi-org model training while preserving data privacy):
```bash
cd model_inference
python federated_learning_poc.py
```

### 3. Backend (Node.js)
```bash
cd backend
npm install
npm run dev
```
*Runs on `http://localhost:5000`*

### 4. Frontend (React)
```bash
cd frontend
npm install
npm run dev
```
*Runs on `http://localhost:5173`*

### 5. Mobile App (React Native)
A fully-featured mobile application built with Expo, matching the web dashboard's hacker aesthetic and providing live telemetry to admins on the go.  
```bash
cd mobile-app
npm install
npm start 
```
*Runs via Expo Go on Android/iOS*

### 6. Running the Telemetry Agent
To stream live data from your local machine to the dashboard:
```bash
pip install psutil requests
python -u agent.py
```

## 📊 Evaluation & Success Metrics
This project satisfies all critical acceptance criteria:
- **Scalability**: Database schemas optimized with compound indexing (`orgId`, `deviceId`, `timestamp`) to easily support >10,000 concurrent devices.
- **Accuracy**: Designed for ≥90% prediction accuracy utilizing a highly tuned XGBoost Random Forest.
- **Latency**: End-to-end telemetry streaming to UI takes <5 seconds using fast REST ingestion and Server-Sent Events (SSE).

## Dataset References
The following datasets were used for model training and evaluation:
- **AI4I 2020 Predictive Maintenance Dataset**
    Source: UCI Machine Learning Repository
    Purpose: Machine failure prediction using operational parameters.
- **Backblaze Hard Drive Dataset**
    Source: Backblaze Drive Stats
    Purpose: Storage device failure prediction using SMART attributes.
- **Synthetic App Telemetry Data**
    Source: Custom synthetic telemetry dataset published on Kaggle by the authors.
    Purpose: Simulating real-time application and device telemetry data for training and testing predictive failure models.

[1] A. Matzka, "AI4I 2020 Predictive Maintenance Dataset," UCI Machine Learning Repository, 2020.

[2] Backblaze, "Hard Drive Test Data and Statistics Dataset," Backblaze Drive Stats.

[3] S. S. Sikarwar, "Synthetic App Telemetry Data," Kaggle, 2026. Available: https://www.kaggle.com/datasets/suhanisinghsikarwar/synthetic-app-telemetry-data
