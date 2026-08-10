const mongoose = require('mongoose');

const trainScheduleSchema = new mongoose.Schema({
    train_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Train', required: true },
    date: { type: Date, required: true },
    available: { type: Boolean, default: true }
}, { timestamps: true });

module.exports = mongoose.model('TrainSchedule', trainScheduleSchema);
