const mongoose = require('mongoose');

const userTypeSchema = new mongoose.Schema({
    role: { type: String, enum: ['B2C', 'Agent', 'Corporate'], required: true, unique: true },
    commissionRules: {
        type: {
            commissionType: { type: String, enum: ['flat', 'percentage'], default: 'percentage' },
            value: { type: Number, required: true },
            minCap: { type: Number, default: 0 },
            maxCap: { type: Number, default: 999999 },
            discountMultiplier: { type: Number, default: 1 } // Corporate might have 0.9, Agent might have 1.1 etc.
        },
        required: true
    },
    description: { type: String },
    isActive: { type: Boolean, default: true }
}, { timestamps: true });

module.exports = mongoose.model('UserType', userTypeSchema);
