const mongoose = require('mongoose');

const occupancyLogSchema = new mongoose.Schema({
    busId: { type: mongoose.Schema.Types.ObjectId, ref: 'Bus', required: true },
    scheduleId: { type: mongoose.Schema.Types.ObjectId, ref: 'Schedule', required: true },
    travelDate: { type: String, required: true }, // YYYY-MM-DD
    totalSeats: { type: Number, required: true },
    bookedSeats: { type: Number, default: 0 },
    occupancyPercentage: { type: Number, default: 0 },
    lastUpdated: { type: Date, default: Date.now }
}, { timestamps: true });

occupancyLogSchema.index({ busId: 1, scheduleId: 1, travelDate: 1 }, { unique: true });

module.exports = mongoose.model('OccupancyLog', occupancyLogSchema);
