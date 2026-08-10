const mongoose = require('mongoose');

const scheduleSchema = new mongoose.Schema({
    operator: { type: mongoose.Schema.Types.ObjectId, ref: 'Operator', required: true },
    bus: { type: mongoose.Schema.Types.ObjectId, ref: 'Bus', required: true },
    route: { type: mongoose.Schema.Types.ObjectId, ref: 'Route', required: true },
    startDate: { type: Date, required: true },
    frequency: { type: String, enum: ['daily'], default: 'daily' },
    departureTime: { type: String, required: true },
    arrivalTime: { type: String, required: true },
    ticketPrice: { type: Number, required: true },
    boardingPoints: [
        {
            location: { type: String, required: true },
            time: { type: String, required: true },
            lat: { type: Number },
            lng: { type: Number }
        }
    ],
    droppingPoints: [
        {
            location: { type: String, required: true },
            time: { type: String, required: true },
            lat: { type: Number },
            lng: { type: Number }
        }
    ],
    availableSeats: { type: Number, default: 40 },
    // Boarding Reminder Details
    driverName: { type: String, default: '' },
    driverPhone: { type: String, default: '' },
    pickupContactName: { type: String, default: '' },
    pickupContactPhone: { type: String, default: '' },
    reminderSent: { type: Boolean, default: false },
    status: { 
        type: String, 
        enum: ['pending', 'active', 'inactive', 'canceled'], 
        default: 'pending' 
    }
}, { timestamps: true });

module.exports = mongoose.model('Schedule', scheduleSchema);

