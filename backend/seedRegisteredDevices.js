/**
 * Registered Devices seed data for dell-hackathon-2026 demo organization.
 * Replaces legacy placeholder devices with realistic Dell fleet entries.
 *
 * Usage: node seedRegisteredDevices.js
 */
const mongoose = require("mongoose");
const Device = require("./src/models/Device");
const Prediction = require("./src/models/Prediction");
const Telemetry = require("./src/models/Telemetry");
require("dotenv").config();

const ORG_ID = "dell-hackathon-2026";

const LEGACY_DEVICE_IDS = [
    "XPS-15-FRIEND",
    "LATITUDE-SERVER-1",
    "PRECISION-LAB-9",
    "DELL-DEV-001",
    "DELL-DEV-002",
    "DELL-DEV-003",
];

const REGISTERED_DEMO_DEVICES = [
    {
        deviceId: "DELL-LATITUDE-7420",
        hostname: "DELL-LATITUDE-7420",
        orgId: ORG_ID,
        manufacturer: "Dell",
        model: "Latitude 7420",
        cpu: "Intel Core i7-1185G7 @ 3.00GHz",
        ram: "16 GB DDR4",
        storage: "512 GB NVMe SSD",
        os: "Windows 11 Pro",
        status: "healthy",
        prediction: {
            healthScore: 94,
            failureProbability: 6,
            riskLevel: "low",
            predictedComponent: "None",
            rootCause: "System operating normally",
            estimatedFailureWindow: "Stable",
            recommendation: ["Continue standard quarterly maintenance.", "Monitor SMART health during routine checks."],
            cascadeChain: [],
        },
        telemetryProfile: "healthy",
    },
    {
        deviceId: "DELL-PRECISION-3680",
        hostname: "DELL-PRECISION-3680",
        orgId: ORG_ID,
        manufacturer: "Dell",
        model: "Precision 3680",
        cpu: "Intel Core i7-14700 @ 2.10GHz",
        ram: "32 GB DDR5",
        storage: "1 TB NVMe SSD",
        os: "Windows 11 Pro",
        status: "warning",
        prediction: {
            healthScore: 38,
            failureProbability: 60,
            riskLevel: "warning",
            predictedComponent: "GPU",
            rootCause: "Sustained GPU thermal throttling under CAD workloads",
            estimatedFailureWindow: "7 - 30 Days",
            recommendation: [
                "Inspect GPU cooling assembly and repaste if thermal paste is degraded.",
                "Reduce sustained GPU load during peak hours until maintenance window.",
                "Schedule workstation thermal audit in next maintenance cycle.",
            ],
            cascadeChain: [
                {
                    step: 1,
                    component: "GPU",
                    risk: "warning",
                    description: "GPU temperature sustained above 82°C during rendering workloads.",
                    timeframe: "Now",
                },
                {
                    step: 2,
                    component: "Cooling",
                    risk: "warning",
                    description: "Fan RPM elevated to 5100+ RPM with inconsistent ramp curve.",
                    timeframe: "Now",
                },
                {
                    step: 3,
                    component: "GPU",
                    risk: "critical",
                    description: "Repeated thermal throttling may accelerate solder joint fatigue.",
                    timeframe: "Weeks",
                },
                {
                    step: 4,
                    component: "System",
                    risk: "critical",
                    description: "Workstation instability or unexpected shutdown during heavy GPU tasks.",
                    timeframe: "Weeks",
                },
            ],
        },
        telemetryProfile: "warning",
    },
];

function buildTelemetrySeries(deviceId, profile) {
    const now = Date.now();
    const points = [];

    const profiles = {
        healthy: () => ({
            cpuUsage: 28 + Math.random() * 12,
            cpuTemp: 46 + Math.random() * 8,
            ramUsage: 48 + Math.random() * 12,
            diskUsage: 58 + Math.random() * 6,
            batteryHealth: 90 + Math.random() * 5,
            cpuPower: 12 + Math.random() * 6,
            batteryPower: 8 + Math.random() * 4,
            fanRpm: 2200 + Math.random() * 500,
            smartHealth: 98 + Math.random() * 2,
            smartReallocatedSectors: 0,
            psuVoltageFluctuation: 1.0 + Math.random() * 0.01,
            processCount: 140 + Math.floor(Math.random() * 30),
            gpuUsage: 12 + Math.random() * 10,
            gpuTemp: 42 + Math.random() * 8,
        }),
        warning: () => ({
            cpuUsage: 78 + Math.random() * 12,
            cpuTemp: 76 + Math.random() * 10,
            ramUsage: 84 + Math.random() * 7,
            diskUsage: 71 + Math.random() * 5,
            batteryHealth: 72 + Math.random() * 4,
            cpuPower: 45 + Math.random() * 12,
            batteryPower: 0,
            fanRpm: 4800 + Math.random() * 400,
            smartHealth: 94 + Math.random() * 3,
            smartReallocatedSectors: 3 + Math.floor(Math.random() * 2),
            psuVoltageFluctuation: 1.02 + Math.random() * 0.02,
            processCount: 210 + Math.floor(Math.random() * 40),
            gpuUsage: 72 + Math.random() * 14,
            gpuTemp: 74 + Math.random() * 10,
        }),
    };

    const generator = profiles[profile];

    for (let i = 9; i >= 0; i--) {
        const metrics = generator();
        points.push({
            deviceId,
            ...metrics,
            cpuUsage: Math.round(metrics.cpuUsage * 10) / 10,
            cpuTemp: Math.round(metrics.cpuTemp * 10) / 10,
            ramUsage: Math.round(metrics.ramUsage * 10) / 10,
            diskUsage: Math.round(metrics.diskUsage * 10) / 10,
            batteryHealth: Math.round(metrics.batteryHealth),
            cpuPower: Math.round(metrics.cpuPower * 100) / 100,
            batteryPower: Math.round(metrics.batteryPower * 100) / 100,
            fanRpm: Math.round(metrics.fanRpm),
            smartHealth: Math.round(metrics.smartHealth),
            gpuUsage: Math.round(metrics.gpuUsage * 10) / 10,
            gpuTemp: Math.round(metrics.gpuTemp * 10) / 10,
            timestamp: new Date(now - i * 5 * 60 * 1000),
        });
    }

    return points;
}

async function seedRegisteredDevices() {
    const uri = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/hardware_predictor";
    await mongoose.connect(uri);
    console.log("Connected to MongoDB");

    // Remove legacy placeholder demo devices (keep DELL-DEV-004 / 6986fea479e0 untouched)
    const removed = await Device.deleteMany({ deviceId: { $in: LEGACY_DEVICE_IDS } });
    console.log(`Removed ${removed.deletedCount} legacy demo device records.`);

    await Prediction.deleteMany({ deviceId: { $in: LEGACY_DEVICE_IDS } });
    await Telemetry.deleteMany({ deviceId: { $in: LEGACY_DEVICE_IDS } });

    for (const demo of REGISTERED_DEMO_DEVICES) {
        const { prediction, telemetryProfile, ...deviceFields } = demo;

        await Device.findOneAndUpdate(
            { deviceId: demo.deviceId },
            { $set: deviceFields },
            { upsert: true, new: true }
        );

        await Prediction.deleteMany({ deviceId: demo.deviceId });
        await Telemetry.deleteMany({ deviceId: demo.deviceId });

        const telemetrySeries = buildTelemetrySeries(demo.deviceId, telemetryProfile);
        await Telemetry.insertMany(telemetrySeries);

        const latestTs = telemetrySeries[telemetrySeries.length - 1].timestamp;
        const historicalPredictions = telemetrySeries.map((_, idx) => ({
            deviceId: demo.deviceId,
            ...prediction,
            failureProbability: Math.max(
                0,
                prediction.failureProbability + (idx - 9) * (demo.deviceId.includes("PRECISION") ? 0.5 : 0.2)
            ),
            healthScore: Math.min(
                100,
                prediction.healthScore - (idx - 9) * (demo.deviceId.includes("PRECISION") ? 0.5 : 0.2)
            ),
            timestamp: new Date(latestTs.getTime() - (9 - idx) * 5 * 60 * 1000),
        }));

        await Prediction.insertMany(historicalPredictions);

        console.log(`Seeded ${demo.deviceId} with hardware profile, telemetry, and predictions.`);
    }

    const orgDevices = await Device.find({ orgId: ORG_ID }).select("deviceId orgAssignedId hostname");
    console.log("\nRegistered devices for dell-hackathon-2026:");
    orgDevices.forEach((d) => {
        const label = d.orgAssignedId || d.hostname || d.deviceId;
        console.log(`  - ${label} (${d.deviceId})`);
    });

    process.exit(0);
}

seedRegisteredDevices().catch((err) => {
    console.error(err);
    process.exit(1);
});
