const mongoose = require('mongoose');

const HotelDetailSchema = new mongoose.Schema({
    hotelId: {
        type: String,
        required: true,
        unique: true,
        index: true
    },
    name: {
        type: String,
        required: true
    },
    address: {
        type: String,
        default: ''
    },
    stars: {
        type: Number,
        default: 4
    },
    rating: {
        type: Number,
        default: 4.0
    },
    reviewsCount: {
        type: Number,
        default: 100
    },
    image: {
        type: String,
        default: ''
    },
    city: {
        type: String,
        required: true,
        index: true
    },
    locationId: {
        type: Number,
        required: true,
        index: true
    },
    latitude: {
        type: Number
    },
    longitude: {
        type: Number
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('HotelDetail', HotelDetailSchema);
