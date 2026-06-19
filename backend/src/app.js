const express = require("express");
const cors = require("cors");

const telemetryRoutes = require("./routes/telemetryRoutes");
const predictionRoutes = require("./routes/predictionRoutes");
const dashboardRoutes = require("./routes/dashboardRoutes");
const historyRoutes = require("./routes/historyRoutes");
const errorHandler = require("./middleware/errorHandler");

const app = express();

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
    res.send("Hardware Failure Prediction API Running");
});

app.use("/api/telemetry", telemetryRoutes);
app.use("/api/predictions", predictionRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/history", historyRoutes);

// Mock ML Prediction API for simulation and standalone local testing
app.post("/api/mock-ml", (req, res) => {
    const { cpuUsage, cpuTemp, ramUsage, diskUsage, batteryHealth, smartHealth, gpuTemp } = req.body;
    
    let failureProbability = 10;
    let riskLevel = "low";
    let predictedComponent = "None";
    let rootCause = "System is operating within normal parameters.";
    
    if (cpuTemp > 80 || cpuUsage > 90) {
        failureProbability = 85;
        riskLevel = "critical";
        predictedComponent = "CPU";
        rootCause = `High CPU temperature (${cpuTemp}°C) and high load (${cpuUsage}%) detected.`;
    } else if (smartHealth < 50) {
        failureProbability = 92;
        riskLevel = "critical";
        predictedComponent = "Disk";
        rootCause = `Disk S.M.A.R.T. health is critical (${smartHealth}%). Potential imminent drive failure.`;
    } else if (batteryHealth < 45) {
        failureProbability = 80;
        riskLevel = "critical";
        predictedComponent = "Battery";
        rootCause = `Battery health is critically degraded (${batteryHealth}%).`;
    } else if (ramUsage > 85) {
        failureProbability = 55;
        riskLevel = "warning";
        predictedComponent = "RAM";
        rootCause = `High RAM utilization (${ramUsage}%). Memory pressure detected.`;
    } else if (cpuTemp > 70 || gpuTemp > 75) {
        failureProbability = 50;
        riskLevel = "warning";
        predictedComponent = "Cooling System";
        rootCause = `Elevated temperature CPU: ${cpuTemp}°C / GPU: ${gpuTemp}°C. Cooling capability degraded.`;
    }

    const healthScore = Math.max(10, 100 - failureProbability);

    res.status(200).json({
        healthScore,
        failureProbability,
        riskLevel,
        predictedComponent,
        rootCause
    });
});

// Error handling middleware (must be last)
app.use(errorHandler);

module.exports = app;