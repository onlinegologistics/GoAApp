const express = require('express');
const router = express.Router();
const City = require('../models/City');

// GET /api/cities
router.get('/', async (req, res) => {
    try {
        const cities = await City.find({}).sort({ name: 1 });
        res.json(cities);
    } catch (err) {
        console.error("Fetch Cities Error:", err);
        res.status(500).json({ message: "Server error while fetching cities" });
    }
});

// GET /api/cities/search?q=cityname
router.get('/search', async (req, res) => {
    try {
        const query = req.query.q;
        if (!query) return res.json([]);

        // Search cities using regex (case-insensitive)
        const cities = await City.find({
            name: { $regex: `${query}`, $options: 'i' }
        }).limit(10);

        res.json(cities);
    } catch (err) {
        console.error("City Search Error:", err);
        res.status(500).json({ message: "Server error during city search" });
    }
});

module.exports = router;
