const jwt = require('jsonwebtoken');
const User = require('../models/User');
const OperatorRequest = require('../models/OperatorRequest');
const Operator = require('../models/Operator');
// const HotelOperator = require('../models/hotel/HotelOperator');
const Bus = require('../models/Bus');
const Schedule = require('../models/Schedule');
const mongoose = require('mongoose');
const { sendSetPasswordEmail } = require('../utils/emailService');

// Submit Operator Request (Customer)
const submitOperatorRequest = async (req, res) => {
    try {
        const { fullName, email, mobileNumber, operatorType, documents } = req.body;
        const userId = req.user.id;

        // Check if user already has a pending request
        const existing = await OperatorRequest.findOne({ userId, status: 'pending' });
        if (existing) {
            return res.status(400).json({ success: false, message: "You already have a pending request." });
        }

        const request = new OperatorRequest({
            userId, fullName, email, mobileNumber, operatorType, documents
        });
        await request.save();

        res.status(201).json({ success: true, message: "Request submitted successfully. Waiting for approval." });
    } catch (error) {
        console.error("Operator Request Error:", error);
        res.status(500).json({ success: false, message: "Server Error" });
    }
};

// Get All Requests (Admin/Super Admin)
const getAllOperatorRequests = async (req, res) => {
    try {
        const requests = await OperatorRequest.find().sort({ createdAt: -1 });
        res.status(200).json({ success: true, requests });
    } catch (error) {
        res.status(500).json({ success: false, message: "Server Error" });
    }
};

// Approve Operator Request
const approveOperatorRequest = async (req, res) => {
    try {
        const { requestId } = req.body;
        const request = await OperatorRequest.findById(requestId);
        if (!request) return res.status(404).json({ success: false, message: "Request not found" });

        request.status = 'approved';
        await request.save();

        // Generate Set Password Link
        const setPasswordToken = jwt.sign(
            { 
                requestId: request._id, 
                userId: request.userId, 
                role: `${request.operatorType}_operator`,
                requestType: 'operator'
            },
            process.env.JWT_SECRET || 'fallback_secret',
            { expiresIn: '1h' }
        );

        const setPasswordLink = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/set-password?token=${setPasswordToken}`;
        
        // Send actual email dynamically to the address in the request
        await sendSetPasswordEmail(request.email, request.fullName, request.operatorType, setPasswordLink);
        
        // [NEW] Cascading Approval: If operator already exists, activate their fleet
        if (request.operatorType === 'bus') {
            const operator = await Operator.findOne({ email: request.email.toLowerCase() });
            if (operator) {
                // Activate operator status
                operator.status = 'Active';
                await operator.save();

                // Activate all buses
                await Bus.updateMany({ operator: operator._id }, { status: 'active' });
                
                // Activate all schedules for these buses
                const buses = await Bus.find({ operator: operator._id });
                const busIds = buses.map(b => b._id);
                await Schedule.updateMany({ bus: { $in: busIds } }, { status: 'active' });
                
                console.log(`[Operator Approval] Cascaded activation to fleet for ${operator.name}`);
            }
        }
        
        res.status(200).json({ 
            success: true, 
            message: "Request approved. Activation link generated.",
            setPasswordLink 
        });
    } catch (error) {
        res.status(500).json({ success: false, message: "Server Error" });
    }
};

// Manual Operator Creation (Admin/Super Admin)
const manualCreateOperator = async (req, res) => {
    try {
        const { fullName, email, mobileNumber, operatorType } = req.body;

        // Check if user exists, otherwise create a placeholder user
        let user = await User.findOne({ 
            $or: [{ mobileNumber }, { email }] 
        });

        if (!user) {
            user = new User({
                fullName,
                mobileNumber,
                email,
                role: 'user' // placeholder
            });
            await user.save();
        }

        const request = new OperatorRequest({
            userId: user._id,
            fullName,
            email,
            mobileNumber,
            operatorType,
            status: 'approved'
        });
        await request.save();

        // Generate Set Password Link
        const setPasswordToken = jwt.sign(
            { 
                requestId: request._id, 
                userId: user._id, 
                role: `${operatorType}_operator`,
                requestType: 'operator'
            },
            process.env.JWT_SECRET || 'fallback_secret',
            { expiresIn: '1h' }
        );

        const setPasswordLink = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/set-password?token=${setPasswordToken}`;

        // Send actual email dynamically to the address entered in the form
        await sendSetPasswordEmail(email, fullName, operatorType, setPasswordLink);

        // [NEW] Create the actual record immediately so it appears in the database/directory
        // This is now MANDATORY. If it fails (e.g. duplicate email), the request will fail.
        if (operatorType === 'bus') {
            await Operator.create({
                name: fullName,
                email: email,
                contactNumber: mobileNumber,
                password: 'TEMP_PASSWORD_CHANGE_ME', // Placeholder until link is used
                companyName: 'New Venture',
                adminId: req.user.id
            });
        } else if (operatorType === 'hotel') {
            console.log("Hotel operator creation is temporarily disabled.");
        }

        res.status(201).json({ 
            success: true, 
            message: "Operator created. Activation link generated.",
            setPasswordLink 
        });
    } catch (error) {
        console.error("Manual Create Error:", error);
        
        // Handle MongoDB Duplicate Key Error (11000)
        if (error.code === 11000) {
            const field = Object.keys(error.keyPattern)[0];
            return res.status(400).json({ 
                success: false, 
                message: `An operator with this ${field === 'contactNumber' || field === 'phone' || field === 'mobileNumber' ? 'phone number' : field} already exists.` 
            });
        }

        res.status(500).json({ success: false, message: error.message || "Server Error" });
    }
};

// Login Operator
const loginOperator = async (req, res) => {
    try {
        const { email, password } = req.body;
        console.log(`[Operator Login] Attempt for: ${email}`);

        if (!email || !password) {
            return res.status(400).json({ success: false, message: "Email and password are required." });
        }

        // Find operator by email - Robust search (handling case-insensitivity and potential missing isDeleted field)
        const operator = await Operator.findOne({ 
            email: { $regex: new RegExp(`^${email.toLowerCase().trim()}$`, 'i') }, 
            isDeleted: { $ne: true } 
        });
        if (!operator) {
            console.log(`[Operator Login] Operator not found for email: ${email}`);
            return res.status(401).json({ success: false, message: "Invalid email or password." });
        }

        console.log(`[Operator Login] Found operator: ${operator.email}, status: ${operator.status}`);

        // Check status
        if (operator.status !== 'Active') {
            console.log(`[Operator Login] Account not active: ${operator.status}`);
            return res.status(403).json({ success: false, message: `Your account is ${operator.status}. Please contact support.` });
        }

        // Compare password
        let isMatch = false;
        try {
            isMatch = await operator.comparePassword(password);
            console.log(`[Operator Login] Bcrypt match: ${isMatch}`);
        } catch (bcryptErr) {
            console.log(`[Operator Login] Bcrypt error (likely plain text in DB):`, bcryptErr.message);
        }

        // Fallback: If not matched, check if it's a plain text password (for migration/dev)
        if (!isMatch && operator.password === password) {
            console.log(`[Operator Login] Plain text password match found! Auto-hashing now...`);
            isMatch = true;
            // Automatically hash the plain text password for future security
            operator.password = password;
            await operator.save(); 
        }

        if (!isMatch) {
            console.log(`[Operator Login] Password mismatch for: ${email}`);
            return res.status(401).json({ success: false, message: "Invalid email or password." });
        }

        // Generate JWT
        const token = jwt.sign(
            { id: operator._id, email: operator.email, role: 'bus_operator', name: operator.name },
            process.env.JWT_SECRET || 'fallback_secret',
            { expiresIn: '7d' }
        );

        console.log(`[Operator Login] Login successful for: ${email}`);

        res.status(200).json({
            success: true,
            token,
            operator: {
                id: operator._id,
                name: operator.name,
                email: operator.email,
                role: 'bus_operator',
                companyName: operator.companyName
            }
        });
    } catch (error) {
        console.error("Operator Login Error:", error);
        res.status(500).json({ success: false, message: "Server Error" });
    }
};

module.exports = {
    submitOperatorRequest,
    getAllOperatorRequests,
    approveOperatorRequest,
    manualCreateOperator,
    loginOperator
};
