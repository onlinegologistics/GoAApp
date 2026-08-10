const Banner = require('../models/Banner');
const path = require('path');
const fs = require('fs');

// ─── Helper ─────────────────────────────────────────────────────────────────

const buildImageUrl = (req, filename) =>
    `${req.protocol}://${req.get('host')}/uploads/banners/${filename}`;

// ─── CREATE BANNER ───────────────────────────────────────────────────────────
exports.createBanner = async (req, res) => {
    try {
        const { title, offerText, couponCode, buttonText, redirectUrl, isActive, showType, priority, expiryDate } = req.body;

        if (!req.file) {
            return res.status(400).json({ success: false, message: 'Banner image is required.' });
        }

        const imageUrl = buildImageUrl(req, req.file.filename);

        const banner = await Banner.create({
            title,
            offerText,
            couponCode,
            imageUrl,
            buttonText,
            redirectUrl,
            isActive: isActive === 'true' || isActive === true,
            showType,
            priority: Number(priority) || 1,
            expiryDate: new Date(expiryDate),
        });

        res.status(201).json({ success: true, message: 'Banner created successfully.', banner });
    } catch (err) {
        console.error('[BannerController] createBanner error:', err);
        res.status(500).json({ success: false, message: 'Server error while creating banner.', error: err.message });
    }
};

// ─── GET ALL ACTIVE BANNERS (Public / User-Side) ─────────────────────────────
exports.getActiveBanners = async (req, res) => {
    try {
        const now = new Date();
        const banners = await Banner.find({
            isActive: true,
            expiryDate: { $gt: now },
        }).sort({ priority: -1 });

        res.json({ success: true, count: banners.length, banners });
    } catch (err) {
        console.error('[BannerController] getActiveBanners error:', err);
        res.status(500).json({ success: false, message: 'Server error.', error: err.message });
    }
};

// ─── GET ALL BANNERS (Admin View) ─────────────────────────────────────────────
exports.getAllBannersAdmin = async (req, res) => {
    try {
        const banners = await Banner.find().sort({ priority: -1, createdAt: -1 });
        res.json({ success: true, count: banners.length, banners });
    } catch (err) {
        console.error('[BannerController] getAllBannersAdmin error:', err);
        res.status(500).json({ success: false, message: 'Server error.', error: err.message });
    }
};

// ─── UPDATE BANNER ────────────────────────────────────────────────────────────
exports.updateBanner = async (req, res) => {
    try {
        const { title, offerText, couponCode, buttonText, redirectUrl, isActive, showType, priority, expiryDate } = req.body;

        const existing = await Banner.findById(req.params.id);
        if (!existing) return res.status(404).json({ success: false, message: 'Banner not found.' });

        const updateData = {
            title,
            offerText,
            couponCode,
            buttonText,
            redirectUrl,
            isActive: isActive === 'true' || isActive === true,
            showType,
            priority: Number(priority) || 1,
            expiryDate: new Date(expiryDate),
        };

        if (req.file) {
            const oldFilename = existing.imageUrl.split('/uploads/banners/')[1];
            if (oldFilename) {
                const oldPath = path.join(__dirname, '..', 'uploads', 'banners', oldFilename);
                if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
            }
            updateData.imageUrl = buildImageUrl(req, req.file.filename);
        }

        const banner = await Banner.findByIdAndUpdate(req.params.id, updateData, { new: true, runValidators: true });
        res.json({ success: true, message: 'Banner updated successfully.', banner });
    } catch (err) {
        console.error('[BannerController] updateBanner error:', err);
        res.status(500).json({ success: false, message: 'Server error.', error: err.message });
    }
};

// ─── DELETE BANNER ────────────────────────────────────────────────────────────
exports.deleteBanner = async (req, res) => {
    try {
        const banner = await Banner.findById(req.params.id);
        if (!banner) return res.status(404).json({ success: false, message: 'Banner not found.' });

        const filename = banner.imageUrl.split('/uploads/banners/')[1];
        if (filename) {
            const filePath = path.join(__dirname, '..', 'uploads', 'banners', filename);
            if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
        }

        await Banner.findByIdAndDelete(req.params.id);
        res.json({ success: true, message: 'Banner deleted successfully.' });
    } catch (err) {
        console.error('[BannerController] deleteBanner error:', err);
        res.status(500).json({ success: false, message: 'Server error.', error: err.message });
    }
};

// ─── TOGGLE ACTIVE STATUS ─────────────────────────────────────────────────────
exports.toggleActive = async (req, res) => {
    try {
        const banner = await Banner.findById(req.params.id);
        if (!banner) return res.status(404).json({ success: false, message: 'Banner not found.' });

        banner.isActive = !banner.isActive;
        await banner.save();

        res.json({ success: true, message: `Banner ${banner.isActive ? 'activated' : 'deactivated'}.`, isActive: banner.isActive });
    } catch (err) {
        console.error('[BannerController] toggleActive error:', err);
        res.status(500).json({ success: false, message: 'Server error.', error: err.message });
    }
};

// ─── ANALYTICS: RECORD IMPRESSION ───────────────────────────────────────────
exports.recordImpression = async (req, res) => {
    try {
        await Banner.findByIdAndUpdate(req.params.id, { $inc: { 'analytics.impressions': 1 } });
        res.json({ success: true, message: 'Impression recorded.' });
    } catch (err) {
        console.error('[BannerController] recordImpression error:', err);
        res.status(500).json({ success: false, message: 'Server error.', error: err.message });
    }
};

// ─── ANALYTICS: RECORD CLICK ─────────────────────────────────────────────────
exports.recordClick = async (req, res) => {
    try {
        await Banner.findByIdAndUpdate(req.params.id, { $inc: { 'analytics.clicks': 1 } });
        res.json({ success: true, message: 'Click recorded.' });
    } catch (err) {
        console.error('[BannerController] recordClick error:', err);
        res.status(500).json({ success: false, message: 'Server error.', error: err.message });
    }
};
