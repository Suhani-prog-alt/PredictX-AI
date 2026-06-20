const mongoose = require("mongoose");

const predictionSchema = new mongoose.Schema({

    deviceId: {
        type: String,
        required: true
    },

    healthScore: Number,

    failureProbability: Number,

    riskLevel: String,

    predictedComponent: String,

    rootCause: String,

    estimatedFailureWindow: String,

    recommendation: [String],

    timestamp: {
        type: Date,
        default: Date.now
    }

});

module.exports = mongoose.model("Prediction", predictionSchema);