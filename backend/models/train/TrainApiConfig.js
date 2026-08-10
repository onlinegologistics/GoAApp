const mongoose = require('mongoose');

const trainApiConfigSchema = new mongoose.Schema({
    mode: { type: String, enum: ['dummy', 'live'], default: 'dummy' },
    api_url: { type: String, required: true }
}, { timestamps: true });

module.exports = mongoose.model('TrainApiConfig', trainApiConfigSchema);
