const mongoose = require('mongoose');

const testimonialSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  role: {
    type: String,
    required: true
  },
  rating: {
    type: Number,
    required: true,
    min: 1,
    max: 5,
    default: 5
  },
  reviewText: {
    type: String,
    required: true
  },
  image: {
    type: String,
    required: true
  },
  status: {
    type: Boolean,
    default: true
  }
}, { timestamps: true });

module.exports = mongoose.model('Testimonial', testimonialSchema);
