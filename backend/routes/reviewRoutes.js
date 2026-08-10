const express = require('express');
const router = express.Router();
const { getOperatorReviews, replyToReview } = require('../controllers/reviewController');
const { operatorAuthMiddleware } = require('../middleware/operatorAuthMiddleware');

router.get('/my-reviews', operatorAuthMiddleware, getOperatorReviews);
router.put('/reply/:id', operatorAuthMiddleware, replyToReview);

module.exports = router;
