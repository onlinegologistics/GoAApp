const mongoose = require('mongoose');

const seatAvailabilitySchema = new mongoose.Schema({
    train: { type: mongoose.Schema.Types.ObjectId, ref: 'Train', required: true },
    date: { type: String, required: true }, // YYYY-MM-DD
    coachType: { type: String, required: true }, // e.g., 1A, 2A, 3A, SL
    totalSeats: { type: Number, required: true },
    availableSeats: { type: Number, required: true },
}, { timestamps: true });

seatAvailabilitySchema.index({ train: 1, date: 1, coachType: 1 }, { unique: true });

module.exports = mongoose.model('SeatAvailability', seatAvailabilitySchema);
