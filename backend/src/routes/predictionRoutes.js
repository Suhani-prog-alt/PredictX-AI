const express = require("express");
const router = express.Router();

const { getPredictionsByDevice, getLatestPrediction } = require("../controllers/predictionController");

router.get("/:deviceId", getPredictionsByDevice);
router.get("/:deviceId/latest", getLatestPrediction);

module.exports = router;
