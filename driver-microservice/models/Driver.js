const mongoose = require('mongoose');

const driverSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true
  },
  firstName: {
    type: String,
    required: true
  },
  lastName: {
    type: String,
    required: true
  },
  phone: {
    type: String,
    required: true
  },
  licenseNumber: {
    type: String,
    required: true
  },
  vehicleDetails: {
    make: String,
    model: String,
    year: Number,
    plateNumber: String,
    color: String
  },
  status: {
    type: String,
    enum: ['active', 'inactive', 'suspended'],
    default: 'active'
  },
  rating: {
    type: Number,
    default: 0
  },
  totalTrips: {
    type: Number,
    default: 0
  },
  earnings: {
    total: {
      type: Number,
      default: 0
    },
    daily: {
      type: Number,
      default: 0
    },
    weekly: {
      type: Number,
      default: 0
    },
    monthly: {
      type: Number,
      default: 0
    }
  },
  location: {
    latitude: Number,
    longitude: Number,
    address: String
  },
  isAvailable: {
    type: Boolean,
    default: true
  },
  profileImage: String,
  documents: {
    license: String,
    insurance: String,
    registration: String
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Index for faster email lookups
driverSchema.index({ email: 1 });

module.exports = mongoose.model('Driver', driverSchema, 'Driver_info');
