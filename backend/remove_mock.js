const mongoose = require("mongoose");
const Device = require("./src/models/Device");
const Prediction = require("./src/models/Prediction");
const Telemetry = require("./src/models/Telemetry");

mongoose.connect("mongodb://127.0.0.1:27017/dell_telemetry").then(async () => {
    console.log("Connected to MongoDB");

    // Remove the mock Mac device and its predictions/telemetry
    await Device.deleteMany({ manufacturer: "Apple" });
    await Prediction.deleteMany({ predictedComponent: "Battery", rootCause: { $regex: /Battery health degraded/ } });
    
    console.log("Mock Apple devices removed from DB.");
    process.exit(0);
}).catch(err => {
    console.error(err);
    process.exit(1);
});
