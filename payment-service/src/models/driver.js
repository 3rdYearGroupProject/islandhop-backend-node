const mongoose = require('mongoose');

const driverSchema = new mongoose.Schema({
  tripId: {
    type: String,
    required: true,
    unique: true
  },
  driverEmail: {
    type: String,
    required: true,
    trim: true,
    lowercase: true
  },
  cost: {
    type: Number,
    required: true,
    min: 0
  },
  paid: {
    type: Number,
    required: true,
    default: 0,
    enum: [0, 1] // 0 = not paid, 1 = paid
  },
  evidence: {
    type: String,
    default: null // Store filename or URL to picture
  }
}, {
  timestamps: true
});

// Index for faster queries
driverSchema.index({ tripId: 1 });
driverSchema.index({ driverEmail: 1 });
driverSchema.index({ paid: 1 });

module.exports = mongoose.model('Driver', driverSchema);
