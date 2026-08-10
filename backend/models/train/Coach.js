const mongoose = require('mongoose');

const coachSchema = new mongoose.Schema({
    train: { type: mongoose.Schema.Types.ObjectId, ref: 'Train', required: true },
    coachType: { type: String, required: true }, // e.g., 1A, 2A, 3A, SL, CC
    prefix: { type: String, required: true, default: 'S' }, // e.g., B1, B2 (B is prefix)
    numberOfCoaches: { type: Number, required: true, default: 1 },
    seatsPerCoach: { type: Number, required: true, default: 72 },
    totalSeats: { type: Number, required: true },
}, { timestamps: true });

// A train can only have one configuration per coachType
coachSchema.index({ train: 1, coachType: 1 }, { unique: true });

module.exports = mongoose.model('Coach', coachSchema);
