const express = require('express');
const router = express.Router();
const locationController = require('../controllers/locationController');

/**
 * @route GET /health
 * @desc Health check endpoint
 * @returns { status: 'ok' }
 * @example GET {BASE_URL}/health
 */
router.get('/health', (req, res) => res.json({ status: 'ok' }));

/**
 * @route POST /share-location
 * @desc Share or update location for a specific trip and user for today
 * @body {
 *   tripId: String (required),
 *   userId: String (required),
 *   latitude: Number (required),
 *   longitude: Number (required),
 *   email: String (required)
 * }
 * Only one location per user/trip/day is allowed. If already exists, updates the location.
 * @example POST {BASE_URL}/share-location
 */
router.post('/share-location', locationController.shareLocation);

/**
 * @route GET /users-at-location
 * @desc Retrieve users who have shared the same location today
 * @query latitude: Number (required)
 * @query longitude: Number (required)
 * @returns Array of {
 *   userId,
 *   tripId,
 *   timestamp,
 *   email,
 *   firstName,
 *   lastName,
 *   dob,
 *   nationality,
 *   languages,
 *   profilePic,
 *   profileCompletion
 * }
 * @example GET {BASE_URL}/users-at-location?latitude=...&longitude=...
 */
router.get('/users-at-location', locationController.getUsersAtLocation);

module.exports = router;
