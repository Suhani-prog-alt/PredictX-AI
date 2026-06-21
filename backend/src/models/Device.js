const mongoose = require("mongoose");

const deviceSchema = new mongoose.Schema(
{
    deviceId: {
        type: String,
        required: true,
        unique: true
    },
    orgId: {
        type: String,
        default: 'default-org'
    },
    
    orgAssignedId: String,
    
    originalHostname: String,

    hostname: String,

    manufacturer: String,

    model: String,

    cpu: String,

    ram: String,

    storage: String,

    os: String,

    status: {
        type: String,
        enum: ['healthy', 'warning', 'critical'],
        default: 'healthy'
    }
},
{
    timestamps: true
});

// Add database indexes for high-scale querying
deviceSchema.index({ orgId: 1, deviceId: 1 });
deviceSchema.index({ 'latestPrediction.riskLevel': 1 });

module.exports = mongoose.model("Device", deviceSchema);