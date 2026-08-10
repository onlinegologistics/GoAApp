const mongoose = require('mongoose');

const trainPaymentSchema = new mongoose.Schema({
    bookingId: { type: mongoose.Schema.Types.ObjectId, ref: 'TrainBooking', required: true },
    razorpayOrderId: { type: String, required: true },
    razorpayPaymentId: { type: String },
    razorpaySignature: { type: String },
    amount: { type: Number, required: true },
    currency: { type: String, default: 'INR' },
    status: { 
        type: String, 
        enum: ['CREATED', 'SUCCESS', 'FAILED'], 
        default: 'CREATED' 
    }
}, { timestamps: true });

module.exports = mongoose.model('TrainPayment', trainPaymentSchema);
