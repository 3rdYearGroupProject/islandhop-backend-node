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
  
  // Payment Information
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
    paymentDeadline: {
      type: Date
    },
    memberPayments: [{
      userId: String,
      amount: Number,
      status: {
        type: String,
        enum: ['pending', 'paid', 'failed', 'refunded'],
        default: 'pending'
      },
      paymentId: String,
      paidAt: Date,
      paymentMethod: String
    }]
  },
  
  // Confirmation Details
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
      enum: ['pending', 'paid', 'failed'],
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
confirmedTripSchema.virtual('allMembersPaid').get(function() {
  if (!this.paymentInfo.memberPayments || this.paymentInfo.memberPayments.length === 0) {
    return false;
  }
  const paidCount = this.paymentInfo.memberPayments.filter(mp => mp.status === 'paid').length;
  return paidCount === this.currentMemberCount;
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

confirmedTripSchema.methods.updatePaymentStatus = function(userId, paymentId, status, amount = 0) {
  let memberPayment = this.paymentInfo.memberPayments.find(mp => mp.userId === userId);
  if (!memberPayment) {
    memberPayment = {
      userId,
      amount,
      status: 'pending',
      paymentId: null
    };
    this.paymentInfo.memberPayments.push(memberPayment);
  }
  
  memberPayment.paymentId = paymentId;
  memberPayment.status = status;
  if (status === 'paid') {
    memberPayment.paidAt = new Date();
    memberPayment.amount = amount;
  }
  
  // Update member confirmation payment status
  const memberConfirmation = this.memberConfirmations.find(mc => mc.userId === userId);
  if (memberConfirmation) {
    memberConfirmation.paymentStatus = status;
  }
};

module.exports = mongoose.model('ConfirmedTrip', confirmedTripSchema);
