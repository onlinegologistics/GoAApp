const mongoose = require('mongoose');

const trainSchema = new mongoose.Schema({
    name: { type: String, required: true },
    number: { type: String, required: true, unique: true },
    type: { type: String }, // e.g., Express, Superfast, Rajdhani
    source: { type: mongoose.Schema.Types.ObjectId, ref: 'Station', required: true },
    destination: { type: mongoose.Schema.Types.ObjectId, ref: 'Station', required: true },
    runsOn: [{ type: String }], // ['Mon', 'Tue', ...]
    status: { type: String, enum: ['Active', 'Inactive'], default: 'Active' },
}, { timestamps: true });

module.exports = mongoose.model('Train', trainSchema);
