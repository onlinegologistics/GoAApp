const mongoose = require('mongoose');

const coachTypeSchema = new mongoose.Schema({
    name: { type: String, required: true, unique: true }, // e.g., 1A, 2A, 3A, SL, CC, EC, 2S
    fullName: { type: String, required: true }, // e.g., "First AC", "Second AC"
    defaultSeats: { type: Number, required: true, default: 72 },
    icon: { type: String, default: '🚃' },
    order: { type: Number, default: 0 } // Display order (1A=1, 2A=2, etc.)
}, { timestamps: true });

module.exports = mongoose.model('CoachType', coachTypeSchema);
