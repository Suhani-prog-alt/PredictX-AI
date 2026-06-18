const express = require("express");
const cors = require("cors");

const telemetryRoutes = require("./routes/telemetryRoutes");
const predictionRoutes = require("./routes/predictionRoutes");
const dashboardRoutes = require("./routes/dashboardRoutes");
const historyRoutes = require("./routes/historyRoutes");
const errorHandler = require("./middleware/errorHandler");

const app = express();

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
    res.send("Hardware Failure Prediction API Running");
});

app.use("/api/telemetry", telemetryRoutes);
app.use("/api/predictions", predictionRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/history", historyRoutes);

// Error handling middleware (must be last)
app.use(errorHandler);

module.exports = app;