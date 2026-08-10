const mongoose = require('mongoose');

const fareRuleSchema = new mongoose.Schema({
    train: { type: mongoose.Schema.Types.ObjectId, ref: 'Train', required: true },
    classType: { type: String, required: true }, // e.g., 1A, 2A, 3A, SL
    baseFare: { type: Number, required: true }, // legacy flat fare (fallback)
    multiplier: { type: Number, required: true, default: 1.0 }, // New dynamic multiplier
    tatkalCharge: { type: Number, required: true, default: 0 },
    dynamicPricing: { type: String, default: 'None' }, // e.g., 'None', '10%', '15%'
}, { timestamps: true });

fareRuleSchema.index({ train: 1, classType: 1 }, { unique: true });

module.exports = mongoose.model('FareRule', fareRuleSchema);
