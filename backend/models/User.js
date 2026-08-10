const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
    fullName: {
        type: String,
        required: [true, "Full name is required"],
        trim: true,
    },
    mobileNumber: {
        type: String,
        required: [true, "Mobile number is required"],
        unique: true,
        trim: true,
    },
    referralCode: {
        type: String,
        default: "",
    },
    role: {
        type: String,
        enum: ["user", "agent", "finance", "support", "admin", "superadmin", "bus_operator", "hotel_operator"],
        default: "user",
    },
    adminUsername: {
        type: String,
        unique: true,
        sparse: true,
    },
    adminPassword: {
        type: String,
    },
    permissions: {
        type: [String],
        default: [],
    },
    otp: {
        type: String,
        default: null,
    },
    otpExpiry: {
        type: Date,
        default: null,
    },
    otpAttempts: {
        type: Number,
        default: 0,
    },
    firstName: {
        type: String,
        trim: true,
    },
    lastName: {
        type: String,
        trim: true,
    },
    email: {
        type: String,
        trim: true,
        unique: true,
        sparse: true,
    },
    isEmailVerified: {
        type: Boolean,
        default: false,
    },
    gender: {
        type: String,
        enum: ["Male", "Female", "Other"],
    },
    dob: {
        type: Date,
    },
    nationality: {
        type: String,
        trim: true,
    },
    passportNumber: {
        type: String,
        trim: true,
    },
    passportExpiry: {
        type: Date,
    },
    frequentFlyer: {
        type: String,
        trim: true,
    },
    isBlocked: {
        type: Boolean,
        default: false,
    },
    profileImage: {
        type: String,
        default: null,
    },
    registrationSource: {
        type: String,
        default: "WEBSITE",
    },
    password: {
        type: String,
        default: null,
    }
}, { timestamps: true });

const appUserSchema = new mongoose.Schema({
    ...userSchema.obj,
    registrationSource: {
        type: String,
        default: "APP",
    }
}, { timestamps: true });

const AppUser = mongoose.model("AppUser", appUserSchema, "app_users");

// Fallback search mechanisms for seamless ID-based updates/lookups
userSchema.statics.findById = function (id, projection, options) {
    const query = this.findOne({ _id: id }, projection, options);
    const originalThen = query.then.bind(query);
    query.then = function (onResolve, onReject) {
        return originalThen(user => {
            if (!user) {
                return AppUser.findOne({ _id: id }, projection, options).then(onResolve, onReject);
            }
            return onResolve ? onResolve(user) : user;
        }, onReject);
    };
    return query;
};

userSchema.statics.findByIdAndUpdate = function (id, update, options) {
    const query = this.findOneAndUpdate({ _id: id }, update, options);
    const originalThen = query.then.bind(query);
    query.then = function (onResolve, onReject) {
        return originalThen(user => {
            if (!user) {
                return AppUser.findOneAndUpdate({ _id: id }, update, options).then(onResolve, onReject);
            }
            return onResolve ? onResolve(user) : user;
        }, onReject);
    };
    return query;
};

const User = mongoose.model("User", userSchema);
User.AppUser = AppUser;

module.exports = User;

