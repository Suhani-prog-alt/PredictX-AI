const mongoose = require('mongoose');

mongoose.connect('mongodb://127.0.0.1:27017/dell_telemetry').then(async () => {
    const db = mongoose.connection.db;
    
    // Delete old hardcoded devices and raw devices, keeping only Anon-Devices
    await db.collection('devices').deleteMany({ hostname: { $not: /Anon-Device/ } });
    
    // Delete all predictions and telemetry to start fresh
    await db.collection('predictions').deleteMany({});
    await db.collection('telemetries').deleteMany({});
    
    console.log('Cleaned up old database records');
    process.exit(0);
});
