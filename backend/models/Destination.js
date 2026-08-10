const mongoose = require('mongoose');

const destinationSchema = new mongoose.Schema({
    name: { type: String, required: true },
    image: { type: String, required: true },
    distance: { type: String, required: true },
    duration: { type: String },
    description: { type: String },
    isPopular: { type: Boolean, default: false },
    status: { type: Boolean, default: true }
}, { timestamps: true });

module.exports = mongoose.model('Destination', destinationSchema);
