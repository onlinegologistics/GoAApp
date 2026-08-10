const mongoose = require("mongoose");

const operatorRequestSchema = new mongoose.Schema({
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
        required: true
    },
    operatorType: {
        type: String,
        enum: ["bus", "hotel"],
        required: true
    },
    documents: {
        type: [String],
        default: []
    },
    status: {
        type: String,
        enum: ["pending", "approved", "rejected"],
        default: "pending"
    }
}, { timestamps: true });

module.exports = mongoose.model("OperatorRequest", operatorRequestSchema);
