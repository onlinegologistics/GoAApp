const User = require('../models/User');
const Operator = require('../models/Operator');
// const HotelOperator = require('../models/hotel/HotelOperator');
// const HotelBooking = require('../models/hotel/HotelBooking');
const HotelOperator = {
    countDocuments: async () => 0,
    find: () => ({ sort: () => ({ select: async () => [] }) }),
    findOne: async () => null,
    findById: async () => null,
};
const HotelBooking = {
    countDocuments: async () => 0,
};
const Booking = require('../models/Booking');
const FlightBooking = {
    countDocuments: async () => 0,
};
const OperatorRequest = require('../models/OperatorRequest');

// Get centralized stats for User Directory
const getDirectoryStats = async (req, res) => {
    try {
        const [totalAdmins, appUsersCount, webUsersCount] = await Promise.all([
            User.countDocuments({ role: 'admin' }),
            User.AppUser.countDocuments({ role: 'user' }),
            User.countDocuments({ role: 'user' })
        ]);

        res.status(200).json({
            success: true,
            stats: {
                totalAdmins,
                appUsersCount,
                webUsersCount,
                totalUsers: appUsersCount + webUsersCount
            }
        });
    } catch (error) {
        console.error("Directory Stats Error:", error);
        res.status(500).json({ success: false, message: "Server Error" });
    }
};

// Get Users by Role (admin / user)
const getUsersByRole = async (req, res) => {
    try {
        const { role, search, status } = req.query;
        
        let query = {};
        let activeModel = User;

        if (role === 'web-user') {
            query.role = 'user';
            activeModel = User;
        } else if (role === 'user') {
            query.role = 'user';
            activeModel = User.AppUser;
        } else {
            query.role = role || 'user';
            activeModel = User;
        }

        if (search) {
            query.$or = [
                { fullName: { $regex: search, $options: 'i' } },
                { email: { $regex: search, $options: 'i' } },
                { mobileNumber: { $regex: search, $options: 'i' } }
            ];
        }

        // Users don't have a status field in the schema yet, but we'll return them all
        // or filter by other fields if needed.

        const users = await activeModel.find(query).sort({ createdAt: -1 }).select('-adminPassword -otp -otpExpiry');

        // Fetch booking counts for each user (only if role is 'user')
        let usersWithBookings = users;
        if (role === 'user') {
            usersWithBookings = await Promise.all(users.map(async (user) => {
                const [busCount, hotelCount, flightCount] = await Promise.all([
                    Booking.countDocuments({ userId: user._id }),
                    HotelBooking.countDocuments({ userId: user._id }),
                    FlightBooking.countDocuments({ userId: user._id })
                ]);
                return {
                    ...user.toObject(),
                    bookingCount: busCount + hotelCount + flightCount
                };
            }));
        }

        res.status(200).json({ success: true, users: usersWithBookings });
    } catch (error) {
        console.error("Fetch Users Error:", error);
        res.status(500).json({ success: false, message: "Server Error" });
    }
};

// Get Operators by Type (bus / hotel)
const getOperatorsByType = async (req, res) => {
    try {
        const { type, search, status } = req.query;
        let query = { isDeleted: { $ne: true } };

        if (search) {
            query.$or = [
                { name: { $regex: search, $options: 'i' } },
                { email: { $regex: search, $options: 'i' } },
                { companyName: { $regex: search, $options: 'i' } }
            ];
            if (type === 'bus') query.$or.push({ contactNumber: { $regex: search, $options: 'i' } });
            if (type === 'hotel') query.$or.push({ phone: { $regex: search, $options: 'i' } });
        }

        if (status) {
            query.status = status;
        }

        let operators = [];
        if (type === 'bus') {
            operators = await Operator.find(query).sort({ createdAt: -1 }).select('-password');
        } else if (type === 'hotel') {
            operators = await HotelOperator.find(query).sort({ createdAt: -1 }).select('-password');
        }

        res.status(200).json({ success: true, operators, type });
    } catch (error) {
        console.error("Fetch Operators Error:", error);
        res.status(500).json({ success: false, message: "Server Error" });
    }
};

// Update Status (Generic status update)
const updateDirectoryUserStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { type, status } = req.body;

        let model;
        if (type === 'bus-operator') model = Operator;
        else if (type === 'hotel-operator') model = HotelOperator;
        else if (type === 'admin') model = User;
        else if (type === 'user') model = User.AppUser;
        else return res.status(400).json({ success: false, message: "Invalid type" });

        const updatedUser = await model.findByIdAndUpdate(id, { status }, { new: true });
        if (!updatedUser) {
            return res.status(404).json({ success: false, message: "User not found" });
        }

        res.status(200).json({ success: true, message: `Status updated to ${status}`, user: updatedUser });
    } catch (error) {
        console.error("Update Status Error:", error);
        res.status(500).json({ success: false, message: "Server Error" });
    }
};

// Delete Record (Generic)
const deleteDirectoryRecord = async (req, res) => {
    try {
        const { id, type } = req.params;
        let model;

        if (type === 'admin' || type === 'user') {
            // Permanent delete for normal users/admins if requested, 
            // but we'll stick to soft delete for admins if preferred.
            // For now, let's just use soft delete for operators as requested.
            model = (type === 'user') ? User.AppUser : User;
            const deleted = await model.findByIdAndDelete(id); 

            if (!deleted) return res.status(404).json({ success: false, message: "Record not found" });
            return res.status(200).json({ success: true, message: "Record deleted successfully" });
        }
        else if (type === 'bus-operator') model = Operator;
        else if (type === 'hotel-operator') model = HotelOperator;
        else if (type === 'request') model = OperatorRequest;
        else return res.status(400).json({ success: false, message: "Invalid type" });

        // Soft Delete for operators
        const deleted = await model.findByIdAndUpdate(id, { isDeleted: true }, { new: true });
        if (!deleted) return res.status(404).json({ success: false, message: "Record not found" });

        res.status(200).json({ success: true, message: "Operator deactivated and removed from view (Soft Deleted)" });
    } catch (error) {
        console.error("Delete Record Error:", error);
        res.status(500).json({ success: false, message: "Server Error" });
    }
};

// Update Record (Generic)
const updateDirectoryRecord = async (req, res) => {
    try {
        const { id, type } = req.params;
        const { fullName, email, mobileNumber, companyName } = req.body;

        let model;
        let updateData = {};

        if (type === 'admin' || type === 'user') {
            model = (type === 'user') ? User.AppUser : User;
            updateData = { fullName, email, mobileNumber };
        } else if (type === 'bus-operator') {
            model = Operator;
            updateData = { name: fullName, email, contactNumber: mobileNumber, companyName };
        } else if (type === 'hotel-operator') {
            model = HotelOperator;
            updateData = { name: fullName, email, phone: mobileNumber, companyName };
        } else if (type === 'request') {
            model = OperatorRequest;
            updateData = { fullName, email, mobileNumber };
        } else {
            return res.status(400).json({ success: false, message: "Invalid type" });
        }

        const updated = await model.findByIdAndUpdate(id, updateData, { new: true });
        if (!updated) return res.status(404).json({ success: false, message: "Record not found" });

        res.status(200).json({ success: true, message: "Record updated successfully", data: updated });
    } catch (error) {
        console.error("Update Record Error:", error);
        res.status(500).json({ success: false, message: "Server Error" });
    }
};

// Toggle Block Status for Users/Admins
const toggleUserBlock = async (req, res) => {
    try {
        const { id } = req.params;
        const { isBlocked } = req.body;

        let user = await User.findById(id);
        if (!user) {
            user = await User.AppUser.findById(id);
        }
        if (!user) {
            return res.status(404).json({ success: false, message: "User not found" });
        }

        user.isBlocked = isBlocked;
        await user.save();

        res.status(200).json({ 
            success: true, 
            message: `User ${isBlocked ? 'Blocked' : 'Unblocked'} successfully`, 
            user: { _id: user._id, isBlocked: user.isBlocked } 
        });
    } catch (error) {
        console.error("Toggle Block Error:", error);
        res.status(500).json({ success: false, message: "Server Error" });
    }
};

module.exports = {
    getDirectoryStats,
    getUsersByRole,
    getOperatorsByType,
    updateDirectoryUserStatus,
    deleteDirectoryRecord,
    updateDirectoryRecord,
    toggleUserBlock
};
