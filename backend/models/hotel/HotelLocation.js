const mongoose = require('mongoose');

const HotelLocationSchema = new mongoose.Schema({
    locationId: {
        type: Number,
        required: true,
        unique: true
    },
    name: {
        type: String,
        required: true
    },
    cityName: {
        type: String,
        required: true
    },
    type: {
        type: String,
        required: true
    },
    coordinates: {
        centerLatitude: Number,
        centerLongitude: Number
    }
}, {
    timestamps: true
});

// Index for fast search lookup
HotelLocationSchema.index({ cityName: 1, name: 1 });

module.exports = mongoose.model('HotelLocation', HotelLocationSchema);
