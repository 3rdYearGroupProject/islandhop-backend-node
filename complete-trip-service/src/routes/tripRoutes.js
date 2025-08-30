const express = require('express');
const {
  startTrip,
  confirmStart,
  endTrip,
  confirmEnd,
  startDay,
  confirmDayStart,
  endDay,
  confirmDayEnd,
  getDayInfo,
  getTotalDistance,
  guideReview,
  driverReview
} = require('../controllers/tripController');

const router = express.Router();

// Trip management routes
router.post('/start-trip', startTrip);
router.post('/confirm-start', confirmStart);
router.post('/end-trip', endTrip);
router.post('/confirm-end', confirmEnd);

// Day management routes - dynamic day numbers
router.post('/start-day-:dayNumber', startDay);
router.post('/confirm-day-:dayNumber-start', confirmDayStart);
router.post('/end-day-:dayNumber', endDay);
router.post('/confirm-day-:dayNumber-end', confirmDayEnd);

// Information routes
router.get('/day-:dayNumber-info', getDayInfo);
router.get('/total-distance', getTotalDistance);

// Review routes
router.post('/guide-review', guideReview);
router.post('/driver-review', driverReview);

module.exports = router;
