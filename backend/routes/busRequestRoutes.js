const express = require('express');
const router = express.Router();
const busRequestController = require('../controllers/busRequestController');
const { authMiddleware, checkRole } = require('../middleware/authMiddleware');

// apply security to all routes in this file
router.use(authMiddleware);
router.use(checkRole(['admin']));

/**
 * @route   GET /api/admin/bus-requests
 * @desc    Fetch all buses where status = "pending"
 * @access  Admin Only
 */
router.get('/', busRequestController.getPendingRequests);

/**
 * @route   GET /api/admin/bus-requests/:id
 * @desc    Fetch full details of a specific bus
 * @access  Admin Only
 */
router.get('/:id', busRequestController.getRequestDetail);

/**
 * @route   PATCH /api/admin/bus-requests/:id/submit
 * @desc    Submit for approval (forward to Super Admin)
 * @access  Admin Only
 */
router.patch('/:id/submit', busRequestController.submitForReview);

/**
 * @route   PATCH /api/admin/bus-requests/:id/suspend
 * @desc    Suspend request if issues found
 * @access  Admin Only
 */
router.patch('/:id/suspend', busRequestController.suspendRequest);

module.exports = router;
