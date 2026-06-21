const Telemetry = require("../models/Telemetry");
const Prediction = require("../models/Prediction");
const Device = require("../models/Device");
const Organization = require("../models/Organization");
const crypto = require('crypto');

const { getPrediction } = require("../services/mlService");
const { generateRecommendation } = require("../services/recommendationService");

const receiveTelemetry = async (req, res) => {
    try {
        let orgId = req.body.orgId || "default-org";
        let organization = await Organization.findOne({ orgId });
        
        // Auto-create default org if missing for backward compatibility
        if (!organization) {
            organization = await Organization.create({
                orgId: orgId,
                companyName: orgId === "default-org" ? "Default Organization" : orgId,
                contactEmail: "admin@example.com"
            });
        }

        const policy = organization.privacyPolicy || {};
        
        let processedDeviceId = req.body.deviceId;
        let processedHostname = req.body.hostname || `PC-${req.body.deviceId}`;

        // PRIVACY POLICY ENFORCEMENT: Anonymize identifiers if requested by org
        if (policy.anonymizeDeviceIds) {
            processedDeviceId = crypto.createHash('sha256').update(req.body.deviceId).digest('hex').substring(0, 12);
            processedHostname = `Anon-Device-${processedDeviceId}`;
        }

        // PRIVACY POLICY ENFORCEMENT: Strip employee process activity if requested
        if (policy.collectProcessCount === false) {
            req.body.processCount = undefined;
        }

        let device = await Device.findOne({ deviceId: processedDeviceId });

        if (!device) {
            const orgDeviceCount = await Device.countDocuments({ orgId: orgId });
            const prefix = orgId.toUpperCase().substring(0, 4);
            const nextNum = String(orgDeviceCount + 1).padStart(3, '0');
            const orgAssignedId = `${prefix}-DEV-${nextNum}`;

            device = await Device.create({
                deviceId: processedDeviceId,
                orgId: orgId,
                orgAssignedId: orgAssignedId,
                originalHostname: req.body.hostname || `PC-${req.body.deviceId}`,
                hostname: processedHostname,
                manufacturer: req.body.manufacturer || "Unknown",
                model: req.body.model || "Generic Device",
                cpu: req.body.cpu || "Unknown CPU",
                ram: req.body.ram || (req.body.ramCapacityGB ? `${req.body.ramCapacityGB} GB` : "Unknown RAM"),
                storage: req.body.storage || "Unknown Storage",
                os: req.body.os || req.body.osVersion || "Unknown OS"
            });
        } else {
            device.hostname = req.body.hostname || device.hostname;
            device.manufacturer = (req.body.manufacturer && req.body.manufacturer !== "Unknown") ? req.body.manufacturer : device.manufacturer;
            device.model = (req.body.model && req.body.model !== "Generic Device") ? req.body.model : device.model;
            device.cpu = (req.body.cpu && !req.body.cpu.includes("Unknown")) ? req.body.cpu : device.cpu;
            device.ram = req.body.ram || (req.body.ramCapacityGB ? `${req.body.ramCapacityGB} GB` : device.ram);
            device.storage = (req.body.storage && !req.body.storage.includes("Unknown")) ? req.body.storage : device.storage;
            device.os = req.body.os || req.body.osVersion || device.os;

            await device.save();
        }

        // Update telemetry to use processedDeviceId
        const telemetryPayload = { ...req.body, deviceId: processedDeviceId };
        const telemetry = await Telemetry.create(telemetryPayload);

        const predictionResult = await getPrediction(req.body);

        device.status = predictionResult.riskLevel === 'low' ? 'healthy' : predictionResult.riskLevel;
        await device.save();

        const recommendations = generateRecommendation(predictionResult);

        const prediction = await Prediction.create({
            deviceId: processedDeviceId,
            healthScore: predictionResult.healthScore,
            failureProbability: predictionResult.failureProbability,
            riskLevel: predictionResult.riskLevel,
            predictedComponent: predictionResult.predictedComponent,
            rootCause: predictionResult.rootCause,
            estimatedFailureWindow: predictionResult.estimatedFailureWindow,
            recommendation: recommendations
        });

        // HACKATHON: Simulated Webhook Integration for Nagios/Zabbix/SCOM
        if (predictionResult.riskLevel === 'critical') {
            console.log(`[ENTERPRISE WEBHOOK] Firing Critical Alert to Nagios for Device ${processedDeviceId}`);
            console.log(`[ENTERPRISE WEBHOOK] Payload: ${JSON.stringify({
                device: processedDeviceId,
                alert_type: "HARDWARE_FAILURE_IMMINENT",
                root_cause: predictionResult.rootCause,
                recommendation: recommendations[0] || "Dispatch field technician"
            })}`);
        }

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
                deviceId: processedDeviceId,
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