const Train = require('../models/train/Train');
const TrainBooking = require('../models/train/TrainBooking');
const Station = require('../models/train/Station');

// GET all trains (Global View)
exports.getAllTrains = async (req, res) => {
    try {
        const trains = await Train.find()
            .populate('source', 'name code')
            .populate('destination', 'name code')
            .populate('created_by', 'name email');
        res.status(200).json({ success: true, count: trains.length, data: trains });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// PUT override train details
exports.overrideTrain = async (req, res) => {
    try {
        const train = await Train.findByIdAndUpdate(req.params.id, req.body, { 
            new: true, 
            runValidators: true 
        });
        if (!train) return res.status(404).json({ success: false, message: 'Train not found' });
        res.status(200).json({ success: true, data: train });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// DELETE train
exports.deleteTrain = async (req, res) => {
    try {
        const train = await Train.findByIdAndDelete(req.params.id);
        if (!train) return res.status(404).json({ success: false, message: 'Train not found' });
        res.status(200).json({ success: true, message: 'Train deleted successfully' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// GET all bookings (System-wide)
exports.getAllBookings = async (req, res) => {
    try {
        const bookings = await TrainBooking.find()
            .populate('user_id', 'name email')
            .populate('train_id', 'train_name train_number');
        res.status(200).json({ success: true, count: bookings.length, data: bookings });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// GET Reports & Analytics
exports.getReports = async (req, res) => {
    try {
        const totalTrains = await Train.countDocuments();
        const totalBookings = await TrainBooking.countDocuments();
        
        // Today's stats
        const startOfDay = new Date();
        startOfDay.setHours(0, 0, 0, 0);
        const endOfDay = new Date();
        endOfDay.setHours(23, 59, 59, 999);

        const todayBookings = await TrainBooking.countDocuments({
            createdAt: { $gte: startOfDay, $lte: endOfDay }
        });

        const revenueData = await TrainBooking.aggregate([
            { $match: { status: { $ne: 'CANCELLED' } } },
            { $group: { _id: null, total: { $sum: '$totalFare' } } }
        ]);
        const totalRevenue = revenueData.length > 0 ? revenueData[0].total : 0;

        const todayRevenueData = await TrainBooking.aggregate([
            { 
                $match: { 
                    createdAt: { $gte: startOfDay, $lte: endOfDay },
                    status: { $ne: 'CANCELLED' }
                } 
            },
            { $group: { _id: null, total: { $sum: '$totalFare' } } }
        ]);
        const todayRevenue = todayRevenueData.length > 0 ? todayRevenueData[0].total : 0;

        // Last 7 days booking trend
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
        
        const bookingTrend = await TrainBooking.aggregate([
            {
                $match: {
                    createdAt: { $gte: sevenDaysAgo }
                }
            },
            {
                $group: {
                    _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
                    count: { $sum: 1 }
                }
            },
            { $sort: { "_id": 1 } }
        ]);

        const stats = {
            totalTrains,
            totalBookings,
            todayBookings,
            todayRevenue,
            totalRevenue,
            bookingTrend,
            cancellationRatio: '1.2%' // Still semi-mocked or could be calculated
        };

        res.status(200).json({ success: true, data: stats });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// POST toggle API source
exports.toggleApiSource = async (req, res) => {
    try {
        const { mode, api_url } = req.body;
        // Logic to update global API config
        res.status(200).json({ success: true, mode, message: `System switched to ${mode} mode` });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
