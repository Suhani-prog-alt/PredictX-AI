const mongoose = require("mongoose");
const Device = require("./src/models/Device");
const Prediction = require("./src/models/Prediction");

mongoose.connect("mongodb://127.0.0.1:27017/dell_telemetry").then(async () => {
    console.log("Connected to MongoDB");

    // Fix existing bad predictions
    const result = await Prediction.updateMany(
        { healthScore: { $lte: 60 }, riskLevel: "low" },
        { $set: { riskLevel: "warning" } }
    );
    console.log(`Updated ${result.modifiedCount} bad predictions to warning level.`);

    // Insert Friend's Mac
    const macDeviceId = "MACBOOK-PRO-M3-" + Math.floor(Math.random() * 1000);
    
    await Device.create({
        deviceId: macDeviceId,
        hostname: "SARAH-MACBOOK-PRO",
        manufacturer: "Apple",
        model: "MacBook Pro 14 (M3, 2023)",
        cpu: "Apple M3 Pro (11-core)",
        ram: "18 GB",
        storage: "512 GB SSD",
        os: "macOS 14.5 Sonoma"
    });

    await Prediction.create({
        deviceId: macDeviceId,
        healthScore: 42,
        failureProbability: 58,
        riskLevel: "warning",
        predictedComponent: "Battery",
        rootCause: "Battery health degraded to 64%. High cycle count detected.",
        estimatedFailureWindow: "7 - 30 Days",
        recommendation: ["Schedule battery replacement", "Enable optimized battery charging"]
    });

    console.log("Successfully registered friend's Mac device!");
    process.exit(0);
}).catch(err => {
    console.error(err);
    process.exit(1);
});
