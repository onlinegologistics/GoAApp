const mongoose = require('mongoose');

const seatSchema = new mongoose.Schema({
    trainId: { type: mongoose.Schema.Types.ObjectId, ref: 'Train', required: true },
    coachType: { type: String, required: true }, // e.g., SL, 3A, 2A
    coachNumber: { type: String, required: true }, // e.g., S1, B1
    seatNumber: { type: Number, required: true },
    berthType: { type: String, enum: ['LB', 'MB', 'UB', 'SL', 'SU', 'LB', 'MB', 'UB'], required: true },
    status: { 
        type: String, 
        enum: ['AVAILABLE', 'LOCKED', 'BOOKED'], 
        default: 'AVAILABLE' 
    },
    lockExpiresAt: { type: Date },
    lockedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    date: { type: String, required: true } // YYYY-MM-DD
}, { timestamps: true });

// Index for fast seat finding and locking
seatSchema.index({ trainId: 1, coachType: 1, date: 1, status: 1 });
// Unique constraint to prevent duplicate seats
seatSchema.index({ trainId: 1, coachNumber: 1, seatNumber: 1, date: 1 }, { unique: true });

module.exports = mongoose.model('TrainSeat', seatSchema);
