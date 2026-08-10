const Station = require('../models/train/Station');

// @desc    Add a new station
// @route   POST /api/admin/stations
// @access  Super Admin
exports.addStation = async (req, res) => {
    try {
        const { stationCode, stationName, city, state, latitude, longitude, status } = req.body;

        // Validation
        if (!stationCode || !stationName || !city || !state || latitude === undefined || longitude === undefined) {
            return res.status(400).json({ success: false, message: 'All fields are required.' });
        }

        const upperCode = stationCode.toUpperCase();

        // Check for duplicate
        const existingStation = await Station.findOne({ code: upperCode });
        if (existingStation) {
            return res.status(400).json({ success: false, message: 'Station code already exists.' });
        }

        // Parse coordinates safely
        const latNum = parseFloat(latitude);
        const lonNum = parseFloat(longitude);

        if (isNaN(latNum) || isNaN(lonNum)) {
            return res.status(400).json({ success: false, message: 'Latitude and Longitude must be valid numbers.' });
        }

        // Get createdBy ID safely
        let creatorId = null;
        if (req.user) {
            const creatorIdStr = req.user.id || req.user._id;
            if (creatorIdStr && String(creatorIdStr).match(/^[0-9a-fA-F]{24}$/)) {
                creatorId = creatorIdStr;
            }
        }

        // Save
        const station = new Station({
            code: upperCode,
            name: stationName,
            city,
            state,
            latitude: latNum,
            longitude: lonNum,
            status: status || 'active',
            createdBy: creatorId
        });

        await station.save();

        res.status(201).json({ success: true, message: 'Station added successfully', station });
    } catch (error) {
        console.error('Error adding station:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Server error while adding station.',
            error: error.message 
        });
    }
};

// @desc    Get all stations
// @route   GET /api/admin/stations (or general route)
// @access  Public or Admin
exports.getStations = async (req, res) => {
    try {
        const stations = await Station.find({ status: 'active' }).sort({ name: 1 });
        res.status(200).json({ success: true, stations });
    } catch (error) {
        console.error('Error fetching stations:', error);
        res.status(500).json({ success: false, error: 'Server error fetching stations.' });
    }
};
