const express = require("express");
const router = express.Router();

const { getTelemetryHistory, getPredictionHistory } = require("../controllers/historyController");

router.get("/:deviceId/telemetry", getTelemetryHistory);
router.get("/:deviceId/predictions", getPredictionHistory);

module.exports = router;
