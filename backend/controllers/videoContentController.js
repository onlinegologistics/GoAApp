const VideoContent = require('../models/VideoContent');
const path = require('path');
const fs = require('fs');

// @desc    Get video content
// @route   GET /api/content/video
// @access  Public
exports.getVideoContent = async (req, res) => {
  try {
    const content = await VideoContent.findOne();
    if (!content) {
      return res.status(200).json({
        title: "Your Story Begins the Moment You Decide to Travel",
        subtitle: "At GoAirClass, we craft personalized trips that go beyond the ordinary — so you can focus on what truly matters: the experience.",
        points: [
          "Handpicked destinations worldwide",
          "Best price guarantee",
          "Dedicated travel support",
          "Seamless booking experience"
        ],
        buttonText: "Start Exploring",
        videoUrl: "" // Empty if not set
      });
    }
    res.status(200).json(content);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Save/Update video content
// @route   POST /api/content/video
// @access  Private (Admin)
exports.saveVideoContent = async (req, res) => {
  try {
    console.log('Saving video content...', req.body);
    if (req.file) console.log('File received:', req.file.filename);
    const { title, subtitle, points, buttonText } = req.body;

    // Handle points array (if sent as stringified JSON or comma-separated)
    let pointsArray = points;
    if (typeof points === 'string') {
      try {
        pointsArray = JSON.parse(points);
      } catch (e) {
        pointsArray = points.split(',').map(p => p.trim());
      }
    }

    let videoUrl = '';
    if (req.file) {
      videoUrl = `/uploads/videos/${req.file.filename}`;
    }

    let content = await VideoContent.findOne();

    if (content) {
      // Delete old video if new one is uploaded
      if (req.file && content.videoUrl) {
        const oldVideoPath = path.join(__dirname, '..', content.videoUrl);
        if (fs.existsSync(oldVideoPath)) {
          fs.unlinkSync(oldVideoPath);
        }
      }

      content.title = title || content.title;
      content.subtitle = subtitle || content.subtitle;
      content.points = pointsArray || content.points;
      content.buttonText = buttonText || content.buttonText;
      if (videoUrl) content.videoUrl = videoUrl;

      await content.save();
    } else {
      content = await VideoContent.create({
        title,
        subtitle,
        points: pointsArray,
        buttonText,
        videoUrl
      });
    }

    res.status(200).json(content);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
