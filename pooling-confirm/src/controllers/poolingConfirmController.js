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
        tripId: Joi.string().required(),
        groupId: Joi.string().optional(), // Now optional since we find by tripId
        userId: Joi.string().required(),
        minMembers: Joi.number().min(2).max(20).default(2),
        maxMembers: Joi.number().min(2).max(20).default(12),
        tripStartDate: Joi.date().iso().optional(),
        tripEndDate: Joi.date().iso().optional(),
        confirmationHours: Joi.number().min(1).max(168).default(48), // 1 hour to 1 week
        totalAmount: Joi.number().min(0).optional(),
        pricePerPerson: Joi.number().min(0).optional(),
        currency: Joi.string().valid('LKR', 'USD', 'EUR').default('LKR'),
        paymentDeadlineHours: Joi.number().min(1).max(336).default(72), // 1 hour to 2 weeks (for backward compatibility)
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

      const { tripId, groupId, userId, ...confirmationData } = value;

      // Use groupId from the found group data, not from request
      const result = await poolingConfirmService.initiateConfirmation(tripId, userId, confirmationData);

      res.status(201).json({
        success: true,
        message: 'Trip confirmation initiated successfully',
        data: result
      });

    } catch (error) {
      logger.error('Error in initiateConfirmation:', error);
      
      // Determine HTTP status code based on specific error types
      let statusCode = 500; // Default internal server error
      
      if (error.message.includes('does not exist')) {
        statusCode = 404; // Trip not found
      } else if (error.message.includes('not a member')) {
        statusCode = 403; // User not authorized
      } else if (error.message.includes('already initiated')) {
        statusCode = 409; // Conflict - already exists
      } else if (error.message.includes('Insufficient members')) {
        statusCode = 400; // Bad request - business rule violation
      } else if (error.message.includes('Only group creator')) {
        statusCode = 403; // Forbidden - not authorized
      }
      
      res.status(statusCode).json({
        success: false,
        message: error.message,
        errorType: statusCode === 404 ? 'TRIP_NOT_FOUND' :
                   statusCode === 403 ? 'UNAUTHORIZED' :
                   statusCode === 409 ? 'CONFLICT' :
                   statusCode === 400 ? 'VALIDATION_ERROR' : 'INTERNAL_ERROR'
      });
    }
  }

  /**
   * POST /api/v1/pooling-confirm/:tripId/confirm
   * Member confirms their participation using tripId
   */
  async confirmParticipation(req, res) {
    try {
      // Debug logging
      logger.info(`🔍 CONFIRM PARTICIPATION REQUEST:`);
      logger.info(`📋 Method: ${req.method}`);
      logger.info(`📋 URL: ${req.originalUrl}`);
      logger.info(`📋 Params: ${JSON.stringify(req.params)}`);
      logger.info(`📋 Body: ${JSON.stringify(req.body)}`);
      
      const { tripId } = req.params; // Now using tripId instead of confirmedTripId
      const { userId } = req.body;

      logger.info(`🔍 Extracted tripId: ${tripId}`);
      logger.info(`🔍 Extracted userId: ${userId}`);

      // Validation
      if (!userId) {
        logger.warn(`❌ Missing userId in request body`);
        return res.status(400).json({
          success: false,
          message: 'userId is required',
          debug: {
            receivedBody: req.body,
            expectedField: 'userId'
          }
        });
      }

      if (!tripId) {
        logger.warn(`❌ Missing tripId in URL`);
        return res.status(400).json({
          success: false,
          message: 'tripId is required in URL',
          debug: {
            receivedParams: req.params,
            expectedFormat: '/api/v1/pooling-confirm/{tripId}/confirm'
          }
        });
      }

      logger.info(`✅ Validation passed, finding confirmed trip...`);
      
      // Find the confirmed trip by tripId first
      const ConfirmedTrip = require('../models/ConfirmedTrip');
      const confirmedTrip = await ConfirmedTrip.findOne({ tripId });

      if (!confirmedTrip) {
        logger.warn(`❌ No confirmed trip found for tripId: ${tripId}`);
        return res.status(404).json({
          success: false,
          message: 'Trip confirmation not found',
          tripId,
          hint: 'Trip confirmation may not have been initiated yet. Call /initiate first.'
        });
      }

      logger.info(`✅ Found confirmed trip, calling service...`);
      const result = await poolingConfirmService.confirmParticipation(confirmedTrip._id, userId);

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
   * GET /api/v1/pooling-confirm/trip/:tripId/status
   * Get complete trip details and confirmation status by tripId
   */
  async getTripConfirmationStatus(req, res) {
    try {
      const { tripId } = req.params;
      const { userId } = req.query;

      logger.info(`🔍 Getting complete trip details for tripId: ${tripId}, userId: ${userId}`);

      // Find confirmed trip by tripId
      const ConfirmedTrip = require('../models/ConfirmedTrip');
      const confirmedTrip = await ConfirmedTrip.findOne({ tripId });

      if (!confirmedTrip) {
        return res.status(404).json({
          success: false,
          message: 'No confirmation found for this trip',
          tripId,
          hint: 'Trip confirmation may not have been initiated yet. Call /initiate first.'
        });
      }

      // Check if user is a member (optional check - if userId provided)
      if (userId && !confirmedTrip.memberIds.includes(userId)) {
        return res.status(403).json({
          success: false,
          message: 'User is not a member of this trip'
        });
      }

      // Get user-specific confirmation if userId provided
      const userConfirmation = userId ? 
        confirmedTrip.memberConfirmations.find(mc => mc.userId === userId) : null;

      // Return complete trip details
      res.status(200).json({
        success: true,
        data: {
          // Basic Trip Information
          _id: confirmedTrip._id,
          confirmedTripId: confirmedTrip._id, // For backward compatibility
          groupId: confirmedTrip.groupId,
          tripId: confirmedTrip.tripId,
          tripName: confirmedTrip.tripName,
          groupName: confirmedTrip.groupName,
          
          // User and Member Information
          creatorUserId: confirmedTrip.creatorUserId,
          memberIds: confirmedTrip.memberIds,
          currentMemberCount: confirmedTrip.currentMemberCount,
          minMembers: confirmedTrip.minMembers,
          maxMembers: confirmedTrip.maxMembers,
          
          // Trip Status and Dates
          status: confirmedTrip.status,
          tripStartDate: confirmedTrip.tripStartDate,
          tripEndDate: confirmedTrip.tripEndDate,
          confirmationDeadline: confirmedTrip.confirmationDeadline,
          confirmedAt: confirmedTrip.confirmedAt,
          confirmedBy: confirmedTrip.confirmedBy,
          
          // Trip Details and Preferences
          preferences: confirmedTrip.preferences,
          tripDetails: confirmedTrip.tripDetails,
          
          // Payment Information
          paymentInfo: {
            totalAmount: confirmedTrip.paymentInfo.totalAmount,
            currency: confirmedTrip.paymentInfo.currency,
            pricePerPerson: confirmedTrip.paymentInfo.pricePerPerson,
            paymentDeadline: confirmedTrip.paymentInfo.paymentDeadline,
            memberPayments: confirmedTrip.paymentInfo.memberPayments
          },
          
          // Member Confirmations
          memberConfirmations: confirmedTrip.memberConfirmations,
          
          // Cancellation Information
          cancellationInfo: confirmedTrip.cancellationInfo,
          
          // Notifications and Actions History
          notificationsSent: confirmedTrip.notificationsSent,
          actions: confirmedTrip.actions,
          
          // Timestamps
          createdAt: confirmedTrip.createdAt,
          updatedAt: confirmedTrip.updatedAt,
          
          // User-specific information (if userId provided)
          ...(userId && {
            userConfirmed: userConfirmation?.confirmed || false,
            userConfirmedAt: userConfirmation?.confirmedAt,
            userPaymentStatus: userConfirmation?.paymentStatus,
            isCreator: confirmedTrip.creatorUserId === userId,
            userPayment: confirmedTrip.paymentInfo.memberPayments.find(mp => mp.userId === userId)
          })
        }
      });

    } catch (error) {
      logger.error('Error in getTripConfirmationStatus:', error);
      res.status(500).json({
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
   * POST /api/v1/pooling-confirm/:tripId/cancel
   * Cancel trip confirmation
   */
  async cancelConfirmation(req, res) {
    try {
      const { tripId } = req.params;
      const { userId, reason } = req.body;

      // Validation
      if (!userId) {
        return res.status(400).json({
          success: false,
          message: 'userId is required'
        });
      }

      if (!tripId) {
        return res.status(400).json({
          success: false,
          message: 'tripId is required in URL'
        });
      }

      // Find the confirmed trip by tripId first
      const ConfirmedTrip = require('../models/ConfirmedTrip');
      const confirmedTrip = await ConfirmedTrip.findOne({ tripId });

      if (!confirmedTrip) {
        return res.status(404).json({
          success: false,
          message: 'Trip confirmation not found',
          tripId
        });
      }

      const result = await poolingConfirmService.cancelConfirmation(confirmedTrip._id, userId, reason);

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
   * Get all confirmed trips for a user with complete details
   */
  async getUserConfirmedTrips(req, res) {
    try {
      const { userId } = req.params;
      const { status, page = 1, limit = 10 } = req.query;

      logger.info(`🔍 Getting confirmed trips for user: ${userId}`);
      logger.info(`📋 Query params - status: ${status}, page: ${page}, limit: ${limit}`);

      if (!userId) {
        return res.status(400).json({
          success: false,
          message: 'userId is required'
        });
      }

      // Build query
      const query = { memberIds: userId };
      
      // Handle comma-separated status values (e.g., "payment_pending,confirmed,completed")
      if (status) {
        const statusArray = status.split(',').map(s => s.trim()).filter(s => s.length > 0);
        logger.info(`📋 Status array: ${JSON.stringify(statusArray)}`);
        
        if (statusArray.length === 1) {
          query.status = statusArray[0];
        } else if (statusArray.length > 1) {
          query.status = { $in: statusArray };
        }
      }

      logger.info(`📋 Final query: ${JSON.stringify(query)}`);

      // Pagination
      const skip = (parseInt(page) - 1) * parseInt(limit);
      

      const ConfirmedTrip = require('../models/ConfirmedTrip');
      const trips = await ConfirmedTrip.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit));

      const total = await ConfirmedTrip.countDocuments(query);

      logger.info(`📋 Found ${trips.length} trips out of ${total} total for user ${userId}`);

      // MongoDB Atlas connection for initiated_trips
      const mongoose = require('mongoose');
      const initiatedConn = await mongoose.createConnection('mongodb+srv://2022cs056:dH4aTFn3IOerWlVZ@cluster0.9ccambx.mongodb.net/islandhop_trips?retryWrites=true&w=majority', {
        useNewUrlParser: true,
        useUnifiedTopology: true
      });
      const initiatedTripSchema = new mongoose.Schema({
        _id: String
      }, { strict: false, collection: 'initiated_trips' });
      const InitiatedTrip = initiatedConn.model('InitiatedTrip', initiatedTripSchema);

      // Fetch initiated trip data for each confirmed trip
      const tripsWithInitiatedData = await Promise.all(trips.map(async trip => {
        let initiatedTrip = null;
        try {
          // Try to find by _id as string
          initiatedTrip = await InitiatedTrip.findOne({ _id: trip.tripId }).lean();
          // If not found, try by tripId field
          if (!initiatedTrip) {
            initiatedTrip = await InitiatedTrip.findOne({ tripId: trip.tripId }).lean();
          }
        } catch (e) {
          logger.warn(`Could not fetch initiated trip for tripId ${trip.tripId}: ${e.message}`);
        }
        const userConfirmation = trip.memberConfirmations.find(mc => mc.userId === userId);
        return {
          // Basic Trip Information
          _id: trip._id,
          confirmedTripId: trip._id, // For backward compatibility
          groupId: trip.groupId,
          tripId: trip.tripId,
          tripName: trip.tripName,
          groupName: trip.groupName,

          // User and Member Information
          creatorUserId: trip.creatorUserId,
          memberIds: trip.memberIds,
          currentMemberCount: trip.currentMemberCount,
          minMembers: trip.minMembers,
          maxMembers: trip.maxMembers,

          // Trip Status and Dates
          status: trip.status,
          tripStartDate: trip.tripStartDate,
          tripEndDate: trip.tripEndDate,
          confirmationDeadline: trip.confirmationDeadline,
          confirmedAt: trip.confirmedAt,
          confirmedBy: trip.confirmedBy,

          // Trip Details and Preferences
          preferences: trip.preferences,
          tripDetails: trip.tripDetails,

          // Payment Information
          paymentInfo: {
            totalAmount: trip.paymentInfo.totalAmount,
            currency: trip.paymentInfo.currency,
            pricePerPerson: trip.paymentInfo.pricePerPerson,
            paymentDeadline: trip.paymentInfo.paymentDeadline,
            memberPayments: trip.paymentInfo.memberPayments
          },

          // Member Confirmations
          memberConfirmations: trip.memberConfirmations,

          // Cancellation Information
          cancellationInfo: trip.cancellationInfo,

          // Notifications and Actions History
          notificationsSent: trip.notificationsSent,
          actions: trip.actions,

          // Timestamps
          createdAt: trip.createdAt,
          updatedAt: trip.updatedAt,

          // User-specific information
          userConfirmed: userConfirmation?.confirmed || false,
          userConfirmedAt: userConfirmation?.confirmedAt,
          userPaymentStatus: userConfirmation?.paymentStatus,
          isCreator: trip.creatorUserId === userId,
          userPayment: trip.paymentInfo.memberPayments.find(mp => mp.userId === userId),

          // Legacy fields for backward compatibility
          memberCount: trip.currentMemberCount,
          paymentRequired: trip.paymentInfo.pricePerPerson > 0,
          pricePerPerson: trip.paymentInfo.pricePerPerson,

          // Initiated trip fields for frontend
          vehicleType: initiatedTrip?.vehicleType || null,
          driverNeeded: initiatedTrip?.driverNeeded ?? null,
          guideNeeded: initiatedTrip?.guideNeeded ?? null,
          initiatedTripCreatorUserId: initiatedTrip?.userId || null
        };
      }));

      // Close the initiated trip connection
      await initiatedConn.close();

      res.status(200).json({
        success: true,
        data: {
          trips: tripsWithInitiatedData,
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

  /**
   * GET /api/v1/pooling-confirm/debug/groups
   * Debug endpoint to list all available groups and trips
   */
  async debugGroups(req, res) {
    try {
      const result = await poolingConfirmService.debugGroups();
      res.status(200).json(result);
    } catch (error) {
      logger.error('Error in debugGroups:', error);
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  /**
   * GET /api/v1/pooling-confirm/debug/trip/:tripId
   * Debug endpoint to get complete trip details for testing
   */
  async debugTripDetails(req, res) {
    try {
      const { tripId } = req.params;
      
      logger.info(`🧪 DEBUG: Getting trip details for tripId: ${tripId}`);

      // Find confirmed trip by tripId
      const ConfirmedTrip = require('../models/ConfirmedTrip');
      const confirmedTrip = await ConfirmedTrip.findOne({ tripId });

      if (!confirmedTrip) {
        return res.status(404).json({
          success: false,
          message: 'No confirmed trip found',
          tripId,
          hint: 'Trip may not be confirmed yet or tripId is incorrect'
        });
      }

      // Return the raw document for debugging
      res.status(200).json({
        success: true,
        message: `Complete trip details for tripId: ${tripId}`,
        data: confirmedTrip.toJSON(),
        debug: {
          documentId: confirmedTrip._id,
          collection: 'confirmed_trips',
          database: 'islandhop_pooling_confirm'
        }
      });

    } catch (error) {
      logger.error('Error in debugTripDetails:', error);
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  /**
   * POST /api/v1/pooling-confirm/:tripId/complete-payment
   * Complete payment for a user in a specific trip
   */
  async completePayment(req, res) {
    try {
      const { tripId } = req.params;
      const { userId } = req.body;

      logger.info(`🔍 COMPLETE PAYMENT REQUEST:`);
      logger.info(`📋 Method: ${req.method}`);
      logger.info(`📋 URL: ${req.originalUrl}`);
      logger.info(`📋 TripId: ${tripId}`);
      logger.info(`📋 UserId: ${userId}`);

      // Validation
      if (!tripId) {
        return res.status(400).json({
          success: false,
          message: 'Trip ID is required'
        });
      }

      if (!userId) {
        return res.status(400).json({
          success: false,
          message: 'User ID is required'
        });
      }

      // Call service method
      const result = await poolingConfirmService.completePayment(tripId, userId);

      res.status(200).json({
        success: true,
        message: result.message,
        data: result.data
      });

    } catch (error) {
      logger.error('Error in completePayment:', error);
      
      // Determine HTTP status code based on specific error types
      let statusCode = 500; // Default internal server error
      
      if (error.message.includes('No confirmed trip found') || error.message.includes('not found')) {
        statusCode = 404; // Trip not found
      } else if (error.message.includes('not a member') || error.message.includes('Unauthorized')) {
        statusCode = 403; // User not authorized
      } else if (error.message.includes('No pending payment') || error.message.includes('already completed')) {
        statusCode = 409; // Conflict - payment already processed or not available
      } else if (error.message.includes('Failed to activate trip')) {
        statusCode = 502; // Bad Gateway - external service error
      }
      
      res.status(statusCode).json({
        success: false,
        message: error.message,
        errorType: statusCode === 404 ? 'TRIP_NOT_FOUND' :
                   statusCode === 403 ? 'UNAUTHORIZED' :
                   statusCode === 409 ? 'PAYMENT_CONFLICT' :
                   statusCode === 502 ? 'EXTERNAL_SERVICE_ERROR' : 'INTERNAL_ERROR'
      });
    }
  }
}

module.exports = new PoolingConfirmController();
