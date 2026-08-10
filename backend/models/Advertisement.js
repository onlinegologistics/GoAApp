const mongoose = require('mongoose');

const advertisementSchema = new mongoose.Schema({
    title: { type: String, required: true },
    description: { type: String },
    imageDesktop: { type: String, required: true }, // URL or Base64
    imageMobile: { type: String, required: true },
    redirectUrl: { type: String, required: true },
    
    // Dynamic Banner Content
    subTitle: { type: String }, // e.g., "SUMMER OFFER 2026"
    offerText: { type: String }, // e.g., "FLAT ₹120 OFF"
    couponCode: { type: String }, // e.g., "SUMMER2026"
    buttonText: { type: String, default: 'Book Now' },

    adType: {
        type: String,
        enum: ['Banner', 'Sidebar', 'Inline', 'Popup'],
        default: 'Banner'
    },
    position: {
        type: String,
        enum: ['HomepageTop', 'SearchTop', 'SearchInline', 'GlobalPopup'],
        required: true
    },

    // Targeting rules
    targetOperator: { type: mongoose.Schema.Types.ObjectId, ref: 'Operator', default: null }, // Null means all operators
    targetRouteSource: { type: String, default: null },
    targetRouteDestination: { type: String, default: null },
    targetDevice: {
        type: String,
        enum: ['All', 'Mobile', 'Desktop'],
        default: 'All'
    },
    targetUserType: {
        type: String,
        enum: ['All', 'New', 'Returning'],
        default: 'All'
    },

    priority: {
        type: String,
        enum: ['High', 'Medium', 'Low'],
        default: 'Medium'
    },

    status: {
        type: String,
        enum: ['Active', 'Inactive'],
        default: 'Active'
    },
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },

    // Revenue tracking
    cpc: { type: Number, default: 0 },
    cpm: { type: Number, default: 0 },

    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Advertisement', advertisementSchema);
