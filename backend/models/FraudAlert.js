const mongoose = require('mongoose');

const fraudAlertSchema = new mongoose.Schema({
    booking: { type: mongoose.Schema.Types.ObjectId, ref: 'Booking', required: true },
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    reason: { type: String, required: true },
    riskLevel: { 
        type: String, 
        enum: ['Low', 'Medium', 'High'], 
        default: 'Medium' 
    },
    status: { 
        type: String, 
        enum: ['Open', 'Investigated', 'Ignored', 'Resolved'], 
        default: 'Open' 
    },
    flaggedBy: { type: String, default: 'System' }, // 'System' or 'Admin'
    details: {
        ipAddress: String,
        deviceId: String,
        description: String
    }
}, { timestamps: true });

module.exports = mongoose.model('FraudAlert', fraudAlertSchema);
