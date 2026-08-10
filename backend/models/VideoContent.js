const mongoose = require('mongoose');

const videoContentSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    default: "Your Story Begins the Moment You Decide to Travel"
  },
  subtitle: {
    type: String,
    required: true,
    default: "At GoAirClass, we craft personalized trips that go beyond the ordinary — so you can focus on what truly matters: the experience."
  },
  points: {
    type: [String],
    default: [
      "Handpicked destinations worldwide",
      "Best price guarantee",
      "Dedicated travel support",
      "Seamless booking experience"
    ]
  },
  buttonText: {
    type: String,
    required: true,
    default: "Start Exploring"
  },
  videoUrl: {
    type: String,
    required: true
  }
}, { timestamps: true });

module.exports = mongoose.model('VideoContent', videoContentSchema);
