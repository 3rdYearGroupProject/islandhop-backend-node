const express = require('express');
const router = express.Router();
const poolingConfirmController = require('../controllers/poolingConfirmController');

/**
 * @route   POST /api/v1/pooling-confirm/initiate
 * @desc    Initiate trip confirmation process
 * @access  Private (Group Creator only)
 * @body    {
 *            groupId: string,
 *            userId: string,
 *            minMembers?: number,
 *            maxMembers?: number,
 *            tripStartDate: string (ISO date),
 *            tripEndDate: string (ISO date),
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
 * @route   POST /api/v1/pooling-confirm/:confirmedTripId/confirm
 * @desc    Member confirms their participation in the trip
 * @access  Private (Trip Members only)
 * @params  confirmedTripId: string (MongoDB ObjectId)
 * @body    { userId: string }
 */
router.post('/:confirmedTripId/confirm', poolingConfirmController.confirmParticipation);

/**
 * @route   GET /api/v1/pooling-confirm/:confirmedTripId/status
 * @desc    Get trip confirmation status and details
 * @access  Private (Trip Members only)
 * @params  confirmedTripId: string (MongoDB ObjectId)
 * @query   userId: string
 */
router.get('/:confirmedTripId/status', poolingConfirmController.getConfirmationStatus);

/**
 * @route   GET /api/v1/pooling-confirm/:confirmedTripId/details
 * @desc    Get comprehensive trip details with all member payment information
 * @access  Private (Trip Members only)
 * @params  confirmedTripId: string (MongoDB ObjectId)
 * @query   userId: string
 */
router.get('/:confirmedTripId/details', poolingConfirmController.getComprehensiveTripDetails);

/**
 * @route   POST /api/v1/pooling-confirm/:confirmedTripId/cancel
 * @desc    Cancel trip confirmation (Creator only)
 * @access  Private (Trip Creator only)
 * @params  confirmedTripId: string (MongoDB ObjectId)
 * @body    { userId: string, reason?: string }
 */
router.post('/:confirmedTripId/cancel', poolingConfirmController.cancelConfirmation);

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

module.exports = router;
