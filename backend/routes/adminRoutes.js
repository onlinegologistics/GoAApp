const express = require('express');
const router = express.Router();
const Operator = require('../models/Operator');
const Bus = require('../models/Bus');
const Route = require('../models/Route');
const Booking = require('../models/Booking');
const mongoose = require('mongoose');
const { authMiddleware } = require('../middleware/authMiddleware');
const stationController = require('../controllers/stationController');
const adminDashboardController = require('../controllers/adminDashboardController');
const adminBusController = require('../controllers/adminBusController');
const routeController = require('../controllers/routeController');
const adminBookingController = require('../controllers/adminBookingController');
// const { getHotelDashboardStats } = require('../controllers/hotel/hotelController');

// ─── ADMIN BUS MANAGEMENT ────────────────────────────────────────────────────
router.get('/buses', authMiddleware, adminBusController.getAllBuses);
router.get('/buses/count', authMiddleware, adminBusController.getBusCounts);
router.post('/buses', authMiddleware, adminBusController.createBus);
router.delete('/buses/:id', authMiddleware, adminBusController.deleteBus);

// Status updates: approve, reject, suspend, activate
router.patch('/buses/:id/:action', authMiddleware, adminBusController.updateBusStatus);

// Operators management
router.get('/operators', authMiddleware, adminBusController.getAllOperators);
router.get('/operators/:id', authMiddleware, adminBusController.getOperatorById);

// Bus Types management
router.get('/bus-types', authMiddleware, adminBusController.getAllBusTypes);
router.post('/bus-types', authMiddleware, adminBusController.createBusType);
router.delete('/bus-types/:id', authMiddleware, adminBusController.deleteBusType);

// ─── ROUTE NETWORK MANAGEMENT ───────────────────────────────────────────────
router.get('/routes', authMiddleware, routeController.getAllRoutes);
router.post('/routes', authMiddleware, routeController.createRoute);
router.put('/routes/:id', authMiddleware, routeController.updateRoute);
router.delete('/routes/:id', authMiddleware, routeController.deleteRoute);
router.patch('/routes/:id/popular', authMiddleware, routeController.togglePopular);

// ─── BOOKING CONTROL MANAGEMENT ──────────────────────────────────────────────
router.get('/bookings', authMiddleware, adminBookingController.getAllBookings);
router.get('/bookings/hotels', authMiddleware, adminBookingController.getAllHotelBookings);
router.get('/bookings/stats', authMiddleware, adminBookingController.getBookingStats);
router.get('/bookings/cancel-requests', authMiddleware, adminBookingController.getCancelRequests);
router.patch('/bookings/:id/force-cancel', authMiddleware, adminBookingController.forceCancelBooking);
router.post('/bookings/cancel/:id', authMiddleware, adminBookingController.approveCancel);
router.post('/bookings/reject-cancel/:id', authMiddleware, adminBookingController.rejectCancel);
router.post('/bookings/refund/:id', authMiddleware, adminBookingController.initiateRefund);
router.get('/bookings/operator/:operatorId', authMiddleware, adminBookingController.getOperatorBookings);
router.post('/bookings/fraud-alerts/:id/action', authMiddleware, adminBookingController.handleFraudAction);

// GET /api/admin/hotel/dashboard
// router.get('/hotel/dashboard', authMiddleware, getHotelDashboardStats);

// ─── Helper: build scoped query filters based on admin role ───────────────────
// superadmin → no filter (sees all)
// admin      → filters by adminId chain: adminId → operatorIds → busIds
const getScopeFilters = async (user) => {
    if (user.role === 'superadmin') {
        return { operatorFilter: {}, busFilter: {}, bookingFilter: {} };
    }

    const adminObjId = new mongoose.Types.ObjectId(user.id);

    const operators = await Operator.find({ adminId: adminObjId }, '_id');
    const operatorIds = operators.map(op => op._id);

    const buses = await Bus.find({ operator: { $in: operatorIds } }, '_id');
    const busIds = buses.map(b => b._id);

    return {
        operatorFilter: { adminId: adminObjId },
        busFilter: { operator: { $in: operatorIds } },
        bookingFilter: { bus: { $in: busIds } },
        operatorIds,
        busIds
    };
};

// GET /api/admin/stats — scoped per admin role; superadmin sees everything
router.get('/stats', authMiddleware, async (req, res) => {
    try {
        const User = require('../models/User');
        const FlightBooking = require('../models/flight/flightBooking.model');
        const HotelBooking = require('../models/hotel/HotelBooking');

        const { operatorFilter, busFilter, bookingFilter } = await getScopeFilters(req.user);
        const isSuperAdmin = req.user.role === 'superadmin';

        const [totalOperators, totalBuses, totalRoutes, totalUsers] = await Promise.all([
            Operator.countDocuments(operatorFilter),
            Bus.countDocuments(busFilter),
            Route.countDocuments(),
            User.countDocuments({ role: 'user' })
        ]);

        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        // Aggregation for all services (Only for SuperAdmin or scoped if applicable)
        // For now, SuperAdmin sees everything, Admin potentially sees a subset of Bus

        const [busRevenueRes, flightRevenueRes, hotelRevenueRes, busBookingsCount, flightBookingsCount, hotelBookingsCount] = await Promise.all([
            // Bus Stats
            Booking.aggregate([
                { $match: { ...bookingFilter, paymentStatus: 'Completed' } },
                { $group: { _id: null, total: { $sum: '$totalFare' } } }
            ]),
            // Flight Stats (SuperAdmin only)
            isSuperAdmin ? FlightBooking.aggregate([
                { $match: { paymentStatus: 'PAID' } },
                { $group: { _id: null, total: { $sum: '$fareDetails.totalAmount' } } }
            ]) : Promise.resolve([]),
            // Hotel Stats (SuperAdmin only)
            isSuperAdmin ? HotelBooking.aggregate([
                { $match: { paymentStatus: 'Completed' } },
                { $group: { _id: null, total: { $sum: '$totalPrice' } } }
            ]) : Promise.resolve([]),
            // Lifetime Counts
            Booking.countDocuments(bookingFilter),
            isSuperAdmin ? FlightBooking.countDocuments() : Promise.resolve(0),
            isSuperAdmin ? HotelBooking.countDocuments() : Promise.resolve(0)
        ]);

        const totalRevenue = (busRevenueRes[0]?.total || 0) + (flightRevenueRes[0]?.total || 0) + (hotelRevenueRes[0]?.total || 0);
        const totalBookings = busBookingsCount + flightBookingsCount + hotelBookingsCount;

        const topRoutes = await Booking.aggregate([
            { $match: { ...bookingFilter, paymentStatus: 'Completed' } },
            { $group: { _id: '$route', revenue: { $sum: '$totalFare' }, count: { $count: {} } } },
            { $sort: { revenue: -1 } },
            { $limit: 10 },
            {
                $lookup: {
                    from: 'routes',
                    localField: '_id',
                    foreignField: '_id',
                    as: 'routeDetails'
                }
            },
            { $unwind: { path: '$routeDetails', preserveNullAndEmptyArrays: true } }
        ]);

        const formattedTopRoutes = topRoutes.map(item => ({
            route: item.routeDetails ? `${item.routeDetails.from} → ${item.routeDetails.to}` : 'Unknown Route',
            revenue: `₹${item.revenue.toLocaleString()}`,
            count: `${item.count} Bookings`,
            growth: '+5%'
        }));

        res.json({
            success: true,
            stats: {
                revenue: totalRevenue,
                bookings: totalBookings,
                users: totalUsers,
                totalOperators,
                totalBuses,
                totalRoutes,
                topRoutes: formattedTopRoutes
            }
        });
    } catch (error) {
        console.error('Error fetching admin stats:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// GET /api/admin/dashboard
router.get('/dashboard', authMiddleware, adminDashboardController.getAdminDashboard);

// GET /api/admin/transport/dashboard
router.get('/transport/dashboard', authMiddleware, adminDashboardController.getTransportDashboard);

// GET /api/admin/users — global user list (not admin-scoped)
router.get('/users', authMiddleware, async (req, res) => {
    try {
        const User = require('../models/User');
        const users = await User.find({ role: 'user' }).sort({ createdAt: -1 });
        res.json({ success: true, users });
    } catch (error) {
        console.error('Error fetching users:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// GET /api/admin/my-operators — operators scoped to logged-in admin
router.get('/my-operators', authMiddleware, async (req, res) => {
    try {
        if (req.user.role === 'superadmin') {
            const operators = await Operator.find();
            return res.json({ success: true, operators });
        }
        const adminObjId = new mongoose.Types.ObjectId(req.user.id);
        const operators = await Operator.find({ adminId: adminObjId });
        res.json({ success: true, operators });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// GET /api/admin/my-bookings — bookings scoped to logged-in admin's buses
router.get('/my-bookings', authMiddleware, async (req, res) => {
    try {
        const { operatorId } = req.query;
        let { bookingFilter, operatorIds, busIds } = await getScopeFilters(req.user);

        // If specific operator requested, further refine the filter
        if (operatorId && operatorId !== 'all') {
            const requestedOpId = new mongoose.Types.ObjectId(operatorId);

            // Find buses for this specific operator to apply to booking filter
            const busesForOp = await Bus.find({ operator: requestedOpId }, '_id');
            const busIdsForOp = busesForOp.map(b => b._id);
            bookingFilter.bus = { $in: busIdsForOp };
        }

        const bookings = await Booking.find(bookingFilter)
            .populate('bus', 'busName busNumber')
            .populate('route')
            .sort({ createdAt: -1 });

        res.json({ success: true, bookings });
    } catch (error) {
        console.error('Error fetching scoped bookings:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// POST /api/admin/stations — strict explicitly superadmin protected
router.post('/stations', authMiddleware, async (req, res, next) => {
    if (req.user.role !== 'superadmin') {
        return res.status(403).json({ success: false, error: 'Access denied. Super Admin only.' });
    }
    await stationController.addStation(req, res);
});

// GET /api/admin/stations — retrieve all active stations
router.get('/stations', authMiddleware, stationController.getStations);

module.exports = router;
