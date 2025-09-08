const poolingConfirmService = require('../services/poolingConfirmService');
const logger = require('../config/logger');
const Joi = require('joi');

class PoolingConfirmController {
  
  /**
   * POST /api/v1/pooling-confirm/initiate
   * Initiate trip confirmation process
   */
  async initiateConfirmation(req, res) {
    try {
      // Validation schema
      const schema = Joi.object({
        groupId: Joi.string().required(),
        userId: Joi.string().required(),
        minMembers: Joi.number().min(2).max(20).default(2),
        maxMembers: Joi.number().min(2).max(20).default(12),
        tripStartDate: Joi.date().iso().required(),
        tripEndDate: Joi.date().iso().min(Joi.ref('tripStartDate')).required(),
        confirmationHours: Joi.number().min(1).max(168).default(48), // 1 hour to 1 week
        totalAmount: Joi.number().min(0).default(0),
        pricePerPerson: Joi.number().min(0).default(0),
        currency: Joi.string().valid('LKR', 'USD', 'EUR').default('LKR'),
        paymentDeadlineHours: Joi.number().min(1).max(336).default(72), // 1 hour to 2 weeks
        tripDetails: Joi.object().default({})
      });

      const { error, value } = schema.validate(req.body);
      if (error) {
        return res.status(400).json({
          success: false,
          message: 'Validation error',
          details: error.details[0].message
        });
      }

      const { groupId, userId, ...confirmationData } = value;

      const result = await poolingConfirmService.initiateConfirmation(groupId, userId, confirmationData);

      res.status(201).json({
        success: true,
        message: 'Trip confirmation initiated successfully',
        data: result
      });

    } catch (error) {
      logger.error('Error in initiateConfirmation:', error);
      res.status(error.message.includes('not found') ? 404 : 
                 error.message.includes('already initiated') ? 409 :
                 error.message.includes('Insufficient members') ? 400 :
                 error.message.includes('Only group creator') ? 403 : 500).json({
        success: false,
        message: error.message
      });
    }
  }

  /**
   * POST /api/v1/pooling-confirm/:confirmedTripId/confirm
   * Member confirms their participation
   */
  async confirmParticipation(req, res) {
    try {
      const { confirmedTripId } = req.params;
      const { userId } = req.body;

      // Validation
      if (!userId) {
        return res.status(400).json({
          success: false,
          message: 'userId is required'
        });
      }

      if (!confirmedTripId || !confirmedTripId.match(/^[0-9a-fA-F]{24}$/)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid confirmedTripId format'
        });
      }

      const result = await poolingConfirmService.confirmParticipation(confirmedTripId, userId);

      res.status(200).json({
        success: true,
        message: 'Participation confirmed successfully',
        data: result
      });

    } catch (error) {
      logger.error('Error in confirmParticipation:', error);
      res.status(error.message.includes('not found') ? 404 :
                 error.message.includes('not a member') ? 403 :
                 error.message.includes('already confirmed') ? 409 :
                 error.message.includes('deadline has passed') ? 410 : 500).json({
        success: false,
        message: error.message
      });
    }
  }

  /**
   * GET /api/v1/pooling-confirm/:confirmedTripId/status
   * Get trip confirmation status
   */
  async getConfirmationStatus(req, res) {
    try {
      const { confirmedTripId } = req.params;
      const { userId } = req.query;

      // Validation
      if (!userId) {
        return res.status(400).json({
          success: false,
          message: 'userId is required as query parameter'
        });
      }

      if (!confirmedTripId || !confirmedTripId.match(/^[0-9a-fA-F]{24}$/)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid confirmedTripId format'
        });
      }

      const status = await poolingConfirmService.getConfirmationStatus(confirmedTripId, userId);

      res.status(200).json({
        success: true,
        data: status
      });

    } catch (error) {
      logger.error('Error in getConfirmationStatus:', error);
      res.status(error.message.includes('not found') ? 404 :
                 error.message.includes('Unauthorized') ? 403 : 500).json({
        success: false,
        message: error.message
      });
    }
  }

  /**
   * POST /api/v1/pooling-confirm/:confirmedTripId/cancel
   * Cancel trip confirmation
   */
  async cancelConfirmation(req, res) {
    try {
      const { confirmedTripId } = req.params;
      const { userId, reason } = req.body;

      // Validation
      if (!userId) {
        return res.status(400).json({
          success: false,
          message: 'userId is required'
        });
      }

      if (!confirmedTripId || !confirmedTripId.match(/^[0-9a-fA-F]{24}$/)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid confirmedTripId format'
        });
      }

      const result = await poolingConfirmService.cancelConfirmation(confirmedTripId, userId, reason);

      res.status(200).json({
        success: true,
        message: 'Trip confirmation cancelled successfully',
        data: result
      });

    } catch (error) {
      logger.error('Error in cancelConfirmation:', error);
      res.status(error.message.includes('not found') ? 404 :
                 error.message.includes('Only trip creator') ? 403 :
                 error.message.includes('Cannot cancel') ? 409 : 500).json({
        success: false,
        message: error.message
      });
    }
  }

  /**
   * GET /api/v1/pooling-confirm/user/:userId/trips
   * Get all confirmed trips for a user
   */
  async getUserConfirmedTrips(req, res) {
    try {
      const { userId } = req.params;
      const { status, page = 1, limit = 10 } = req.query;

      if (!userId) {
        return res.status(400).json({
          success: false,
          message: 'userId is required'
        });
      }

      // Build query
      const query = { memberIds: userId };
      if (status) {
        query.status = status;
      }

      // Pagination
      const skip = (parseInt(page) - 1) * parseInt(limit);
      
      const ConfirmedTrip = require('../models/ConfirmedTrip');
      const trips = await ConfirmedTrip.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit));

      const total = await ConfirmedTrip.countDocuments(query);

      res.status(200).json({
        success: true,
        data: {
          trips: trips.map(trip => ({
            confirmedTripId: trip._id,
            groupId: trip.groupId,
            tripId: trip.tripId,
            tripName: trip.tripName,
            status: trip.status,
            memberCount: trip.currentMemberCount,
            isCreator: trip.creatorUserId === userId,
            userConfirmed: trip.memberConfirmations.find(mc => mc.userId === userId)?.confirmed || false,
            tripStartDate: trip.tripStartDate,
            confirmationDeadline: trip.confirmationDeadline,
            paymentRequired: trip.paymentInfo.pricePerPerson > 0,
            pricePerPerson: trip.paymentInfo.pricePerPerson,
            createdAt: trip.createdAt
          })),
          pagination: {
            currentPage: parseInt(page),
            totalPages: Math.ceil(total / parseInt(limit)),
            totalTrips: total,
            hasNextPage: skip + trips.length < total,
            hasPrevPage: parseInt(page) > 1
          }
        }
      });

    } catch (error) {
      logger.error('Error in getUserConfirmedTrips:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }

  /**
   * GET /api/v1/pooling-confirm/health
   * Health check endpoint
   */
  async healthCheck(req, res) {
    try {
      const ConfirmedTrip = require('../models/ConfirmedTrip');
      
      // Check database connection
      await ConfirmedTrip.findOne().limit(1);

      res.status(200).json({
        success: true,
        message: 'Pooling Confirm Service is healthy',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        service: 'pooling-confirm-service',
        version: '1.0.0'
      });

    } catch (error) {
      logger.error('Health check failed:', error);
      res.status(503).json({
        success: false,
        message: 'Service unhealthy',
        error: error.message
      });
    }
  }
}

module.exports = new PoolingConfirmController();
