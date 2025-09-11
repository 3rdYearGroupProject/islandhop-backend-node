const ConfirmedTrip = require('../models/Confi      // 6. Calculate payment deadlines and amounts
      const upfrontDeadline = moment().add(confirmationData.upfrontPaymentHours || 48, 'hours').toDate();
      const finalDeadline = moment(confirmationData.tripStartDate).subtract(confirmationData.finalPaymentDaysBefore || 7, 'days').toDate();
      
      const pricePerPerson = confirmationData.pricePerPerson || 0;
      const upfrontAmount = Math.round(pricePerPerson * 0.5); // 50%
      const finalAmount = pricePerPerson - upfrontAmount; // Remaining amountedTrip');
const PaymentTransaction = require('../models/PaymentTransaction');
const logger = require('../config/logger');
const axios = require('axios');
const { v4: uuidv4 } = require('uuid');
const moment = require('moment');

class PoolingConfirmService {
  constructor() {
    this.poolingServiceUrl = process.env.POOLING_SERVICE_URL || 'http://localhost:8086';
    this.paymentServiceUrl = process.env.PAYMENT_SERVICE_URL || 'http://localhost:8068';
    this.activeTripServiceUrl = process.env.ACTIVE_TRIP_SERVICE_URL || 'http://localhost:8070';
    this.emailServiceUrl = process.env.EMAIL_SERVICE_URL || 'http://localhost:8062';
  }

  /**
   * Initiate trip confirmation process
   * Called by group creator to start confirmation
   */
  async initiateConfirmation(groupId, userId, confirmationData) {
    try {
      logger.info(`Initiating confirmation for group ${groupId} by user ${userId}`);

      // 1. Fetch group details from pooling service
      const groupDetails = await this.fetchGroupDetails(groupId, userId);
      if (!groupDetails) {
        throw new Error(`Group ${groupId} not found`);
      }

      // 2. Validate that user is the creator
      if (groupDetails.creatorUserId !== userId) {
        throw new Error('Only group creator can initiate confirmation');
      }

      // 3. Check if already confirmed
      const existingConfirmation = await ConfirmedTrip.findOne({ groupId });
      if (existingConfirmation) {
        throw new Error('Trip confirmation already initiated');
      }

      // 4. Validate minimum members
      const currentMembers = groupDetails.userIds || [];
      if (currentMembers.length < (confirmationData.minMembers || 2)) {
        throw new Error(`Insufficient members. Minimum ${confirmationData.minMembers || 2} required, current: ${currentMembers.length}`);
      }

      // 5. Calculate confirmation deadline (default 48 hours)
      const confirmationDeadline = moment().add(confirmationData.confirmationHours || 48, 'hours').toDate();
      
      // 6. Calculate payment deadlines and amounts
      const upfrontDeadline = moment().add(confirmationData.upfrontPaymentHours || 48, 'hours').toDate();
      const finalDeadline = moment(confirmationData.tripStartDate).subtract(confirmationData.finalPaymentDaysBefore || 7, 'days').toDate();
      
      const pricePerPerson = confirmationData.pricePerPerson || 0;
      const upfrontAmount = Math.round(pricePerPerson * 0.5); // 50%
      const finalAmount = pricePerPerson - upfrontAmount; // Remaining amount
      
      // 7. Create confirmed trip entry
      const confirmedTrip = new ConfirmedTrip({
        groupId,
        tripId: groupDetails.tripId,
        tripName: groupDetails.tripName || 'Untitled Trip',
        groupName: groupDetails.groupName || 'Travel Group',
        creatorUserId: userId,
        memberIds: currentMembers,
        currentMemberCount: currentMembers.length,
        minMembers: confirmationData.minMembers || 2,
        maxMembers: confirmationData.maxMembers || 12,
        tripStartDate: new Date(confirmationData.tripStartDate || groupDetails.preferences?.startDate),
        tripEndDate: new Date(confirmationData.tripEndDate || groupDetails.preferences?.endDate),
        preferences: groupDetails.preferences || {},
        tripDetails: confirmationData.tripDetails || {},
        confirmationDeadline,
        status: 'pending_confirmation',
        paymentInfo: {
          totalAmount: confirmationData.totalAmount || 0,
          pricePerPerson: pricePerPerson,
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
          memberPayments: currentMembers.map(memberId => ({
            userId: memberId,
            userEmail: '', // Will be populated later
            userName: '', // Will be populated later
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
          }))
        },
        memberConfirmations: currentMembers.map(memberId => ({
          userId: memberId,
          confirmed: memberId === userId, // Creator auto-confirms
          confirmedAt: memberId === userId ? new Date() : null
        }))
      });

      // 7. Add initial action
      confirmedTrip.addAction(userId, 'INITIATE_CONFIRMATION', {
        memberCount: currentMembers.length,
        confirmationDeadline,
        paymentInfo: confirmedTrip.paymentInfo
      });

      await confirmedTrip.save();

      // 8. Send confirmation notifications to all members
      await this.sendConfirmationNotifications(confirmedTrip);

      logger.info(`Trip confirmation initiated successfully for group ${groupId}`);
      
      return {
        success: true,
        confirmedTripId: confirmedTrip._id,
        groupId,
        status: 'pending_confirmation',
        confirmationDeadline,
        memberCount: currentMembers.length,
        message: 'Trip confirmation initiated. Members will be notified.'
      };

    } catch (error) {
      logger.error(`Error initiating confirmation for group ${groupId}:`, error);
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
  async fetchGroupDetails(groupId, userId) {
    try {
      const response = await axios.get(`${this.poolingServiceUrl}/api/v1/groups/${groupId}?userId=${userId}`);
      return response.data;
    } catch (error) {
      logger.error(`Error fetching group details for ${groupId}:`, error.message);
      return null;
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
