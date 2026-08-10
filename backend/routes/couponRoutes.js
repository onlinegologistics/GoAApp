const express = require('express');
const router = express.Router();
const couponController = require('../controllers/CouponController');
const { authMiddleware, checkRole } = require('../middleware/authMiddleware');

const upload = require('../middleware/couponUpload');

// Consumer Facing Routes (Bus Booking)
router.get('/', couponController.getAvailableCoupons);
router.get('/public', couponController.getPublicCoupons);
router.post('/apply', couponController.applyCoupon);

// Admin & Operator Shared Routes (Management)
router.post('/create', authMiddleware, upload.single('image'), couponController.createCoupon);
router.put('/:id', authMiddleware, upload.single('image'), couponController.updateCoupon);
router.delete('/:id', authMiddleware, couponController.deleteCoupon);

router.get('/admin/list', authMiddleware, checkRole(['superadmin', 'admin']), couponController.listCoupons);
router.get('/operator/list', authMiddleware, checkRole(['operator', 'bus_operator']), couponController.listCoupons);

module.exports = router;
