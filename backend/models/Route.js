const mongoose = require('mongoose');

const routeSchema = new mongoose.Schema({
    operatorId: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'Operator',
        required: false // Optional for admin-created global routes
    },
    fromCity: { type: String, required: true },
    toCity: { type: String, required: true },
    distance: { type: Number, required: true }, // numeric as requested
    travelTime: { type: String, required: true }, // "6h 30m" format
    boardingPoints: [{ type: String }],
    droppingPoints: [{ type: String }],
    stops: [
        {
            city: { type: String, required: true },
            arrivalTime: { type: String, required: true },
            departureTime: { type: String, required: true }
        }
    ],
    status: { type: String, enum: ['Active', 'Inactive'], default: 'Active' },
    isActive: { type: Boolean, default: true },
    isPopular: { type: Boolean, default: false },
    type: { type: String, enum: ['flight', 'train', 'bus'], default: 'bus' },
    price: { type: Number, default: 0 }
}, { timestamps: true });

module.exports = mongoose.model('Route', routeSchema);
