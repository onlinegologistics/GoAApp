const express = require('express');
const router = express.Router();
const Route = require('../models/Route');

// Get Popular Routes (Public)
router.get('/popular', async (req, res) => {
    try {
        const routes = await Route.find({ isPopular: true }).sort({ createdAt: -1 });
        res.json(routes);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Get All (Alias for root)
router.get('/', async (req, res) => {
    try {
        const routes = await Route.find().sort({ createdAt: -1 });
        res.json(routes);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Create Route
router.post('/create', async (req, res) => {
    try {
        const route = new Route(req.body);
        await route.save();
        res.status(201).json(route);
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

// Get All
router.get('/all', async (req, res) => {
    try {
        const routes = await Route.find().sort({ createdAt: -1 });
        res.json(routes);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Get Single Route by ID  ← NEW
router.get('/:id', async (req, res) => {
    try {
        const route = await Route.findById(req.params.id);
        if (!route) return res.status(404).json({ error: 'Route not found' });
        res.json(route);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Update
router.put('/:id', async (req, res) => {
    try {
        const route = await Route.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
        if (!route) return res.status(404).json({ error: 'Route not found' });
        res.json(route);
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

// Delete
router.delete('/:id', async (req, res) => {
    try {
        const deleted = await Route.findByIdAndDelete(req.params.id);
        if (!deleted) return res.status(404).json({ error: 'Route not found' });
        res.json({ message: 'Route deleted' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
