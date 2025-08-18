const express = require('express');
const router = express.Router();
const {
  getTopGuide,
  assignGuide,
  getAllGuides,
  createGuide,
  getGuideTrips
} = require('../controllers/guideController');
const { validate } = require('../middleware/validation');

// GET /top-guide - Get the top available guide for a trip
router.get('/top-guide', validate('getTopGuide', 'query'), getTopGuide);

// POST /assign-guide - Assign a guide to a trip
router.post('/assign-guide', validate('assignGuide'), assignGuide);

// GET /guides - Get all guides with scores
router.get('/guides', getAllGuides);

// POST /guides - Create a new guide score record
router.post('/guides', validate('createGuideScore'), createGuide);

// GET /guides/:email/trips - Get trips for a specific guide
router.get('/guides/:email/trips', getGuideTrips);

module.exports = router;
