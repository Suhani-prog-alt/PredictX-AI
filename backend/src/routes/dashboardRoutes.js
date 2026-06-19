const express = require("express");
const router = express.Router();

const { getDashboardSummary, getAllDevicesStatus, getDeviceDetail } = require("../controllers/dashboardController");

router.get("/summary", getDashboardSummary);
router.get("/devices", getAllDevicesStatus);
router.get("/devices/:deviceId", getDeviceDetail);

module.exports = router;
