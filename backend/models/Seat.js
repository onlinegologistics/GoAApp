const mongoose = require('mongoose');

const seatSchema = new mongoose.Schema({
    busId: { type: mongoose.Schema.Types.ObjectId, ref: 'Bus', required: true },
    seatNumber: { type: String, required: true },
    seatType: { type: String, enum: ['window', 'aisle', 'sleeper', 'seater'], required: true },
    isPremium: { type: Boolean, default: false },
    isLadies: { type: Boolean, default: false },
    isAvailable: { type: Boolean, default: true }
}, { timestamps: true });

// Index for quick lookup during seat pricing
seatSchema.index({ busId: 1, seatNumber: 1 }, { unique: true });

module.exports = mongoose.model('Seat', seatSchema);
