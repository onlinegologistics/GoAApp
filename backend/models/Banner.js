const mongoose = require('mongoose');

/**
 * Banner Schema
 * Supports fullscreen popup and inline banners.
 * Priority-based delivery, expiry control, analytics tracking.
 */
const BannerSchema = new mongoose.Schema({
    title: {
        type: String,
        required: [true, 'Banner title is required'],
        trim: true,
    },
    offerText: {
        type: String,
        default: '',
        trim: true,
    },
    couponCode: {
        type: String,
        default: '',
        trim: true,
    },
    imageUrl: {
        type: String,
        required: [true, 'Banner image is required'],
    },
    buttonText: {
        type: String,
        default: 'Book Now',
        trim: true,
    },
    redirectUrl: {
        type: String,
        default: '/',
        trim: true,
    },
    isActive: {
        type: Boolean,
        default: true,
    },
    showType: {
        type: String,
        enum: ['popup', 'inline'],
        default: 'popup',
    },
    priority: {
        type: Number,
        default: 1,
        min: 1,
        max: 100,
    },
    expiryDate: {
        type: Date,
        required: [true, 'Expiry date is required'],
    },
    // Analytics
    analytics: {
        impressions: { type: Number, default: 0 },
        clicks: { type: Number, default: 0 },
    },
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
});

// Virtual: computed CTR
BannerSchema.virtual('analytics.ctr').get(function () {
    if (!this.analytics.impressions || this.analytics.impressions === 0) return '0.00%';
    return ((this.analytics.clicks / this.analytics.impressions) * 100).toFixed(2) + '%';
});

// Index for fast active-banner queries sorted by priority
BannerSchema.index({ isActive: 1, expiryDate: 1, priority: -1 });

module.exports = mongoose.model('Banner', BannerSchema);
