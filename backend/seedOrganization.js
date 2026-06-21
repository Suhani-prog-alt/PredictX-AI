const mongoose = require('mongoose');
const Organization = require('./src/models/Organization');
require('dotenv').config();

mongoose.connect('mongodb://127.0.0.1:27017/dell_telemetry')
    .then(async () => {
        console.log('Connected to MongoDB');
        
        await Organization.findOneAndUpdate(
            { orgId: "dell-hackathon-2026" },
            {
                orgId: "dell-hackathon-2026",
                companyName: "Dell Hackathon Inc.",
                contactEmail: "security@dellhackathon.com",
                privacyPolicy: {
                    anonymizeDeviceIds: true,
                    collectProcessCount: false,
                    dataRetentionDays: 7
                }
            },
            { upsert: true, new: true }
        );

        console.log('Seeded Dell Hackathon organization with STRICT privacy policy!');
        process.exit(0);
    })
    .catch(err => {
        console.error(err);
        process.exit(1);
    });
