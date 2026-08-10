const Bus = require('../models/Bus');
// const Hotel = require('../models/hotel/Hotel');
// const Room = require('../models/hotel/Room');

const getAssets = async (req, res) => {
    try {
        const { type } = req.query;

        if (type === 'BUS') {
            const buses = await Bus.find().populate('operator', 'name');
            const normalized = buses.map(b => ({
                id: b._id,
                name: b.busName,
                subtitle: `${b.busType}`, // Simplified for now, or fetch route
                price: b.seatLayout?.[0]?.price || 500,
                type: 'BUS',
                operatorId: b.operator?._id || '',
                operatorName: b.operator?.name || 'Unknown'
            }));
            return res.json({ success: true, assets: normalized });
        }

        if (type === 'HOTEL') {
            return res.json({ success: true, assets: [] });
        }

        res.status(400).json({ success: false, message: 'Invalid asset type' });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
};

module.exports = { getAssets };
