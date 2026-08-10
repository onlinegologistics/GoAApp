const express = require('express');
const router = express.Router();
const Schedule = require('../models/Schedule');
const Booking = require('../models/Booking');

const { operatorAuthMiddleware } = require('../middleware/operatorAuthMiddleware');
const Bus = require('../models/Bus');

// Create Schedule
router.post('/create', operatorAuthMiddleware, async (req, res) => {
    try {
        const bus = await Bus.findOne({ _id: req.body.bus, operator: req.operator.id });
        if (!bus) {
            return res.status(403).json({ error: 'Unauthorized: You do not own this bus' });
        }
        const payload = { ...req.body, operator: req.operator.id };
        const schedule = new Schedule(payload);
        await schedule.save();

        // Automatically mark bus as "pending" for Admin review after scheduling
        await Bus.findByIdAndUpdate(req.body.bus, { status: 'pending' });

        res.status(201).json(schedule);
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

// Get All (Filtered for Operator)
router.get('/my-schedules', operatorAuthMiddleware, async (req, res) => {
    try {
        const schedules = await Schedule.find({ operator: req.operator.id }).populate('bus route');
        res.json(schedules);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Get All (For Admin)
router.get('/all', async (req, res) => {
    try {
        const schedules = await Schedule.find().populate('bus route operator');
        res.json(schedules);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Unified Time Slot categorization for consistent Commission matching
const getTimeSlot = (timeStr) => {
    if (!timeStr) return 'All';
    const hour = parseInt(timeStr.split(':')[0]);
    if (isNaN(hour)) return 'All';
    if (hour >= 5 && hour < 12) return 'Morning';    // 05:00 - 11:59
    if (hour >= 12 && hour < 17) return 'Afternoon'; // 12:00 - 16:59
    if (hour >= 17 && hour < 21) return 'Evening';   // 17:00 - 20:59
    return 'Night';                                  // 21:00 - 04:59
};

// Search Schedules (Public)
router.get('/search', async (req, res) => {
    try {
        const { from, to, date, womenBooking } = req.query;
        if (!from || !to) {
            return res.status(400).json({ error: 'Origin and destination are required' });
        }
        const Route = require('../models/Route');
        const route = await Route.findOne({
            fromCity: { $regex: new RegExp(from, 'i') },
            toCity: { $regex: new RegExp(to, 'i') }
        });
        if (!route) return res.json([]);

        let query = { route: route._id };
        let searchDate;
        if (date) {
            searchDate = new Date(date);
            // If native Date fails or gives invalid date, try fallback parsing
            if (isNaN(searchDate.getTime())) {
                const parts = date.split('-');
                if (parts.length === 3) {
                    // Try DD-MM-YYYY fallback
                    searchDate = new Date(parts[2], parseInt(parts[1]) - 1, parts[0]);
                }
            }
        }
        if (searchDate && !isNaN(searchDate.getTime())) {
            const endOfDay = new Date(searchDate);
            endOfDay.setHours(23, 59, 59, 999);
            query.startDate = { $lte: endOfDay };
            query.frequency = 'daily';
        }

        let schedules = await Schedule.find(query).populate('bus route operator');

        // SECURITY: Filter for visibility - only show approved/live buses AND active schedules in search
        schedules = schedules.filter(schedule => 
            schedule.status === 'active' &&
            schedule.bus && ['live', 'approved', 'active'].includes(schedule.bus.status)
        );

        // Apply Dynamic Commission Orchestration
        const pricingEngine = require('../services/pricingEngine');

        const isWeekend = searchDate ? (searchDate.getDay() === 0 || searchDate.getDay() === 6) : false;

        const orchestratedSchedules = await Promise.all(schedules.map(async (schedule) => {
            const schedObj = schedule.toObject();

            // Find best available coupon for this specific bus/operator/route
            const Coupon = require('../models/Coupon');
            const availableCoupons = await Coupon.find({
                status: 'Active',
                applicableOn: { $in: ['Bus', 'All'] },
                validFrom: { $lte: searchDate || new Date() },
                validTill: { $gte: searchDate || new Date() },
                $or: [
                    { isGlobal: true },
                    { specificOperators: schedObj.operator?._id || schedObj.operator },
                    { applicableBuses: schedObj.bus?._id || schedObj.bus }
                ]
            }).sort({ discountValue: -1 }); // Get highest discount first

            // filter by route if not global routes
            const bestCoupon = availableCoupons.find(c => {
                if (c.applyToAllRoutes) return true;
                return c.applicableRoutes.some(r => r.toString() === schedObj.route?._id?.toString());
            });

            // Prepare matching parameters for Pricing Engine
            const context = {
                bus: schedObj.bus,
                schedule: schedObj,
                operatorId: schedObj.operator?._id || schedObj.operator,
                busId: schedObj.bus?._id || schedObj.bus,
                travelDate: date,
                sourceCity: schedObj.route?.fromCity,
                destinationCity: schedObj.route?.toCity,
                busType: schedObj.bus?.busType,
                timeSlot: getTimeSlot(schedObj.departureTime),
                seatType: (schedObj.bus?.amenities || []).some(a => a.toUpperCase().includes('AC')) ? 'AC' : 'Non-AC',
                distance: schedObj.route?.distance || 0,
                isWeekend,
                isFestival: false,
                userRole: 'B2C'
            };

            const breakdown = await pricingEngine.calculate(context);

            if (schedObj.bus && schedObj.bus.seatLayout) {
                schedObj.bus.seatLayout = schedObj.bus.seatLayout.map(seat => {
                    const baseSeatPrice = Number(seat.price || schedObj.ticketPrice || 0);
                    return {
                        ...seat,
                        basePrice: baseSeatPrice,
                        commission: breakdown.commission,
                        price: Math.round(
                            baseSeatPrice +
                            (breakdown.seatPremiums / (context.selectedSeats?.length || 1)) +
                            breakdown.surgeAmount +
                            breakdown.boardingPremium -
                            breakdown.userDiscount -
                            breakdown.couponDiscount +
                            breakdown.commission
                        )
                    };
                });
            }

            return {
                ...schedObj,
                baseFare: schedObj.ticketPrice,
                commission: breakdown.commission,
                finalPrice: breakdown.totalFare,
                ticketPrice: breakdown.totalFare,
                coupon: bestCoupon ? {
                    code: bestCoupon.code,
                    discountType: bestCoupon.discountType,
                    discountValue: bestCoupon.discountValue,
                    rules: bestCoupon.rules
                } : null
            };
        }));

        res.json(orchestratedSchedules);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ── NEW: Get Single Schedule by ID ──────────────────────────────────────────
router.get('/:id', async (req, res) => {
    try {
        const schedule = await Schedule.findById(req.params.id).populate('bus route operator');
        if (!schedule) return res.status(404).json({ error: 'Schedule not found' });
        res.json(schedule);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ── NEW: Get Passengers for a Schedule ──────────────────────────────────────
router.get('/:id/passengers', async (req, res) => {
    try {
        const schedule = await Schedule.findById(req.params.id).populate('bus route');
        if (!schedule) return res.status(404).json({ error: 'Schedule not found' });

        const bookings = await Booking.find({
            schedule: req.params.id,
            status: { $in: ['Confirmed', 'Pending'] }
        }).populate('userId', 'name email phone');

        res.json({ schedule, bookings });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Update
router.put('/:id', operatorAuthMiddleware, async (req, res) => {
    try {
        const schedule = await Schedule.findById(req.params.id);
        if (!schedule || schedule.operator.toString() !== req.operator.id) {
            return res.status(404).json({ error: 'Schedule not found or unauthorized' });
        }
        const updatedSchedule = await Schedule.findByIdAndUpdate(req.params.id, req.body, { new: true });
        res.json(updatedSchedule);
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

// Delete
router.delete('/:id', operatorAuthMiddleware, async (req, res) => {
    try {
        const schedule = await Schedule.findById(req.params.id);
        if (!schedule || schedule.operator.toString() !== req.operator.id) {
            return res.status(404).json({ error: 'Schedule not found or unauthorized' });
        }
        await Schedule.findByIdAndDelete(req.params.id);
        res.json({ message: 'Schedule deleted' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Get latest schedule for a bus
router.get('/bus/:busId/latest', async (req, res) => {
    try {
        const schedule = await Schedule.findOne({ bus: req.params.busId })
            .sort({ createdAt: -1 })
            .populate('route');
        res.json(schedule);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
