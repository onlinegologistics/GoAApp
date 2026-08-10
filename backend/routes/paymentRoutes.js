const express = require('express');
const Razorpay = require('razorpay');
const crypto = require('crypto');
const router = express.Router();
const { authMiddleware } = require('../middleware/authMiddleware');

// Initialize Razorpay with keys from .env
const razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET,
});

/**
 * POST /api/payments/create-order
 * Creates a Razorpay order. Frontend calls this before opening the checkout.
 * Body: { amount, busId, seats, boardingPoint, droppingPoint }
 */
router.post('/create-order', authMiddleware, async (req, res) => {
    try {
        const { amount, notes } = req.body;

        if (!amount || amount <= 0) {
            return res.status(400).json({ success: false, message: 'Invalid amount' });
        }

        const options = {
            amount: Math.round(amount * 100), // Convert to paise
            currency: 'INR',
            receipt: `receipt_${Date.now()}`,
            notes: notes || {},
        };

        const order = await razorpay.orders.create(options);
        res.json({
            success: true,
            orderId: order.id,
            amount: order.amount,
            currency: order.currency,
            key: process.env.RAZORPAY_KEY_ID, // Safe to send — this is the public key
        });
    } catch (error) {
        console.error('Razorpay order creation error:', error);
        res.status(500).json({ success: false, message: 'Failed to create payment order', error: error.message });
    }
});

/**
 * POST /api/payments/verify
 * Verifies the Razorpay payment signature after checkout completes.
 * Body: { razorpay_order_id, razorpay_payment_id, razorpay_signature }
 */
router.post('/verify', (req, res) => {
    try {
        const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

        if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
            return res.status(400).json({ success: false, message: 'Missing payment verification fields' });
        }

        // Generate expected signature using HMAC-SHA256
        const body = razorpay_order_id + '|' + razorpay_payment_id;
        const expectedSignature = crypto
            .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
            .update(body)
            .digest('hex');

        if (expectedSignature === razorpay_signature) {
            res.json({ success: true, message: 'Payment verified', paymentId: razorpay_payment_id });
        } else {
            res.status(400).json({ success: false, message: 'Invalid payment signature' });
        }
    } catch (error) {
        console.error('Payment verification error:', error);
        res.status(500).json({ success: false, message: 'Verification failed', error: error.message });
    }
});

module.exports = router;
