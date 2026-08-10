const mongoose = require('mongoose');

const trainRouteSchema = new mongoose.Schema({
    train: { type: mongoose.Schema.Types.ObjectId, ref: 'Train', required: true },
    stops: [{
        station: { type: mongoose.Schema.Types.ObjectId, ref: 'Station', required: true },
        arrivalTime: { type: String },
        departureTime: { type: String },
        stopNumber: { type: Number, required: true }, // Used as sequence
        stopType: { 
            type: String, 
            enum: ['SOURCE', 'INTERMEDIATE', 'DESTINATION'],
            required: true 
        },
        distance: { type: Number, default: 0 }, // distance from source
    }],
}, { timestamps: true });

// Auto-calculate stopType and stopNumber before save
trainRouteSchema.pre('save', function () {
    if (this.stops && this.stops.length > 0) {
        this.stops.forEach((stop, index) => {
            // 1. Assign Sequence (1-indexed)
            stop.stopNumber = index + 1;

            // 2. Assign Stop Type
            if (index === 0) {
                stop.stopType = 'SOURCE';
                stop.arrivalTime = ''; // No arrival time for source
            } else if (index === this.stops.length - 1) {
                stop.stopType = 'DESTINATION';
                stop.departureTime = ''; // No departure time for destination
            } else {
                stop.stopType = 'INTERMEDIATE';
            }
        });
    }
});

module.exports = mongoose.model('TrainRoute', trainRouteSchema);
