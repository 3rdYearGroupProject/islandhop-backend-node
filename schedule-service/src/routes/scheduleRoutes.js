const express = require('express');
const router = express.Router();
const {
  markUnavailable,
  unmarkAvailable,
  lockDays,
  getAvailableDays,
  healthCheck
} = require('../controllers/scheduleController');

const {
  validateMarkUnavailable,
  validateUnmarkAvailable,
  validateLock,
  validateGetAvailable
} = require('../middleware/validation');

// Health check route
router.get('/health', healthCheck);

// Schedule routes for both drivers and guides
// userType parameter should be either 'driver' or 'guide'

// POST /schedule/:userType/mark-unavailable
router.post('/:userType/mark-unavailable', validateMarkUnavailable, markUnavailable);

// POST /schedule/:userType/unmark-available
router.post('/:userType/unmark-available', validateUnmarkAvailable, unmarkAvailable);

// POST /schedule/:userType/lock
router.post('/:userType/lock', validateLock, lockDays);

// GET /schedule/:userType/available?email=...&month=2025-09
router.get('/:userType/available', validateGetAvailable, getAvailableDays);

module.exports = router;
