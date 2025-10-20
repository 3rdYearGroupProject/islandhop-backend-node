const express = require('express');
const router = express.Router();
const poolingConfirmController = require('../controllers/poolingConfirmController');

/**
 * @route   POST /api/v1/pooling-confirm/initiate
 * @desc    Initiate trip confirmation process
 * @access  Private (Group Creator only)
 * @body    {
 *            tripId: string (the actual trip ID),
 *            groupId: string (the group's _id from MongoDB),
 *            userId: string,
 *            minMembers?: number,
 *            maxMembers?: number,
 *            tripStartDate?: string (ISO date),
 *            tripEndDate?: string (ISO date),
 *            confirmationHours?: number,
 *            totalAmount?: number,
 *            pricePerPerson?: number,
 *            currency?: string,
 *            paymentDeadlineHours?: number,
 *            tripDetails?: object
 *          }
 */
router.post('/initiate', poolingConfirmController.initiateConfirmation);

/**
 * @route   GET /api/v1/pooling-confirm/trip/:tripId/status
 * @desc    Get confirmation status by tripId (helper for frontend)
 * @access  Private (Trip Members only)
 * @params  tripId: string (UUID from pooling service)
 * @query   userId: string (required)
 */
router.get('/trip/:tripId/status', poolingConfirmController.getTripConfirmationStatus);

/**
 * @route   POST /api/v1/pooling-confirm/:tripId/confirm
 * @desc    Member confirms their participation in the trip
 * @access  Private (Trip Members only)
 * @params  tripId: string (UUID from pooling service)
 * @body    { userId: string }
 */
router.post('/:tripId/confirm', poolingConfirmController.confirmParticipation);

/**
 * @route   GET /api/v1/pooling-confirm/:confirmedTripId/status
 * @desc    Get trip confirmation status and details
 * @access  Private (Trip Members only)
 * @params  confirmedTripId: string (MongoDB ObjectId)
 * @query   userId: string
 */
router.get('/:confirmedTripId/status', poolingConfirmController.getConfirmationStatus);

/**
 * @route   POST /api/v1/pooling-confirm/:tripId/cancel
 * @desc    Cancel trip confirmation (Creator only)
 * @access  Private (Trip Creator only)
 * @params  tripId: string (UUID from pooling service)
 * @body    { userId: string, reason?: string }
 */
router.post('/:tripId/cancel', poolingConfirmController.cancelConfirmation);

/**
 * @route   GET /api/v1/pooling-confirm/user/:userId/trips
 * @desc    Get all confirmed trips for a specific user
 * @access  Private
 * @params  userId: string
 * @query   status?: string, page?: number, limit?: number
 */
router.get('/user/:userId/trips', poolingConfirmController.getUserConfirmedTrips);

/**
 * @route   GET /api/v1/pooling-confirm/health
 * @desc    Health check endpoint
 * @access  Public
 */
router.get('/health', poolingConfirmController.healthCheck);

/**
 * @route   GET /api/v1/pooling-confirm/debug/groups
 * @desc    Debug endpoint to list all available groups
 * @access  Development only
 */
router.get('/debug/groups', poolingConfirmController.debugGroups);

/**
 * @route   GET /api/v1/pooling-confirm/debug/trip/:tripId
 * @desc    Debug endpoint to get complete trip details
 * @access  Development only
 * @params  tripId: string (UUID from pooling service)
 */
router.get('/debug/trip/:tripId', poolingConfirmController.debugTripDetails);

/**
 * @route   POST /api/v1/pooling-confirm/:tripId/complete-payment
 * @desc    Complete full payment (upfront + final) for a user in a specific trip
 * @access  Private (Payment system or admin)
 * @params  tripId: string (UUID from pooling service OR MongoDB ObjectId of confirmedTripId)
 * @body    { userId: string, orderId?: string }
 */
router.post('/:tripId/complete-payment', poolingConfirmController.completeFullPayment);

/**
 * @route   GET /api/v1/pooling-confirm/initiated-trip/:tripId/summary
 * @desc    Get initiated trip summary (days, cost per person, driver/guide status)
 * @access  Private
 * @params  tripId: string (UUID from initiated_trips collection)
 */
router.get('/initiated-trip/:tripId/summary', poolingConfirmController.getInitiatedTripSummary);

module.exports = router;
