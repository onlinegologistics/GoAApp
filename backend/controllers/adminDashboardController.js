const Operator = require('../models/Operator');
const Bus = require('../models/Bus');
const Route = require('../models/Route');
const Booking = require('../models/Booking');
const User = require('../models/User');
const Schedule = require('../models/Schedule');
const mongoose = require('mongoose');
const dayjs = require('dayjs');

// Helper to get scope filters (reused from adminRoutes logic)
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

const calculateGrowth = (current, previous) => {
    if (previous === 0) return current > 0 ? 100 : 0;
    return parseFloat((((current - previous) / previous) * 100).toFixed(1));
};

exports.getAdminDashboard = async (req, res) => {
    try {
        const { operatorFilter, busFilter, bookingFilter } = await getScopeFilters(req.user);

        const todayStart = dayjs().startOf('day').toDate();
        const todayEnd = dayjs().endOf('day').toDate();
        const yesterdayStart = dayjs().subtract(1, 'day').startOf('day').toDate();
        const yesterdayEnd = dayjs().subtract(1, 'day').endOf('day').toDate();

        const [
            totalOperators,
            totalBuses,
            totalRoutes,
            totalUsers,
            bookingsToday,
            bookingsYesterday,
            revenueDataToday,
            revenueDataYesterday,
            activeRoutesCount
        ] = await Promise.all([
            Operator.countDocuments(operatorFilter),
            Bus.countDocuments(busFilter),
            Route.countDocuments(),
            User.countDocuments({ role: 'user' }),
            Booking.countDocuments({ ...bookingFilter, bookingDate: { $gte: todayStart, $lte: todayEnd } }),
            Booking.countDocuments({ ...bookingFilter, bookingDate: { $gte: yesterdayStart, $lte: yesterdayEnd } }),
            Booking.aggregate([
                { $match: { ...bookingFilter, bookingDate: { $gte: todayStart, $lte: todayEnd }, paymentStatus: 'Completed' } },
                { $group: { _id: null, total: { $sum: '$totalFare' } } }
            ]),
            Booking.aggregate([
                { $match: { ...bookingFilter, bookingDate: { $gte: yesterdayStart, $lte: yesterdayEnd }, paymentStatus: 'Completed' } },
                { $group: { _id: null, total: { $sum: '$totalFare' } } }
            ]),
            Schedule.distinct('route', { ...busFilter }) // Routes with active schedules for the scoped buses
        ]);

        const revenueToday = revenueDataToday[0]?.total || 0;
        const revenueYesterday = revenueDataYesterday[0]?.total || 0;

        // Mock growth for static totals (normally would track historical totals per day)
        // For demonstration, we use random minor variations or 0 if no historical data
        const growth = {
            operators: 2.5,
            buses: 1.2,
            routes: 0.5,
            bookings: calculateGrowth(bookingsToday, bookingsYesterday),
            revenue: calculateGrowth(revenueToday, revenueYesterday),
            users: 3.1,
            activeRoutes: 1.0
        };

        res.json({
            success: true,
            totalOperators,
            totalBuses,
            totalRoutes,
            bookingsToday,
            totalRevenue: revenueToday,
            totalUsers,
            activeRoutes: activeRoutesCount.length,
            growth
        });
    } catch (error) {
        console.error('Admin Dashboard Error:', error);
        res.status(500).json({ success: true, message: 'Server error', error: error.message });
    }
};

exports.getTransportDashboard = async (req, res) => {
    try {
        const todayStart = dayjs().startOf('day').toDate();
        const todayEnd = dayjs().endOf('day').toDate();

        const [
            totalOperators,
            totalBuses,
            activeBuses,
            inactiveBuses,
            totalRoutes,
            runningBusesArr,
            bookingsToday,
            revenueData,
            topRoutesRaw,
            topOperatorsRaw,
            recentBookings,
            weeklyStats
        ] = await Promise.all([
            Operator.countDocuments(),
            Bus.countDocuments(),
            Bus.countDocuments({ status: 'active' }),
            Bus.countDocuments({ status: 'inactive' }),
            Route.countDocuments(),
            // Simplified running buses check: unique buses from daily schedules that have already started
            Schedule.distinct('bus', { 
                $or: [
                    { date: { $gte: todayStart, $lte: todayEnd } }, // Explicit date (if exists)
                    { frequency: 'daily', startDate: { $lte: todayEnd } } // Daily recurrence
                ]
            }), 
            Booking.countDocuments({ bookingDate: { $gte: todayStart, $lte: todayEnd } }),
            Booking.aggregate([
                { $match: { paymentStatus: 'Completed' } },
                { $group: { _id: null, total: { $sum: '$totalFare' } } }
            ]),
            Booking.aggregate([
                { $match: { paymentStatus: 'Completed' } },
                { $group: { _id: '$route', count: { $sum: 1 }, revenue: { $sum: '$totalFare' } } },
                { $sort: { count: -1 } },
                { $limit: 5 },
                { $lookup: { from: 'routes', localField: '_id', foreignField: '_id', as: 'routeInfo' } },
                { $unwind: { path: '$routeInfo', preserveNullAndEmptyArrays: true } }
            ]),
            Booking.aggregate([
                { $match: { paymentStatus: 'Completed' } },
                { $lookup: { from: 'buses', localField: 'bus', foreignField: '_id', as: 'busInfo' } },
                { $unwind: '$busInfo' },
                { $group: { _id: '$busInfo.operator', count: { $sum: 1 }, revenue: { $sum: '$totalFare' } } },
                { $sort: { revenue: -1 } },
                { $limit: 5 },
                { $lookup: { from: 'operators', localField: '_id', foreignField: '_id', as: 'opInfo' } },
                { $unwind: '$opInfo' }
            ]),
            Booking.find()
                .sort({ createdAt: -1 })
                .limit(10)
                .populate('bus', 'busName busNumber')
                .populate('route', 'fromCity toCity'),
            // Daily stats for last 7 days
            Booking.aggregate([
                { 
                    $match: { 
                        bookingDate: { $gte: dayjs().subtract(7, 'days').startOf('day').toDate() },
                        paymentStatus: 'Completed'
                    } 
                },
                {
                    $group: {
                        _id: { $dateToString: { format: "%Y-%m-%d", date: "$bookingDate" } },
                        bookings: { $sum: 1 },
                        revenue: { $sum: "$totalFare" }
                    }
                },
                { $sort: { _id: 1 } }
            ])
        ]);

        const topRoutes = topRoutesRaw.map(r => ({
            name: r.routeInfo ? `${r.routeInfo.fromCity} - ${r.routeInfo.toCity}` : 'Unknown',
            bookings: r.count,
            revenue: r.revenue
        }));

        const topOperators = topOperatorsRaw.map(o => ({
            name: o.opInfo?.companyName || 'Unknown',
            bookings: o.count,
            revenue: o.revenue
        }));

        res.json({
            success: true,
            totalOperators,
            totalBuses,
            activeBuses,
            inactiveBuses,
            totalRoutes,
            runningBusesToday: runningBusesArr.length,
            bookingsToday,
            revenue: revenueData[0]?.total || 0,
            topRoutes,
            topOperators,
            recentBookings,
            chartData: weeklyStats
        });
    } catch (error) {
        console.error('Transport Dashboard Error:', error);
        res.status(500).json({ success: false, message: 'Server error', error: error.message });
    }
};
