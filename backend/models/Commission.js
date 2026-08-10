const mongoose = require('mongoose');

const commissionSchema = new mongoose.Schema({
  ruleName: {
    type: String,
    default: 'Unnamed Rule'
  },
  category: {
    type: String,
    enum: ['Bus', 'Hotel', 'Flight', 'Train'],
    required: true
  },
  operatorId: {
    type: mongoose.Schema.Types.ObjectId,
    refPath: 'operatorModel',
    default: null
  },
  operatorModel: {
    type: String,
    enum: ['Operator', 'HotelOperator'],
    required: function () { return !!this.operatorId; }
  },
  itemId: {
    type: String,
    default: 'All' // Can be 'All' or a specific Bus/Hotel ID
  },
  // Bus specific advanced filters
  seatType: { type: String, default: 'All' }, // All, Sleeper, Seater, AC, Non-AC
  busType: { type: String, default: 'All' }, // All, Volvo, Sleeper, Semi-Sleeper, Luxury
  sourceCity: { type: String, default: 'All' },
  destinationCity: { type: String, default: 'All' },
  timeSlot: { type: String, default: 'All' }, // Morning, Afternoon, Evening, Night

  // Bus specific
  minDistance: { type: Number, default: 0 },
  maxDistance: { type: Number, default: 99999 },

  // Hotel specific
  minPrice: { type: Number, default: 0 },
  maxPrice: { type: Number, default: 999999 },
  starRating: { type: Number, default: 0 }, // min rating

  // Train specific
  trainClass: {
    type: String,
    enum: ['All', 'Sleeper', '3AC', '2AC', '1AC'],
    default: 'All'
  },
  quota: {
    type: String,
    enum: ['All', 'General', 'Tatkal'],
    default: 'All'
  },

  // Flight specific
  airline: { type: String, default: 'All' },
  fareType: {
    type: String,
    enum: ['All', 'Economy', 'Business'],
    default: 'All'
  },

  // Common
  demandType: [{
    type: String,
    enum: ['Normal', 'Weekend', 'Festival']
  }],
  commissionType: {
    type: String,
    enum: ['flat', 'percentage', 'hybrid'],
    default: 'flat'
  },
  value: {
    type: Number,
    required: true,
    min: 0
  },
  // Point 8: Extended Nested Commission Object
  commission: {
    type: { type: String, enum: ['flat', 'percentage', 'hybrid'] },
    value: Number,
    min: Number,
    max: Number
  },

  // Pricing Controls
  minCap: { type: Number, default: 0 },
  maxCap: { type: Number, default: 999999 },
  applyOn: { type: String, enum: ['Original', 'Discounted'], default: 'Original' },

  // Advanced Payout Logic
  useSlabs: { type: Boolean, default: false },
  slabs: [{
    min: Number,
    max: Number,
    value: Number // Flat or Percentage based on commissionType
  }],
  weekendMultiplier: { type: Number, default: 1.1 }, // 10% boost
  festivalMultiplier: { type: Number, default: 1.2 }, // 20% boost
  roundingRule: {
    type: String,
    enum: ['None', 'Round to 10', 'Round to 50'],
    default: 'None'
  },

  // Dynamic Logic
  isDynamic: { type: Boolean, default: false },
  lowOccupancyRate: { type: Number, default: 0 },
  mediumOccupancyRate: { type: Number, default: 0 },
  highOccupancyRate: { type: Number, default: 0 },

  isActive: { type: Boolean, default: true },
  priority: { type: Number, default: 0 } // higher priority rules take precedence
}, { timestamps: true });

module.exports = mongoose.model('Commission', commissionSchema);
module.exports = mongoose.model('Commission', commissionSchema);
