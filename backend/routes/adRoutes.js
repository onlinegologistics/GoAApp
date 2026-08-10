const express = require('express');
const router = express.Router();
const adController = require('../controllers/adController');

// --- PUBLIC ROUTES (No auth required) ---
router.get('/', adController.getPublicAds);
router.post('/event', adController.trackEvent);

// --- ADMIN ROUTES (Should ideally have auth middleware in a real app) ---
router.post('/admin', adController.createAd);
router.get('/admin', adController.getAllAds);
router.put('/admin/:id', adController.updateAd);
router.delete('/admin/:id', adController.deleteAd);

module.exports = router;
