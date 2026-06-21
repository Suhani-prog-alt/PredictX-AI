const express = require("express");
const router = express.Router();
const Organization = require("../models/Organization");
const Device = require("../models/Device");
const Prediction = require("../models/Prediction");

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

        let org = await Organization.findOne({ orgId });
        
        // Auto-create the demo org if it doesn't exist
        if (!org && orgId === 'dell-hackathon-2026' && passcode === 'admin123') {
            org = await Organization.create({
                orgId: 'dell-hackathon-2026',
                companyName: 'Dell Hackathon Demo',
                contactEmail: 'admin@dell-hackathon.com',
                passcode: 'admin123',
                privacyPolicy: {
                    anonymizeDeviceIds: false,
                    collectProcessCount: true,
                    dataRetentionDays: 30
                }
            });

            // Seed 3 mock devices for the demo
            const mockDevices = [
                { id: "XPS-15-FRIEND", type: "Laptop", os: "Windows 11", risk: "low", msg: "System operating normally" },
                { id: "LATITUDE-SERVER-1", type: "Server", os: "Ubuntu 22.04", risk: "warning", msg: "High memory utilization detected" },
                { id: "PRECISION-LAB-9", type: "Workstation", os: "Windows 10", risk: "critical", msg: "Impending thermal failure on GPU" }
            ];

            for (const d of mockDevices) {
                await Device.create({
                    deviceId: d.id,
                    orgId: 'dell-hackathon-2026',
                    deviceType: d.type,
                    osVersion: d.os
                });

                await Prediction.create({
                    deviceId: d.id,
                    riskScore: d.risk === 'low' ? 12 : d.risk === 'warning' ? 65 : 92,
                    riskLevel: d.risk,
                    anomalies: [d.msg],
                    recommendation: "Review system logs"
                });
            }
        }

        if (!org) {
            return res.status(404).json({ error: "Organization not found" });
        }

        if (org.passcode !== passcode) {
            return res.status(401).json({ error: "Invalid passcode" });
        }

        res.json({ success: true, message: "Verification successful", org });
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
