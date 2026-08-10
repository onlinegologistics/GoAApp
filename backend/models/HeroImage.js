// models/HeroImage.js
const mongoose = require('mongoose')

const heroImageSchema = new mongoose.Schema({
  url:   { type: String, required: true },
  title: { type: String, default: '' },
  type:  { 
    type: String, 
    enum: ['home', 'flight', 'hotel', 'train', 'bus'],
    default: 'home'
  },
  order: { type: Number, default: 0 },
}, { timestamps: true })

module.exports = mongoose.model('HeroImage', heroImageSchema)