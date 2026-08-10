const mongoose = require('mongoose');

const trainCoachSchema = new mongoose.Schema({
    trainId: { type: mongoose.Schema.Types.ObjectId, ref: 'Train', required: true },
    coachTypeId: { type: mongoose.Schema.Types.ObjectId, ref: 'CoachType', required: true },
    coachCount: { type: Number, required: true, default: 1, min: 1 },
    seatsPerCoach: { type: Number, required: true, default: 72, min: 1 }
}, { timestamps: true });

// Each train can have only one config per coach type
trainCoachSchema.index({ trainId: 1, coachTypeId: 1 }, { unique: true });

// Virtual: total seats for this coach type on this train
trainCoachSchema.virtual('totalSeats').get(function () {
    return this.coachCount * this.seatsPerCoach;
});

// Ensure virtuals show in JSON
trainCoachSchema.set('toJSON', { virtuals: true });
trainCoachSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('TrainCoach', trainCoachSchema);
