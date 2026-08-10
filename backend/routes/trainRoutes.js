const express = require('express');
const router = express.Router();
const trainController = require('../controllers/trainController');
const { authMiddleware } = require('../middleware/authMiddleware');

// ─── Static / prefixed routes FIRST (must be before /:id) ───────────────────
router.get('/stats', trainController.getDashboardStats);
router.get('/reports', trainController.getReports);
router.get('/user-bookings', authMiddleware, trainController.getUserBookings);
router.post('/cancel-booking', authMiddleware, trainController.cancelBooking);
router.post('/settings', trainController.updateSettings);

router.get('/bookings', trainController.getAllBookings);
router.post('/book', trainController.bookTrain);
router.get('/pnr/:pnr', trainController.getBookingByPNR);
router.post('/lock-seats', trainController.lockSeats);
router.post('/confirm-booking', trainController.confirmBooking);
router.post('/payment/create-order', trainController.createPaymentOrder);
router.post('/payment/verify', trainController.verifyPayment);
router.get('/booking/:id', trainController.getBookingById);
router.get('/booking/:id/pdf', trainController.generateTicketPDF);
router.get('/ticket/:pnr/pdf', trainController.downloadTicketByPNR);
router.get('/ticket/verify/:pnr', trainController.verifyTicket);

router.get('/stations', trainController.getAllStations);
router.post('/stations', trainController.createStation);
router.get('/search', trainController.searchTrains);

// Fare & Quote & Coach endpoints
router.post('/coaches', trainController.saveCoachConfig);
router.get('/coaches/:trainId', trainController.getCoachConfig);
router.post('/fares', trainController.saveFareRules);
router.get('/fares/:trainId', trainController.getFareRules);
router.get('/quotas', (req, res) => res.json({ success: true, data: [] }));

// Route management — MUST be before /:id
router.get('/route/:trainId', trainController.getTrainRoute);
router.post('/route/:trainId', trainController.updateTrainRoute);

// ─── Dynamic /:id routes LAST ────────────────────────────────────────────────
router.get('/', trainController.getAllTrains);
router.post('/', trainController.createTrain);
router.put('/:id', trainController.updateTrain);
router.delete('/:id', trainController.deleteTrain);

module.exports = router;
