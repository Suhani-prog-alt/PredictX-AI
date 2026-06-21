const express = require("express");
const router = express.Router();
const Organization = require("../models/Organization");

// GET all organizations
router.get("/", async (req, res) => {
    try {
        const orgs = await Organization.find().sort({ createdAt: -1 });
        res.json(orgs);
    } catch (err) {
        res.status(500).json({ error: "Server error fetching organizations" });
    }
});

// POST register a new organization
router.post("/", async (req, res) => {
    try {
        const { orgId, companyName, contactEmail, passcode, privacyPolicy } = req.body;
        
        // Basic validation
        if (!orgId || !companyName || !contactEmail || !passcode) {
            return res.status(400).json({ error: "Missing required fields" });
        }

        // Check if orgId already exists
        const existing = await Organization.findOne({ orgId });
        if (existing) {
            return res.status(400).json({ error: "Organization ID already exists" });
        }

        const org = await Organization.create({
            orgId,
            companyName,
            contactEmail,
            passcode,
            privacyPolicy: privacyPolicy || {}
        });

        res.status(201).json(org);
    } catch (err) {
        console.error("Error creating organization:", err);
        res.status(500).json({ error: "Server error creating organization" });
    }
});

// POST verify passcode
router.post("/verify", async (req, res) => {
    try {
        const { orgId, passcode } = req.body;
        if (!orgId || !passcode) {
            return res.status(400).json({ error: "Missing required fields" });
        }

        const org = await Organization.findOne({ orgId });
        if (!org) {
            return res.status(404).json({ error: "Organization not found" });
        }

        if (org.passcode !== passcode) {
            return res.status(401).json({ error: "Invalid passcode" });
        }

        res.json({ success: true, message: "Verification successful" });
    } catch (err) {
        res.status(500).json({ error: "Server error verifying passcode" });
    }
});

// PUT update privacy policy
router.put("/:orgId/privacy", async (req, res) => {
    try {
        const { orgId } = req.params;
        const { anonymizeDeviceIds, collectProcessCount } = req.body;
        
        const org = await Organization.findOne({ orgId });
        if (!org) {
            return res.status(404).json({ error: "Organization not found" });
        }

        // Update nested policy
        org.privacyPolicy = {
            ...org.privacyPolicy,
            anonymizeDeviceIds: anonymizeDeviceIds !== undefined ? anonymizeDeviceIds : org.privacyPolicy.anonymizeDeviceIds,
            collectProcessCount: collectProcessCount !== undefined ? collectProcessCount : org.privacyPolicy.collectProcessCount
        };
        
        await org.save();
        res.json({ success: true, organization: org });
    } catch (err) {
        console.error("Error updating privacy policy:", err);
        res.status(500).json({ error: "Server error updating privacy policy" });
    }
});

module.exports = router;
