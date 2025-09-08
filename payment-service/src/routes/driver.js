const express = require('express');
const router = express.Router();
const driverController = require('../controllers/driverController');
const upload = require('../middleware/upload');

// POST /driver - Create a new driver entry
router.post('/', driverController.createDriver);

// PUT /driver/pay/:tripId - Update driver payment status with evidence
router.put('/pay/:tripId', upload.single('evidence'), driverController.payDriver);

// GET /driver/:tripId - Get driver details by tripId
router.get('/:tripId', driverController.getDriverByTripId);

// GET /driver - Get all drivers (with optional paid filter)
router.get('/', driverController.getAllDrivers);

module.exports = router;
