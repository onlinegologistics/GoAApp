const Review = require('../models/Review');

exports.getOperatorReviews = async (req, res) => {
    try {
        const reviews = await Review.find({ operatorId: req.operator.id })
            .populate('userId', 'name email')
            .populate('busId', 'busName busNumber')
            .sort({ createdAt: -1 });
        res.json(reviews);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.replyToReview = async (req, res) => {
    try {
        const { reply } = req.body;
        const review = await Review.findOneAndUpdate(
            { _id: req.params.id, operatorId: req.operator.id },
            { reply },
            { new: true }
        );
        if (!review) return res.status(404).json({ error: 'Review not found' });
        res.json(review);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};
