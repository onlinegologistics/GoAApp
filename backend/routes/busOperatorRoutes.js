const express = require('express');
const router = express.Router();
const { 
    getLiveBookings, 
    updateBoardingStatus, 
    changeSeat, 
    cancelBooking,
    updateTripDriverDetails,
    sendBoardingReminders,
    getManifestBySchedule
} = require('../controllers/busOperatorController');
const routeController = require('../controllers/routeController');
const { authMiddleware, checkRole } = require('../middleware/authMiddleware');

// All routes require operator role
router.use(authMiddleware);
router.use(checkRole(['bus_operator']));

router.get('/live-bookings', getLiveBookings);
router.patch('/boarding-status', updateBoardingStatus);
router.patch('/change-seat', changeSeat);
router.post('/cancel-booking', cancelBooking);

// Boarding Reminders
router.get('/trips/:scheduleId/manifest', getManifestBySchedule);
router.put('/trips/driver-details', updateTripDriverDetails);
router.post('/trips/send-reminders', sendBoardingReminders);

// Route Management
router.get('/routes', routeController.getOperatorRoutes);
router.get('/routes/:id', routeController.getOperatorRouteById);
router.post('/routes', routeController.createOperatorRoute);
router.put('/routes/:id', routeController.updateOperatorRoute);
router.delete('/routes/:id', routeController.deleteOperatorRoute);
router.patch('/routes/:id/popular', routeController.togglePopular);


module.exports = router;
