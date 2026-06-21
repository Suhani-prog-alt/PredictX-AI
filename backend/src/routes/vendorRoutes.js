// backend/src/routes/vendorRoutes.js
const express = require("express");
const router = express.Router();
const { getVendorInfo } = require("../controllers/vendorController");

router.get("/", getVendorInfo);

module.exports = router;
