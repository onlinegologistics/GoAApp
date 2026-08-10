const mongoose = require('mongoose');

const adAnalyticsSchema = new mongoose.Schema({
    adId: { type: mongoose.Schema.Types.ObjectId, ref: 'Advertisement', required: true },
    eventType: {
        type: String,
        enum: ['View', 'Click'],
        required: true
    },

    // Context details for reporting
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    device: {
        type: String,
        enum: ['Mobile', 'Desktop', 'Tablet'],
        default: 'Desktop'
    },
    ip: { type: String },

    // Revenue tracking (snapshot at event time)
    revenue: { type: Number, default: 0 },

    timestamp: { type: Date, default: Date.now }
});

module.exports = mongoose.model('AdAnalytics', adAnalyticsSchema);
