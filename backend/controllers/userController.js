const User = require("../models/User");
const jwt = require("jsonwebtoken");

// Generate JWT
const generateToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET || 'fallback_secret', {
        expiresIn: "30d",
    });
};

// @desc    Register a new user
// @route   POST /api/users/register
// @access  Public
const registerUser = async (req, res) => {
    try {
        const { fullName, mobileNumber, referralCode } = req.body;

        if (!fullName || !mobileNumber) {
            return res.status(400).json({ message: "Full Name and Mobile Number are required" });
        }

        // Check if user already exists
        const userExists = await User.findOne({ mobileNumber });
        if (userExists) {
            return res.status(400).json({ message: "User already exists with this mobile number" });
        }

        const user = await User.create({
            fullName,
            mobileNumber,
            referralCode,
        });

        if (user) {
            res.status(201).json({
                _id: user._id,
                fullName: user.fullName,
                mobileNumber: user.mobileNumber,
                referralCode: user.referralCode,
                token: generateToken(user._id),
            });
        } else {
            res.status(400).json({ message: "Invalid user data" });
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Server Error" });
    }
};

// @desc    Authenticate user & get token
// @route   POST /api/users/login
// @access  Public
const loginUser = async (req, res) => {
    try {
        const { mobileNumber } = req.body;

        if (!mobileNumber) {
            return res.status(400).json({ message: "Mobile number is required" });
        }

        const user = await User.findOne({ mobileNumber });

        if (user) {
            res.json({
                _id: user._id,
                fullName: user.fullName,
                mobileNumber: user.mobileNumber,
                token: generateToken(user._id),
            });
        } else {
            res.status(401).json({ message: "User not found with this mobile number" });
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Server Error" });
    }
};

// @desc    Get user profile
// @route   GET /api/users/profile
// @access  Private
const getUserProfile = async (req, res) => {
    try {
        const user = await User.findById(req.user.id).select("-adminPassword -otp");

        if (user) {
            res.json(user);
        } else {
            res.status(404).json({ message: "User not found" });
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Server Error" });
    }
};

// @desc    Update profile image
// @route   POST /api/users/profile/image
// @access  Private
const updateProfileImage = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ message: "Please upload an image" });
        }

        const imagePath = `/uploads/profiles/${req.file.filename}`;
        const user = await User.findByIdAndUpdate(
            req.user.id,
            { profileImage: imagePath },
            { new: true }
        ).select("-adminPassword -otp");

        if (user) {
            res.json({
                message: "Profile image updated successfully",
                user
            });
        } else {
            res.status(404).json({ message: "User not found" });
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Server Error" });
    }
};

module.exports = {
    registerUser,
    loginUser,
    getUserProfile,
    updateProfileImage
};
