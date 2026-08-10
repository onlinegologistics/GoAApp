const mongoose = require('mongoose');

const stationSchema = new mongoose.Schema({
    name: { type: String, required: true },
    code: { type: String, required: true, unique: true }, // Mapped to stationCode in API
    city: { type: String, required: true },
    state: { type: String, required: true },
    latitude: { type: Number, required: true },
    longitude: { type: Number, required: true },
    status: { type: String, enum: ['active', 'inactive'], default: 'active' },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true });

// Auto uppercase station code before save
stationSchema.pre('save', async function () {
    if (this.isModified('code') && this.code) {
        this.code = this.code.toUpperCase();
    }
});

module.exports = mongoose.model('Station', stationSchema);
