const express = require('express');
const router = express.Router();
const superAdminTrainController = require('../controllers/superAdminTrainController');
const { authMiddleware, checkRole } = require('../middleware/authMiddleware');

// All routes here are protected and require superadmin role
router.use(authMiddleware);
router.use(checkRole(['superadmin']));

router.get('/trains', superAdminTrainController.getAllTrains);
router.put('/train/:id', superAdminTrainController.overrideTrain);
router.delete('/train/:id', superAdminTrainController.deleteTrain);
router.get('/bookings', superAdminTrainController.getAllBookings);
router.get('/reports', superAdminTrainController.getReports);
router.post('/api-toggle', superAdminTrainController.toggleApiSource);

module.exports = router;
