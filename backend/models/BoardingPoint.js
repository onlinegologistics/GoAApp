const mongoose = require('mongoose');

const boardingPointSchema = new mongoose.Schema({
    busId: { type: mongoose.Schema.Types.ObjectId, ref: 'Bus' }, // Optional: global points or bus-specific
    name: { type: String, required: true },
    city: { type: String },
    type: { type: String, enum: ['Premium', 'Normal', 'Remote'], default: 'Normal' },
    premiumAmount: { type: Number, default: 0 },
    time: { type: String }, // Optional: specific time for this point
    priority: { type: Number, default: 0 }
}, { timestamps: true });

module.exports = mongoose.model('BoardingPoint', boardingPointSchema);
