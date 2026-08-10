const Destination = require('../models/Destination');
const fs = require('fs');
const path = require('path');

exports.createDestination = async (req, res) => {
    try {
        console.log("Create Destination Request Body:", req.body);
        console.log("Create Destination File:", req.file);
        const { name, distance, duration, description, isPopular, status } = req.body;

        if (!req.file) {
            return res.status(400).json({ success: false, message: 'Image is required' });
        }

        const destination = new Destination({
            name, distance, duration, description,
            isPopular: isPopular === 'true' || isPopular === true,
            status: status === 'true' || status === true,
            image: `/uploads/destinations/${req.file.filename}`
        });

        await destination.save();
        res.status(201).json({ success: true, data: destination });
    } catch (error) {
        console.error("Create Destination Error:", error);
        res.status(500).json({ success: false, message: error.message, stack: error.stack });
    }
};

exports.getDestinations = async (req, res) => {
    try {
        const destinations = await Destination.find().sort({ createdAt: -1 });
        res.json({ success: true, data: destinations });
    } catch (error) {
        console.error("Get Destinations Error:", error);
        res.status(500).json({ success: false, message: error.message });
    }
};

exports.getPublicDestinations = async (req, res) => {
    try {
        const destinations = await Destination.find({ status: true }).sort({ isPopular: -1, createdAt: -1 });
        res.json({ success: true, data: destinations });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

exports.updateDestination = async (req, res) => {
    try {
        const { id } = req.params;
        const updates = { ...req.body };

        // Handle boolean conversions from FormData
        if (updates.isPopular !== undefined) updates.isPopular = updates.isPopular === 'true' || updates.isPopular === true;
        if (updates.status !== undefined) updates.status = updates.status === 'true' || updates.status === true;

        if (req.file) {
            const oldDest = await Destination.findById(id);
            if (oldDest && oldDest.image) {
                const oldPath = path.join(__dirname, '../', oldDest.image);
                if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
            }
            updates.image = `/uploads/destinations/${req.file.filename}`;
        }

        const destination = await Destination.findByIdAndUpdate(id, updates, { new: true });
        res.json({ success: true, data: destination });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

exports.deleteDestination = async (req, res) => {
    try {
        const { id } = req.params;
        const destination = await Destination.findById(id);

        if (destination && destination.image) {
            const imagePath = path.join(__dirname, '../', destination.image);
            if (fs.existsSync(imagePath)) fs.unlinkSync(imagePath);
        }

        await Destination.findByIdAndDelete(id);
        res.json({ success: true, message: 'Destination deleted successfully' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
