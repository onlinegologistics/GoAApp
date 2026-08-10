const express = require('express');
const router = express.Router();
const { 
    submitOperatorRequest, 
    getAllOperatorRequests, 
    approveOperatorRequest, 
    manualCreateOperator,
    loginOperator
} = require('../controllers/operatorController');
const { authMiddleware, checkRole } = require('../middleware/authMiddleware');

// Public routes
router.post('/login', loginOperator);

// Publicly logged-in routes
router.post('/request', authMiddleware, submitOperatorRequest);

// Admin / Super Admin routes
router.get('/requests', authMiddleware, checkRole(['admin', 'superadmin']), getAllOperatorRequests);
router.post('/approve', authMiddleware, checkRole(['admin', 'superadmin']), approveOperatorRequest);
router.post('/manual-create', authMiddleware, checkRole(['admin', 'superadmin']), manualCreateOperator);

module.exports = router;
