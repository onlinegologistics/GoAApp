const Advertisement = require('../models/Advertisement');
const AdAnalytics = require('../models/AdAnalytics');

// --- PUBLIC FETCHING ---
const getPublicAds = async (req, res) => {
    try {
        const { source, destination, device, userType, position } = req.query;
        const now = new Date();

        const query = {
            status: 'Active',
            startDate: { $lte: now },
            endDate: { $gte: now }
        };

        if (position) query.position = position;

        // Fetch all potential ads
        let ads = await Advertisement.find(query).lean();

        // Targeting Filter Logic
        let filteredAds = ads.filter(ad => {
            // Source & Destination matching (Case insensitive & trimmed)
            if (ad.targetRouteSource && source && ad.targetRouteSource.trim().toLowerCase() !== source.trim().toLowerCase()) return false;
            if (ad.targetRouteDestination && destination && ad.targetRouteDestination.trim().toLowerCase() !== destination.trim().toLowerCase()) return false;

            // Device matching
            if (ad.targetDevice !== 'All' && device && ad.targetDevice !== device) return false;

            // UserType matching
            if (ad.targetUserType !== 'All' && userType && ad.targetUserType !== userType) return false;

            return true;
        });

        // Rotation & Priority-based Sorting
        // Priority weight: High (3), Medium (2), Low (1)
        const priorityLevels = { High: 3, Medium: 2, Low: 1 };

        filteredAds.sort((a, b) => {
            const priorityDiff = priorityLevels[b.priority] - priorityLevels[a.priority];
            if (priorityDiff !== 0) return priorityDiff;
            return 0.5 - Math.random(); // Shuffling if same priority
        });

        res.json({ success: true, ads: filteredAds });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
};

// --- ANALYTICS TRACKING ---
const trackEvent = async (req, res) => {
    try {
        const { adId, eventType, device, userId } = req.body;

        const ad = await Advertisement.findById(adId);
        if (!ad) return res.status(404).json({ success: false, message: 'Ad not found' });

        const revenue = eventType === 'Click' ? (ad.cpc || 0) : (ad.cpm / 1000 || 0);

        const event = new AdAnalytics({
            adId,
            eventType,
            device,
            userId,
            revenue,
            ip: req.ip
        });

        await event.save();
        res.json({ success: true, message: `Ad event [${eventType}] tracked.` });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
};

// --- ADMIN MANAGEMENT ---
const createAd = async (req, res) => {
    try {
        const ad = new Advertisement(req.body);
        await ad.save();
        res.status(201).json({ success: true, ad });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
};

const getAllAds = async (req, res) => {
    try {
        const ads = await Advertisement.find().sort({ createdAt: -1 });

        // Fetch stats for each ad
        const adsWithStats = await Promise.all(ads.map(async (ad) => {
            const impressions = await AdAnalytics.countDocuments({ adId: ad._id, eventType: 'View' });
            const clicks = await AdAnalytics.countDocuments({ adId: ad._id, eventType: 'Click' });
            const ctr = impressions > 0 ? (clicks / impressions * 100).toFixed(2) : 0;
            const revenue = await AdAnalytics.aggregate([
                { $match: { adId: ad._id } },
                { $group: { _id: null, total: { $sum: '$revenue' } } }
            ]);

            return {
                ...ad.toObject(),
                stats: {
                    impressions,
                    clicks,
                    ctr: `${ctr}%`,
                    revenue: revenue[0] ? revenue[0].total : 0
                }
            };
        }));

        res.json({ success: true, ads: adsWithStats });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
};

const updateAd = async (req, res) => {
    try {
        const ad = await Advertisement.findByIdAndUpdate(req.params.id, req.body, { new: true });
        res.json({ success: true, ad });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
};

const deleteAd = async (req, res) => {
    try {
        await Advertisement.findByIdAndDelete(req.params.id);
        await AdAnalytics.deleteMany({ adId: req.params.id });
        res.json({ success: true, message: 'Ad and its analytics deleted successfully.' });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
};

module.exports = {
    getPublicAds,
    trackEvent,
    createAd,
    getAllAds,
    updateAd,
    deleteAd
};
