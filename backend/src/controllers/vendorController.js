// backend/src/controllers/vendorController.js

/**
 * GET /vendor-info
 * Returns realistic mock asset metadata, warranty status, and connection logs
 * simulated from a Dell OpenManage / iDRAC system.
 */
const getVendorInfo = (req, res) => {
    try {
        // Dynamically compute warranty expiry date to be 45 days in the future
        // This ensures the frontend's 60-day warning badge is consistently triggered for demonstration.
        const expiryDate = new Date();
        expiryDate.setDate(expiryDate.getDate() + 45);

        const vendorData = {
            vendorName: "Dell Inc.",
            assetTag: "JP-8X49-C10",
            deviceModel: "PowerEdge R750",
            firmwareVersion: "iDRAC9 v6.10.05.00",
            warrantyStatus: "Active (ProSupport Plus)",
            warrantyExpiryDate: expiryDate.toISOString(),
            connectionStatus: "Connected",
            openManageVersion: "v4.1.0",
            lastSyncTime: new Date().toISOString(),
            systemAlerts: 0,
            hardwareHealth: "Nominal"
        };

        res.status(200).json(vendorData);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = {
    getVendorInfo
};
