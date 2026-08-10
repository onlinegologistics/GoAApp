const express = require('express');
const router = express.Router();
const { getOperatorStats } = require('../controllers/dashboardController');
const { operatorAuthMiddleware } = require('../middleware/operatorAuthMiddleware');

// Get Operator Dashboard Stats
router.get('/operator', operatorAuthMiddleware, getOperatorStats);

module.exports = router;
