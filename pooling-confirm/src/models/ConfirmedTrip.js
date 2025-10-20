const mongoose = require('mongoose');

// ConfirmedTrip Schema - New collection for confirmed pooling trips
const confirmedTripSchema = new mongoose.Schema({
  // Reference to original group and trip
  groupId: {
    type: String,
    required: true,
    index: true
  },
  tripId: {
    type: String,
    required: true,
    index: true
  },
  
  // Trip Basic Information
  tripName: {
    type: String,
    required: true
  },
  groupName: {
    type: String,
    required: true
  },
  
  // Creator and Members
  creatorUserId: {
    type: String,
    required: true,
    index: true
  },
  memberIds: [{
    type: String,
    required: true
  }],
  members: [{
    userId: String,
    email: String,
    firstName: String,
    lastName: String,
    nationality: String,
    languages: [String],
    dob: String,
    profileCompletion: Number,
    joinedAt: Date,
    isCreator: Boolean
  }],
  
  // Trip Status
  status: {
    type: String,
    enum: ['pending_confirmation', 'confirmed', 'payment_pending', 'payment_completed', 'trip_started', 'completed', 'cancelled'],
    default: 'pending_confirmation',
    index: true
  },
  
  // Member Requirements
  minMembers: {
    type: Number,
    required: true,
    default: 2
  },
  maxMembers: {
    type: Number,
    required: true,
    default: 12
  },
  currentMemberCount: {
    type: Number,
    required: true,
    default: 1
  },
  
  // Dates
  tripStartDate: {
    type: Date,
    required: true,
    index: true
  },
  tripEndDate: {
    type: Date,
    required: true
  },
  
  // Trip Details (copied from original trip)
  preferences: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  tripDetails: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  
  // Payment Information - Enhanced with 50% model
  paymentInfo: {
    totalAmount: {
      type: Number,
      default: 0
    },
    currency: {
      type: String,
      default: 'LKR'
    },
    pricePerPerson: {
      type: Number,
      default: 0
    },
    
    // Payment Phases
    phases: {
      // Phase 1: 50% upfront after confirmation
      upfront: {
        percentage: {
          type: Number,
          default: 50
        },
        amount: {
          type: Number,
          default: 0
        },
        deadline: {
          type: Date
        },
        status: {
          type: String,
          enum: ['pending', 'active', 'completed', 'expired'],
          default: 'pending'
        }
      },
      
      // Phase 2: Remaining 50% before trip starts
      final: {
        percentage: {
          type: Number,
          default: 50
        },
        amount: {
          type: Number,
          default: 0
        },
        deadline: {
          type: Date // Usually 7-14 days before trip
        },
        status: {
          type: String,
          enum: ['pending', 'active', 'completed', 'expired'],
          default: 'pending'
        }
      }
    },
    
    memberPayments: [{
      userId: String,
      userEmail: String,
      userName: String,
      firstName: String,
      lastName: String,
      nationality: String,
      languages: [String],
      
      // Upfront Payment (50%)
      upfrontPayment: {
        amount: Number,
        status: {
          type: String,
          enum: ['pending', 'paid', 'failed', 'refunded'],
          default: 'pending'
        },
        paymentId: String,
        paidAt: Date,
        paymentMethod: String,
        gatewayResponse: mongoose.Schema.Types.Mixed
      },
      
      // Final Payment (50%)
      finalPayment: {
        amount: Number,
        status: {
          type: String,
          enum: ['pending', 'paid', 'failed', 'refunded'],
          default: 'pending'
        },
        paymentId: String,
        paidAt: Date,
        paymentMethod: String,
        gatewayResponse: mongoose.Schema.Types.Mixed
      },
      
      // Overall status
      overallPaymentStatus: {
        type: String,
        enum: ['pending', 'partial', 'completed', 'failed', 'refunded'],
        default: 'pending'
      },
      totalPaid: {
        type: Number,
        default: 0
      }
    }]
  },
  
  // Payment Decision Period - For partial payments
  paymentDecisionPeriod: {
    isActive: {
      type: Boolean,
      default: false
    },
    startedAt: Date,
    deadline: Date,
    
    // Member decisions during partial payment situation
    memberDecisions: [{
      userId: String,
      decision: {
        type: String,
        enum: ['continue', 'cancel', 'waiting'],
        default: 'waiting'
      },
      decidedAt: Date
    }],
    
    // Overall decision outcome
    finalDecision: {
      type: String,
      enum: ['continue', 'cancel', 'pending'],
      default: 'pending'
    },
    decidedAt: Date
  },
  confirmedAt: {
    type: Date
  },
  confirmedBy: {
    type: String
  },
  confirmationDeadline: {
    type: Date,
    required: true
  },
  
  // Member Confirmations
  memberConfirmations: [{
    userId: {
      type: String,
      required: true
    },
    confirmed: {
      type: Boolean,
      default: false
    },
    confirmedAt: Date,
    paymentStatus: {
      type: String,
      enum: ['pending', 'partial', 'completed', 'paid', 'failed'],
      default: 'pending'
    }
  }],
  
  // Notifications and Reminders
  notificationsSent: [{
    type: {
      type: String,
      enum: ['confirmation_request', 'payment_reminder', 'trip_confirmed', 'trip_cancelled']
    },
    sentAt: Date,
    sentTo: [String], // Array of user IDs
    details: mongoose.Schema.Types.Mixed
  }],
  
  // Audit Trail
  actions: [{
    userId: String,
    action: String,
    details: mongoose.Schema.Types.Mixed,
    timestamp: {
      type: Date,
      default: Date.now
    }
  }],
  
  // Trip Cancellation
  cancellationInfo: {
    cancelledAt: Date,
    cancelledBy: String,
    reason: String,
    refundStatus: {
      type: String,
      enum: ['pending', 'processed', 'completed'],
      default: 'pending'
    }
  }
}, {
  timestamps: true,
  collection: 'confirmed_trips'
});

// Indexes for better performance
confirmedTripSchema.index({ creatorUserId: 1, status: 1 });
confirmedTripSchema.index({ memberIds: 1, status: 1 });
confirmedTripSchema.index({ tripStartDate: 1, status: 1 });
confirmedTripSchema.index({ 'paymentInfo.paymentDeadline': 1, status: 1 });

// Virtual for checking if trip has enough members
confirmedTripSchema.virtual('hasEnoughMembers').get(function() {
  return this.currentMemberCount >= this.minMembers;
});

// Virtual for checking if all members confirmed
confirmedTripSchema.virtual('allMembersConfirmed').get(function() {
  const confirmedCount = this.memberConfirmations.filter(mc => mc.confirmed).length;
  return confirmedCount === this.currentMemberCount;
});

// Virtual for checking payment status
confirmedTripSchema.virtual('allMembersUpfrontPaid').get(function() {
  if (!this.paymentInfo.memberPayments || this.paymentInfo.memberPayments.length === 0) {
    return false;
  }
  const upfrontPaidCount = this.paymentInfo.memberPayments.filter(mp => 
    mp.upfrontPayment && mp.upfrontPayment.status === 'paid'
  ).length;
  return upfrontPaidCount === this.currentMemberCount;
});

confirmedTripSchema.virtual('allMembersFinalPaid').get(function() {
  if (!this.paymentInfo.memberPayments || this.paymentInfo.memberPayments.length === 0) {
    return false;
  }
  const finalPaidCount = this.paymentInfo.memberPayments.filter(mp => 
    mp.finalPayment && mp.finalPayment.status === 'paid'
  ).length;
  return finalPaidCount === this.currentMemberCount;
});

confirmedTripSchema.virtual('upfrontPaymentStats').get(function() {
  if (!this.paymentInfo.memberPayments || this.paymentInfo.memberPayments.length === 0) {
    return { paid: 0, pending: 0, total: this.currentMemberCount };
  }
  
  const stats = this.paymentInfo.memberPayments.reduce((acc, mp) => {
    if (mp.upfrontPayment && mp.upfrontPayment.status === 'paid') {
      acc.paid++;
    } else {
      acc.pending++;
    }
    return acc;
  }, { paid: 0, pending: 0, total: this.currentMemberCount });
  
  return stats;
});

// Instance methods
confirmedTripSchema.methods.addMemberConfirmation = function(userId) {
  const existingConfirmation = this.memberConfirmations.find(mc => mc.userId === userId);
  if (existingConfirmation) {
    existingConfirmation.confirmed = true;
    existingConfirmation.confirmedAt = new Date();
  } else {
    this.memberConfirmations.push({
      userId,
      confirmed: true,
      confirmedAt: new Date()
    });
  }
};

confirmedTripSchema.methods.addAction = function(userId, action, details = {}) {
  this.actions.push({
    userId,
    action,
    details,
    timestamp: new Date()
  });
};

confirmedTripSchema.methods.updatePaymentStatus = function(userId, phase, paymentId, status, amount = 0, gatewayResponse = {}) {
  let memberPayment = this.paymentInfo.memberPayments.find(mp => mp.userId === userId);
  if (!memberPayment) {
    memberPayment = {
      userId,
      upfrontPayment: { amount: 0, status: 'pending' },
      finalPayment: { amount: 0, status: 'pending' },
      overallPaymentStatus: 'pending',
      totalPaid: 0
    };
    this.paymentInfo.memberPayments.push(memberPayment);
  }
  
  // Update specific phase payment
  if (phase === 'upfront') {
    memberPayment.upfrontPayment.paymentId = paymentId;
    memberPayment.upfrontPayment.status = status;
    memberPayment.upfrontPayment.gatewayResponse = gatewayResponse;
    if (status === 'paid') {
      memberPayment.upfrontPayment.amount = amount;
      memberPayment.upfrontPayment.paidAt = new Date();
    }
  } else if (phase === 'final') {
    memberPayment.finalPayment.paymentId = paymentId;
    memberPayment.finalPayment.status = status;
    memberPayment.finalPayment.gatewayResponse = gatewayResponse;
    if (status === 'paid') {
      memberPayment.finalPayment.amount = amount;
      memberPayment.finalPayment.paidAt = new Date();
    }
  }
  
  // Calculate total paid and overall status
  memberPayment.totalPaid = 
    (memberPayment.upfrontPayment.status === 'paid' ? memberPayment.upfrontPayment.amount : 0) +
    (memberPayment.finalPayment.status === 'paid' ? memberPayment.finalPayment.amount : 0);
  
  // Update overall payment status
  if (memberPayment.upfrontPayment.status === 'paid' && memberPayment.finalPayment.status === 'paid') {
    memberPayment.overallPaymentStatus = 'completed';
  } else if (memberPayment.upfrontPayment.status === 'paid' || memberPayment.finalPayment.status === 'paid') {
    memberPayment.overallPaymentStatus = 'partial';
  } else if (memberPayment.upfrontPayment.status === 'failed' || memberPayment.finalPayment.status === 'failed') {
    memberPayment.overallPaymentStatus = 'failed';
  } else {
    memberPayment.overallPaymentStatus = 'pending';
  }
  
  // Update member confirmation payment status
  const memberConfirmation = this.memberConfirmations.find(mc => mc.userId === userId);
  if (memberConfirmation) {
    memberConfirmation.paymentStatus = memberPayment.overallPaymentStatus;
  }
};

module.exports = mongoose.model('ConfirmedTrip', confirmedTripSchema);
