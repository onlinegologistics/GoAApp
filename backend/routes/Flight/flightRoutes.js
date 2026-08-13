const express = require('express');
const router = express.Router();
const flightController = require('../../controllers/Flight/flightController');

// Route for flight partner login
router.post('/login', flightController.loginFlight);

// Route for flight search
router.post('/search', flightController.searchFlights);

// Route for airport auto-suggest search
router.get('/airports/search', flightController.searchAirports);

// Route for flight fare calendar matrix
router.post('/fare-calendar', flightController.getFareCalendar);

// Route for creating flight booking session
router.post('/session', flightController.createSession);

// Route for flight live preview validation
router.post('/preview', flightController.flightPreview);

// Route for fetching ancillaries (seats, meals, extra baggage)
router.post('/fetch-ancillaries', flightController.fetchAncillaries);

// Route for holding a flight booking
router.post('/hold', flightController.holdFlight);

const { authMiddleware } = require('../../middleware/authMiddleware');

// Route for committing flight booking / ticketing (auth required to link booking to user)
router.post('/book', authMiddleware, flightController.bookFlight);

// Route for retrieving flight cancellation reasons from Cleartrip
router.get('/cancel-reasons/:tripId', flightController.getCancelReasons);

// Route for cancelling flight booking / ticketing (auth required)
router.post('/cancel', authMiddleware, flightController.cancelFlightBooking);

// Route for retrieving flight cancellation refund info preview from Cleartrip (auth required)
router.get('/cancel-refund-info/:tripId/:reasonCode', authMiddleware, flightController.getFlightCancelRefundInfo);

// Route for retrieving flight cancellation refund details of a cancelled trip from Cleartrip (auth required)
router.get('/refund-info/:tripId', authMiddleware, flightController.getFlightRefundInfo);

// Route for bulk benefits (baggage and penalties)
router.post('/benefits/bulk', flightController.getBulkBenefits);

// Route for standard benefits (baggage, penalties, fare benefits for single selection)
router.post('/benefits', flightController.getBenefits);

// Route for fetching complete trip details by trip ID
router.get('/trip/:tripId', flightController.getTripDetails);

// Route for downloading flight ticket receipt
router.get('/trip/:tripId/download-receipt', authMiddleware, flightController.downloadFlightReceipt);

// Route for retrieving user flight bookings
router.get('/my-bookings', authMiddleware, flightController.getUserFlightBookings);

// Route for retrieving all flight bookings from database
router.get('/bookings', flightController.getAllFlightBookings);

module.exports = router;

