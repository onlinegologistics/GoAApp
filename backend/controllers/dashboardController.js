const Bus = require('../models/Bus');
const Booking = require('../models/Booking');
const Schedule = require('../models/Schedule');
const Route = require('../models/Route'); // Ensure Route is registered
const dayjs = require('dayjs');
const mongoose = require('mongoose');

/**
 * Get Operator Dashboard Stats
 * Aggregates data specific to the logged-in operator.
 */
exports.getOperatorStats = async (req, res) => {
    try {
        if (!req.operator || !req.operator.id) {
            return res.status(401).json({ success: false, message: 'Operator not authenticated' });
        }

        const operatorIdString = req.operator.id;
        let operatorId;
        
        try {
            operatorId = new mongoose.Types.ObjectId(operatorIdString);
        } catch (err) {
            return res.status(400).json({ success: false, message: 'Invalid operator identification' });
        }

        const weekAgo = dayjs().subtract(7, 'days').startOf('day').toDate();

        // 1. Get all buses belonging to this operator
        const myBuses = await Bus.find({ operator: operatorId }, '_id');
        const busIds = myBuses.map(b => b._id);

        if (busIds.length === 0) {
            return res.status(200).json({
                success: true,
                stats: { totalBuses: 0, activeBuses: 0, totalBookings: 0, totalRevenue: 0, seatOccupancy: 0 },
                recentBookings: [],
                chartData: []
            });
        }

        // 2. Aggregate data
        const results = await Promise.allSettled([
            Bus.countDocuments({ operator: operatorId }),
            Bus.countDocuments({ operator: operatorId, status: { $in: ['active', 'live', 'approved'] } }),
            Booking.countDocuments({ bus: { $in: busIds } }),
            Booking.aggregate([
                { $match: { bus: { $in: busIds }, paymentStatus: 'Completed' } },
                { $group: { _id: null, total: { $sum: '$totalFare' } } }
            ]),
            Booking.find({ bus: { $in: busIds } })
                .sort({ createdAt: -1 })
                .limit(5)
                .populate('bus', 'busName busNumber')
                .populate('route', 'fromCity toCity'),
            Booking.aggregate([
                { 
                    $match: { 
                        bus: { $in: busIds },
                        bookingDate: { $type: "date", $gte: weekAgo },
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

        // Helper to get fulfilled results
        const getVal = (idx, fallback = 0) => results[idx].status === 'fulfilled' ? results[idx].value : fallback;

        const totalBuses = getVal(0);
        const activeBuses = getVal(1);
        const totalBookings = getVal(2);
        const revenueData = getVal(3, []);
        const recentBookings = getVal(4, []);
        const weeklyStats = getVal(5, []);

        const totalRevenue = revenueData[0]?.total || 0;

        res.status(200).json({
            success: true,
            stats: {
                totalBuses,
                activeBuses,
                totalBookings,
                totalRevenue,
                seatOccupancy: 65,
            },
            recentBookings,
            chartData: weeklyStats
        });
    } catch (error) {
        console.error('Operator Dashboard Critical Error:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Server error while fetching dashboard stats', 
            error: error.message
        });
    }
};
