const express = require('express');
const router = express.Router();
const {
  setDriver,
  setGuide,
  removeDriver,
  removeGuide,
  newActivateTrip,
  getTripsByUserId,
  getTripsByDriverEmail,
  getTripsByGuideEmail,
  acceptDriver,
  acceptGuide
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

// Route to get all trips for a specific user
router.get('/trips/user/:userId', getTripsByUserId);

// Route to get all trips for a specific driver
router.get('/trips/driver/:driverEmail', getTripsByDriverEmail);

// Route to get all trips for a specific guide
router.get('/trips/guide/:guideEmail', getTripsByGuideEmail);

// Route to accept driver assignment for a trip
router.post('/accept_driver', acceptDriver);

// Route to accept guide assignment for a trip
router.post('/accept_guide', acceptGuide);

module.exports = router;
