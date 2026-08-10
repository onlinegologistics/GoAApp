const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const AppUser = User.AppUser;
const AdminRequest = require('../models/AdminRequest');
const Operator = require('../models/Operator');
const Bus = require('../models/Bus');
// const HotelOperator = require('../models/hotel/HotelOperator');
const OperatorRequest = require('../models/OperatorRequest');
const { verifyCaptcha } = require('../utils/captchaService');
const { sendOTP } = require('../utils/smsService');
const Otp = require('../models/Otp');
const { sendOtpEmail } = require('../utils/emailService');

// Generate a random 6-digit OTP
const generate6DigitOtp = () => {
    return Math.floor(100000 + Math.random() * 900000).toString();
};

/**
 * sendOtp / getOtp
 * Generates and saves OTP for a mobile number.
 * Works for both new and existing users.
 */
const getOtp = async (req, res) => {
    try {
        const { mobileNumber } = req.body;
        if (!mobileNumber || !/^\d{10}$/.test(mobileNumber)) {
            return res.status(400).json({ success: false, message: "Valid 10-digit mobile number is required" });
        }

        const otp = generate6DigitOtp();
        const otpExpiry = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes

        // Find or Create user to ensure only one record per phone number
        let user = await User.findOne({ mobileNumber });
        if (!user) {
            user = await User.AppUser.findOne({ mobileNumber });
        }
        
        if (user && user.isBlocked) {
            return res.status(403).json({ success: false, message: "Your account has been suspended. Please contact support." });
        }

        if (!user) {
            return res.status(404).json({ success: false, message: "User not registered. Please sign up first." });
        }

        // Overwrite previous OTP, reset attempts and update expiry
        user.otp = otp;
        user.otpExpiry = otpExpiry;
        user.otpAttempts = 0; 
        await user.save();

        // Debugging logs
        console.log("------------------------------------");
        console.log(`>>> OTP GENERATED: ${otp} for ${mobileNumber} <<<`);
        console.log(`>>> EXPIRY: ${otpExpiry.toISOString()} <<<`);
        console.log("------------------------------------");

        res.status(200).json({ 
            success: true, 
            message: "OTP sent successfully",
            ...(process.env.NODE_ENV === 'development' && { otp })
        });
    } catch (error) {
        console.error("sendOtp error:", error);
        res.status(500).json({ success: false, message: "Server Error" });
    }
};

/**
 * resendOtp
 * Overwrites the previous OTP and resets expiry.
 */
const resendOtp = async (req, res) => {
    console.log("Resending OTP...");
    return getOtp(req, res); // Reuse sendOtp logic as it already overwrites
};

/**
 * verifyOtp
 * Verifies the latest OTP, handles expiry, and clears it after success.
 */
const verifyOtp = async (req, res) => {
    try {
        const { mobileNumber, otp } = req.body;

        if (!mobileNumber || !otp) {
            return res.status(400).json({ success: false, message: "Mobile number and OTP are required" });
        }

        let user = await User.findOne({ mobileNumber });
        if (!user) {
            user = await User.AppUser.findOne({ mobileNumber });
        }

        if (!user) {
            return res.status(404).json({ success: false, message: "User not found. Please request a new OTP." });
        }

        if (user.isBlocked) {
            return res.status(403).json({ success: false, message: "Your account has been suspended. Please contact support." });
        }

        // 2. Check if OTP exists
        if (!user.otp || !user.otpExpiry) {
            return res.status(400).json({ success: false, message: "No OTP found. Please request a new OTP." });
        }

        // 3. Check for max attempts
        if (user.otpAttempts >= 3) {
            return res.status(400).json({ success: false, message: "Maximum OTP attempts exceeded. Please request a new OTP." });
        }

        // 4. Add console logs for debugging OTP mismatch
        console.log(`[DEBUG] Verifying OTP for ${mobileNumber}. Provided: ${otp}, Stored: ${user.otp}`);

        // 5. Check if OTP is expired
        if (new Date() > user.otpExpiry) {
            // Clear expired OTP
            user.otp = null;
            user.otpExpiry = null;
            user.otpAttempts = 0;
            await user.save();
            return res.status(400).json({ success: false, message: "OTP expired" });
        }

        // 6. Check OTP match
        if (user.otp !== otp) {
            user.otpAttempts += 1;
            await user.save();
            return res.status(400).json({ success: false, message: `Invalid OTP. Attempts left: ${3 - user.otpAttempts}` });
        }

        // 7. OTP is correct - Clear it after successful verification
        user.otp = null;
        user.otpExpiry = null;
        user.otpAttempts = 0;

        await user.save();

        const token = jwt.sign(
            { id: user._id, role: user.role },
            process.env.JWT_SECRET || 'fallback_secret',
            { expiresIn: "30d" }
        );

        res.status(200).json({
            success: true,
            message: "OTP verified successfully",
            token,
            user: {
                _id: user._id,
                fullName: user.fullName,
                mobileNumber: user.mobileNumber,
                role: user.role
            }
        });
    } catch (error) {
        console.error("verifyOtp error:", error);
        res.status(500).json({ success: false, message: "Server Error" });
    }
};

// Aliases for backward compatibility if needed, or we just update routes
const loginWithOtp = getOtp;
const verifyLoginOtp = verifyOtp;

/**
 * sendRegistrationOtp
 * Validates fullName, mobileNumber, captchaToken.
 * Generates OTP, sets 5-min expiry, resets otpAttempts.
 */
const sendRegistrationOtp = async (req, res) => {
    try {
        const { fullName, mobileNumber, captchaToken } = req.body;

        if (!fullName || !mobileNumber || !captchaToken) {
            return res.status(400).json({ success: false, message: "Full Name, Mobile Number, and CAPTCHA are required" });
        }

        if (!/^\d{10}$/.test(mobileNumber)) {
            return res.status(400).json({ success: false, message: "Valid 10-digit mobile number is required" });
        }

        const isCaptchaValid = await verifyCaptcha(captchaToken);
        if (!isCaptchaValid) {
            return res.status(400).json({ success: false, message: "Invalid CAPTCHA. Please try again." });
        }

        const otp = generate6DigitOtp();
        const otpExpiry = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes

        let user = await User.findOne({ mobileNumber });
        if (!user) {
            user = await User.AppUser.findOne({ mobileNumber });
        }
        if (!user) {
            user = new User({
                fullName,
                mobileNumber,
                role: "user"
            });
        } else {
            // Update name if they are registering an existing account
            user.fullName = fullName;
        }

        user.otp = otp;
        user.otpExpiry = otpExpiry;
        user.otpAttempts = 0; // reset attempts
        await user.save();

        await sendOTP(mobileNumber, otp);

        res.status(200).json({ 
            success: true, 
            message: "OTP sent successfully",
            ...(process.env.NODE_ENV === 'development' && { otp })
        });
    } catch (error) {
        console.error("sendRegistrationOtp error:", error);
        res.status(500).json({ success: false, message: "Server Error" });
    }
};

/**
 * verifyRegistrationOtp
 * Verifies OTP with max 3 attempts limit.
 */
const verifyRegistrationOtp = async (req, res) => {
    try {
        const { mobileNumber, otp } = req.body;

        if (!mobileNumber || !otp) {
            return res.status(400).json({ success: false, message: "Mobile number and OTP are required" });
        }

        let user = await User.findOne({ mobileNumber });
        if (!user) {
            user = await User.AppUser.findOne({ mobileNumber });
        }
        if (!user) {
            return res.status(404).json({ success: false, message: "User not found. Please request a new OTP." });
        }

        if (!user.otp || !user.otpExpiry) {
            return res.status(400).json({ success: false, message: "No OTP found. Please request a new OTP." });
        }

        if (user.otpAttempts >= 3) {
            return res.status(400).json({ success: false, message: "Maximum OTP attempts exceeded. Please request a new OTP." });
        }

        if (new Date() > user.otpExpiry) {
            user.otp = null;
            user.otpExpiry = null;
            user.otpAttempts = 0;
            await user.save();
            return res.status(400).json({ success: false, message: "OTP expired. Please request a new one." });
        }

        if (user.otp !== otp) {
            user.otpAttempts += 1;
            await user.save();
            return res.status(400).json({ success: false, message: `Invalid OTP. Attempts left: ${3 - user.otpAttempts}` });
        }

        // Success
        user.otp = null;
        user.otpExpiry = null;
        user.otpAttempts = 0;
        await user.save();

        const token = jwt.sign(
            { id: user._id, role: user.role },
            process.env.JWT_SECRET || 'fallback_secret',
            { expiresIn: "30d" }
        );

        res.status(200).json({
            success: true,
            message: "Registration successful",
            token,
            user: {
                _id: user._id,
                fullName: user.fullName,
                mobileNumber: user.mobileNumber,
                role: user.role
            }
        });
    } catch (error) {
        console.error("verifyRegistrationOtp error:", error);
        res.status(500).json({ success: false, message: "Server Error" });
    }
};
// Get Dashboard Statistics
const getDashboardStats = async (req, res) => {
    try {
        const [userCount, totalBuses, activeBuses, totalOperators] = await Promise.all([
            User.countDocuments({ role: 'user' }),
            Bus.countDocuments(),
            Bus.countDocuments({ status: { $in: ['active', 'live', 'approved'] } }),
            Operator.countDocuments()
        ]);

        res.status(200).json({
            success: true,
            stats: {
                revenue: 1254300, // Still placeholder for now
                bookings: 8540,   // Still placeholder for now
                users: userCount,
                agents: totalOperators, // Using operators as agents for now
                activeBuses,
                totalBuses
            }
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: "Server Error" });
    }
};

// Submit Admin Access Request
const submitAdminRequest = async (req, res) => {
    try {
        const { fullName, mobileNumber, email } = req.body;

        // Find user by mobile to get their ID
        const user = await User.findOne({ mobileNumber });
        if (!user) {
            return res.status(404).json({ success: false, message: "User not found" });
        }

        // Check if a pending request already exists
        const existingRequest = await AdminRequest.findOne({ mobileNumber, status: 'pending' });
        if (existingRequest) {
            return res.status(400).json({ success: false, message: "A request for this mobile number is already pending" });
        }

        const newRequest = await AdminRequest.create({
            userId: user._id,
            fullName,
            mobileNumber,
            email,
            status: 'pending',
            requestedRole: 'admin'
        });

        res.status(201).json({
            success: true,
            message: "Request submitted successfully",
            request: newRequest
        });
    } catch (error) {
        console.error("Admin Request Error:", error);
        if (error.code === 11000) {
            return res.status(400).json({ success: false, message: "Duplicate key error", details: error.keyValue });
        }
        res.status(500).json({ success: false, message: "Server Error", error: error.message });
    }
};

// Get all Admin Requests (Super Admin only)
const getAdminRequests = async (req, res) => {
    try {
        const requests = await AdminRequest.find().sort({ createdAt: -1 });
        res.status(200).json({ success: true, requests });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: "Server Error" });
    }
};

// Get Admin Notifications (pending requests count)
const getAdminNotifications = async (req, res) => {
    try {
        const count = await AdminRequest.countDocuments({ status: 'pending' });
        res.status(200).json({ success: true, count });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: "Server Error" });
    }
};

// Update Admin Request Status (Approve/Reject)
const updateAdminRequestStatus = async (req, res) => {
    try {
        const { requestId, status, permissions } = req.body;

        const request = await AdminRequest.findById(requestId);
        if (!request) {
            return res.status(404).json({ success: false, message: "Request not found" });
        }

        request.status = status;
        let setPasswordLink = '';

        if (status === 'approved') {
            request.permissions = permissions || [];
            
            // Generate a 10-minute JWT for setting the password
            const setPasswordToken = jwt.sign(
                { requestId: request._id, userId: request.userId, mobile: request.mobileNumber },
                process.env.JWT_SECRET || 'fallback_secret',
                { expiresIn: '10m' }
            );

            // In dev, we return it. In prod, we'd send an email.
            setPasswordLink = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/set-password/${setPasswordToken}`;
            console.log("APPROVE ADMIN REQUEST: Set Password Link ->", setPasswordLink);
        }

        await request.save();
        res.status(200).json({ 
            success: true, 
            message: `Request ${status} successfully`,
            setPasswordLink: status === 'approved' ? setPasswordLink : null
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: "Server Error" });
    }
};

// Admin Login (Username/Password)
const adminLogin = async (req, res) => {
    try {
        const { username, password } = req.body;

        const user = await User.findOne({ adminUsername: username });
        if (!user) {
            return res.status(401).json({ success: false, message: "Invalid credentials" });
        }

        if (user.isBlocked) {
            return res.status(403).json({ success: false, message: "Administrative access for this account has been suspended. Please contact the Super Admin." });
        }

        const isMatch = await bcrypt.compare(password, user.adminPassword);
        if (!isMatch) {
            return res.status(401).json({ success: false, message: "Invalid credentials" });
        }

        const token = jwt.sign(
            { id: user._id, role: user.role },
            process.env.JWT_SECRET || 'fallback_secret',
            { expiresIn: '24h' }
        );

        res.status(200).json({
            success: true,
            token,
            user: {
                id: user._id,
                fullName: user.fullName,
                mobile: user.mobileNumber,
                role: user.role,
                permissions: user.permissions
            }
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: "Server Error" });
    }
};

// Get all Admins (Super Admin only)
const getAllAdmins = async (req, res) => {
    try {
        const admins = await User.find({ role: 'admin' }).select('-password -adminPassword');
        res.status(200).json({ success: true, admins });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: "Server Error" });
    }
};

// Verify Activation Token
const verifyActivationToken = async (req, res) => {
    try {
        const { token } = req.params;
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback_secret');
        
        if (!decoded || !decoded.userId) {
            return res.status(401).json({ success: false, message: "Invalid or expired token" });
        }

        res.status(200).json({ 
            success: true, 
            role: decoded.role || 'admin',
            userId: decoded.userId
        });
    } catch (error) {
        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({ success: false, message: "Activation link expired." });
        }
        res.status(400).json({ success: false, message: "Invalid activation token." });
    }
};

// Set User Password (step 2 of onboarding for Admins & Operators)
const setAdminPassword = async (req, res) => {
    try {
        const { token, password, username } = req.body;

        // Verify the token
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback_secret');
        if (!decoded || !decoded.requestId) {
            return res.status(401).json({ success: false, message: "Invalid or expired token" });
        }

        const isOperator = decoded.requestType === 'operator';
        const model = isOperator ? OperatorRequest : AdminRequest;

        const request = await model.findById(decoded.requestId);
        if (!request || (request.status !== 'approved' && request.status !== 'pending' && !isOperator)) {
            // Note: Operators might be created directly with 'approved' status
            return res.status(400).json({ success: false, message: "Request not approved or already completed" });
        }

        const user = await User.findById(decoded.userId);
        if (!user) {
            return res.status(404).json({ success: false, message: "User not found" });
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Update User
        user.role = decoded.role || 'admin'; // Use role from token or default to admin
        user.adminUsername = username || request.mobileNumber; 
        user.adminPassword = hashedPassword;
        
        // For operators, permissions might be empty for now or preset
        if (!isOperator) {
            user.permissions = request.permissions;
        } else {
            user.permissions = ['dashboard']; // Base permission for operators
        }
        
        await user.save();

        // Mark request as processed/completed
        request.status = 'approved'; 
        await request.save();

        // [NEW] If it's an operator, create or update the actual record
        if (isOperator) {
            try {
                const operatorData = {
                    name: request.fullName || user.fullName,
                    email: request.email || user.email,
                    password: hashedPassword, // Use the hashed password
                    status: 'Active'
                };

                if (decoded.role === 'bus_operator') {
                    await Operator.findOneAndUpdate(
                        { email: operatorData.email },
                        { 
                            ...operatorData,
                            contactNumber: request.mobileNumber || user.mobileNumber,
                            companyName: 'New Venture',
                            adminId: request.userId 
                        },
                        { upsert: true, new: true }
                    );
                } else if (decoded.role === 'hotel_operator') {
                    console.log("Hotel operator integration is temporarily disabled.");
                }
            } catch (createErr) {
                console.error("Error updating operator record:", createErr);
            }
        }

        res.status(200).json({ 
            success: true, 
            message: `Password set successfully. You are now a ${user.role.replace('_', ' ')}!` 
        });
    } catch (error) {
        console.error("Set Admin Password Error:", error);

        // Handle MongoDB Duplicate Key Error (11000)
        if (error.code === 11000) {
            const field = Object.keys(error.keyPattern || {})[0];
            let message = "A conflict occurred with existing data.";
            
            if (field === 'adminUsername' || field === 'username') {
                message = "This username is already taken. Please choose another one.";
            } else if (field === 'email') {
                message = "This email is already associated with another account.";
            }

            return res.status(400).json({ success: false, message });
        }

        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({ success: false, message: "Activation link expired. Please request approval again." });
        }
        res.status(500).json({ success: false, message: error.message || "Server Error" });
    }
};

// Delete Administrator (Super Admin only)
const deleteAdmin = async (req, res) => {
    try {
        const { id } = req.params;

        const user = await User.findById(id);
        if (!user) {
            return res.status(404).json({ success: false, message: "Administrator not found" });
        }

        if (user.role !== 'admin') {
            return res.status(400).json({ success: false, message: "User is not an administrator" });
        }

        // Delete the user record
        await User.findByIdAndDelete(id);

        // Also clean up any associated admin requests
        await AdminRequest.deleteMany({ userId: id });

        res.status(200).json({ success: true, message: "Administrator deleted successfully" });
    } catch (error) {
        console.error("Delete Admin Error:", error);
        res.status(500).json({ success: false, message: "Server Error" });
    }
};

/**
 * sendRegisterEmailOtp
 * POST /api/auth/register/send-otp
 */
const sendRegisterEmailOtp = async (req, res) => {
    try {
        const { fullName, mobileNumber, email } = req.body;

        if (!fullName || !mobileNumber || !email) {
            return res.status(400).json({ success: false, message: "Full Name, Mobile Number, and Email Address are required" });
        }

        // Email validation
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return res.status(400).json({ success: false, message: "Invalid email format" });
        }

        // Mobile validation
        if (!/^\d{10}$/.test(mobileNumber)) {
            return res.status(400).json({ success: false, message: "Valid 10-digit mobile number is required" });
        }

        // Check if email already exists
        let existingUser = await User.findOne({ email });
        if (!existingUser) {
            existingUser = await User.AppUser.findOne({ email });
        }
        if (existingUser) {
            return res.status(400).json({ success: false, message: "Email already registered. Please login." });
        }

        // Rate limit: 1 OTP request per minute
        const oneMinuteAgo = new Date(Date.now() - 60 * 1000);
        const recentOtp = await Otp.findOne({ email, purpose: 'register', createdAt: { $gte: oneMinuteAgo } });
        if (recentOtp) {
            return res.status(429).json({ success: false, message: "Please wait 1 minute before requesting another OTP." });
        }

        const otp = generate6DigitOtp();
        const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes

        // Delete any old registration OTPs for this email to enforce "latest OTP only"
        await Otp.deleteMany({ email, purpose: 'register' });

        // Save new OTP
        await Otp.create({
            email,
            otp,
            purpose: 'register',
            expiresAt
        });

        // Send OTP via email
        const mailSent = await sendOtpEmail(email, otp);
        if (!mailSent) {
            return res.status(500).json({ success: false, message: "Failed to send verification email. Please try again." });
        }

        res.status(200).json({
            success: true,
            message: "OTP sent to your email successfully",
            ...(process.env.NODE_ENV === 'development' && { otp })
        });
    } catch (error) {
        console.error("sendRegisterEmailOtp error:", error);
        res.status(500).json({ success: false, message: "Server Error" });
    }
};

/**
 * verifyRegisterEmailOtp
 * POST /api/auth/register/verify-otp
 */
const verifyRegisterEmailOtp = async (req, res) => {
    try {
        const { fullName, mobileNumber, email, otp, password } = req.body;

        if (!fullName || !mobileNumber || !email || !otp) {
            return res.status(400).json({ success: false, message: "Full Name, Mobile Number, Email Address, and OTP are required" });
        }

        const otpRecord = await Otp.findOne({ email, purpose: 'register' }).sort({ createdAt: -1 });

        if (!otpRecord) {
            return res.status(400).json({ success: false, message: "No OTP found. Please request a new OTP." });
        }

        if (new Date() > otpRecord.expiresAt) {
            await Otp.deleteMany({ email, purpose: 'register' });
            return res.status(400).json({ success: false, message: "OTP expired. Please request a new one." });
        }

        if (otpRecord.otp !== otp) {
            return res.status(400).json({ success: false, message: "Invalid OTP. Please try again." });
        }

        // OTP verified - Create user
        let user = await User.findOne({ mobileNumber });
        if (!user) {
            user = await User.AppUser.findOne({ mobileNumber });
        }
        if (user) {
            // Mobile number is unique, so let's check if they already have an email or if there is a conflict.
            if (user.email && user.email !== email) {
                return res.status(400).json({ success: false, message: "This mobile number is already registered with another email." });
            }
            user.email = email;
            user.fullName = fullName;
            user.isEmailVerified = true;
            if (password) {
                user.password = await bcrypt.hash(password, 10);
            }
            await user.save();
        } else {
            const hashedPassword = password ? await bcrypt.hash(password, 10) : null;
            user = await AppUser.create({
                fullName,
                mobileNumber,
                email,
                password: hashedPassword,
                isEmailVerified: true,
                role: 'user',
                registrationSource: 'APP'
            });
        }

        // Delete used OTP
        await Otp.deleteMany({ email, purpose: 'register' });

        const token = jwt.sign(
            { id: user._id, role: user.role },
            process.env.JWT_SECRET || 'fallback_secret',
            { expiresIn: "30d" }
        );

        res.status(200).json({
            success: true,
            message: "Registration successful",
            token,
            user: {
                _id: user._id,
                fullName: user.fullName,
                mobileNumber: user.mobileNumber,
                email: user.email,
                role: user.role
            }
        });
    } catch (error) {
        console.error("verifyRegisterEmailOtp error:", error);
        res.status(500).json({ success: false, message: "Server Error" });
    }
};

/**
 * adminLoginStep1
 * POST /api/auth/admin/login
 * Verifies email + password for admin/superadmin accounts, then emails an OTP.
 */
const adminLoginStep1 = async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ success: false, message: "Email and password are required" });
        }

        const user = await User.findOne({ email, role: { $in: ['admin', 'superadmin'] } });
        if (!user || !user.adminPassword) {
            return res.status(401).json({ success: false, message: "Invalid credentials" });
        }

        if (user.isBlocked) {
            return res.status(403).json({ success: false, message: "Your admin access has been suspended. Please contact the Super Admin." });
        }

        const isMatch = await bcrypt.compare(password, user.adminPassword);
        if (!isMatch) {
            return res.status(401).json({ success: false, message: "Invalid credentials" });
        }

        // Rate limit: 1 OTP request per minute (Production only)
        if (process.env.NODE_ENV === 'production') {
            const oneMinuteAgo = new Date(Date.now() - 60 * 1000);
            const recentOtp = await Otp.findOne({ email, purpose: 'admin-login', createdAt: { $gte: oneMinuteAgo } });
            if (recentOtp) {
                return res.status(429).json({ success: false, message: "Please wait 1 minute before requesting another OTP." });
            }
        }

        const otp = generate6DigitOtp();
        const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes

        await Otp.deleteMany({ email, purpose: 'admin-login' });
        await Otp.create({ email, otp, purpose: 'admin-login', expiresAt });

        const mailSent = await sendOtpEmail(email, otp);
        if (!mailSent && process.env.NODE_ENV !== 'development') {
            return res.status(500).json({ success: false, message: "Failed to send OTP email. Please try again." });
        }

        res.status(200).json({
            success: true,
            message: mailSent ? "OTP sent to your email successfully" : "OTP email failed but allowed in DEV mode",
            ...(process.env.NODE_ENV === 'development' && { otp })
        });
    } catch (error) {
        console.error("adminLoginStep1 error:", error);
        res.status(500).json({ success: false, message: "Server Error" });
    }
};

/**
 * adminLoginVerifyOtp
 * POST /api/auth/admin/verify-otp
 * Verifies the OTP sent in adminLoginStep1, then issues a JWT.
 */
const adminLoginVerifyOtp = async (req, res) => {
    try {
        const { email, otp } = req.body;

        if (!email || !otp) {
            return res.status(400).json({ success: false, message: "Email and OTP are required" });
        }

        const otpRecord = await Otp.findOne({ email, purpose: 'admin-login' }).sort({ createdAt: -1 });
        if (!otpRecord) {
            return res.status(400).json({ success: false, message: "No OTP found. Please request a new OTP." });
        }

        if (new Date() > otpRecord.expiresAt) {
            await Otp.deleteMany({ email, purpose: 'admin-login' });
            return res.status(400).json({ success: false, message: "OTP expired. Please request a new one." });
        }

        if (otpRecord.otp !== otp) {
            return res.status(400).json({ success: false, message: "Invalid OTP. Please try again." });
        }

        const user = await User.findOne({ email, role: { $in: ['admin', 'superadmin'] } });
        if (!user) {
            return res.status(404).json({ success: false, message: "User not found." });
        }

        if (user.isBlocked) {
            return res.status(403).json({ success: false, message: "Your admin access has been suspended. Please contact the Super Admin." });
        }

        await Otp.deleteMany({ email, purpose: 'admin-login' });

        const token = jwt.sign(
            { id: user._id, role: user.role },
            process.env.JWT_SECRET || 'fallback_secret',
            { expiresIn: "12h" }
        );

        res.status(200).json({
            success: true,
            message: "Logged in successfully",
            token,
            user: {
                _id: user._id,
                fullName: user.fullName,
                email: user.email,
                role: user.role,
                permissions: user.permissions
            }
        });
    } catch (error) {
        console.error("adminLoginVerifyOtp error:", error);
        res.status(500).json({ success: false, message: "Server Error" });
    }
};

/**
 * sendLoginEmailOtp
 * POST /api/auth/login/send-otp
 */
const sendLoginEmailOtp = async (req, res) => {
    try {
        const { email } = req.body;

        if (!email) {
            return res.status(400).json({ success: false, message: "Email Address is required" });
        }

        // Email validation
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return res.status(400).json({ success: false, message: "Invalid email format" });
        }

        // Check if user exists by email
        let user = await User.findOne({ email });
        if (!user) {
            user = await User.AppUser.findOne({ email });
        }
        if (!user) {
            return res.status(404).json({ success: false, message: "Please register first. This email is not registered." });
        }

        if (user.isBlocked) {
            return res.status(403).json({ success: false, message: "Your account has been suspended. Please contact support." });
        }

        // Rate limit: 1 OTP request per minute
        const oneMinuteAgo = new Date(Date.now() - 60 * 1000);
        const recentOtp = await Otp.findOne({ email, purpose: 'login', createdAt: { $gte: oneMinuteAgo } });
        if (recentOtp) {
            return res.status(429).json({ success: false, message: "Please wait 1 minute before requesting another OTP." });
        }

        const otp = generate6DigitOtp();
        const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes

        // Delete old login OTPs to enforce "latest OTP only"
        await Otp.deleteMany({ email, purpose: 'login' });

        // Save new OTP
        await Otp.create({
            email,
            otp,
            purpose: 'login',
            expiresAt
        });

        // Send OTP via email
        const mailSent = await sendOtpEmail(email, otp);
        if (!mailSent) {
            return res.status(500).json({ success: false, message: "Failed to send OTP email. Please try again." });
        }

        res.status(200).json({
            success: true,
            message: "OTP sent to your email successfully",
            ...(process.env.NODE_ENV === 'development' && { otp })
        });
    } catch (error) {
        console.error("sendLoginEmailOtp error:", error);
        res.status(500).json({ success: false, message: "Server Error" });
    }
};

/**
 * verifyLoginEmailOtp
 * POST /api/auth/login/verify-otp
 */
const verifyLoginEmailOtp = async (req, res) => {
    try {
        const { email, otp } = req.body;

        if (!email || !otp) {
            return res.status(400).json({ success: false, message: "Email and OTP are required" });
        }

        const otpRecord = await Otp.findOne({ email, purpose: 'login' }).sort({ createdAt: -1 });

        if (!otpRecord) {
            return res.status(400).json({ success: false, message: "No OTP found. Please request a new OTP." });
        }

        if (new Date() > otpRecord.expiresAt) {
            await Otp.deleteMany({ email, purpose: 'login' });
            return res.status(400).json({ success: false, message: "OTP expired. Please request a new one." });
        }

        if (otpRecord.otp !== otp) {
            return res.status(400).json({ success: false, message: "Invalid OTP. Please try again." });
        }

        // Find user by email
        let user = await User.findOne({ email });
        if (!user) {
            user = await User.AppUser.findOne({ email });
        }
        if (!user) {
            return res.status(404).json({ success: false, message: "User not found." });
        }

        if (user.isBlocked) {
            return res.status(403).json({ success: false, message: "Your account has been suspended. Please contact support." });
        }

        // Delete used OTP
        await Otp.deleteMany({ email, purpose: 'login' });

        const token = jwt.sign(
            { id: user._id, role: user.role },
            process.env.JWT_SECRET || 'fallback_secret',
            { expiresIn: "30d" }
        );

        res.status(200).json({
            success: true,
            message: "Logged in successfully",
            token,
            user: {
                _id: user._id,
                fullName: user.fullName,
                mobileNumber: user.mobileNumber,
                email: user.email,
                role: user.role
            }
        });
    } catch (error) {
        console.error("verifyLoginEmailOtp error:", error);
        res.status(500).json({ success: false, message: "Server Error" });
    }
};

const forgotPassword = async (req, res) => {
    try {
        const { email } = req.body;
        if (!email) {
            return res.status(400).json({ success: false, message: "Email address is required" });
        }

        // Email validation
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return res.status(400).json({ success: false, message: "Invalid email format" });
        }

        // Check if user exists (User or AppUser)
        let user = await User.findOne({ email });
        if (!user) {
            user = await User.AppUser.findOne({ email });
        }
        if (!user) {
            return res.status(404).json({ success: false, message: "Email not found. Please register first." });
        }

        const otp = generate6DigitOtp();
        const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes

        // Delete old forgot-password OTPs
        await Otp.deleteMany({ email, purpose: 'forgot-password' });

        // Save new OTP
        await Otp.create({
            email,
            otp,
            purpose: 'forgot-password',
            expiresAt
        });

        // Send OTP via email
        const mailSent = await sendOtpEmail(email, otp);
        if (!mailSent) {
            return res.status(500).json({ success: false, message: "Failed to send verification email. Please try again." });
        }

        res.status(200).json({
            success: true,
            message: "OTP sent to your email successfully",
            ...(process.env.NODE_ENV === 'development' && { otp })
        });
    } catch (error) {
        console.error("forgotPassword error:", error);
        res.status(500).json({ success: false, message: "Server Error" });
    }
};

const resetPassword = async (req, res) => {
    try {
        const { email, otp, newPassword } = req.body;

        if (!email || !otp || !newPassword) {
            return res.status(400).json({ success: false, message: "Email, OTP, and New Password are required" });
        }

        if (newPassword.length < 8) {
            return res.status(400).json({ success: false, message: "Password must be at least 8 characters long" });
        }

        const otpRecord = await Otp.findOne({ email, purpose: 'forgot-password' }).sort({ createdAt: -1 });

        if (!otpRecord) {
            return res.status(400).json({ success: false, message: "No OTP found. Please request a new OTP." });
        }

        if (new Date() > otpRecord.expiresAt) {
            await Otp.deleteMany({ email, purpose: 'forgot-password' });
            return res.status(400).json({ success: false, message: "OTP expired. Please request a new one." });
        }

        if (otpRecord.otp !== otp) {
            return res.status(400).json({ success: false, message: "Invalid OTP. Please try again." });
        }

        // Find user in either collection
        let user = await User.findOne({ email });
        if (!user) {
            user = await User.AppUser.findOne({ email });
        }

        if (!user) {
            return res.status(404).json({ success: false, message: "User not found." });
        }

        // Hash and update the password
        const hashedPassword = await bcrypt.hash(newPassword, 10);
        user.password = hashedPassword;
        await user.save();

        // Delete used OTP
        await Otp.deleteMany({ email, purpose: 'forgot-password' });

        res.status(200).json({
            success: true,
            message: "Password reset successfully"
        });
    } catch (error) {
        console.error("resetPassword error:", error);
        res.status(500).json({ success: false, message: "Server Error" });
    }
};

module.exports = {
    getOtp,
    resendOtp,
    verifyOtp,
    loginWithOtp,
    verifyLoginOtp,
    sendRegistrationOtp,
    verifyRegistrationOtp,
    sendRegisterEmailOtp,
    verifyRegisterEmailOtp,
    sendLoginEmailOtp,
    verifyLoginEmailOtp,
    getDashboardStats,
    submitAdminRequest,
    getAdminRequests,
    getAdminNotifications,
    updateAdminRequestStatus,
    setAdminPassword,
    adminLogin,
    adminLoginStep1,
    adminLoginVerifyOtp,
    getAllAdmins,
    deleteAdmin,
    verifyActivationToken,
    forgotPassword,
    resetPassword
};
