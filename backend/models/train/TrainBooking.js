const mongoose = require('mongoose');

const trainBookingSchema = new mongoose.Schema({
    pnr: { type: String, required: true, unique: true },
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    customerName: { type: String, required: true },
    train: { type: mongoose.Schema.Types.ObjectId, ref: 'Train', required: true },
    passengers: [{
        name: { type: String, required: true },
        age: { type: Number, required: true },
        gender: { type: String, enum: ['Male', 'Female', 'Other'] },
        seatNumber: { type: String },
        coachType: { type: String },
        berthPreference: { type: String }
    }],
    irctcUserId: { type: String, required: true },
    contactDetails: {
        email: { type: String, required: true },
        phone: { type: String, required: true }
    },
    addOns: {
        insurance: { type: Boolean, default: false },
        autoUpgrade: { type: Boolean, default: false }
    },
    journeyDate: { type: String, required: true }, // YYYY-MM-DD
    source: { type: mongoose.Schema.Types.ObjectId, ref: 'Station', required: true },
    destination: { type: mongoose.Schema.Types.ObjectId, ref: 'Station', required: true },
    totalFare: { type: Number, required: true },
    status: { type: String, enum: ['PENDING', 'CONFIRMED', 'CANCELLED'], default: 'PENDING' },
    paymentStatus: { type: String, enum: ['PENDING', 'SUCCESS', 'FAILED'], default: 'PENDING' },
    lockExpiresAt: { type: Date },
    allocatedSeats: [{
        seatNumber: { type: Number },
        coachNumber: { type: String },
        berthType: { type: String }
    }],
    quota: { type: String, default: 'General' },
}, { timestamps: true });

module.exports = mongoose.model('TrainBooking', trainBookingSchema);
