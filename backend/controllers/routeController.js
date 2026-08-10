const Route = require('../models/Route');

/**
 * GET /api/admin/routes
 */
exports.getAllRoutes = async (req, res) => {
    try {
        const { search, status, popular } = req.query;
        let query = {};

        if (status) query.status = status;
        if (popular === 'true') query.isPopular = true;
        if (search) {
            query.$or = [
                { fromCity: { $regex: search, $options: 'i' } },
                { toCity: { $regex: search, $options: 'i' } }
            ];
        }

        const routes = await Route.find(query).sort({ createdAt: -1 });
        res.json({ success: true, routes });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

/**
 * POST /api/admin/routes
 */
exports.createRoute = async (req, res) => {
    try {
        const { fromCity, toCity, distance, travelTime, isPopular, boardingPoints, droppingPoints, type, price } = req.body;

        if (fromCity === toCity) {
            return res.status(400).json({ success: false, message: 'Source and Destination cannot be the same.' });
        }

        // Check if route already exists
        const existing = await Route.findOne({ fromCity, toCity });
        if (existing) {
            return res.status(400).json({ success: false, message: 'This route is already defined.' });
        }

        const route = new Route({ fromCity, toCity, distance, travelTime, isPopular, boardingPoints, droppingPoints, type, price });
        await route.save();

        res.status(201).json({ success: true, route });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
};

/**
 * PUT /api/admin/routes/:id
 */
exports.updateRoute = async (req, res) => {
    try {
        const { fromCity, toCity } = req.body;
        if (fromCity && toCity && fromCity === toCity) {
            return res.status(400).json({ success: false, message: 'Source and Destination cannot be the same.' });
        }

        const route = await Route.findByIdAndUpdate(req.params.id, req.body, { new: true });
        if (!route) return res.status(404).json({ success: false, message: 'Route not found' });

        res.json({ success: true, route });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
};

/**
 * DELETE /api/admin/routes/:id
 */
exports.deleteRoute = async (req, res) => {
    try {
        const route = await Route.findByIdAndDelete(req.params.id);
        if (!route) return res.status(404).json({ success: false, message: 'Route not found' });
        res.json({ success: true, message: 'Route deleted successfully' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

/**
 * PATCH /api/admin/routes/:id/popular
 */
exports.togglePopular = async (req, res) => {
    try {
        const route = await Route.findById(req.params.id);
        if (!route) return res.status(404).json({ success: false, message: 'Route not found' });

        route.isPopular = !route.isPopular;
        await route.save();

        res.json({ success: true, isPopular: route.isPopular });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

/**
 * OPERATOR SPECIFIC METHODS
 */

/**
 * GET /api/bus-operator/routes
 */
exports.getOperatorRoutes = async (req, res) => {
    try {
        const routes = await Route.find({ 
            $or: [
                { operatorId: req.user.id },
                { operatorId: null },
                { operatorId: { $exists: false } }
            ]
        }).sort({ createdAt: -1 });
        res.json({ success: true, routes });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

/**
 * GET /api/bus-operator/routes/:id
 */
exports.getOperatorRouteById = async (req, res) => {
    try {
        const route = await Route.findOne({ 
            _id: req.params.id, 
            $or: [
                { operatorId: req.user.id },
                { operatorId: null },
                { operatorId: { $exists: false } }
            ]
        });
        if (!route) return res.status(404).json({ success: false, message: 'Route not found or unauthorized' });
        res.json({ success: true, route });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

/**
 * POST /api/bus-operator/routes
 */
exports.createOperatorRoute = async (req, res) => {
    try {
        const { fromCity, toCity, distance, travelTime, stops, isActive, boardingPoints, droppingPoints } = req.body;

        if (fromCity === toCity) {
            return res.status(400).json({ success: false, message: 'Source and Destination cannot be the same.' });
        }

        const route = new Route({
            operatorId: req.user.id,
            fromCity,
            toCity,
            distance: Number(distance),
            travelTime,
            stops: stops || [],
            boardingPoints: boardingPoints || [],
            droppingPoints: droppingPoints || [],
            type: type || 'bus',
            price: price || 0,
            isActive: isActive !== undefined ? isActive : true
        });

        await route.save();
        res.status(201).json({ success: true, route });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
};

/**
 * PUT /api/bus-operator/routes/:id
 */
exports.updateOperatorRoute = async (req, res) => {
    try {
        const { fromCity, toCity, distance } = req.body;
        
        if (fromCity && toCity && fromCity === toCity) {
            return res.status(400).json({ success: false, message: 'Source and Destination cannot be the same.' });
        }

        const updateData = { ...req.body };
        if (distance) updateData.distance = Number(distance);

        const route = await Route.findOneAndUpdate(
            { _id: req.params.id, operatorId: req.user.id },
            updateData,
            { new: true }
        );

        if (!route) return res.status(404).json({ success: false, message: 'Route not found or unauthorized' });

        res.json({ success: true, route });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
};

/**
 * DELETE /api/bus-operator/routes/:id
 */
exports.deleteOperatorRoute = async (req, res) => {
    try {
        const route = await Route.findOneAndDelete({ _id: req.params.id, operatorId: req.user.id });
        if (!route) return res.status(404).json({ success: false, message: 'Route not found or unauthorized' });
        res.json({ success: true, message: 'Route deleted successfully' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
