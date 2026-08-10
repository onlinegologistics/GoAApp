const express = require('express');
const router = express.Router();
const {
    createInquiry,
    getInquiries,
    updateInquiryStatus,
    deleteInquiry,
} = require('../controllers/inquiryController');
const { authMiddleware, checkRole } = require('../middleware/authMiddleware');

// Public route — anyone can submit an inquiry
router.post('/', createInquiry);

// Admin routes
router.get('/', authMiddleware, checkRole(['admin', 'superadmin']), getInquiries);
router.put('/:id/status', authMiddleware, checkRole(['admin', 'superadmin']), updateInquiryStatus);
router.delete('/:id', authMiddleware, checkRole(['admin', 'superadmin']), deleteInquiry);

module.exports = router;
