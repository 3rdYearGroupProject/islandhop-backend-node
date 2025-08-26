const express = require('express');
const TripController = require('../controllers/tripController');
const EnhancedMockTripService = require('../services/enhancedMockTripService');
// const TripService = require('../services/tripService');
// const Trip = require('../models/Trip');

const router = express.Router();

// Use enhanced mock service that can generate real Google Maps routes
const tripService = new EnhancedMockTripService();
// const tripService = new TripService(Trip); // Uncomment when ready for real DB

const tripController = new TripController(tripService);

router.get('/:id', tripController.getTrip.bind(tripController));
router.post('/', tripController.createTrip.bind(tripController));
router.put('/:id', tripController.updateTrip.bind(tripController));
router.delete('/:id', tripController.deleteTrip.bind(tripController));
router.get('/:id/route', tripController.getRoute.bind(tripController));
router.get('/:id/optimized-route', tripController.getOptimizedRoute.bind(tripController));
router.get('/:id/route-coordinates', tripController.getRouteCoordinates.bind(tripController));
router.get('/:id/directions-request', tripController.getDirectionsRequest.bind(tripController));
router.post('/:id/completeDestination', tripController.completeDestination.bind(tripController));
router.post('/:id/recalculate-route', tripController.recalculateRoute.bind(tripController));
router.put('/:id/current-location', tripController.updateCurrentLocation.bind(tripController));

// Demo endpoint - get the hardcoded trip data
router.get('/demo/sample-trip', (req, res) => {
  const mockData = require('../data/mockTripData');
  res.json({
    message: 'Sample trip data for frontend testing',
    data: mockData
  });
});

module.exports = router;