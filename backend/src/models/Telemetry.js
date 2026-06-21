const mongoose = require("mongoose");

const telemetrySchema = new mongoose.Schema({

    deviceId: {
        type: String,
        required: true
    },

    cpuUsage: Number,

    cpuTemp: Number,

    ramUsage: Number,

    diskUsage: Number,

    batteryHealth: Number,

    cpuPower: Number,

    batteryPower: Number,

    fanRpm: Number,

    smartHealth: Number,

    smartReallocatedSectors: Number,

    psuVoltageFluctuation: Number,

    processCount: Number,

    gpuUsage: Number,

    gpuTemp: Number,

    timestamp: {
        type: Date,
        default: Date.now
    }

}, { timestamps: true });

// Time-series optimization for 10k+ device scaling
telemetrySchema.index({ deviceId: 1, createdAt: -1 });

module.exports = mongoose.model("Telemetry", telemetrySchema);