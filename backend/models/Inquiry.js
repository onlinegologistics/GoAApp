const mongoose = require('mongoose');

const inquirySchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, "Name is required"],
        trim: true,
    },
    email: {
        type: String,
        required: [true, "Email is required"],
        trim: true,
    },
    phone: {
        type: String,
        required: [true, "Phone number is required"],
        trim: true,
    },
    subject: {
        type: String,
        trim: true,
    },
    message: {
        type: String,
        required: [true, "Message is required"],
        trim: true,
    },
    status: {
        type: String,
        enum: ['new', 'read', 'resolved'],
        default: 'new',
    },
}, { timestamps: true });

module.exports = mongoose.model('Inquiry', inquirySchema);
