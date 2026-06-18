const Telemetry = require("../models/Telemetry");
const Prediction = require("../models/Prediction");

// GET /api/history/:deviceId/telemetry - paginated telemetry history
const getTelemetryHistory = async (req, res) => {
    try {
        const { deviceId } = req.params;
        const limit = parseInt(req.query.limit) || 50;
        const page = parseInt(req.query.page) || 1;
        const skip = (page - 1) * limit;

        const [data, total] = await Promise.all([
            Telemetry.find({ deviceId })
                .sort({ timestamp: -1 })
                .skip(skip)
                .limit(limit),
            Telemetry.countDocuments({ deviceId })
        ]);

        res.status(200).json({
            data,
            total,
            page,
            totalPages: Math.ceil(total / limit)
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// GET /api/history/:deviceId/predictions - paginated prediction history
const getPredictionHistory = async (req, res) => {
    try {
        const { deviceId } = req.params;
        const limit = parseInt(req.query.limit) || 50;
        const page = parseInt(req.query.page) || 1;
        const skip = (page - 1) * limit;

        const [data, total] = await Promise.all([
            Prediction.find({ deviceId })
                .sort({ timestamp: -1 })
                .skip(skip)
                .limit(limit),
            Prediction.countDocuments({ deviceId })
        ]);

        res.status(200).json({
            data,
            total,
            page,
            totalPages: Math.ceil(total / limit)
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = {
    getTelemetryHistory,
    getPredictionHistory
};
