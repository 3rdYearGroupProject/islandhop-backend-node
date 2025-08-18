const express = require('express');
const router = express.Router();
const {
  getTopDriver,
  assignDriver,
  getAllDrivers,
  createDriver,
  getDriverTrips
} = require('../controllers/driverController');
const { validate } = require('../middleware/validation');

// GET /top-driver - Get the top available driver for a trip
router.get('/top-driver', validate('getTopDriver', 'query'), getTopDriver);

// POST /assign-driver - Assign a driver to a trip
router.post('/assign-driver', validate('assignDriver'), assignDriver);

// GET /drivers - Get all drivers with scores
router.get('/drivers', getAllDrivers);

// POST /drivers - Create a new driver score record
router.post('/drivers', validate('createDriverScore'), createDriver);

// GET /drivers/:email/trips - Get trips for a specific driver
router.get('/drivers/:email/trips', getDriverTrips);

module.exports = router;
