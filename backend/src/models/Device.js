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

    os: String
},
{
    timestamps: true
});

module.exports = mongoose.model("Device", deviceSchema);