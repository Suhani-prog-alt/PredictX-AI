# 🚀 PredictX-AI

PredictX-AI is a next-generation predictive maintenance and hardware telemetry dashboard designed for real-time monitoring and proactive system failure prevention. 

Built with a sleek, premium dark-mode interface, PredictX-AI streams live hardware data from target machines and uses Machine Learning concepts to analyze thermal trends, performance bottlenecks, and power consumption to predict hardware failures before they happen.

## ✨ Features
* **Live Telemetry Dashboard:** View real-time hardware metrics (CPU Usage, RAM, Disk I/O, Fan RPM, Battery Health) with beautiful, dynamic progress bars and widgets.
* **Predictive Failure Analysis:** Automated assessment algorithms calculate a "Time to Failure" (TTF) and generate proactive recommendations to save hardware.
* **Historical Trend Charts:** Interactive, solid-filled Chart.js graphs tracking performance history, thermal trends, failure probabilities, and power consumption over time.
* **Secure Telemetry Agent:** A lightweight Python agent (`agent.py`) that runs locally on target machines to securely harvest hardware data and transmit it to the backend.

## 🛠️ Tech Stack
* **Frontend:** React.js, Vite, TailwindCSS (Concepts), Chart.js, Lucide Icons
* **Backend:** Python, Flask, Flask-CORS
* **Database:** MongoDB (Local)
* **Agent:** Python (`psutil`, `requests`)

## 🚀 Getting Started

### Prerequisites
Make sure you have [Node.js](https://nodejs.org/) and [Python 3.8+](https://www.python.org/) installed on your system. You will also need a local instance of MongoDB running on port `27017`.

### 1. Start the Backend (Flask)
```bash
cd backend
pip install -r requirements.txt
python app.py
```
*The backend API will start running on `http://localhost:5000`*

### 2. Start the Frontend (React)
```bash
cd frontend
npm install
npm run dev
```
*The frontend dashboard will start running on `http://localhost:5173`*

### 3. Run the Telemetry Agent
To see live data on your dashboard, you need to run the agent on your machine (or another machine on the same network).
```bash
cd telemetry-agent
pip install psutil requests
python agent.py
```

## 📸 Hackathon Presentation Notes
If you are presenting this project locally:
1. Ensure both your frontend and backend are running.
2. Run `agent.py` to start sending live data to the dashboard.
3. Show the judges the dynamic charts and live-updating telemetry widgets!
