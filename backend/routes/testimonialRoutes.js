const express = require('express');
const router = express.Router();
const { 
  getTestimonials, 
  getTestimonialById,
  getPublicTestimonials, 
  createTestimonial, 
  updateTestimonial, 
  deleteTestimonial 
} = require('../controllers/testimonialController');
const { authMiddleware, checkRole } = require('../middleware/authMiddleware');
const upload = require('../middleware/reviewUpload');

// Public route for homepage
router.get('/public', getPublicTestimonials);

// Admin routes
router.get('/', authMiddleware, checkRole(['admin', 'superadmin']), getTestimonials);
router.get('/:id', authMiddleware, checkRole(['admin', 'superadmin']), getTestimonialById);

router.post('/', 
  authMiddleware, 
  checkRole(['admin', 'superadmin']), 
  upload.single('image'), 
  createTestimonial
);

router.put('/:id', 
  authMiddleware, 
  checkRole(['admin', 'superadmin']), 
  upload.single('image'), 
  updateTestimonial
);

router.delete('/:id', 
  authMiddleware, 
  checkRole(['admin', 'superadmin']), 
  deleteTestimonial
);

module.exports = router;
