const express = require('express');
const router = express.Router();
const {
    getLocations,
    searchHotelsByLocation,
    searchHotelsByIds,
    triggerSync,
    syncHotelsForLocationRoute,
    getHotelDirectoryRoute,
    clearHotelDirectoryRoute,
    getHotelRoomDetails,
    provisionalBookHotel,
    syncIncrementalUpdates,
    confirmBookHotel,
    getTripDetails,
    getHotelRefundInfo,
    cancelHotelBooking,
    getUserHotelBookings,
    getHotelProfilesBatchRoute,
    downloadHotelReceipt
} = require('../../controllers/hotel/hotelController');

const { authMiddleware } = require('../../middleware/authMiddleware');

router.get('/locations', getLocations);
router.get('/search-by-location', searchHotelsByLocation);
router.post('/search', searchHotelsByIds);
router.post('/sync', triggerSync);
router.get('/details/:hotelId', getHotelRoomDetails);
router.post('/provisional-book', authMiddleware, provisionalBookHotel);
router.post('/confirm-book', authMiddleware, confirmBookHotel);
router.get('/trip/:tripId', authMiddleware, getTripDetails);
router.get('/trip/:tripId/download-receipt', authMiddleware, downloadHotelReceipt);
router.get('/refund-info/:tripId', authMiddleware, getHotelRefundInfo);
router.post('/cancel-booking', authMiddleware, cancelHotelBooking);
router.get('/my-bookings', authMiddleware, getUserHotelBookings);
router.post('/batch-profiles', getHotelProfilesBatchRoute);

// Admin Routes
router.post('/admin/sync', syncHotelsForLocationRoute);
router.get('/admin/directory', getHotelDirectoryRoute);
router.get('/admin/incremental-updates', syncIncrementalUpdates);
router.delete('/admin/clear', clearHotelDirectoryRoute);

module.exports = router;
