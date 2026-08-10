const Booking = require('../models/Booking');
const CancellationLog = require('../models/CancellationLog');
const FraudAlert = require('../models/FraudAlert');
const User = require('../models/User');
const HotelBooking = require('../models/hotel/HotelBooking');

/**
 * GET /api/admin/bookings
 * Global access with advanced filtering
 */
exports.getAllBookings = async (req, res) => {
    try {
        const { search, status, paymentStatus, startDate, endDate, operatorId } = req.query;
        let query = {};

        if (status) query.status = status;
        if (paymentStatus) query.paymentStatus = paymentStatus;

        // Date range filtering
        if (startDate && endDate) {
            query.bookingDate = {
                $gte: new Date(startDate),
                $lte: new Date(endDate)
            };
        } else if (startDate) {
            query.bookingDate = { $gte: new Date(startDate) };
        } else if (endDate) {
            query.bookingDate = { $lte: new Date(endDate) };
        }

        // Search logic
        if (search) {
            query.$or = [
                { pnrNumber: { $regex: search, $options: 'i' } },
                { passengerName: { $regex: search, $options: 'i' } },
                { passengerEmail: { $regex: search, $options: 'i' } }
            ];
        }

        const bookings = await Booking.find(query)
            .populate('bus', 'busName busNumber operator')
            .populate('route', 'fromCity toCity')
            .populate('userId', 'name email mobile')
            .sort({ createdAt: -1 });

        // If filtering by operator (nested population lookup)
        let filteredBookings = bookings;
        if (operatorId) {
            filteredBookings = bookings.filter(b => b.bus?.operator?.toString() === operatorId);
        }

        res.json({ success: true, bookings: filteredBookings });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

/**
 * PATCH /api/admin/bookings/:id/force-cancel
 */
exports.forceCancelBooking = async (req, res) => {
    try {
        const { reason, refundAmount } = req.body;
        const booking = await Booking.findById(req.params.id);

        if (!booking) return res.status(404).json({ success: false, message: 'Booking not found' });
        if (booking.status === 'Cancelled') return res.status(400).json({ success: false, message: 'Booking is already cancelled' });

        booking.status = 'Cancelled';
        booking.paymentStatus = 'Cancelled';
        await booking.save();

        // Create Cancellation Log
        const log = new CancellationLog({
            bookingId: booking._id,
            pnrNumber: booking.pnrNumber || 'N/A',
            userId: booking.userId,
            originalTotalFare: booking.totalFare,
            refundAmount: refundAmount || booking.totalFare,
            cancellationCharges: (booking.totalFare - (refundAmount || 0)),
            reversedCommission: 0, // Simplified for now
            reason: reason || 'Administrative Cancellation'
        });
        await log.save();

        res.json({ success: true, message: 'Booking successfully force-cancelled', log });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

/**
 * GET /api/admin/bookings/refunds
 */
exports.getRefundLogs = async (req, res) => {
    try {
        const logs = await CancellationLog.find()
            .populate({
                path: 'bookingId',
                populate: { path: 'userId', select: 'name email' }
            })
            .sort({ createdAt: -1 });
        res.json({ success: true, logs });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

/**
 * GET /api/admin/bookings/fraud-alerts
 */
exports.getFraudAlerts = async (req, res) => {
    try {
        // Simple Automated Detection: Multiple bookings from same IP in last hour
        // For now, return stored alerts and run a quick scan
        const alerts = await FraudAlert.find()
            .populate('booking', 'pnrNumber totalFare')
            .populate('user', 'name email mbile')
            .sort({ createdAt: -1 });

        res.json({ success: true, alerts });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

/**
 * POST /api/admin/bookings/fraud-alerts/:id/action
 */
exports.handleFraudAction = async (req, res) => {
    try {
        const { action } = req.body; // 'block', 'cancel_booking', 'ignore'
        const alert = await FraudAlert.findById(req.params.id);
        if (!alert) return res.status(404).json({ success: false, message: 'Alert not found' });

        if (action === 'ignore') {
            alert.status = 'Ignored';
        } else if (action === 'block') {
            await User.findByIdAndUpdate(alert.user, { isBlocked: true });
            alert.status = 'Resolved';
        }

        await alert.save();
        res.json({ success: true, message: `Fraud alert action '${action}' processed` });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
/**
 * GET /api/admin/bookings/cancel-requests
 */
exports.getCancelRequests = async (req, res) => {
    try {
        const bookings = await Booking.find({ status: 'cancel_requested' })
            .populate('bus', 'busName busNumber')
            .populate('userId', 'name email mobile')
            .sort({ createdAt: -1 });
        res.json({ success: true, bookings });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

/**
 * POST /api/admin/bookings/cancel/:id
 */
exports.approveCancel = async (req, res) => {
    try {
        const booking = await Booking.findById(req.params.id);
        if (!booking) return res.status(404).json({ success: false, message: 'Booking not found' });

        booking.status = 'Cancelled';
        booking.paymentStatus = 'Cancelled';
        await booking.save();

        res.json({ success: true, message: 'Cancellation approved', booking });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

/**
 * POST /api/admin/bookings/reject-cancel/:id
 */
exports.rejectCancel = async (req, res) => {
    try {
        const booking = await Booking.findById(req.params.id);
        if (!booking) return res.status(404).json({ success: false, message: 'Booking not found' });

        booking.status = 'cancel_rejected';
        await booking.save();

        res.json({ success: true, message: 'Cancellation request rejected', booking });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

/**
 * POST /api/admin/bookings/refund/:id
 */
exports.initiateRefund = async (req, res) => {
    try {
        const booking = await Booking.findById(req.params.id);
        if (!booking) return res.status(404).json({ success: false, message: 'Booking not found' });

        // Admin can initiate, but superadmin handles final (simulated here)
        booking.status = 'refund_initiated';
        await booking.save();

        res.json({ success: true, message: 'Refund initiated successfully', booking });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

/**
 * GET /api/admin/bookings/operator/:operatorId
 */
exports.getOperatorBookings = async (req, res) => {
    try {
        const { operatorId } = req.params;
        const bookings = await Booking.find()
            .populate({
                path: 'bus',
                match: { operator: operatorId },
                select: 'busName busNumber'
            })
            .populate('userId', 'name email mobile')
            .sort({ createdAt: -1 });

        // Filter out bookings where bus didn't match the operator
        const filtered = bookings.filter(b => b.bus !== null);

        res.json({ success: true, bookings: filtered });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

/**
 * GET /api/admin/bookings/stats
 */
exports.getBookingStats = async (req, res) => {
    try {
        const stats = await Booking.aggregate([
            {
                $facet: {
                    totals: [
                        {
                            $group: {
                                _id: null,
                                totalBookings: { $sum: 1 },
                                totalRevenue: { $sum: { $cond: [{ $eq: ["$paymentStatus", "Completed"] }, "$totalFare", 0] } },
                                cancelledBookings: { $sum: { $cond: [{ $eq: ["$status", "Cancelled"] }, 1, 0] } },
                                pendingRefunds: { $sum: { $cond: [{ $eq: ["$status", "refund_initiated"] }, 1, 0] } }
                            }
                        }
                    ]
                }
            }
        ]);

        res.json({
            success: true,
            stats: stats[0].totals[0] || {
                totalBookings: 0,
                totalRevenue: 0,
                cancelledBookings: 0,
                pendingRefunds: 0
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

/**
 * GET /api/admin/bookings/hotels
 */
exports.getAllHotelBookings = async (req, res) => {
    try {
        const bookings = await HotelBooking.find({ tripId: { $exists: true, $ne: null } }).sort({ createdAt: -1 });
        res.json({ success: true, bookings });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
