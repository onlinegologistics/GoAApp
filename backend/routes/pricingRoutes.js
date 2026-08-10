const express = require('express');
const router = express.Router();
const engine = require('../services/pricingEngine');
const Bus = require('../models/Bus');
const Schedule = require('../models/Schedule');

/**
 * POST /api/pricing/simulate
 * Body: { busId, scheduleId, travelDate, userRole, selectedSeats, boardingPointId, couponCode }
 */
router.post('/simulate', async (req, res) => {
    try {
        const { busId, scheduleId, travelDate, userRole, selectedSeats, boardingPointId, couponCode } = req.body;

        if (!busId || !scheduleId || !travelDate) {
            return res.status(400).json({ success: false, message: 'busId, scheduleId, and travelDate are required.' });
        }

        const bus = await Bus.findById(busId);
        const schedule = await Schedule.findById(scheduleId).populate('route');

        if (!bus || !schedule) {
            return res.status(404).json({ success: false, message: 'Bus or Schedule not found.' });
        }

        const context = {
            bus,
            schedule,
            travelDate,
            userRole: userRole || 'B2C',
            selectedSeats: selectedSeats || [],
            boardingPointId,
            couponCode,
            isSimulation: true
        };

        const breakdown = await engine.calculate(context);

        res.json({
            success: true,
            breakdown
        });

    } catch (error) {
        console.error('Simulation Error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

module.exports = router;
