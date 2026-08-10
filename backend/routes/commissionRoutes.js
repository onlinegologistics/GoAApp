const express = require('express');
const router = express.Router();
const commissionController = require('../controllers/commissionController');

router.post('/', commissionController.createCommission);
router.get('/', commissionController.getAllCommissions);
router.put('/:id', commissionController.updateCommission);
router.delete('/:id', commissionController.deleteCommission);

// Simulation/Calculation
router.post('/calculate', commissionController.calculate);

module.exports = router;
