const mongoose = require('mongoose');

const flightSchema = new mongoose.Schema({
    flightNumber: { type: String, required: true, unique: true },
    airline: { type: String, required: true },
    departureAirport: { type: String, required: true },
    arrivalAirport: { type: String, required: true },
    departureCity: { type: String },
    arrivalCity: { type: String },
    departureTime: { type: Date },
    durationMinutes: { type: Number }
}, { timestamps: true });

module.exports = mongoose.model('Flight', flightSchema);
