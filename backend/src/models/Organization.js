const mongoose = require('mongoose');

const privacyPolicySchema = new mongoose.Schema({
    anonymizeDeviceIds: { type: Boolean, default: false },
    collectProcessCount: { type: Boolean, default: true },
    dataRetentionDays: { type: Number, default: 30 }
}, { _id: false });

const organizationSchema = new mongoose.Schema({
    orgId: { type: String, required: true, unique: true },
    companyName: { type: String, required: true },
    contactEmail: { type: String, required: true },
    passcode: { type: String, required: true },
    privacyPolicy: { type: privacyPolicySchema, default: () => ({}) },
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Organization', organizationSchema);
