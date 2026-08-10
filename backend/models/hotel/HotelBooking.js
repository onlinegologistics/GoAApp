const mongoose = require('mongoose');

const HotelBookingSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        index: true
    },
    provisionalBookId: {
        type: String,
        required: true,
        index: true
    },
    tripId: {
        type: String,
        required: true,
        unique: true,
        index: true
    },
    confirmationNumber: {
        type: String,
        required: true,
        index: true
    },
    affiliateTripReference: {
        type: String,
        required: true,
        unique: true
    },
    hotelId: {
        type: String,
        required: true
    },
    hotelName: {
        type: String,
        required: true
    },
    roomName: {
        type: String,
        required: true
    },
    guestName: {
        type: String,
        required: true
    },
    totalAmount: {
        type: Number,
        required: true
    },
    status: {
        type: String,
        enum: ['provisional', 'confirmed', 'cancelled'],
        default: 'confirmed'
    },
    razorpayOrderId: {
        type: String
    },
    razorpayPaymentId: {
        type: String
    },
    razorpaySignature: {
        type: String
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('HotelBooking', HotelBookingSchema);
