const mongoose = require('mongoose');

const passengerSchema = new mongoose.Schema({
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    gender: { type: String },
    dateOfBirth: { type: Date },
    seatNumber: { type: String },
    seatType: { type: String },
    seatPrice: { type: Number, default: 0 },
    baggage: { type: String },
    meal: { type: String }
}, { _id: false });

const flightDetailsSchema = new mongoose.Schema({
    airline: { type: String, required: true },
    flightNumber: { type: String, required: true },
    departureAirport: { type: String, required: true },
    arrivalAirport: { type: String, required: true },
    departureCity: { type: String },
    arrivalCity: { type: String },
    departureTime: { type: Date, required: true },
    arrivalTime: { type: Date },
    boardingTime: { type: Date },
    durationMinutes: { type: Number },
    aircraft: { type: String },
    terminal: { type: String }
}, { _id: false });

const contactDetailsSchema = new mongoose.Schema({
    email: { 
        type: String, 
        required: true
    },
    phone: { 
        type: String, 
        required: true
    }
}, { _id: false });

const fareDetailsSchema = new mongoose.Schema({
    baseFare: { type: Number, required: true, default: 0 },
    taxes: { type: Number, required: true, default: 0 },
    seatFee: { type: Number, default: 0 },
    addons: { type: Number, default: 0 },
    discount: { type: Number, default: 0 },
    totalAmount: { type: Number, default: 0 }
}, { _id: false });

const flightBookingSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    flightId: { type: mongoose.Schema.Types.ObjectId, ref: 'Flight', default: null },
    tripId: { type: String, unique: true, sparse: true },
    pnr: { type: String, sparse: true },
    flightDetails: { type: flightDetailsSchema, required: true },
    passengers: { type: [passengerSchema], default: [] },
    contactDetails: { type: contactDetailsSchema, required: true },
    fareDetails: { type: fareDetailsSchema, required: true },
    currency: { type: String, default: 'INR' },
    bookingId: { type: String, required: true, unique: true },
    bookingStatus: { type: String, default: 'PENDING' },
    paymentStatus: { type: String, default: 'PENDING' },
    ticketStatus: { type: String, default: 'PENDING' },
    bookingSource: { type: String, default: 'WEB' }
}, { timestamps: true });

// Auto-calculate fare details, arrival time, and boarding time on save
flightBookingSchema.pre('save', function() {
    // 1. Calculate totalAmount
    const fare = this.fareDetails;
    if (fare) {
        fare.totalAmount = (fare.baseFare + fare.taxes + fare.seatFee + fare.addons) - fare.discount;
    }

    // 2. Calculate arrivalTime
    const flight = this.flightDetails;
    if (flight && flight.departureTime && flight.durationMinutes) {
        flight.arrivalTime = new Date(flight.departureTime.getTime() + flight.durationMinutes * 60 * 1000);
        // Boarding is typically 45 mins before departure
        flight.boardingTime = new Date(flight.departureTime.getTime() - 45 * 60 * 1000);
    }
});

module.exports = mongoose.model('FlightBooking', flightBookingSchema);
