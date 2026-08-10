const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const bannerController = require('../controllers/bannerController');

// ─── Multer Config ────────────────────────────────────────────────────────────

// Ensure uploads directory exists
const uploadDir = path.join(__dirname, '..', 'uploads', 'banners');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, uploadDir),
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
        cb(null, 'banner-' + uniqueSuffix + path.extname(file.originalname));
    },
});

const fileFilter = (req, file, cb) => {
    const allowed = /jpeg|jpg|png|gif|webp/;
    const ext = allowed.test(path.extname(file.originalname).toLowerCase());
    const mime = allowed.test(file.mimetype);
    if (ext && mime) return cb(null, true);
    cb(new Error('Only image files are allowed (jpeg, jpg, png, gif, webp)'));
};

const upload = multer({
    storage,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB max
    fileFilter,
});

// ─── Routes ───────────────────────────────────────────────────────────────────

// Public routes (user-facing)
router.get('/', bannerController.getActiveBanners);

// Admin routes
router.get('/admin', bannerController.getAllBannersAdmin);
router.post('/', upload.single('image'), bannerController.createBanner);
router.put('/:id', upload.single('image'), bannerController.updateBanner);
router.delete('/:id', bannerController.deleteBanner);
router.patch('/:id/toggle', bannerController.toggleActive);

// Analytics routes (public - called from frontend)
router.post('/:id/impression', bannerController.recordImpression);
router.post('/:id/click', bannerController.recordClick);

module.exports = router;
