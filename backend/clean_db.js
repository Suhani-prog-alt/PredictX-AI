const mongoose = require('mongoose');

mongoose.connect('mongodb://localhost:27017/dell_predictx').then(async () => {
    console.log('Connected to MongoDB. Wiping devices, telemetry, and predictions...');
    await mongoose.connection.db.collection('devices').deleteMany({});
    await mongoose.connection.db.collection('telemetries').deleteMany({});
    await mongoose.connection.db.collection('predictions').deleteMany({});
    console.log('Database wiped successfully! Clean slate ready.');
    process.exit(0);
}).catch(err => {
    console.error('Error:', err);
    process.exit(1);
});
