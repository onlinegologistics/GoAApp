const Testimonial = require('../models/Testimonial');
const path = require('path');
const fs = require('fs');

// Get all testimonials (Admin)
exports.getTestimonials = async (req, res) => {
  try {
    const testimonials = await Testimonial.find().sort({ createdAt: -1 });
    res.json(testimonials);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get single testimonial
exports.getTestimonialById = async (req, res) => {
  try {
    const testimonial = await Testimonial.findById(req.params.id);
    if (!testimonial) return res.status(404).json({ message: 'Not found' });
    res.json(testimonial);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get public testimonials (Frontend)
exports.getPublicTestimonials = async (req, res) => {
  try {
    const testimonials = await Testimonial.find({ status: true }).sort({ createdAt: -1 });
    res.json(testimonials);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Create testimonial
exports.createTestimonial = async (req, res) => {
  try {
    const { name, role, rating, reviewText } = req.body;
    let image = '';
    if (req.file) {
      image = `/uploads/reviews/${req.file.filename}`;
    }

    const testimonial = await Testimonial.create({
      name,
      role,
      rating: Number(rating),
      reviewText,
      image,
      status: req.body.status === 'false' ? false : true
    });

    res.status(201).json(testimonial);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Update testimonial
exports.updateTestimonial = async (req, res) => {
  try {
    const { name, role, rating, reviewText, status } = req.body;
    let testimonial = await Testimonial.findById(req.params.id);

    if (!testimonial) {
      return res.status(404).json({ message: 'Testimonial not found' });
    }

    if (req.file) {
      // Delete old image
      if (testimonial.image) {
        const oldImagePath = path.join(__dirname, '..', testimonial.image);
        if (fs.existsSync(oldImagePath)) fs.unlinkSync(oldImagePath);
      }
      testimonial.image = `/uploads/reviews/${req.file.filename}`;
    }

    testimonial.name = name || testimonial.name;
    testimonial.role = role || testimonial.role;
    testimonial.rating = rating ? Number(rating) : testimonial.rating;
    testimonial.reviewText = reviewText || testimonial.reviewText;
    testimonial.status = status !== undefined ? (status === 'true' || status === true) : testimonial.status;

    await testimonial.save();
    res.json(testimonial);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Delete testimonial
exports.deleteTestimonial = async (req, res) => {
  try {
    const testimonial = await Testimonial.findById(req.params.id);
    if (!testimonial) return res.status(404).json({ message: 'Not found' });

    if (testimonial.image) {
      const imagePath = path.join(__dirname, '..', testimonial.image);
      if (fs.existsSync(imagePath)) fs.unlinkSync(imagePath);
    }

    await testimonial.deleteOne();
    res.json({ message: 'Deleted' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
