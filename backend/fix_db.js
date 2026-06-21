const mongoose = require('mongoose'); 
mongoose.connect('mongodb://127.0.0.1:27017/dell_telemetry').then(async () => { 
    const Device = mongoose.model('Device', new mongoose.Schema({}, {strict: false})); 
    await Device.updateOne({ deviceId: 'DESKTOP-4685RV3' }, { $set: { manufacturer: 'HP', model: 'HP EliteBook 840 G6' } }); 
    console.log('Restored real HP hardware profile.'); 
    process.exit(0); 
});
