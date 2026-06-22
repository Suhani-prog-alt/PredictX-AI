const mongoose = require("mongoose");
const Device = require("./src/models/Device");
const Prediction = require("./src/models/Prediction");

mongoose.connect("mongodb://127.0.0.1:27017/dell_telemetry").then(async () => {
    console.log("Connected to MongoDB");

    const devices = await Device.find();
    console.log(`Found ${devices.length} devices.`);

    if (devices.length === 0) {
        console.log("No devices found!");
        process.exit(1);
    }

    // Set 5 devices to Warning/Critical
    const components = ["cooling", "storage", "power", "battery", "cooling"];
    const risks = ["Critical", "Warning", "Critical", "Warning", "Critical"];

    for (let i = 0; i < Math.min(5, devices.length); i++) {
        const device = devices[i];
        const comp = components[i];
        const risk = risks[i];
        const failureProb = risk === "Critical" ? 85 + Math.random()*10 : 60 + Math.random()*15;
        const healthScore = risk === "Critical" ? 15 : 40;

        // Try to update latest prediction, or create one
        const latest = await Prediction.findOne({ deviceId: device.deviceId }).sort({ timestamp: -1 });
        if (latest) {
            latest.healthScore = healthScore;
            latest.failureProbability = failureProb;
            latest.riskLevel = risk;
            latest.predictedComponent = comp;
            latest.rootCause = `Detected anomalies in ${comp}`;
            latest.estimatedFailureWindow = risk === "Critical" ? "1-3 Days" : "7-14 Days";
            latest.timestamp = new Date();
            await latest.save();
        } else {
            await Prediction.create({
                deviceId: device.deviceId,
                healthScore,
                failureProbability: failureProb,
                riskLevel: risk,
                predictedComponent: comp,
                rootCause: `Detected anomalies in ${comp}`,
                estimatedFailureWindow: risk === "Critical" ? "1-3 Days" : "7-14 Days",
                recommendation: [],
                timestamp: new Date()
            });
        }
        console.log(`Updated ${device.deviceId} to ${risk} (${comp})`);
    }

    console.log("Successfully made the dashboard realistic!");
    process.exit(0);
}).catch(err => {
    console.error(err);
    process.exit(1);
});
