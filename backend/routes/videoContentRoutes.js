const express = require('express');
const router = express.Router();
const { getVideoContent, saveVideoContent } = require('../controllers/videoContentController');
const { authMiddleware, checkRole } = require('../middleware/authMiddleware');
const upload = require('../middleware/videoUpload');

router.get('/video', getVideoContent);

router.post('/video', 
  authMiddleware, 
  checkRole(['admin', 'superadmin']), 
  (req, res, next) => {
    console.log('Incoming POST to /api/content/video');
    upload.single('video')(req, res, (err) => {
      if (err) {
        console.error('Multer Error:', err.message);
        return res.status(400).json({ message: err.message });
      }
      next();
    });
  }, 
  saveVideoContent
);

module.exports = router;
