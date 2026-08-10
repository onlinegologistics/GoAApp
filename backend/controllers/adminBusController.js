const Bus = require('../models/Bus');
const Operator = require('../models/Operator');
const BusType = require('../models/BusType');
const User = require('../models/User');
const Schedule = require('../models/Schedule');
const mongoose = require('mongoose');

/**
 * GET /api/admin/buses
 * Supports filters: status, search
 */
exports.getAllBuses = async (req, res) => {
    try {
        const { status, search, operatorId } = req.query;
        let query = {};
        
        // Filter by specific operator if provided
        if (operatorId) {
            query.operator = operatorId;
        }
        
        // Contextual Status Filtering with Logical Grouping
        if (status) {
            if (status.toLowerCase() === 'active') {
                query.status = { $in: ['active', 'live', 'approved'] };
            } else if (status.toLowerCase() === 'pending') {
                query.status = { $in: ['pending', 'under_review'] };
            } else {
                query.status = { $regex: new RegExp(`^${status}$`, 'i') };
            }
        }

        // Real-time Search Filtering
        if (search) {
            query.$or = [
                { busName: { $regex: search, $options: 'i' } },
                { busNumber: { $regex: search, $options: 'i' } }
            ];
        }

        const buses = await Bus.find(query)
            .populate('operator', 'companyName name email')
            .sort({ createdAt: -1 });

        res.json({ success: true, buses });
    } catch (error) {
        console.error('Error fetching buses:', error);
        res.status(500).json({ success: false, message: 'Server error while fetching buses' });
    }
};

/**
 * GET /api/admin/buses/count
 * Returns counts for badges
 */
exports.getBusCounts = async (req, res) => {
    try {
        const { status } = req.query;
        let query = {};
        if (status) {
            if (status.toLowerCase() === 'active') {
                query.status = { $in: ['active', 'live', 'approved'] };
            } else if (status.toLowerCase() === 'pending') {
                query.status = { $in: ['pending', 'under_review'] };
            } else {
                query.status = status;
            }
        }

        const count = await Bus.countDocuments(query);
        res.json({ success: true, count });
    } catch (error) {
        console.error('Error in getBusCounts:', error);
        res.status(500).json({ success: false, message: error.message || 'Server error' });
    }
};

/**
 * PATCH /api/admin/buses/:id/:action
 * Approve, Reject, Suspend, Activate
 */
exports.updateBusStatus = async (req, res) => {
    try {
        const { id, action } = req.params;
        const busId = id.trim();
        const actionKey = action.toLowerCase();
        let status;

        switch (actionKey) {
            case 'approve':
                status = 'active'; // Changed from 'approved' to 'active' to match system visibility
                break;
            case 'activate':
                status = 'active'; // Standardizing on 'active'
                break;
            case 'reject':
                status = 'rejected';
                break;
            case 'suspend':
                status = 'suspended';
                break;
            case 'submit_for_approval':
                status = 'under_review';
                break;
            default:
                status = actionKey;
        }

        console.log(`[Bus Status Update Request] ID: ${busId}, Action: ${actionKey}, Target Status: ${status}`);

        const bus = await Bus.findOneAndUpdate(
            { _id: new mongoose.Types.ObjectId(busId) }, 
            { $set: { status: status } }, 
            { new: true, runValidators: true }
        );

        if (!bus) {
            console.log(`[Bus Status Update] Bus not found: ${busId}`);
            return res.status(404).json({ success: false, message: 'Bus not found' });
        }

        console.log(`[Bus Status Update] Bus ${busId} status successfully updated to ${bus.status}`);

        // Update all related schedules
        let scheduleStatus;
        if (status === 'active') {
            scheduleStatus = 'active';
        } else if (status === 'suspended' || status === 'rejected') {
            scheduleStatus = 'inactive';
        }

        if (scheduleStatus) {
            try {
                const result = await Schedule.updateMany(
                    { bus: busId }, 
                    { status: scheduleStatus }
                );
                console.log(`[Bus Status Update] Cascaded to ${result.modifiedCount} schedules for bus ${busId}`);
            } catch (schedError) {
                console.error(`[Bus Status Update] Error updating schedules for bus ${busId}:`, schedError);
            }
        }

        res.json({ 
            success: true, 
            bus, 
            message: `Bus ${actionKey === 'approve' ? 'approved' : actionKey === 'submit_for_approval' ? 'submitted' : actionKey} successfully. Status is now ${status}.` 
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

/**
 * POST /api/admin/buses
 */
exports.createBus = async (req, res) => {
    try {
        const bus = new Bus(req.body);
        await bus.save();
        res.status(201).json({ success: true, bus });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
};

/**
 * DELETE /api/admin/buses/:id
 */
exports.deleteBus = async (req, res) => {
    try {
        const bus = await Bus.findByIdAndDelete(req.params.id);
        if (!bus) return res.status(404).json({ success: false, message: 'Bus not found' });
        res.json({ success: true, message: 'Bus deleted successfully' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

/**
 * OPERATORS MANAGEMENT
 */
exports.getAllOperators = async (req, res) => {
    try {
        const operators = await Operator.find({ isDeleted: false }).sort({ createdAt: -1 });
        res.json({ success: true, operators });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

/**
 * GET /api/admin/operators/:id
 */
exports.getOperatorById = async (req, res) => {
    try {
        const operator = await Operator.findById(req.params.id);
        if (!operator) return res.status(404).json({ success: false, message: 'Operator not found' });
        res.json({ success: true, operator });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

/**
 * BUS TYPES MANAGEMENT
 */
exports.getAllBusTypes = async (req, res) => {
    try {
        const types = await BusType.find().sort({ name: 1 });
        res.json({ success: true, types });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

exports.createBusType = async (req, res) => {
    try {
        const type = new BusType(req.body);
        await type.save();
        res.status(201).json({ success: true, type });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
};

exports.deleteBusType = async (req, res) => {
    try {
        const type = await BusType.findByIdAndDelete(req.params.id);
        if (!type) return res.status(404).json({ success: false, message: 'Bus Type not found' });
        res.json({ success: true, message: 'Bus Type deleted' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
