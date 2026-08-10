const mongoose = require('mongoose');

const cancellationLogSchema = new mongoose.Schema({
    bookingId: { type: mongoose.Schema.Types.ObjectId, ref: 'Booking', required: true },
    pnrNumber: { type: String, required: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    originalTotalFare: { type: Number, required: true },
    refundAmount: { type: Number, required: true },
    cancellationCharges: { type: Number, required: true },
    reversedCommission: { type: Number, required: true },
    cancellationDate: { type: Date, default: Date.now },
    reason: { type: String }
}, { timestamps: true });

module.exports = mongoose.model('CancellationLog', cancellationLogSchema);
