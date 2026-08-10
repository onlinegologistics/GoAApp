const Bus = require('../models/Bus');
const Schedule = require('../models/Schedule');
const Operator = require('../models/Operator');
const mongoose = require('mongoose');

/**
 * GET /api/admin/bus-requests
 * Fetch all buses where status = "pending"
 * Includes aggregated operator, route, and timing info
 */
exports.getPendingRequests = async (req, res) => {
    try {
        const pendingBuses = await Bus.aggregate([
            { $match: { status: 'pending' } },
            {
                $lookup: {
                    from: 'operators',
                    localField: 'operator',
                    foreignField: '_id',
                    as: 'operatorInfo'
                }
            },
            { $unwind: '$operatorInfo' },
            {
                $lookup: {
                    from: 'schedules',
                    localField: '_id',
                    foreignField: 'bus',
                    as: 'schedules'
                }
            },
            {
                $project: {
                    busName: 1,
                    busNumber: 1,
                    createdAt: 1,
                    operatorName: '$operatorInfo.companyName',
                    // Take the first schedule's info if available
                    schedule: { $arrayElemAt: ['$schedules', 0] }
                }
            },
            {
                $lookup: {
                    from: 'routes',
                    localField: 'schedule.route',
                    foreignField: '_id',
                    as: 'routeInfo'
                }
            },
            {
                $project: {
                    busName: 1,
                    operatorName: 1,
                    createdDate: '$createdAt',
                    departureTime: '$schedule.departureTime',
                    route: {
                        $concat: [
                            { $ifNull: [{ $arrayElemAt: ['$routeInfo.fromCity', 0] }, 'N/A'] },
                            ' → ',
                            { $ifNull: [{ $arrayElemAt: ['$routeInfo.toCity', 0] }, 'N/A'] }
                        ]
                    }
                }
            },
            { $sort: { createdDate: -1 } }
        ]);

        res.json({ success: true, count: pendingBuses.length, data: pendingBuses });
    } catch (error) {
        console.error('Error fetching pending bus requests:', error);
        res.status(500).json({ success: false, message: 'Server error while fetching requests' });
    }
};

/**
 * GET /api/admin/bus-requests/:id
 * Fetch full details of a specific bus including operator, route, and schedule info
 */
exports.getRequestDetail = async (req, res) => {
    try {
        const busId = req.params.id;
        const bus = await Bus.findById(busId).populate('operator', 'name companyName email contactNumber address');
        
        if (!bus) {
            return res.status(404).json({ success: false, message: 'Bus request not found' });
        }

        const schedules = await Schedule.find({ bus: busId }).populate('route');

        res.json({ 
            success: true, 
            data: {
                bus,
                schedules
            }
        });
    } catch (error) {
        console.error('Error fetching bus request detail:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

/**
 * PATCH /api/admin/bus-requests/:id/submit
 * Forward for approval: status = "under_review"
 */
exports.submitForReview = async (req, res) => {
    try {
        const bus = await Bus.findOneAndUpdate(
            { _id: req.params.id, status: 'pending' },
            { status: 'under_review' },
            { new: true }
        );

        if (!bus) {
            return res.status(404).json({ success: false, message: 'Pending bus request not found or already processed' });
        }

        res.json({ success: true, message: 'Bus request submitted for final review', data: bus });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

/**
 * PATCH /api/admin/bus-requests/:id/suspend
 * Suspend request: status = "suspended"
 */
exports.suspendRequest = async (req, res) => {
    try {
        const bus = await Bus.findOneAndUpdate(
            { _id: req.params.id, status: 'pending' },
            { status: 'suspended' },
            { new: true }
        );

        if (!bus) {
            return res.status(404).json({ success: false, message: 'Pending bus request not found' });
        }

        res.json({ success: true, message: 'Bus request suspended due to issues', data: bus });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
