const express = require('express');
const router = express.Router();
const chargesController = require('../controllers/chargesController');

// GET /charges - Get current charges
router.get('/get', chargesController.getCharges);

// PUT /charges/driver - Update driver daily charge
router.put('/driver', chargesController.updateDriverCharge);

// PUT /charges/guide - Update guide daily charge
router.put('/guide', chargesController.updateGuideCharge);

// PUT /charges/system - Update system charge percentage
router.put('/system', chargesController.updateSystemCharge);

module.exports = router;
