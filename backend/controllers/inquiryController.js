const Inquiry = require('../models/Inquiry');
const { syncLeadToCrm } = require('../utils/crmSync');

// Public: submit a new inquiry
const createInquiry = async (req, res) => {
    try {
        const { name, email, phone, subject, message } = req.body;

        if (!name || !email || !phone || !message) {
            return res.status(400).json({ success: false, message: "Name, email, phone, and message are required" });
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email.trim())) {
            return res.status(400).json({ success: false, message: "Enter a valid email address" });
        }

        const inquiry = await Inquiry.create({
            name: name.trim(),
            email: email.trim(),
            phone: phone.trim(),
            subject: subject?.trim(),
            message: message.trim(),
        });

        // Fire-and-forget — CRM sync must never block or fail the user's form submission
        syncLeadToCrm({
            name: inquiry.name,
            email: inquiry.email,
            phone: inquiry.phone,
            source: 'goairclass.com',
            formType: 'general',
            message: inquiry.message,
        });

        res.status(201).json({ success: true, message: "Inquiry submitted successfully", inquiry });
    } catch (error) {
        console.error("createInquiry error:", error);
        res.status(500).json({ success: false, message: "Server Error" });
    }
};

// Admin: list all inquiries
const getInquiries = async (req, res) => {
    try {
        const inquiries = await Inquiry.find().sort({ createdAt: -1 });
        res.status(200).json({ success: true, inquiries });
    } catch (error) {
        console.error("getInquiries error:", error);
        res.status(500).json({ success: false, message: "Server Error" });
    }
};

// Admin: update inquiry status
const updateInquiryStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;

        if (!['new', 'read', 'resolved'].includes(status)) {
            return res.status(400).json({ success: false, message: "Invalid status" });
        }

        const inquiry = await Inquiry.findByIdAndUpdate(id, { status }, { new: true });
        if (!inquiry) {
            return res.status(404).json({ success: false, message: "Inquiry not found" });
        }

        res.status(200).json({ success: true, inquiry });
    } catch (error) {
        console.error("updateInquiryStatus error:", error);
        res.status(500).json({ success: false, message: "Server Error" });
    }
};

// Admin: delete an inquiry
const deleteInquiry = async (req, res) => {
    try {
        const { id } = req.params;
        const inquiry = await Inquiry.findByIdAndDelete(id);
        if (!inquiry) {
            return res.status(404).json({ success: false, message: "Inquiry not found" });
        }
        res.status(200).json({ success: true, message: "Inquiry deleted successfully" });
    } catch (error) {
        console.error("deleteInquiry error:", error);
        res.status(500).json({ success: false, message: "Server Error" });
    }
};

module.exports = {
    createInquiry,
    getInquiries,
    updateInquiryStatus,
    deleteInquiry,
};
