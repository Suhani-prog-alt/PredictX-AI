const mongoose = require('mongoose');
const Organization = require('./src/models/Organization');

mongoose.connect('mongodb://127.0.0.1:27017/dell_telemetry').then(async () => {
    console.log("Connected to DB, updating old organizations...");
    const result = await Organization.updateMany(
        { passcode: { $exists: false } },
        { $set: { passcode: 'admin123' } }
    );
    console.log(`Updated ${result.modifiedCount} organizations with default passcode 'admin123'.`);
    process.exit(0);
}).catch(err => {
    console.error(err);
    process.exit(1);
});
