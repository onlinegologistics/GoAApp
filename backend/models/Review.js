const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    operatorId: { type: mongoose.Schema.Types.ObjectId, ref: 'Operator', required: true },
    busId: { type: mongoose.Schema.Types.ObjectId, ref: 'Bus' },
    bookingId: { type: mongoose.Schema.Types.ObjectId, ref: 'Booking' },
    rating: { type: Number, required: true, min: 1, max: 5 },
    comment: { type: String, required: true },
    reply: { type: String }, // Operator's reply
    status: { type: String, enum: ['Published', 'Hidden', 'Flagged'], default: 'Published' }
}, { timestamps: true });

module.exports = mongoose.model('Review', reviewSchema);
