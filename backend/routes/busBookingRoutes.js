const express = require('express');
const router = express.Router();
const Operator = require('../models/Operator');
const Route = require('../models/Route');
const Bus = require('../models/Bus');
const Schedule = require('../models/Schedule');
const Booking = require('../models/Booking');

// Generic CRUD helper (Simulated for brevity, can be expanded)
const handleCRUD = (Model) => ({
    getAll: async (req, res) => {
        try {
            const data = await Model.find().populate(Model.modelName === 'Bus' ? 'operator' : Model.modelName === 'Schedule' ? 'bus route' : Model.modelName === 'Booking' ? 'bus route schedule' : '');
            res.json(data);
        } catch (err) { res.status(500).json({ error: err.message }); }
    },
    create: async (req, res) => {
        try {
            const newItem = new Model(req.body);
            await newItem.save();
            res.status(201).json(newItem);
        } catch (err) { res.status(400).json({ error: err.message }); }
    }
});

// Operator Routes
router.get('/operators', async (req, res) => {
    try {
        const operators = await Operator.find().lean();
        const operatorsWithBusCount = await Promise.all(operators.map(async (op) => {
            const busCount = await Bus.countDocuments({ operator: op._id });
            return { ...op, totalBuses: busCount };
        }));
        res.json(operatorsWithBusCount);
    } catch (err) { res.status(500).json({ error: err.message }); }
});
router.post('/operators', async (req, res) => {
    try {
        const newItem = new Operator(req.body);
        await newItem.save();
        res.status(201).json(newItem);
    } catch (err) { res.status(400).json({ error: err.message }); }
});

// Route Routes
router.get('/routes', async (req, res) => {
    try {
        const routes = await Route.find({ status: 'Active' }).sort({ fromCity: 1 });
        res.json(routes);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});
router.post('/routes', async (req, res) => {
    // Keep internal for now but restrict usage if needed
    try {
        const newItem = new Route(req.body);
        await newItem.save();
        res.status(201).json(newItem);
    } catch (err) { res.status(400).json({ error: err.message }); }
});

// Bus Routes
const busCtrl = handleCRUD(Bus);
router.get('/buses', busCtrl.getAll);
router.post('/buses', busCtrl.create);

// Schedule Routes
const scheduleCtrl = handleCRUD(Schedule);
router.get('/schedules', scheduleCtrl.getAll);
router.post('/schedules', scheduleCtrl.create);

const Coupon = require('../models/Coupon');

// Booking Routes
router.get('/bookings', async (req, res) => {
    try {
        const data = await Booking.find().populate('bus route schedule');
        res.json(data);
    } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/bookings', async (req, res) => {
    try {
        const newItem = new Booking(req.body);
        await newItem.save();
        console.log(`✅ Booking saved ID: ${newItem._id}, Coupon applied: ${newItem.couponCode || 'None'}`);

        // Increment coupon usage if a code was applied
        if (newItem.couponCode && newItem.status === 'Confirmed') {
            console.log(`🔄 Attempting to increment usage for coupon: ${newItem.couponCode}`);
            const updateResult = await Coupon.findOneAndUpdate(
                { code: newItem.couponCode.toString().toUpperCase().trim() },
                { 
                    $inc: { 
                        'analytics.totalTimesUsed': 1,
                        'analytics.totalDiscountGiven': newItem.discount || 0
                    } 
                },
                { new: true }
            );
            
            if (updateResult) {
                console.log(`📈 Success: Coupon ${updateResult.code} usage is now ${updateResult.analytics.totalTimesUsed}`);
            } else {
                console.error(`❌ Failure: No active coupon found with code ${newItem.couponCode}`);
            }
        }

        res.status(201).json({ success: true, booking: newItem });
    } catch (err) { 
        console.error('Error saving booking:', err);
        res.status(400).json({ error: err.message }); 
    }
});

module.exports = router;
