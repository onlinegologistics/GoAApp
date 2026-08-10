// routes/heroImages.js
const express = require('express')
const router = express.Router()
const multer = require('multer')
const path = require('path')
const fs = require('fs')
const HeroImage = require('../models/HeroImage')

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = 'uploads/hero'
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true })
    cb(null, dir)
  },
  filename: (req, file, cb) => {
    cb(null, `hero_${Date.now()}${path.extname(file.originalname)}`)
  }
})

const upload = multer({
  storage,
  limits: { fileSize: 20 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const ok = /jpeg|jpg|png|webp/.test(path.extname(file.originalname).toLowerCase())
    ok ? cb(null, true) : cb(new Error('Only images allowed'))
  }
})

// GET /api/hero-images?type=home  (type optional)
router.get('/', async (req, res) => {
  try {
    const filter = req.query.type ? { type: req.query.type } : {}
    const images = await HeroImage.find(filter).sort({ order: 1, createdAt: 1 })
    res.json(images)
  } catch (err) {
    res.status(500).json({ message: 'Server error' })
  }
})

// POST /api/hero-images
router.post('/', upload.single('image'), async (req, res) => {
  try {
    const { title = '', type = 'home' } = req.body
    const url = `${req.protocol}://${req.get('host')}/uploads/hero/${req.file.filename}`
    const image = await HeroImage.create({ url, title, type })
    res.status(201).json(image)
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

// DELETE /api/hero-images/:id
router.delete('/:id', async (req, res) => {
  try {
    const image = await HeroImage.findById(req.params.id)
    if (!image) return res.status(404).json({ message: 'Not found' })
    const filename = image.url.split('/uploads/hero/')[1]
    const filePath = path.join('uploads/hero', filename)
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath)
    await image.deleteOne()
    res.json({ message: 'Deleted' })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

module.exports = router