const Device = require("../models/Device");
const Telemetry = require("../models/Telemetry");
const Prediction = require("../models/Prediction");

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

// POST /api/dashboard/devices/:deviceId/resolve - Resolve a device issue
const resolveDevice = async (req, res) => {
    try {
        const device = await Device.findOne({ deviceId: req.params.deviceId });
        if (!device) return res.status(404).json({ message: "Device not found" });

        const prediction = await Prediction.create({
            deviceId: device.deviceId,
            healthScore: 100,
            failureProbability: 5,
            riskLevel: "low",
            predictedComponent: "None",
            rootCause: "Issue resolved by maintenance.",
            estimatedFailureWindow: ">14 days",
            recommendation: ["System operating normally."]
        });

        device.status = "healthy";
        await device.save();

        const totalDevices = await Device.countDocuments();
        const latestPredictions = await Prediction.aggregate([
            { $sort: { timestamp: -1 } },
            { $group: { _id: "$deviceId", latestPrediction: { $first: "$$ROOT" } } },
            { $replaceRoot: { newRoot: "$latestPrediction" } }
        ]);

        const criticalDevices = latestPredictions.filter(p => p.riskLevel === "critical").length;
        const warningDevices = latestPredictions.filter(p => p.riskLevel === "warning").length;
        const healthyDevices = latestPredictions.filter(p => p.riskLevel === "low").length;

        const summary = {
            totalDevices,
            criticalDevices,
            warningDevices,
            healthyDevices
        };

        streamService.broadcast({
            type: "TELEMETRY_UPDATE",
            deviceId: device.deviceId,
            device,
            prediction,
            summary
        });

        res.status(200).json({ message: "Device resolved", prediction, summary });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = {
    getDashboardSummary,
    getAllDevicesStatus,
    getDeviceDetail,
    streamUpdates,
    resolveDevice
};
