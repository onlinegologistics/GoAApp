const mongoose = require('mongoose');

const trainPricingSchema = new mongoose.Schema({
    train_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Train', required: true },
    baseFarePerKm: { type: Number, required: true, default: 2.0 }, // ₹2.00 per km by default
    discount: { type: Number, default: 0 }
}, { timestamps: true });

module.exports = mongoose.model('TrainPricing', trainPricingSchema);
