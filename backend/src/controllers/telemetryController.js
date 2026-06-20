const Telemetry = require("../models/Telemetry");
const Prediction = require("../models/Prediction");
const Device = require("../models/Device");

const { getPrediction } = require("../services/mlService");
const { generateRecommendation } = require("../services/recommendationService");

const receiveTelemetry = async (req, res) => {
    try {
        let device = await Device.findOne({ deviceId: req.body.deviceId });

        if (!device) {
            device = await Device.create({
                deviceId: req.body.deviceId,
                hostname: req.body.hostname || `PC-${req.body.deviceId}`,
                manufacturer: "Dell",
                model: req.body.model || "Latitude 5420",
                cpu: req.body.cpu || "Intel Core i5-1135G7",
                ram: req.body.ram || (req.body.ramCapacityGB ? `${req.body.ramCapacityGB} GB` : "16 GB"),
                storage: req.body.storage || "512 GB NVMe SSD",
                os: req.body.os || req.body.osVersion || "Windows 11 Pro"
            });
        } else {
            device.hostname = req.body.hostname || device.hostname;
            device.manufacturer = "Dell";
            device.model = req.body.model || device.model;
            device.cpu = req.body.cpu || device.cpu;
            device.ram = req.body.ram || (req.body.ramCapacityGB ? `${req.body.ramCapacityGB} GB` : device.ram);
            device.storage = req.body.storage || device.storage;
            device.os = req.body.os || req.body.osVersion || device.os;

            await device.save();
        }

        const telemetry = await Telemetry.create(req.body);

        const predictionResult = await getPrediction(req.body);

        const recommendations = generateRecommendation(predictionResult);

        const prediction = await Prediction.create({
            deviceId: req.body.deviceId,
            healthScore: predictionResult.healthScore,
            failureProbability: predictionResult.failureProbability,
            riskLevel: predictionResult.riskLevel,
            predictedComponent: predictionResult.predictedComponent,
            rootCause: predictionResult.rootCause,
            estimatedFailureWindow: predictionResult.estimatedFailureWindow,
            recommendation: recommendations
        });

        try {
            const totalDevices = await Device.countDocuments();

            const latestPredictions = await Prediction.aggregate([
                { $sort: { timestamp: -1 } },
                {
                    $group: {
                        _id: "$deviceId",
                        latestPrediction: { $first: "$$ROOT" }
                    }
                },
                {
                    $replaceRoot: {
                        newRoot: "$latestPrediction"
                    }
                }
            ]);

            const criticalDevices = latestPredictions.filter(
                p => p.riskLevel === "critical"
            ).length;

            const warningDevices = latestPredictions.filter(
                p => p.riskLevel === "warning"
            ).length;

            const healthyDevices = latestPredictions.filter(
                p => p.riskLevel === "low"
            ).length;

            const summary = {
                totalDevices,
                criticalDevices,
                warningDevices,
                healthyDevices
            };

            const streamService = require("../services/streamService");

            streamService.broadcast({
                type: "TELEMETRY_UPDATE",
                deviceId: req.body.deviceId,
                device,
                telemetry,
                prediction,
                summary
            });
        } catch (err) {
            console.error(
                "[Telemetry Controller] Failed to broadcast update:",
                err.message
            );
        }

        res.status(201).json({
            message: "Telemetry processed successfully",
            telemetry,
            prediction
        });

    } catch (error) {
        res.status(500).json({
            message: error.message
        });
    }
};

module.exports = {
    receiveTelemetry
};