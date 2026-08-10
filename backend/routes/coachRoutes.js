const express = require('express');
const router = express.Router();
const coachController = require('../controllers/coachController');

// ─── Master Coach Types ──────────────────────────────────────────────────────
router.get('/coach-types', coachController.getAllCoachTypes);
router.post('/coach-types', coachController.createCoachType);

// ─── Per-Train Coach Configuration ──────────────────────────────────────────
router.get('/train/:trainId/coaches', coachController.getTrainCoaches);
router.post('/train/:trainId/coaches', coachController.saveTrainCoaches);
router.delete('/train/:trainId/coaches/:coachId', coachController.deleteTrainCoach);

// ─── Train Availability ──────────────────────────────────────────────────────
router.get('/train/:trainId/availability', coachController.getTrainAvailability);

module.exports = router;
