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

    gpuUsage: Number,

    gpuTemp: Number,

    timestamp: {
        type: Date,
        default: Date.now
    }

});

module.exports = mongoose.model("Telemetry", telemetrySchema);