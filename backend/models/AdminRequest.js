const mongoose = require("mongoose");

const adminRequestSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    fullName: {
        type: String,
        required: true
    },
    mobileNumber: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: false
    },
    username: {
        type: String,
        sparse: true
    },
    password: {
        type: String
    },
    status: {
        type: String,
        enum: ["pending", "approved", "rejected"],
        default: "pending"
    },
    requestedRole: {
        type: String,
        default: "admin"
    },
    permissions: {
        type: [String],
        default: []
    }
}, { timestamps: true });

module.exports = mongoose.model("AdminRequest", adminRequestSchema);
