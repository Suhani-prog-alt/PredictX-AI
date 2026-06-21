# PredictX-AI: Troubleshooting Guide

If you run into issues while deploying or using the PredictX-AI dashboard, please refer to the following common issues and solutions.

## 1. Dashboard Shows "API Offline" or Data Isn't Updating

**Symptom:** The `backendOnline` indicator is red, or live telemetry isn't appearing on the dashboard.
**Possible Causes & Solutions:**
1.  **Node.js Backend is not running:** Ensure you have started the backend using `node server.js` in the `/backend` directory. The terminal should print `Server running on port 5000`.
2.  **MongoDB is disconnected:** Check the backend terminal for MongoDB connection errors. Ensure MongoDB is running locally on port `27017` or verify your Mongoose connection string.
3.  **CORS Issues:** If the frontend browser console shows CORS errors, ensure that your React app is running on `http://localhost:5173` and the backend `server.js` has CORS configured to accept it.

## 2. Python Agent (`agent.py`) Fails to Start

**Symptom:** Running `python agent.py` throws a `ModuleNotFoundError`.
**Solution:** The agent relies on external libraries to gather OS-level telemetry.
Run the following command to install the required libraries:
```bash
pip install psutil requests
```

## 3. Machine Learning API Returns 500 Error

**Symptom:** The Node.js backend throws an error stating it cannot reach the ML API, or the ML API terminal shows a `Joblib` or `XGBoost` version mismatch.
**Solution:**
1.  Ensure you have activated your virtual environment in the `model_inference` directory.
2.  Install the exact dependencies required by the model: `pip install -r requirements.txt`.
3.  Ensure the FastAPI server is running: `python api.py` (running on port `8000`).

## 4. Maintenance Optimization Doesn't Show Tasks

**Symptom:** You have devices with "Critical" risk levels, but the Maintenance Optimization tab queue is empty.
**Solution:**
Ensure the **"Automated Batch Scheduling"** toggle is turned **ON** in the Maintenance Optimization configuration settings. If it is disabled, the system will not auto-generate the duration time blocks.

## 5. Cannot See Process Count in Dashboard

**Symptom:** The "Process Count" metric is blank or undefined for a device.
**Solution:** This is likely an intentional Privacy Policy enforcement. Go to the **Organizations** tab and check if the **"Hide Processes"** policy is enabled for your organization. If it is green, the backend is intentionally deleting that data before it reaches the dashboard to ensure legal compliance.
