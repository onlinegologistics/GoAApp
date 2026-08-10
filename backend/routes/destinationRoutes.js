const express = require('express');
const router = express.Router();
const destinationController = require('../controllers/destinationController');
const upload = require('../middleware/destinationUpload');
const { authMiddleware, checkRole } = require('../middleware/authMiddleware');

// Public routes
router.get('/public', destinationController.getPublicDestinations);

// Admin routes
router.post('/', authMiddleware, checkRole(['admin', 'superadmin']), (req, res, next) => {
    upload.single('image')(req, res, (err) => {
        if (err) return res.status(400).json({ success: false, message: err.message });
        next();
    });
}, destinationController.createDestination);

router.get('/', authMiddleware, checkRole(['admin', 'superadmin']), destinationController.getDestinations);

router.put('/:id', authMiddleware, checkRole(['admin', 'superadmin']), (req, res, next) => {
    upload.single('image')(req, res, (err) => {
        if (err) return res.status(400).json({ success: false, message: err.message });
        next();
    });
}, destinationController.updateDestination);
router.delete('/:id', authMiddleware, checkRole(['admin', 'superadmin']), destinationController.deleteDestination);

module.exports = router;
