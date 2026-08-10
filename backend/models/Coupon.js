const mongoose = require('mongoose');

const couponSchema = new mongoose.Schema({
    code: { 
        type: String, 
        required: true, 
        unique: true,
        uppercase: true,
        trim: true
    },
    title: { type: String },
    subtitle: { type: String },
    discountText: { type: String },
    buttonText: { type: String },
    image: { type: String },
    description: { type: String },
    discountType: { 
        type: String, 
        enum: ['percentage', 'flat', 'slab'], 
        default: 'percentage' 
    },
    discountValue: { type: Number, required: true }, // Default for non-slab
    maxDiscountAmount: { type: Number }, // For percentage coupons
    
    // Slab-based logic
    slabs: [{
        minAmount: { type: Number },
        maxAmount: { type: Number },
        discountValue: { type: Number },
        discountType: { type: String, enum: ['percentage', 'flat'] }
    }],

    // Coupon Category
    couponCategory: {
        type: String,
        enum: ['InstantDiscount', 'Cashback', 'WalletCredit'],
        default: 'InstantDiscount'
    },

    // Funding Logic
    fundingType: { 
        type: String, 
        enum: ['SUPER_ADMIN', 'SHARED'], 
        default: 'SUPER_ADMIN' 
    },
    fundingDetails: {
        operatorShare: { type: Number, default: 0 },
        adminShare: { type: Number, default: 100 }
    },

    // Applicability
    applicableOn: { 
        type: String, 
        enum: ['Bus', 'Hotel', 'Flight', 'All'], 
        default: 'All' 
    },
    sourceCities: [{ type: String }],
    destinationCities: [{ type: String }],
    busTypes: [{ type: String }], // AC, Sleeper, Seater
    specificOperators: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Operator' }],

    // Route & Bus Application Control
    applyToAllRoutes: { type: Boolean, default: true },
    applyToAllBuses: { type: Boolean, default: true },
    applicableRoutes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Route' }],
    applicableBuses: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Bus' }],

    // Advanced Targeting
    targeting: {
        userTypes: [{ type: String, enum: ['New', 'Existing', 'Inactive', 'All'], default: ['All'] }],
        platforms: [{ type: String, enum: ['Web', 'App', 'All'], default: ['All'] }],
        isWeekendOnly: { type: Boolean, default: false },
        timeWindow: {
            startHour: { type: Number, min: 0, max: 23 },
            endHour: { type: Number, min: 0, max: 23 }
        }
    },

    // Fraud Prevention
    fraud: {
        deviceLimit: { type: Number, default: 3 }, // Max times per device
        ipLimit: { type: Number, default: 5 },     // Max times per IP
        requireOTP: { type: Boolean, default: false }
    },

    // Usage Control
    minBookingAmount: { type: Number, default: 0 },
    totalUsageLimit: { type: Number, default: 1000 },
    perUserLimit: { type: Number, default: 1 },
    userLimit: { type: Number, default: 1 }, // New field from user request
    firstUserOnly: { type: Boolean, default: false },
    allowStacking: { type: Boolean, default: false },

    // Validity
    validFrom: { type: Date, default: Date.now },
    validTill: { type: Date, required: true },

    // Tracking & Analytics
    analytics: {
        totalTimesUsed: { type: Number, default: 0 },
        totalDiscountGiven: { type: Number, default: 0 },
        revenueGenerated: { type: Number, default: 0 }
    },

    status: { 
        type: String, 
        enum: ['Active', 'Inactive', 'Expired'], 
        default: 'Active' 
    },

    // Ownership & Visibility
    createdBy: { 
        type: mongoose.Schema.Types.ObjectId, 
        refPath: 'role' === 'operator' ? 'Operator' : 'User',
        required: true 
    },
    role: { 
        type: String, 
        enum: ['superadmin', 'admin', 'operator', 'bus_operator', 'hotel_operator'], 
        required: true 
    },
    isGlobal: { 
        type: Boolean, 
        default: false 
    },
    rules: {
        lastMinute: { type: Boolean, default: false }
    }
}, { timestamps: true });

// Ensure status updates automatically on retrieval if needed (or via cron/background job)
// For now, we'll check it in the apply logic.

module.exports = mongoose.model('Coupon', couponSchema);
