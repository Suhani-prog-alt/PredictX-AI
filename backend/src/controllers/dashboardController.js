const Device = require("../models/Device");
const Telemetry = require("../models/Telemetry");
const Prediction = require("../models/Prediction");
const mongoose = require("mongoose");
const axios = require("axios");

// GET /api/dashboard/summary - overall system summary
const getDashboardSummary = async (req, res) => {
    try {
        const totalDevices = await Device.countDocuments();

        // Latest prediction per device to count risk levels
        const latestPredictions = await Prediction.aggregate([
            { $sort: { timestamp: -1 } },
            { $group: { _id: "$deviceId", latestPrediction: { $first: "$$ROOT" } } },
            { $replaceRoot: { newRoot: "$latestPrediction" } }
        ]);

        const criticalDevices = latestPredictions.filter(p => p.riskLevel === "critical").length;
        const warningDevices = latestPredictions.filter(p => p.riskLevel === "warning").length;
        const healthyDevices = latestPredictions.filter(p => p.riskLevel === "low").length;

        res.status(200).json({
            totalDevices,
            criticalDevices,
            warningDevices,
            healthyDevices
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// GET /api/dashboard/devices - list all devices with their latest prediction
const getAllDevicesStatus = async (req, res) => {
    try {
        const devices = await Device.find();

        const devicesWithStatus = await Promise.all(devices.map(async (device) => {
            const latestPrediction = await Prediction.findOne({ deviceId: device.deviceId })
                .sort({ timestamp: -1 });

            return {
                ...device.toObject(),
                latestPrediction: latestPrediction || null
            };
        }));

        res.status(200).json(devicesWithStatus);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// GET /api/dashboard/devices/:deviceId - single device detail with recent telemetry
const getDeviceDetail = async (req, res) => {
    try {
        const device = await Device.findOne({ deviceId: req.params.deviceId });

        if (!device) {
            return res.status(404).json({ message: "Device not found" });
        }

        const recentTelemetry = await Telemetry.find({ deviceId: req.params.deviceId })
            .sort({ timestamp: -1 })
            .limit(10);

        const recentPredictions = await Prediction.find({ deviceId: req.params.deviceId })
            .sort({ timestamp: -1 })
            .limit(10);

        const latestPrediction = await Prediction.findOne({ deviceId: req.params.deviceId })
            .sort({ timestamp: -1 });

        res.status(200).json({
            device,
            recentTelemetry,
            recentPredictions: recentPredictions || [],
            latestPrediction: latestPrediction || null
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const streamService = require("../services/streamService");

// GET /api/dashboard/stream - Server-Sent Events stream
const streamUpdates = (req, res) => {
    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");
    res.flushHeaders();

    streamService.addClient(res);

    req.on("close", () => {
        streamService.removeClient(res);
    });
};

// POST /api/dashboard/devices/:deviceId/resolve - Resolve active alerts
const resolveDeviceAlert = async (req, res) => {
    try {
        const deviceId = req.params.deviceId;
        
        // Create a healthy prediction to override the latest alert
        const newPrediction = new Prediction({
            deviceId,
            healthScore: 100,
            failureProbability: 0,
            riskLevel: "low",
            predictedComponent: "None",
            rootCause: "Resolved by user",
            estimatedFailureWindow: "N/A",
            recommendation: [],
            timestamp: new Date()
        });
        await newPrediction.save();

        // Broadcast resolution to clients
        streamService.broadcast({
            type: 'TELEMETRY_UPDATE',
            deviceId,
            prediction: newPrediction
        });

        res.status(200).json({ success: true, message: "Alert resolved", prediction: newPrediction });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// GET /api/dashboard/diagnostics - Run live system health checks
const runDiagnostics = async (req, res) => {
    try {
        const diagnostics = {
            backend: { status: 'ok', latency: 0 },
            database: { status: 'checking', latency: 0 },
            ml_api: { status: 'checking', latency: 0 },
            telemetry: { status: 'checking', latency: 0 }
        };

        // 1. Backend is running since we are inside this route
        diagnostics.backend = { status: 'ok', message: 'Node.js server is online' };

        // 2. Database check
        const dbStart = Date.now();
        const dbState = mongoose.connection.readyState;
        if (dbState === 1) {
            // ping query to measure latency
            await Device.findOne().lean();
            diagnostics.database = { status: 'ok', latency: Date.now() - dbStart, message: 'MongoDB connected' };
        } else {
            diagnostics.database = { status: 'error', message: 'MongoDB disconnected' };
        }

        // 3. ML API check
        const mlStart = Date.now();
        try {
            await axios.get('http://localhost:8000/');
            diagnostics.ml_api = { status: 'ok', latency: Date.now() - mlStart, message: 'FastAPI ML Engine online' };
        } catch (err) {
            diagnostics.ml_api = { status: 'error', message: 'ML API unreachable (Port 8000)' };
        }

        // 4. Telemetry check (did we receive anything in the last 60 seconds?)
        const oneMinuteAgo = new Date(Date.now() - 60 * 1000);
        const recentTelemetry = await Telemetry.exists({ createdAt: { $gte: oneMinuteAgo } });
        if (recentTelemetry) {
            diagnostics.telemetry = { status: 'ok', message: 'Live data stream active' };
        } else {
            diagnostics.telemetry = { status: 'warning', message: 'No telemetry received in last 60s' };
        }

        res.json(diagnostics);
    } catch (err) {
        res.status(500).json({ error: "Diagnostics failed", details: err.message });
    }
};

module.exports = {
    getDashboardSummary,
    getAllDevicesStatus,
    getDeviceDetail,
    streamUpdates,
    resolveDeviceAlert,
    runDiagnostics
};
