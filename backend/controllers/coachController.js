const CoachType = require('../models/train/CoachType');
const TrainCoach = require('../models/train/TrainCoach');
const SeatInventory = require('../models/train/SeatInventory');
const Train = require('../models/train/Train');

// ─── COACH TYPE MASTER ──────────────────────────────────────────────────────

// GET /api/coach-types
exports.getAllCoachTypes = async (req, res) => {
    try {
        const types = await CoachType.find().sort({ order: 1 });
        res.status(200).json({ success: true, coachTypes: types });
    } catch (error) {
        console.error('Error in getAllCoachTypes:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

// POST /api/coach-types
exports.createCoachType = async (req, res) => {
    try {
        const { name, fullName, defaultSeats, icon, order } = req.body;
        const existing = await CoachType.findOne({ name: name.toUpperCase() });
        if (existing) {
            return res.status(400).json({ success: false, message: `Coach type "${name}" already exists` });
        }
        const coachType = await CoachType.create({
            name: name.toUpperCase(),
            fullName: fullName || name,
            defaultSeats: defaultSeats || 72,
            icon: icon || '🚃',
            order: order || 99
        });
        res.status(201).json({ success: true, coachType });
    } catch (error) {
        console.error('Error in createCoachType:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

// ─── PER-TRAIN COACH CONFIGURATION ──────────────────────────────────────────

// GET /api/train/:trainId/coaches
exports.getTrainCoaches = async (req, res) => {
    try {
        const { trainId } = req.params;
        const coaches = await TrainCoach.find({ trainId })
            .populate('coachTypeId')
            .sort({ 'coachTypeId.order': 1 });

        // Also get seat inventory for pricing info
        const inventory = await SeatInventory.find({ trainId, date: null })
            .populate('coachTypeId');

        // Merge inventory data into coach data
        const result = coaches.map(coach => {
            const inv = inventory.find(i =>
                i.coachTypeId && coach.coachTypeId &&
                i.coachTypeId._id.toString() === coach.coachTypeId._id.toString()
            );
            return {
                _id: coach._id,
                trainId: coach.trainId,
                coachType: coach.coachTypeId, // populated
                coachCount: coach.coachCount,
                seatsPerCoach: coach.seatsPerCoach,
                totalSeats: coach.totalSeats,
                price: inv ? inv.price : 0,
                tatkalPrice: inv ? inv.tatkalPrice : 0,
                availableSeats: inv ? inv.availableSeats : coach.totalSeats,
                createdAt: coach.createdAt,
                updatedAt: coach.updatedAt
            };
        });

        res.status(200).json({ success: true, coaches: result });
    } catch (error) {
        console.error('Error in getTrainCoaches:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

// POST /api/train/:trainId/coaches
exports.saveTrainCoaches = async (req, res) => {
    try {
        const { trainId } = req.params;
        const { coaches } = req.body;
        // coaches = [{ coachTypeId, coachCount, seatsPerCoach, price, tatkalPrice }]

        if (!coaches || !Array.isArray(coaches)) {
            return res.status(400).json({ success: false, message: 'coaches array is required' });
        }

        // Verify train exists
        const train = await Train.findById(trainId);
        if (!train) {
            return res.status(404).json({ success: false, message: 'Train not found' });
        }

        // Delete existing config for this train
        await TrainCoach.deleteMany({ trainId });
        await SeatInventory.deleteMany({ trainId, date: null });

        const savedCoaches = [];
        const savedInventory = [];

        for (const c of coaches) {
            // Save coach config
            const trainCoach = await TrainCoach.create({
                trainId,
                coachTypeId: c.coachTypeId,
                coachCount: c.coachCount || 1,
                seatsPerCoach: c.seatsPerCoach || 72
            });
            savedCoaches.push(trainCoach);

            // Save base seat inventory (date=null for default pricing)
            const totalSeats = (c.coachCount || 1) * (c.seatsPerCoach || 72);
            const inv = await SeatInventory.create({
                trainId,
                coachTypeId: c.coachTypeId,
                date: null,
                availableSeats: totalSeats,
                totalSeats,
                price: c.price || 0,
                tatkalPrice: c.tatkalPrice || 0,
                waitingList: 0,
                racCount: 0
            });
            savedInventory.push(inv);
        }

        res.status(200).json({
            success: true,
            message: `Coach configuration saved for train ${train.name}`,
            coaches: savedCoaches,
            inventory: savedInventory
        });
    } catch (error) {
        console.error('Error in saveTrainCoaches:', error);
        if (error.code === 11000) {
            return res.status(400).json({ success: false, message: 'Duplicate coach type for this train' });
        }
        res.status(500).json({ success: false, message: error.message });
    }
};

// DELETE /api/train/:trainId/coaches/:coachId
exports.deleteTrainCoach = async (req, res) => {
    try {
        const { trainId, coachId } = req.params;
        const coach = await TrainCoach.findOneAndDelete({ _id: coachId, trainId });
        if (!coach) {
            return res.status(404).json({ success: false, message: 'Coach not found' });
        }

        // Also remove associated inventory
        await SeatInventory.deleteMany({ trainId, coachTypeId: coach.coachTypeId });

        res.status(200).json({ success: true, message: 'Coach removed successfully' });
    } catch (error) {
        console.error('Error in deleteTrainCoach:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

// ─── TRAIN AVAILABILITY ──────────────────────────────────────────────────────

// GET /api/train/:trainId/availability?date=YYYY-MM-DD
exports.getTrainAvailability = async (req, res) => {
    try {
        const { trainId } = req.params;
        const { date } = req.query;

        // Get coach config
        const coaches = await TrainCoach.find({ trainId }).populate('coachTypeId');

        if (coaches.length === 0) {
            return res.status(200).json({
                success: true,
                availability: [],
                message: 'No coaches configured for this train'
            });
        }

        // Try date-specific inventory first, fallback to base (date=null)
        const availability = [];

        for (const coach of coaches) {
            let inv = null;
            if (date) {
                inv = await SeatInventory.findOne({
                    trainId,
                    coachTypeId: coach.coachTypeId._id,
                    date
                });
            }
            // Fallback to base pricing
            if (!inv) {
                inv = await SeatInventory.findOne({
                    trainId,
                    coachTypeId: coach.coachTypeId._id,
                    date: null
                });
            }

            availability.push({
                coachType: coach.coachTypeId.name,
                coachFullName: coach.coachTypeId.fullName,
                coachCount: coach.coachCount,
                seatsPerCoach: coach.seatsPerCoach,
                totalSeats: coach.totalSeats,
                availableSeats: inv ? inv.availableSeats : coach.totalSeats,
                price: inv ? inv.price : 0,
                tatkalPrice: inv ? inv.tatkalPrice : 0,
                waitingList: inv ? inv.waitingList : 0,
                racCount: inv ? inv.racCount : 0
            });
        }

        res.status(200).json({ success: true, availability });
    } catch (error) {
        console.error('Error in getTrainAvailability:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};
