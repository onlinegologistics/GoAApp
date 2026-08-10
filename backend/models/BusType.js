const mongoose = require('mongoose');

const busTypeSchema = new mongoose.Schema({
    name: { type: String, required: true, unique: true },
    description: { type: String },
    seatLayout: { type: String, default: '2+2' },
    isActive: { type: Boolean, default: true }
}, { timestamps: true });

module.exports = mongoose.model('BusType', busTypeSchema);
