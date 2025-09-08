const express = require('express');
const router = express.Router();
const guideController = require('../controllers/guideController');
const upload = require('../middleware/upload');

// POST /guide - Create a new guide entry
router.post('/', guideController.createGuide);

// PUT /guide/pay/:tripId - Update guide payment status with evidence
router.put('/pay/:tripId', upload.single('evidence'), guideController.payGuide);

// GET /guide/:tripId - Get guide details by tripId
router.get('/:tripId', guideController.getGuideByTripId);

// GET /guide - Get all guides (with optional paid filter)
router.get('/', guideController.getAllGuides);

module.exports = router;
