const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema({
  tripId: {
    type: String,
    required: true
  },
  driverEmail: {
    type: String,
    required: true
  },
  cost: {
    type: Number,
    required: true,
    default: 0
  },
  paid: {
    type: Number,
    required: true,
    default: 0
  },
  evidence: {
    type: String,
    default: null
  }
}, {
  timestamps: true,
  versionKey: '__v'
});

// Create models for both drivers and guides collections
const DriversPayment = mongoose.model('drivers', paymentSchema, 'payment-service/drivers');
const GuidesPayment = mongoose.model('guides', paymentSchema, 'payment-service/guides');

module.exports = {
  DriversPayment,
  GuidesPayment
};
