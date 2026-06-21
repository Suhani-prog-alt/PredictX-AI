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

            // Seed 2 demo organization devices (live laptop registers separately as DELL-DEV-004)
            const mockDevices = [
                {
                    id: "DELL-LATITUDE-7420",
                    hostname: "DELL-LATITUDE-7420",
                    model: "Latitude 7420",
                    os: "Windows 11 Pro",
                    cpu: "Intel Core i7-1185G7 @ 3.00GHz",
                    ram: "16 GB DDR4",
                    storage: "512 GB NVMe SSD",
                    status: "healthy",
                    risk: "low",
                    score: 94,
                    failureProbability: 6,
                    root: "System operating normally",
                    comp: "None",
                    ttf: "Stable",
                    rec: ["Continue standard quarterly maintenance.", "Monitor SMART health during routine checks."]
                },
                {
                    id: "DELL-PRECISION-3680",
                    hostname: "DELL-PRECISION-3680",
                    model: "Precision 3680",
                    os: "Windows 11 Pro",
                    cpu: "Intel Core i7-14700 @ 2.10GHz",
                    ram: "32 GB DDR5",
                    storage: "1 TB NVMe SSD",
                    status: "warning",
                    risk: "warning",
                    score: 38,
                    failureProbability: 60,
                    root: "Sustained GPU thermal throttling under CAD workloads",
                    comp: "GPU",
                    ttf: "7 - 30 Days",
                    rec: [
                        "Inspect GPU cooling assembly and repaste if thermal paste is degraded.",
                        "Reduce sustained GPU load during peak hours until maintenance window.",
                        "Schedule workstation thermal audit in next maintenance cycle."
                    ]
                }
            ];

            for (const d of mockDevices) {
                await Device.create({
                    deviceId: d.id,
                    hostname: d.hostname,
                    orgId: 'dell-hackathon-2026',
                    manufacturer: 'Dell',
                    model: d.model,
                    cpu: d.cpu,
                    ram: d.ram,
                    storage: d.storage,
                    os: d.os,
                    status: d.status
                });

                await Prediction.create({
                    deviceId: d.id,
                    healthScore: d.score,
                    riskLevel: d.risk,
                    failureProbability: d.failureProbability,
                    rootCause: d.root,
                    predictedComponent: d.comp,
                    estimatedFailureWindow: d.ttf,
                    recommendation: d.rec
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
