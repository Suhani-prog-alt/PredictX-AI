const express = require("express");
const router = express.Router();

const { getDashboardSummary, getAllDevicesStatus, getDeviceDetail, streamUpdates, resolveDeviceAlert } = require("../controllers/dashboardController");

router.get("/summary", getDashboardSummary);
router.get("/devices", getAllDevicesStatus);
router.get("/stream", streamUpdates);
router.get("/devices/:deviceId", getDeviceDetail);
router.post("/devices/:deviceId/resolve", resolveDeviceAlert);

module.exports = router;
