const ConfirmedTrip = require('../models/ConfirmedTrip');
  
const PaymentTransaction = require('../models/PaymentTransaction');
const logger = require('../config/logger');
const axios = require('axios');
const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');
const moment = require('moment');

/**
 * Pooling Confirmation Service
 * 
 * DATABASE ARCHITECTURE:
 * - Source: islandhop_pooling.groups (Java service database)
 * - Target: islandhop_pooling_confirm.confirmed_trips (Our Node.js service database)
 * 
 * WORKFLOW:
 * 1. Read group data from islandhop_pooling.groups using tripId
 * 2. Copy relevant data to islandhop_pooling_confirm.confirmed_trips
 * 3. Work with copied data for confirmation workflow and payments
 */

class PoolingConfirmService {
  constructor() {
    this.poolingServiceUrl = process.env.POOLING_SERVICE_URL || 'http://localhost:8086';
    this.paymentServiceUrl = process.env.PAYMENT_SERVICE_URL || 'http://localhost:8068';
    this.activeTripServiceUrl = process.env.ACTIVE_TRIP_SERVICE_URL || 'http://localhost:8070';
    this.emailServiceUrl = process.env.EMAIL_SERVICE_URL || 'http://localhost:8062';
  }

  /**
   * Check if user has any overlapping trips in the same time period
   * @param {string} userId - User ID to check
   * @param {Date} startDate - Trip start date
   * @param {Date} endDate - Trip end date
   * @param {string} excludeTripId - Trip ID to exclude from check (current trip)
   * @returns {Object} - { hasOverlap: boolean, overlappingTrips: [] }
   */
  async checkUserTripOverlap(userId, startDate, endDate, excludeTripId = null) {
    try {
      logger.info(`Checking trip overlap for user ${userId} between ${startDate} and ${endDate}`);

      const tripStartDate = new Date(startDate);
      const tripEndDate = new Date(endDate);

      // Find all confirmed trips where:
      // 1. User is a member
      // 2. Trip status is not cancelled
      // 3. Trip dates overlap with the requested dates
      // 4. Exclude the current trip if provided
      const query = {
        memberIds: userId,
        status: { 
          $nin: ['cancelled', 'completed'] 
        },
        $or: [
          {
            // Case 1: Existing trip starts during new trip period
            tripStartDate: {
              $gte: tripStartDate,
              $lte: tripEndDate
            }
          },
          {
            // Case 2: Existing trip ends during new trip period
            tripEndDate: {
              $gte: tripStartDate,
              $lte: tripEndDate
            }
          },
          {
            // Case 3: Existing trip completely encompasses new trip period
            tripStartDate: { $lte: tripStartDate },
            tripEndDate: { $gte: tripEndDate }
          }
        ]
      };

      // Exclude current trip if provided
      if (excludeTripId) {
        query.tripId = { $ne: excludeTripId };
      }

      const overlappingTrips = await ConfirmedTrip.find(query).select(
        'tripId tripName groupName tripStartDate tripEndDate status members'
      );

      if (overlappingTrips.length > 0) {
        logger.warn(`User ${userId} has ${overlappingTrips.length} overlapping trips`);
        return {
          hasOverlap: true,
          overlappingTrips: overlappingTrips.map(trip => ({
            tripId: trip.tripId,
            tripName: trip.tripName,
            groupName: trip.groupName,
            startDate: trip.tripStartDate,
            endDate: trip.tripEndDate,
            status: trip.status
          }))
        };
      }

      logger.info(`No overlapping trips found for user ${userId}`);
      return {
        hasOverlap: false,
        overlappingTrips: []
      };

    } catch (error) {
      logger.error(`Error checking trip overlap for user ${userId}:`, error);
      throw new Error(`Failed to check trip overlap: ${error.message}`);
    }
  }

  /**
   * Initiate trip confirmation process
   * Called by group creator to start confirmation
   */
  async initiateConfirmation(tripId, userId, confirmationData) {
    try {
      logger.info(`Initiating confirmation for tripId ${tripId} by user ${userId}`);

      // 1. Fetch group details from MongoDB groups collection using tripId
      const groupDetails = await this.fetchGroupDetails(tripId, userId);
      // Note: fetchGroupDetails now throws specific errors, so no null check needed

      // 2. For now, assume the first user in userIds is the creator
      // You can modify this logic based on your actual group structure
      if (groupDetails.userIds[0] !== userId) {
        logger.warn(`User ${userId} is not the group creator, but allowing initiation for demo purposes`);
        // Uncomment the line below if you want to enforce creator-only restriction
        // throw new Error('Only group creator can initiate confirmation');
      }

      // 3. Check if already confirmed
      const existingConfirmation = await ConfirmedTrip.findOne({ tripId });
      if (existingConfirmation) {
        throw new Error('Trip confirmation already initiated');
      }

      // 4. Validate minimum members
      const currentMembers = groupDetails.userIds || [];
      if (currentMembers.length < (confirmationData.minMembers || 2)) {
        throw new Error(`Insufficient members. Minimum ${confirmationData.minMembers || 2} required, current: ${currentMembers.length}`);
      }

      // 5. Check for overlapping trips for all members
      const tripStartDate = new Date(confirmationData.tripStartDate || groupDetails.startDate || Date.now());
      const tripEndDate = new Date(confirmationData.tripEndDate || groupDetails.endDate || Date.now());
      
      logger.info(`Checking for overlapping trips for ${currentMembers.length} members`);
      const membersWithOverlaps = [];
      
      for (const memberId of currentMembers) {
        const overlapCheck = await this.checkUserTripOverlap(
          memberId,
          tripStartDate,
          tripEndDate,
          tripId // Exclude current trip
        );
        
        if (overlapCheck.hasOverlap) {
          // Find member details
          const memberDetails = groupDetails.members.find(m => m.userId === memberId) || {};
          membersWithOverlaps.push({
            userId: memberId,
            userName: memberDetails.firstName && memberDetails.lastName 
              ? `${memberDetails.firstName} ${memberDetails.lastName}` 
              : memberDetails.email || memberId,
            email: memberDetails.email,
            overlappingTrips: overlapCheck.overlappingTrips
          });
        }
      }
      
      if (membersWithOverlaps.length > 0) {
        logger.warn(`Cannot initiate confirmation: ${membersWithOverlaps.length} members have overlapping trips`);
        throw new Error(
          `Cannot initiate trip confirmation. ${membersWithOverlaps.length} member(s) have overlapping trips: ` +
          membersWithOverlaps.map(m => `${m.userName || m.userId} (${m.overlappingTrips.length} overlap(s))`).join(', ') +
          '. Please resolve conflicts before proceeding.'
        );
      }
      
      logger.info(`No overlapping trips found for any members. Proceeding with confirmation.`);

      // 6. Calculate confirmation deadline (default 48 hours)
      const confirmationDeadline = moment().add(confirmationData.confirmationHours || 48, 'hours').toDate();
      
      // 7. Calculate payment deadlines and amounts
      const upfrontDeadline = moment().add(confirmationData.upfrontPaymentHours || 48, 'hours').toDate();
      const finalDeadline = moment(confirmationData.tripStartDate).subtract(confirmationData.finalPaymentDaysBefore || 7, 'days').toDate();
      
      const pricePerPerson = confirmationData.pricePerPerson || 0;
      const upfrontAmount = Math.round(pricePerPerson * 0.5); // 50%
      const finalAmount = pricePerPerson - upfrontAmount; // Remaining amount
      
      // 8. Create confirmed trip entry
      const confirmedTrip = new ConfirmedTrip({
        tripId, // Use the actual tripId from the frontend
        groupId: groupDetails._id, // Use the group's _id from MongoDB
        tripName: groupDetails.tripName || 'Untitled Trip',
        groupName: groupDetails.groupName || 'Travel Group',
        creatorUserId: groupDetails.userIds[0], // First user is considered creator
        memberIds: currentMembers,
        members: groupDetails.members || [], // Store full member details
        currentMemberCount: currentMembers.length,
        minMembers: confirmationData.minMembers || 2,
        maxMembers: confirmationData.maxMembers || groupDetails.maxGroupSize || 12,
        tripStartDate: new Date(confirmationData.tripStartDate || groupDetails.startDate || Date.now()),
        tripEndDate: new Date(confirmationData.tripEndDate || groupDetails.endDate || Date.now()),
        preferences: {
          activities: groupDetails.preferredActivities || [],
          destination: groupDetails.destination || 'Unknown'
        },
        tripDetails: confirmationData.tripDetails || {},
        confirmationDeadline,
        status: 'pending_confirmation',
        paymentInfo: {
          totalAmount: confirmationData.totalAmount || (groupDetails.pricePerPerson * currentMembers.length),
          pricePerPerson: confirmationData.pricePerPerson || groupDetails.pricePerPerson || 0,
          currency: confirmationData.currency || 'LKR',
          phases: {
            upfront: {
              percentage: 50,
              amount: upfrontAmount,
              deadline: upfrontDeadline,
              status: 'pending'
            },
            final: {
              percentage: 50,
              amount: finalAmount,
              deadline: finalDeadline,
              status: 'pending'
            }
          },
          memberPayments: currentMembers.map(memberId => {
            // Find the full member details from the members array
            const memberDetails = groupDetails.members.find(m => m.userId === memberId) || {};
            return {
              userId: memberId,
              userEmail: memberDetails.email || '',
              userName: memberDetails.firstName && memberDetails.lastName 
                ? `${memberDetails.firstName} ${memberDetails.lastName}` 
                : '',
              firstName: memberDetails.firstName || '',
              lastName: memberDetails.lastName || '',
              nationality: memberDetails.nationality || '',
              languages: memberDetails.languages || [],
              upfrontPayment: {
                amount: upfrontAmount,
                status: 'pending'
              },
              finalPayment: {
                amount: finalAmount,
                status: 'pending'
              },
              overallPaymentStatus: 'pending',
              totalPaid: 0
            };
          })
        },
        memberConfirmations: currentMembers.map(memberId => ({
          userId: memberId,
          confirmed: memberId === userId, // Creator auto-confirms
          confirmedAt: memberId === userId ? new Date() : null
        }))
      });

      // 9. Add initial action
      confirmedTrip.addAction(userId, 'INITIATE_CONFIRMATION', {
        memberCount: currentMembers.length,
        confirmationDeadline,
        paymentInfo: confirmedTrip.paymentInfo
      });

      await confirmedTrip.save();

      // 10. Send confirmation notifications to all members
      await this.sendConfirmationNotifications(confirmedTrip);

      logger.info(`Trip confirmation initiated successfully for tripId ${tripId}, groupId ${confirmedTrip.groupId}`);
      
      return {
        success: true,
        confirmedTripId: confirmedTrip._id,
        groupId: confirmedTrip.groupId,
        status: 'pending_confirmation',
        confirmationDeadline,
        memberCount: currentMembers.length,
        message: 'Trip confirmation initiated. Members will be notified.'
      };

    } catch (error) {
      logger.error(`Error initiating confirmation for tripId ${tripId}:`, error);
      throw error;
    }
  }

  /**
   * Member confirms their participation
   */
  async confirmParticipation(confirmedTripId, userId) {
    try {
      logger.info(`User ${userId} confirming participation for trip ${confirmedTripId}`);

      const confirmedTrip = await ConfirmedTrip.findById(confirmedTripId);
      if (!confirmedTrip) {
        throw new Error('Confirmed trip not found');
      }

      // Check if user is a member
      if (!confirmedTrip.memberIds.includes(userId)) {
        throw new Error('User is not a member of this trip');
      }

      // Check if already confirmed
      const memberConfirmation = confirmedTrip.memberConfirmations.find(mc => mc.userId === userId);
      if (memberConfirmation && memberConfirmation.confirmed) {
        throw new Error('User already confirmed participation');
      }

      // Check if deadline passed
      if (new Date() > confirmedTrip.confirmationDeadline) {
        throw new Error('Confirmation deadline has passed');
      }

      // Check for overlapping trips for this user
      logger.info(`Checking for overlapping trips for user ${userId}`);
      const overlapCheck = await this.checkUserTripOverlap(
        userId,
        confirmedTrip.tripStartDate,
        confirmedTrip.tripEndDate,
        confirmedTrip.tripId // Exclude current trip
      );
      
      if (overlapCheck.hasOverlap) {
        const memberDetails = confirmedTrip.members.find(m => m.userId === userId) || {};
        const userName = memberDetails.firstName && memberDetails.lastName 
          ? `${memberDetails.firstName} ${memberDetails.lastName}` 
          : memberDetails.email || userId;
        
        logger.warn(`User ${userId} has overlapping trips, cannot confirm participation`);
        
        const overlapDetails = overlapCheck.overlappingTrips.map(trip => 
          `"${trip.tripName}" (${new Date(trip.startDate).toLocaleDateString()} - ${new Date(trip.endDate).toLocaleDateString()})`
        ).join(', ');
        
        throw new Error(
          `Cannot confirm participation. You have ${overlapCheck.overlappingTrips.length} overlapping trip(s): ${overlapDetails}. ` +
          `Please cancel or modify conflicting trips before confirming this one.`
        );
      }
      
      logger.info(`No overlapping trips found for user ${userId}. Proceeding with confirmation.`);

      // Add confirmation
      confirmedTrip.addMemberConfirmation(userId);
      confirmedTrip.addAction(userId, 'CONFIRM_PARTICIPATION');

      await confirmedTrip.save();

      // Check if all members confirmed
      if (confirmedTrip.allMembersConfirmed) {
        await this.processFullConfirmation(confirmedTrip);
      }

      logger.info(`User ${userId} confirmed participation for trip ${confirmedTripId}`);

      return {
        success: true,
        confirmed: true,
        allMembersConfirmed: confirmedTrip.allMembersConfirmed,
        status: confirmedTrip.status
      };

    } catch (error) {
      logger.error(`Error confirming participation for trip ${confirmedTripId}:`, error);
      throw error;
    }
  }

  /**
   * Process when all members have confirmed
   */
  async processFullConfirmation(confirmedTrip) {
    try {
      logger.info(`Processing full confirmation for trip ${confirmedTrip._id}`);

      // Update status to confirmed
      confirmedTrip.status = 'confirmed';
      confirmedTrip.confirmedAt = new Date();
      confirmedTrip.confirmedBy = confirmedTrip.creatorUserId;

      confirmedTrip.addAction('SYSTEM', 'TRIP_FULLY_CONFIRMED', {
        confirmedMemberCount: confirmedTrip.memberConfirmations.filter(mc => mc.confirmed).length
      });

      await confirmedTrip.save();

      // Create active trip entry
      await this.createActiveTrip(confirmedTrip);

      // Send confirmation success notifications
      await this.sendTripConfirmedNotifications(confirmedTrip);

      // If payment required, initiate payment process
      if (confirmedTrip.paymentInfo.pricePerPerson > 0) {
        await this.initiatePaymentProcess(confirmedTrip);
      }

      logger.info(`Trip ${confirmedTrip._id} fully confirmed and active trip created`);

    } catch (error) {
      logger.error(`Error processing full confirmation for trip ${confirmedTrip._id}:`, error);
      throw error;
    }
  }

  /**
   * Create entry in active trips service
   */
  async createActiveTrip(confirmedTrip) {
    try {
      const activeTripData = {
        groupId: confirmedTrip.groupId,
        tripId: confirmedTrip.tripId,
        confirmedTripId: confirmedTrip._id.toString(),
        tripName: confirmedTrip.tripName,
        creatorUserId: confirmedTrip.creatorUserId,
        memberIds: confirmedTrip.memberIds,
        memberCount: confirmedTrip.currentMemberCount,
        startDate: confirmedTrip.tripStartDate,
        endDate: confirmedTrip.tripEndDate,
        status: 'confirmed',
        tripDetails: confirmedTrip.tripDetails,
        preferences: confirmedTrip.preferences
      };

      const response = await axios.post(`${this.activeTripServiceUrl}/api/trips`, activeTripData);
      
      confirmedTrip.addAction('SYSTEM', 'ACTIVE_TRIP_CREATED', {
        activeTripId: response.data.tripId
      });

      logger.info(`Active trip created for confirmed trip ${confirmedTrip._id}`);

    } catch (error) {
      logger.error(`Error creating active trip for ${confirmedTrip._id}:`, error);
      // Don't throw - this shouldn't block the confirmation process
    }
  }

  /**
   * Initiate payment process for confirmed trip
   */
  async initiatePaymentProcess(confirmedTrip) {
    try {
      logger.info(`Initiating payment process for trip ${confirmedTrip._id}`);

      confirmedTrip.status = 'payment_pending';
      
      // Create payment transactions for each member
      for (const memberId of confirmedTrip.memberIds) {
        const transaction = new PaymentTransaction({
          transactionId: uuidv4(),
          confirmedTripId: confirmedTrip._id,
          groupId: confirmedTrip.groupId,
          tripId: confirmedTrip.tripId,
          userId: memberId,
          userEmail: await this.getUserEmail(memberId),
          amount: confirmedTrip.paymentInfo.pricePerPerson,
          currency: confirmedTrip.paymentInfo.currency,
          paymentGateway: 'payhere',
          expiresAt: confirmedTrip.paymentInfo.paymentDeadline
        });

        await transaction.save();

        // Initialize payment info for member
        confirmedTrip.updatePaymentStatus(memberId, transaction.transactionId, 'pending', confirmedTrip.paymentInfo.pricePerPerson);
      }

      confirmedTrip.addAction('SYSTEM', 'PAYMENT_PROCESS_INITIATED', {
        memberCount: confirmedTrip.memberIds.length,
        pricePerPerson: confirmedTrip.paymentInfo.pricePerPerson
      });

      await confirmedTrip.save();

      // Send payment notifications
      await this.sendPaymentNotifications(confirmedTrip);

      logger.info(`Payment process initiated for trip ${confirmedTrip._id}`);

    } catch (error) {
      logger.error(`Error initiating payment process for trip ${confirmedTrip._id}:`, error);
      throw error;
    }
  }

  /**
   * Get trip confirmation status
   */
  async getConfirmationStatus(confirmedTripId, userId) {
    try {
      const confirmedTrip = await ConfirmedTrip.findById(confirmedTripId);
      if (!confirmedTrip) {
        throw new Error('Confirmed trip not found');
      }

      // Check if user is authorized to view
      if (!confirmedTrip.memberIds.includes(userId)) {
        throw new Error('Unauthorized to view this trip');
      }

      return {
        tripId: confirmedTrip.tripId,
        groupId: confirmedTrip.groupId,
        tripName: confirmedTrip.tripName,
        status: confirmedTrip.status,
        memberCount: confirmedTrip.currentMemberCount,
        minMembers: confirmedTrip.minMembers,
        hasEnoughMembers: confirmedTrip.hasEnoughMembers,
        allMembersConfirmed: confirmedTrip.allMembersConfirmed,
        confirmationDeadline: confirmedTrip.confirmationDeadline,
        memberConfirmations: confirmedTrip.memberConfirmations.map(mc => ({
          userId: mc.userId,
          confirmed: mc.confirmed,
          confirmedAt: mc.confirmedAt,
          paymentStatus: mc.paymentStatus
        })),
        paymentInfo: {
          required: confirmedTrip.paymentInfo.pricePerPerson > 0,
          pricePerPerson: confirmedTrip.paymentInfo.pricePerPerson,
          currency: confirmedTrip.paymentInfo.currency,
          paymentDeadline: confirmedTrip.paymentInfo.paymentDeadline,
          allMembersPaid: confirmedTrip.allMembersPaid
        },
        createdAt: confirmedTrip.createdAt,
        confirmedAt: confirmedTrip.confirmedAt
      };

    } catch (error) {
      logger.error(`Error getting confirmation status for trip ${confirmedTripId}:`, error);
      throw error;
    }
  }

  /**
   * Cancel trip confirmation
   */
  async cancelConfirmation(confirmedTripId, userId, reason) {
    try {
      logger.info(`Cancelling confirmation for trip ${confirmedTripId} by user ${userId}`);

      const confirmedTrip = await ConfirmedTrip.findById(confirmedTripId);
      if (!confirmedTrip) {
        throw new Error('Confirmed trip not found');
      }

      // Only creator can cancel
      if (confirmedTrip.creatorUserId !== userId) {
        throw new Error('Only trip creator can cancel confirmation');
      }

      // Cannot cancel if payments already processed
      if (confirmedTrip.status === 'payment_completed') {
        throw new Error('Cannot cancel trip with completed payments');
      }

      // Update status
      confirmedTrip.status = 'cancelled';
      confirmedTrip.cancellationInfo = {
        cancelledAt: new Date(),
        cancelledBy: userId,
        reason: reason || 'Cancelled by creator'
      };

      confirmedTrip.addAction(userId, 'CANCEL_CONFIRMATION', { reason });

      await confirmedTrip.save();

      // Process refunds if payments were made
      if (confirmedTrip.paymentInfo.memberPayments.some(mp => mp.status === 'paid')) {
        await this.processRefunds(confirmedTrip);
      }

      // Send cancellation notifications
      await this.sendCancellationNotifications(confirmedTrip);

      logger.info(`Trip confirmation cancelled for ${confirmedTripId}`);

      return {
        success: true,
        status: 'cancelled',
        message: 'Trip confirmation cancelled successfully'
      };

    } catch (error) {
      logger.error(`Error cancelling confirmation for trip ${confirmedTripId}:`, error);
      throw error;
    }
  }

  /**
   * Helper Methods
   */
  async fetchGroupDetails(tripId, userId) {
    try {
      // Connect to the islandhop_pooling database (Java service) to find groups
      const poolingDB = mongoose.connection.client.db('islandhop_pooling');
      const groupsCollection = poolingDB.collection('groups');
      
      // Debug logging
      logger.info(`🔍 Searching for tripId: ${tripId} in database: islandhop_pooling`);
      logger.info(`🔍 Collection: groups`);
      logger.info(`🔍 User: ${userId}`);
      
      // Search by tripId in the Java service database
      const group = await groupsCollection.findOne({ tripId: tripId });
      
      // Debug what we found
      if (group) {
        logger.info(`✅ Found group in islandhop_pooling: ${group.groupName}`);
        logger.info(`📋 Group members: ${group.userIds}`);
        logger.info(`📋 Creator: ${group.creatorUserId}`);
      } else {
        logger.warn(`❌ No group found in islandhop_pooling database`);
        // Check first few documents to see the structure
        const sampleDocs = await groupsCollection.find({}).limit(3).toArray();
        logger.info(`📋 Sample documents: ${JSON.stringify(sampleDocs.map(doc => ({_id: doc._id, tripId: doc.tripId, groupName: doc.groupName})), null, 2)}`);
      }
      
      // First check: Does the trip exist in the pooling database?
      if (!group) {
        logger.warn(`Trip not found for tripId: ${tripId} in islandhop_pooling database`);
        throw new Error(`Trip with ID ${tripId} does not exist`);
      }

      // Second check: Is user authorized (part of the group)?
      if (!group.userIds || !group.userIds.includes(userId)) {
        logger.warn(`User ${userId} is not authorized for tripId: ${tripId}. Group members: ${group.userIds}`);
        throw new Error(`User ${userId} is not a member of this trip group`);
      }

      logger.info(`Retrieved group details for tripId: ${tripId}, group: ${group.groupName}`);
      return {
        _id: group._id,
        tripId: group.tripId,
        groupName: group.groupName,
        userIds: group.userIds,
        members: group.members || [], // Include full member details
        tripName: group.tripName || `Trip ${group.tripId}`,
        destination: group.destination || 'Unknown',
        startDate: group.startDate,
        endDate: group.endDate,
        maxGroupSize: group.maxGroupSize || group.maxParticipants || group.userIds.length,
        pricePerPerson: group.pricePerPerson || 0,
        status: group.status || 'active',
        preferredActivities: group.preferredActivities || []
      };
    } catch (error) {
      // Re-throw the specific error if it's one of our custom ones
      if (error.message.includes('does not exist') || error.message.includes('not a member')) {
        throw error;
      }
      // Handle unexpected errors
      logger.error(`Unexpected error fetching group details for tripId ${tripId}:`, error.message);
      throw new Error(`Database error while fetching trip details: ${error.message}`);
    }
  }

  async getUserEmail(userId) {
    try {
      // This would integrate with your user service
      // For now, return a placeholder
      return `user${userId}@example.com`;
    } catch (error) {
      logger.error(`Error getting user email for ${userId}:`, error.message);
      return `user${userId}@example.com`;
    }
  }

  async sendConfirmationNotifications(confirmedTrip) {
    try {
      const notification = {
        type: 'confirmation_request',
        tripName: confirmedTrip.tripName,
        deadline: confirmedTrip.confirmationDeadline,
        memberIds: confirmedTrip.memberIds.filter(id => id !== confirmedTrip.creatorUserId)
      };

      confirmedTrip.notificationsSent.push({
        type: 'confirmation_request',
        sentAt: new Date(),
        sentTo: notification.memberIds,
        details: notification
      });

      logger.info(`Confirmation notifications sent for trip ${confirmedTrip._id}`);
    } catch (error) {
      logger.error(`Error sending confirmation notifications:`, error);
    }
  }

  async sendTripConfirmedNotifications(confirmedTrip) {
    try {
      const notification = {
        type: 'trip_confirmed',
        tripName: confirmedTrip.tripName,
        startDate: confirmedTrip.tripStartDate,
        memberIds: confirmedTrip.memberIds
      };

      confirmedTrip.notificationsSent.push({
        type: 'trip_confirmed',
        sentAt: new Date(),
        sentTo: notification.memberIds,
        details: notification
      });

      logger.info(`Trip confirmed notifications sent for trip ${confirmedTrip._id}`);
    } catch (error) {
      logger.error(`Error sending trip confirmed notifications:`, error);
    }
  }

  async sendPaymentNotifications(confirmedTrip) {
    try {
      const notification = {
        type: 'payment_reminder',
        tripName: confirmedTrip.tripName,
        amount: confirmedTrip.paymentInfo.pricePerPerson,
        deadline: confirmedTrip.paymentInfo.paymentDeadline,
        memberIds: confirmedTrip.memberIds
      };

      confirmedTrip.notificationsSent.push({
        type: 'payment_reminder',
        sentAt: new Date(),
        sentTo: notification.memberIds,
        details: notification
      });

      logger.info(`Payment notifications sent for trip ${confirmedTrip._id}`);
    } catch (error) {
      logger.error(`Error sending payment notifications:`, error);
    }
  }

  async sendCancellationNotifications(confirmedTrip) {
    try {
      const notification = {
        type: 'trip_cancelled',
        tripName: confirmedTrip.tripName,
        reason: confirmedTrip.cancellationInfo.reason,
        memberIds: confirmedTrip.memberIds
      };

      confirmedTrip.notificationsSent.push({
        type: 'trip_cancelled',
        sentAt: new Date(),
        sentTo: notification.memberIds,
        details: notification
      });

      logger.info(`Cancellation notifications sent for trip ${confirmedTrip._id}`);
    } catch (error) {
      logger.error(`Error sending cancellation notifications:`, error);
    }
  }

  async processRefunds(confirmedTrip) {
    try {
      logger.info(`Processing refunds for cancelled trip ${confirmedTrip._id}`);
      
      for (const memberPayment of confirmedTrip.paymentInfo.memberPayments) {
        if (memberPayment.status === 'paid') {
          // Process refund through payment gateway
          const transaction = await PaymentTransaction.findOne({
            confirmedTripId: confirmedTrip._id,
            userId: memberPayment.userId,
            status: 'completed'
          });

          if (transaction) {
            transaction.initiateRefund(memberPayment.amount, 'Trip cancelled');
            await transaction.save();
          }
        }
      }

      confirmedTrip.cancellationInfo.refundStatus = 'pending';
      await confirmedTrip.save();

      logger.info(`Refunds initiated for trip ${confirmedTrip._id}`);
    } catch (error) {
      logger.error(`Error processing refunds for trip ${confirmedTrip._id}:`, error);
    }
  }

  /**
   * Get comprehensive trip details with member payment information
   * This endpoint provides all trip details including payment status for each member
   */
  async getComprehensiveTripDetails(confirmedTripId, requestingUserId) {
    try {
      logger.info(`Getting comprehensive trip details for ${confirmedTripId} by user ${requestingUserId}`);

      const confirmedTrip = await ConfirmedTrip.findById(confirmedTripId);
      if (!confirmedTrip) {
        throw new Error('Confirmed trip not found');
      }

      // Check if user is authorized to view (member or creator)
      if (!confirmedTrip.memberIds.includes(requestingUserId)) {
        throw new Error('Unauthorized to view this trip');
      }

      // Get detailed user information for all members
      const memberDetails = await Promise.all(
        confirmedTrip.memberIds.map(async (memberId) => {
          const userEmail = await this.getUserEmail(memberId);
          const userName = await this.getUserName(memberId);
          
          // Find member's payment info
          const memberPayment = confirmedTrip.paymentInfo.memberPayments.find(mp => mp.userId === memberId);
          const memberConfirmation = confirmedTrip.memberConfirmations.find(mc => mc.userId === memberId);
          
          return {
            userId: memberId,
            userEmail,
            userName,
            isCreator: confirmedTrip.creatorUserId === memberId,
            
            // Confirmation Status
            hasConfirmed: memberConfirmation ? memberConfirmation.confirmed : false,
            confirmedAt: memberConfirmation ? memberConfirmation.confirmedAt : null,
            
            // Payment Status
            paymentStatus: {
              overall: memberPayment ? memberPayment.overallPaymentStatus : 'pending',
              totalPaid: memberPayment ? memberPayment.totalPaid : 0,
              totalDue: confirmedTrip.paymentInfo.pricePerPerson,
              
              upfront: {
                amount: memberPayment ? memberPayment.upfrontPayment.amount : 0,
                status: memberPayment ? memberPayment.upfrontPayment.status : 'pending',
                paidAt: memberPayment ? memberPayment.upfrontPayment.paidAt : null,
                paymentId: memberPayment ? memberPayment.upfrontPayment.paymentId : null
              },
              
              final: {
                amount: memberPayment ? memberPayment.finalPayment.amount : 0,
                status: memberPayment ? memberPayment.finalPayment.status : 'pending',
                paidAt: memberPayment ? memberPayment.finalPayment.paidAt : null,
                paymentId: memberPayment ? memberPayment.finalPayment.paymentId : null
              }
            }
          };
        })
      );

      // Calculate days until trip
      const daysUntilTrip = moment(confirmedTrip.tripStartDate).diff(moment(), 'days');
      const daysUntilFinalPayment = moment(confirmedTrip.paymentInfo.phases.final.deadline).diff(moment(), 'days');

      // Payment statistics
      const paymentStats = {
        upfront: {
          paid: memberDetails.filter(m => m.paymentStatus.upfront.status === 'paid').length,
          pending: memberDetails.filter(m => m.paymentStatus.upfront.status === 'pending').length,
          failed: memberDetails.filter(m => m.paymentStatus.upfront.status === 'failed').length,
          totalCollected: memberDetails.reduce((sum, m) => 
            sum + (m.paymentStatus.upfront.status === 'paid' ? m.paymentStatus.upfront.amount : 0), 0
          )
        },
        final: {
          paid: memberDetails.filter(m => m.paymentStatus.final.status === 'paid').length,
          pending: memberDetails.filter(m => m.paymentStatus.final.status === 'pending').length,
          failed: memberDetails.filter(m => m.paymentStatus.final.status === 'failed').length,
          totalCollected: memberDetails.reduce((sum, m) => 
            sum + (m.paymentStatus.final.status === 'paid' ? m.paymentStatus.final.amount : 0), 0
          )
        },
        overall: {
          fullyPaid: memberDetails.filter(m => m.paymentStatus.overall === 'completed').length,
          partiallyPaid: memberDetails.filter(m => m.paymentStatus.overall === 'partial').length,
          notPaid: memberDetails.filter(m => m.paymentStatus.overall === 'pending').length,
          totalExpected: confirmedTrip.paymentInfo.pricePerPerson * confirmedTrip.currentMemberCount,
          totalCollected: memberDetails.reduce((sum, m) => sum + m.paymentStatus.totalPaid, 0)
        }
      };

      // Trip timeline and deadlines
      const timeline = {
        confirmationDeadline: confirmedTrip.confirmationDeadline,
        upfrontPaymentDeadline: confirmedTrip.paymentInfo.phases.upfront.deadline,
        finalPaymentDeadline: confirmedTrip.paymentInfo.phases.final.deadline,
        tripStartDate: confirmedTrip.tripStartDate,
        tripEndDate: confirmedTrip.tripEndDate,
        
        // Time remaining
        daysUntilTrip,
        daysUntilFinalPayment,
        
        // Status indicators
        isConfirmationExpired: new Date() > confirmedTrip.confirmationDeadline,
        isUpfrontPaymentExpired: new Date() > confirmedTrip.paymentInfo.phases.upfront.deadline,
        isFinalPaymentExpired: new Date() > confirmedTrip.paymentInfo.phases.final.deadline,
        isTripStarted: new Date() > confirmedTrip.tripStartDate
      };

      return {
        // Basic Trip Information
        confirmedTripId: confirmedTrip._id,
        groupId: confirmedTrip.groupId,
        tripId: confirmedTrip.tripId,
        tripName: confirmedTrip.tripName,
        groupName: confirmedTrip.groupName,
        status: confirmedTrip.status,
        
        // Trip Details
        tripDetails: confirmedTrip.tripDetails,
        preferences: confirmedTrip.preferences,
        
        // Member Information
        members: memberDetails,
        memberCount: confirmedTrip.currentMemberCount,
        minMembers: confirmedTrip.minMembers,
        maxMembers: confirmedTrip.maxMembers,
        
        // Creator Information
        creator: {
          userId: confirmedTrip.creatorUserId,
          userName: await this.getUserName(confirmedTrip.creatorUserId),
          userEmail: await this.getUserEmail(confirmedTrip.creatorUserId)
        },
        
        // Payment Information
        paymentInfo: {
          currency: confirmedTrip.paymentInfo.currency,
          pricePerPerson: confirmedTrip.paymentInfo.pricePerPerson,
          phases: confirmedTrip.paymentInfo.phases,
          statistics: paymentStats
        },
        
        // Timeline and Deadlines
        timeline,
        
        // Status Flags
        flags: {
          allMembersConfirmed: confirmedTrip.allMembersConfirmed,
          allUpfrontPaid: confirmedTrip.allMembersUpfrontPaid,
          allFinalPaid: confirmedTrip.allMembersFinalPaid,
          hasEnoughMembers: confirmedTrip.hasEnoughMembers,
          canStartTrip: confirmedTrip.allMembersConfirmed && confirmedTrip.allMembersUpfrontPaid,
          isReadyForFinalPayment: daysUntilFinalPayment <= 14 && confirmedTrip.allMembersUpfrontPaid
        },
        
        // Audit Information
        createdAt: confirmedTrip.createdAt,
        updatedAt: confirmedTrip.updatedAt,
        confirmedAt: confirmedTrip.confirmedAt,
        recentActions: confirmedTrip.actions.slice(-10).reverse() // Last 10 actions
      };

    } catch (error) {
      logger.error(`Error getting comprehensive trip details for ${confirmedTripId}:`, error);
      throw error;
    }
  }

  /**
   * Complete upfront payment (initial 50%) for a user in a specific trip
   */
  async completePayment(tripId, userId) {
    try {
      logger.info(`Completing UPFRONT payment for user ${userId} in trip ${tripId}`);

      // Try to find confirmed trip by tripId (UUID) or by _id (MongoDB ObjectId)
      let confirmedTrip = await ConfirmedTrip.findOne({ tripId });
      
      // If not found by tripId, try by MongoDB _id (in case confirmedTripId was passed)
      if (!confirmedTrip) {
        logger.info(`Trip not found by tripId, trying as confirmedTripId (MongoDB ObjectId)...`);
        confirmedTrip = await ConfirmedTrip.findById(tripId);
      }
      
      if (!confirmedTrip) {
        throw new Error(`No confirmed trip found for tripId or confirmedTripId: ${tripId}`);
      }
      
      logger.info(`✅ Found confirmed trip: ${confirmedTrip._id} (UUID: ${confirmedTrip.tripId})`);

      // Check if user is a member of this trip
      if (!confirmedTrip.memberIds.includes(userId)) {
        throw new Error(`User ${userId} is not a member of trip ${tripId}`);
      }

      // Find member payment info
      const memberPayment = confirmedTrip.paymentInfo.memberPayments.find(mp => mp.userId === userId);
      if (!memberPayment) {
        throw new Error(`No payment info found for user ${userId} in trip ${tripId}`);
      }

      // Check if upfront payment is already completed
      if (memberPayment.upfrontPayment.status === 'paid') {
        throw new Error(`Upfront payment already completed for user ${userId}`);
      }

      // Get upfront payment amount
      const upfrontAmount = confirmedTrip.paymentInfo.phases.upfront.amount;
      const paymentId = `upfront_${Date.now()}_${userId.substring(0, 8)}`;

      // Update upfront payment status
      confirmedTrip.updatePaymentStatus(userId, 'upfront', paymentId, 'paid', upfrontAmount, {
        completedAt: new Date(),
        method: 'manual_completion',
        gateway: 'payhere'
      });
      
      // Add action log
      confirmedTrip.addAction(userId, 'UPFRONT_PAYMENT_COMPLETED', {
        phase: 'upfront',
        amount: upfrontAmount,
        paymentId: paymentId
      });

      await confirmedTrip.save();

      // Check if all members have completed upfront payment (for logging only, don't activate)
      const allUpfrontPaymentsCompleted = confirmedTrip.paymentInfo.memberPayments.every(
        mp => mp.upfrontPayment.status === 'paid'
      );
      
      if (allUpfrontPaymentsCompleted) {
        logger.info(`✅ All upfront payments completed for trip ${tripId}`);
        
        // Update trip status to upfront_payment_completed
        confirmedTrip.status = 'upfront_payment_completed';
        confirmedTrip.addAction('SYSTEM', 'ALL_UPFRONT_PAYMENTS_COMPLETED', {
          memberCount: confirmedTrip.memberIds.length,
          totalAmount: upfrontAmount * confirmedTrip.memberIds.length
        });
        await confirmedTrip.save();
        
        logger.info(`📧 Final payment still required from all members`);
      }

      logger.info(`✅ Upfront payment completed for user ${userId}`);

      return {
        success: true,
        message: 'Upfront payment (50%) completed successfully',
        data: {
          tripId: confirmedTrip.tripId,
          confirmedTripId: confirmedTrip._id,
          userId,
          phase: 'upfront',
          paymentId: paymentId,
          amount: upfrontAmount,
          upfrontPaymentCompleted: true,
          allUpfrontPaymentsCompleted,
          finalPaymentAmount: confirmedTrip.paymentInfo.phases.final.amount,
          finalPaymentDeadline: confirmedTrip.paymentInfo.phases.final.deadline,
          overallPaymentStatus: memberPayment.overallPaymentStatus
        }
      };

    } catch (error) {
      logger.error(`Error completing upfront payment for user ${userId} in trip ${tripId}:`, error);
      throw error;
    }
  }

  /**
   * Complete final payment (remaining 50%) for a user in a specific trip
   */
  async completeFinalPayment(tripId, userId) {
    try {
      logger.info(`Completing FINAL payment for user ${userId} in trip ${tripId}`);

      // Try to find confirmed trip by tripId (UUID) or by _id (MongoDB ObjectId)
      let confirmedTrip = await ConfirmedTrip.findOne({ tripId });
      
      // If not found by tripId, try by MongoDB _id (in case confirmedTripId was passed)
      if (!confirmedTrip) {
        logger.info(`Trip not found by tripId, trying as confirmedTripId (MongoDB ObjectId)...`);
        confirmedTrip = await ConfirmedTrip.findById(tripId);
      }
      
      if (!confirmedTrip) {
        throw new Error(`No confirmed trip found for tripId or confirmedTripId: ${tripId}`);
      }
      
      logger.info(`✅ Found confirmed trip: ${confirmedTrip._id} (UUID: ${confirmedTrip.tripId})`);

      // Check if user is a member of this trip
      if (!confirmedTrip.memberIds.includes(userId)) {
        throw new Error(`User ${userId} is not a member of trip ${tripId}`);
      }

      // Find member payment info
      const memberPayment = confirmedTrip.paymentInfo.memberPayments.find(mp => mp.userId === userId);
      if (!memberPayment) {
        throw new Error(`No payment info found for user ${userId} in trip ${tripId}`);
      }

      // Check if upfront payment is completed first
      if (memberPayment.upfrontPayment.status !== 'paid') {
        throw new Error(`Upfront payment must be completed before final payment for user ${userId}`);
      }

      // Check if final payment is already completed
      if (memberPayment.finalPayment.status === 'paid') {
        throw new Error(`Final payment already completed for user ${userId}`);
      }

      // Get final payment amount
      const finalAmount = confirmedTrip.paymentInfo.phases.final.amount;
      const paymentId = `final_${Date.now()}_${userId.substring(0, 8)}`;

      // Update final payment status
      confirmedTrip.updatePaymentStatus(userId, 'final', paymentId, 'paid', finalAmount, {
        completedAt: new Date(),
        method: 'manual_completion',
        gateway: 'payhere'
      });
      
      // Add action log
      confirmedTrip.addAction(userId, 'FINAL_PAYMENT_COMPLETED', {
        phase: 'final',
        amount: finalAmount,
        paymentId: paymentId
      });

      await confirmedTrip.save();

      // Check if all members have completed both payments (for logging only, don't activate here)
      const allPaymentsCompleted = confirmedTrip.paymentInfo.memberPayments.every(
        mp => mp.upfrontPayment.status === 'paid' && mp.finalPayment.status === 'paid'
      );
      
      if (allPaymentsCompleted) {
        logger.info(`✅ All payments (upfront + final) completed for trip ${tripId}.`);
        logger.warn(`⚠️ Trip activation should be triggered via completeFullPayment endpoint, not individual payment completion.`);
        
        // Update trip status to payment_completed
        confirmedTrip.status = 'payment_completed';
        confirmedTrip.addAction('SYSTEM', 'ALL_PAYMENTS_COMPLETED', {
          memberCount: confirmedTrip.memberIds.length,
          totalAmount: confirmedTrip.paymentInfo.pricePerPerson * confirmedTrip.memberIds.length
        });
        await confirmedTrip.save();
        
        // DON'T activate trip here - let completeFullPayment handle it
        logger.info(`ℹ️ Trip activation deferred to completeFullPayment workflow`);
      }

      logger.info(`✅ Final payment completed for user ${userId}`);

      return {
        success: true,
        message: 'Final payment (50%) completed successfully. Trip is now fully paid!',
        data: {
          tripId: confirmedTrip.tripId,
          confirmedTripId: confirmedTrip._id,
          userId,
          phase: 'final',
          paymentId: paymentId,
          amount: finalAmount,
          finalPaymentCompleted: true,
          allPaymentsCompleted,
          totalPaid: memberPayment.upfrontPayment.amount + finalAmount,
          overallPaymentStatus: memberPayment.overallPaymentStatus
        }
      };

    } catch (error) {
      logger.error(`Error completing final payment for user ${userId} in trip ${tripId}:`, error);
      throw error;
    }
  }

  /**
   * Complete BOTH upfront and final payments atomically for a user
   * This prevents race conditions where trip activation happens between payments
   */
  async completeFullPayment(tripId, userId) {
    try {
      logger.info(`🔥 ATOMIC FULL PAYMENT for user ${userId} in trip ${tripId}`);

      // Try to find confirmed trip by tripId (UUID) or by _id (MongoDB ObjectId)
      let confirmedTrip = await ConfirmedTrip.findOne({ tripId });
      
      if (!confirmedTrip) {
        logger.info(`Trip not found by tripId, trying as confirmedTripId (MongoDB ObjectId)...`);
        confirmedTrip = await ConfirmedTrip.findById(tripId);
      }
      
      if (!confirmedTrip) {
        throw new Error(`No confirmed trip found for tripId or confirmedTripId: ${tripId}`);
      }
      
      logger.info(`✅ Found confirmed trip: ${confirmedTrip._id} (UUID: ${confirmedTrip.tripId})`);

      // Check if user is a member
      if (!confirmedTrip.memberIds.includes(userId)) {
        throw new Error(`User ${userId} is not a member of trip ${tripId}`);
      }

      // Find member payment info
      const memberPayment = confirmedTrip.paymentInfo.memberPayments.find(mp => mp.userId === userId);
      if (!memberPayment) {
        throw new Error(`No payment info found for user ${userId} in trip ${tripId}`);
      }

      // Get member details
      const memberDetails = confirmedTrip.members.find(m => m.userId === userId) || {};

      // Check if both payments are already completed
      if (memberPayment.upfrontPayment.status === 'paid' && memberPayment.finalPayment.status === 'paid') {
        throw new Error(`Both payments already completed for user ${userId}`);
      }

      // Get payment amounts
      const upfrontAmount = confirmedTrip.paymentInfo.phases.upfront.amount;
      const finalAmount = confirmedTrip.paymentInfo.phases.final.amount;
      
      const upfrontPaymentId = `upfront_${Date.now()}_${userId.substring(0, 8)}`;
      const finalPaymentId = `final_${Date.now()}_${userId.substring(0, 8)}`;

      // Update UPFRONT payment status (if not already paid)
      if (memberPayment.upfrontPayment.status !== 'paid') {
        confirmedTrip.updatePaymentStatus(userId, 'upfront', upfrontPaymentId, 'paid', upfrontAmount, {
          completedAt: new Date(),
          method: 'manual_completion',
          gateway: 'payhere'
        });
        
        confirmedTrip.addAction(userId, 'UPFRONT_PAYMENT_COMPLETED', {
          phase: 'upfront',
          amount: upfrontAmount,
          paymentId: upfrontPaymentId
        });
        
        logger.info(`✅ Upfront payment completed for user ${userId}`);
      } else {
        logger.info(`ℹ️ Upfront payment already completed for user ${userId}`);
      }

      // Update FINAL payment status (if not already paid)
      if (memberPayment.finalPayment.status !== 'paid') {
        confirmedTrip.updatePaymentStatus(userId, 'final', finalPaymentId, 'paid', finalAmount, {
          completedAt: new Date(),
          method: 'manual_completion',
          gateway: 'payhere'
        });
        
        confirmedTrip.addAction(userId, 'FINAL_PAYMENT_COMPLETED', {
          phase: 'final',
          amount: finalAmount,
          paymentId: finalPaymentId
        });
        
        logger.info(`✅ Final payment completed for user ${userId}`);
      } else {
        logger.info(`ℹ️ Final payment already completed for user ${userId}`);
      }

      // Save changes ONCE
      await confirmedTrip.save();

      // NOW check if all members have completed both payments
      const allPaymentsCompleted = confirmedTrip.paymentInfo.memberPayments.every(
        mp => mp.upfrontPayment.status === 'paid' && mp.finalPayment.status === 'paid'
      );
      
      let tripActivated = false;
      
      if (allPaymentsCompleted) {
        logger.info(`✅ All payments (upfront + final) completed for trip ${tripId}. Activating trip.`);
        
        // Update trip status to payment_completed
        confirmedTrip.status = 'payment_completed';
        confirmedTrip.addAction('SYSTEM', 'ALL_PAYMENTS_COMPLETED', {
          memberCount: confirmedTrip.memberIds.length,
          totalAmount: confirmedTrip.paymentInfo.pricePerPerson * confirmedTrip.memberIds.length
        });
        await confirmedTrip.save();
        
        // Send activation request to active-trip service
        try {
          await this.activateTrip(confirmedTrip.tripId);
          tripActivated = true;
        } catch (activationError) {
          logger.error(`Failed to activate trip, but payments completed:`, activationError);
          // Don't throw error - payments are still completed
        }
      }

      logger.info(`✅ FULL PAYMENT completed for user ${userId}`);

      // Return comprehensive response with member details
      return {
        success: true,
        message: 'Full payment (upfront + final) completed successfully',
        data: {
          tripId: confirmedTrip.tripId,
          tripName: confirmedTrip.tripName,
          groupName: confirmedTrip.groupName,
          member: {
            userId: userId,
            email: memberDetails.email || '',
            firstName: memberDetails.firstName || '',
            lastName: memberDetails.lastName || '',
            fullName: memberDetails.firstName && memberDetails.lastName 
              ? `${memberDetails.firstName} ${memberDetails.lastName}` 
              : memberDetails.email || userId,
            nationality: memberDetails.nationality || '',
            languages: memberDetails.languages || []
          },
          payment: {
            upfrontPayment: {
              amount: upfrontAmount,
              status: 'paid',
              paidAt: memberPayment.upfrontPayment.paidAt || new Date()
            },
            finalPayment: {
              amount: finalAmount,
              status: 'paid',
              paidAt: memberPayment.finalPayment.paidAt || new Date()
            },
            totalAmount: upfrontAmount + finalAmount,
            currency: confirmedTrip.paymentInfo.currency,
            overallPaymentStatus: 'completed'
          },
          allPaymentsCompleted,
          tripActivated
        }
      };

    } catch (error) {
      logger.error(`Error completing full payment for user ${userId} in trip ${tripId}:`, error);
      throw error;
    }
  }

  /**
   * Check if all payments for a trip are completed
   */
  async checkAllPaymentsCompleted(confirmedTripId) {
    try {
      const totalTransactions = await PaymentTransaction.countDocuments({
        confirmedTripId: confirmedTripId
      });

      const completedTransactions = await PaymentTransaction.countDocuments({
        confirmedTripId: confirmedTripId,
        status: 'completed'
      });

      return totalTransactions > 0 && totalTransactions === completedTransactions;
    } catch (error) {
      logger.error(`Error checking payment completion status:`, error);
      throw error;
    }
  }

  /**
   * Activate trip by sending request to active-trip service
   */
  async activateTrip(tripId) {
    try {
      const activationUrl = 'http://localhost:5006/api/new_activate_trip';
      
      const response = await axios.post(activationUrl, {
        tripId: tripId
      }, {
        headers: {
          'Content-Type': 'application/json'
        },
        timeout: 10000 // 10 second timeout
      });

      logger.info(`Trip ${tripId} activated successfully:`, response.data);
      return response.data;

    } catch (error) {
      logger.error(`Error activating trip ${tripId}:`, error.message);
      
      if (error.response) {
        logger.error(`Activation service response:`, error.response.data);
        throw new Error(`Failed to activate trip: ${error.response.status} - ${error.response.data?.message || 'Unknown error'}`);
      } else if (error.request) {
        throw new Error(`Failed to activate trip: No response from activation service`);
      } else {
        throw new Error(`Failed to activate trip: ${error.message}`);
      }
    }
  }

  async getUserName(userId) {
    try {
      // This would integrate with your user service to get user name
      return `User_${userId.substring(0, 8)}`;
    } catch (error) {
      logger.error(`Error getting user name for ${userId}:`, error.message);
      return `User_${userId.substring(0, 8)}`;
    }
  }
}

module.exports = new PoolingConfirmService();
