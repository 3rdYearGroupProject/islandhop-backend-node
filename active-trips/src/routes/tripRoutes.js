const express = require('express');
const router = express.Router();
const {
  setDriver,
  setGuide,
  removeDriver,
  removeGuide,
  newActivateTrip
} = require('../controllers/tripController');

// Route to set driver for a trip
router.post('/set_driver', setDriver);

// Route to set guide for a trip
router.post('/set_guide', setGuide);

// Route to remove driver from a trip
router.post('/remove_driver', removeDriver);

// Route to remove guide from a trip
router.post('/remove_guide', removeGuide);

// Route to activate trip with automatic driver/guide assignment
router.post('/new_activate_trip', newActivateTrip);

module.exports = router;
