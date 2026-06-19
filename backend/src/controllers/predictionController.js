const Prediction = require("../models/Prediction");

// GET /api/predictions/:deviceId - get all predictions for a device
const getPredictionsByDevice = async (req, res) => {
    try {
        const predictions = await Prediction.find({ deviceId: req.params.deviceId })
            .sort({ timestamp: -1 });

        res.status(200).json(predictions);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// GET /api/predictions/:deviceId/latest - get latest prediction for a device
const getLatestPrediction = async (req, res) => {
    try {
        const prediction = await Prediction.findOne({ deviceId: req.params.deviceId })
            .sort({ timestamp: -1 });

        if (!prediction) {
            return res.status(404).json({ message: "No prediction found for this device" });
        }

        res.status(200).json(prediction);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = {
    getPredictionsByDevice,
    getLatestPrediction
};
