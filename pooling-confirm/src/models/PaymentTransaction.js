const mongoose = require('mongoose');

// Payment Transaction Schema
const paymentTransactionSchema = new mongoose.Schema({
  transactionId: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  
  // Trip and User Information
  confirmedTripId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ConfirmedTrip',
    required: true,
    index: true
  },
  groupId: {
    type: String,
    required: true,
    index: true
  },
  tripId: {
    type: String,
    required: true
  },
  userId: {
    type: String,
    required: true,
    index: true
  },
  userEmail: {
    type: String,
    required: true
  },
  
  // Payment Details
  amount: {
    type: Number,
    required: true
  },
  currency: {
    type: String,
    required: true,
    default: 'LKR'
  },
  
  // Payment Gateway Information
  paymentGateway: {
    type: String,
    enum: ['payhere', 'stripe', 'manual'],
    required: true
  },
  gatewayTransactionId: {
    type: String,
    index: true
  },
  gatewayResponse: {
    type: mongoose.Schema.Types.Mixed
  },
  
  // Transaction Status
  status: {
    type: String,
    enum: ['pending', 'processing', 'completed', 'failed', 'refunded', 'cancelled'],
    default: 'pending',
    index: true
  },
  
  // Payment Method
  paymentMethod: {
    type: String,
    enum: ['credit_card', 'debit_card', 'bank_transfer', 'digital_wallet', 'cash']
  },
  
  // Important Dates
  initiatedAt: {
    type: Date,
    default: Date.now,
    index: true
  },
  completedAt: {
    type: Date
  },
  expiresAt: {
    type: Date,
    index: true
  },
  
  // Refund Information
  refundInfo: {
    refundId: String,
    refundAmount: Number,
    refundReason: String,
    refundedAt: Date,
    refundStatus: {
      type: String,
      enum: ['pending', 'processing', 'completed', 'failed']
    }
  },
  
  // Additional Metadata
  metadata: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  
  // Error Handling
  errorDetails: {
    errorCode: String,
    errorMessage: String,
    errorTimestamp: Date
  }
}, {
  timestamps: true,
  collection: 'payment_transactions'
});

// Indexes for performance
paymentTransactionSchema.index({ userId: 1, status: 1 });
paymentTransactionSchema.index({ confirmedTripId: 1, status: 1 });
paymentTransactionSchema.index({ expiresAt: 1, status: 1 });
paymentTransactionSchema.index({ createdAt: -1 });

// Instance methods
paymentTransactionSchema.methods.markCompleted = function(gatewayTransactionId, gatewayResponse = {}) {
  this.status = 'completed';
  this.completedAt = new Date();
  this.gatewayTransactionId = gatewayTransactionId;
  this.gatewayResponse = gatewayResponse;
};

paymentTransactionSchema.methods.markFailed = function(errorCode, errorMessage) {
  this.status = 'failed';
  this.errorDetails = {
    errorCode,
    errorMessage,
    errorTimestamp: new Date()
  };
};

paymentTransactionSchema.methods.initiateRefund = function(refundAmount, reason) {
  this.refundInfo = {
    refundAmount: refundAmount || this.amount,
    refundReason: reason,
    refundStatus: 'pending'
  };
  this.status = 'refunded';
};

module.exports = mongoose.model('PaymentTransaction', paymentTransactionSchema);
