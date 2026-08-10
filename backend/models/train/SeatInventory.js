const mongoose = require('mongoose');

const seatInventorySchema = new mongoose.Schema({
    trainId: { type: mongoose.Schema.Types.ObjectId, ref: 'Train', required: true },
    coachTypeId: { type: mongoose.Schema.Types.ObjectId, ref: 'CoachType', required: true },
    date: { type: String }, // YYYY-MM-DD (optional, null = default/base price)
    availableSeats: { type: Number, required: true, default: 0 },
    totalSeats: { type: Number, required: true, default: 0 },
    price: { type: Number, required: true, default: 0 },
    tatkalPrice: { type: Number, default: 0 },
    waitingList: { type: Number, default: 0 },
    racCount: { type: Number, default: 0 }
}, { timestamps: true });

// Unique per train + coach type + date
seatInventorySchema.index({ trainId: 1, coachTypeId: 1, date: 1 }, { unique: true });

module.exports = mongoose.model('TrainSeatInventory', seatInventorySchema);
