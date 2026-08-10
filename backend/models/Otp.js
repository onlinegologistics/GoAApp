const mongoose = require('mongoose');

const otpSchema = new mongoose.Schema({
    email: {
        type: String,
        required: true,
        trim: true
    },
    otp: {
        type: String,
        required: true
    },
    purpose: {
        type: String,
        enum: ['register', 'login', 'admin-login', 'forgot-password'],
        required: true
    },
    expiresAt: {
        type: Date,
        required: true
    }
}, { timestamps: true });

// Index for auto-expiring documents in MongoDB
otpSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

module.exports = mongoose.model('Otp', otpSchema);
