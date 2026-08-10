const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const Bus = require('../models/Bus');
const { operatorAuthMiddleware } = require('../middleware/operatorAuthMiddleware');

// Multer Storage Configuration
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/');
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + '-' + file.originalname);
    }
});

const upload = multer({
    storage: storage,
    limits: { fileSize: 5 * 1024 * 1024 } // 5MB limit
});

// Helper to parse JSON safely from FormData
const parseJsonField = (field) => {
    if (typeof field === 'string') {
        try {
            return JSON.parse(field);
        } catch (e) {
            return field;
        }
    }
    return field;
};

// Create Bus with Images
router.post('/create', operatorAuthMiddleware, upload.array('images', 6), async (req, res) => {
    try {
        const imagePaths = req.files ? req.files.map(file => `/uploads/${file.filename}`) : [];

        // Parse JSON fields from FormData
        const { images: _, ...otherBody } = req.body;
        const busData = {
            ...otherBody,
            images: imagePaths,
            operator: req.operator.id,
            amenities: parseJsonField(req.body.amenities),
            seatLayout: parseJsonField(req.body.seatLayout)
        };

        // Convert types
        if (busData.totalSeats) busData.totalSeats = parseInt(busData.totalSeats);

        const bus = new Bus(busData);
        await bus.save();
        res.status(201).json({
            ...bus.toObject(),
            _debug_files_received: imagePaths.length
        });
    } catch (err) {
        console.error('Create Bus Error:', err);
        res.status(400).json({ error: err.message });
    }
});

// Get by Operator (Current logged-in operator)
router.get('/my-buses', operatorAuthMiddleware, async (req, res) => {
    try {
        const { routeIds } = req.query;
        let query = { operator: req.operator.id };

        if (routeIds) {
            const Schedule = require('../models/Schedule');
            const schedules = await Schedule.find({
                operator: req.operator.id,
                route: { $in: routeIds.split(',') }
            });
            const busIds = schedules.map(s => s.bus);
            query._id = { $in: busIds };
        }

        const buses = await Bus.find(query);
        res.json(buses);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Get All (For Admin)
router.get('/all', async (req, res) => {
    try {
        const buses = await Bus.find().populate('operator');
        res.json(buses);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// GET /api/buses
router.get('/', async (req, res) => {
    try {
        const Schedule = require('../models/Schedule');
        const schedules = await Schedule.find()
            .populate('bus')
            .populate('route')
            .populate('operator');

        const mergedData = schedules.map(s => ({
            _id: s.bus?._id,
            busName: s.bus?.busName || 'Unknown Bus',
            busType: s.bus?.busType || 'Sleeper',
            seatType: (s.bus?.amenities || []).some(a => a.toUpperCase().includes('AC')) ? 'AC' : 'Non-AC',
            operatorId: s.operator?._id,
            fromCity: s.route?.fromCity,
            toCity: s.route?.toCity,
            distance: s.route?.distance,
            baseFare: s.ticketPrice
        })).filter(item => item._id);

        res.json(mergedData);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Get Single Bus by ID
router.get('/:id', async (req, res) => {
    try {
        const bus = await Bus.findById(req.params.id).populate('operator');
        if (!bus) return res.status(404).json({ error: 'Bus not found' });
        res.json(bus);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Update
router.put('/:id', operatorAuthMiddleware, upload.array('images', 6), async (req, res) => {
    try {
        const newImagePaths = req.files ? req.files.map(file => `/uploads/${file.filename}`) : [];
        let { images: _, existingImages: __, ...updateData } = req.body;

        // Parse complex fields
        updateData.amenities = parseJsonField(updateData.amenities);
        updateData.seatLayout = parseJsonField(updateData.seatLayout);
        const existingImages = parseJsonField(req.body.existingImages) || [];

        // Combine existing images (that were kept) with new uploads
        updateData.images = [...existingImages, ...newImagePaths];

        if (updateData.totalSeats) updateData.totalSeats = parseInt(updateData.totalSeats);

        // Ensure the bus belongs to the logged-in operator
        const bus = await Bus.findOneAndUpdate(
            { _id: req.params.id, operator: req.operator.id },
            updateData,
            { new: true, runValidators: true }
        );

        if (!bus) {
            return res.status(404).json({ error: 'Bus not found or unauthorized' });
        }
        res.json(bus);
    } catch (err) {
        console.error('Update Bus Error:', err);
        res.status(400).json({ error: err.message });
    }
});


// Delete
router.delete('/:id', operatorAuthMiddleware, async (req, res) => {
    try {
        // Ensure the bus belongs to the logged-in operator
        const bus = await Bus.findOneAndDelete({ _id: req.params.id, operator: req.operator.id });
        if (!bus) {
            return res.status(404).json({ error: 'Bus not found or unauthorized' });
        }
        res.json({ message: 'Bus deleted' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

/**
 * GET /api/bus/:scheduleId/seats
 * Public endpoint to fetch seat layout and status for a specific schedule
 */
router.get('/:scheduleId/seats', async (req, res) => {
    try {
        const Schedule = require('../models/Schedule');
        const Booking = require('../models/Booking');

        const schedule = await Schedule.findById(req.params.scheduleId)
            .populate('bus')
            .populate('route');

        if (!schedule) {
            return res.status(404).json({ error: 'Schedule not found' });
        }

        const bus = schedule.bus;
        if (!bus) {
            return res.status(404).json({ error: 'Bus not found for this schedule' });
        }

        const { date } = req.query;
        const travelDateFilter = date || schedule.travelDate || new Date().toISOString().split('T')[0];

        // Fetch all successful bookings for this specific schedule trip ON THIS SPECIFIC DATE
        const bookings = await Booking.find({
            schedule: schedule._id,
            travelDate: travelDateFilter,
            paymentStatus: 'Completed',
            status: 'Confirmed'
        });
        
        console.log(`Found ${bookings.length} bookings for Schedule ${schedule._id} on ${travelDateFilter}`);

        const bookedSeats = [];
        const seatGenders = {}; // Map seatNo -> gender

        bookings.forEach(booking => {
            if (booking.passengers && Array.isArray(booking.passengers)) {
                booking.passengers.forEach(p => {
                    if (p.seatNumber) {
                        bookedSeats.push(p.seatNumber);
                        seatGenders[p.seatNumber] = p.gender?.toLowerCase() || 'male';
                    }
                });
            }
        });

        // Map seat layout with status and gender info
        const seatLayout = bus.seatLayout.map(seat => ({
            ...seat.toObject(),
            status: bookedSeats.includes(seat.seatNo) ? 'Booked' : 'Available',
            bookedGender: seatGenders[seat.seatNo] || null
        }));

        const busId = bus._id || bus; // If populated, use ._id; if not, use the value itself

        const response = {
            busId: busId,
            busName: bus.busName || 'Unknown Bus',
            busType: bus.busType,
            totalSeats: bus.totalSeats,
            seatLayout: seatLayout,
            images: bus.images || [],
            amenities: bus.amenities || [],
            operator: bus.operator,
            operatorId: schedule.operator?._id || schedule.operator,
            routeId: schedule.route?._id || schedule.route,
            departureTime: schedule.departureTime,
            arrivalTime: schedule.arrivalTime,
            ticketPrice: schedule.ticketPrice,
            boardingPoints: schedule.boardingPoints,
            droppingPoints: schedule.droppingPoints,
            fromCity: schedule.route?.fromCity,
            toCity: schedule.route?.toCity
        };

        res.json(response);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
