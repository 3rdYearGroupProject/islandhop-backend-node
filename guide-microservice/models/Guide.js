const mongoose = require('mongoose');

const guideSchema = new mongoose.Schema({
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
  languages: [{
    type: String,
    required: true
  }],
  specializations: [{
    type: String,
    enum: ['cultural', 'historical', 'nature', 'adventure', 'wildlife', 'photography', 'culinary', 'spiritual', 'archaeological']
  }],
  certifications: [{
    name: String,
    issuedBy: String,
    issuedDate: Date,
    expiryDate: Date,
    certificateUrl: String
  }],
  status: {
    type: String,
    enum: ['active', 'inactive', 'suspended'],
    default: 'active'
  },
  rating: {
    type: Number,
    default: 0
  },
  totalTours: {
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
    address: String,
    coverageAreas: [String] // Areas the guide covers
  },
  isAvailable: {
    type: Boolean,
    default: true
  },
  profileImage: String,
  documents: {
    license: String,
    insurance: String,
    certifications: [String]
  },
  experience: {
    years: Number,
    description: String,
    previousWork: [{
      company: String,
      position: String,
      duration: String,
      description: String
    }]
  },
  tourTypes: [{
    type: String,
    enum: ['day-trip', 'multi-day', 'walking-tour', 'cultural-tour', 'adventure-tour', 'photography-tour', 'food-tour', 'historical-tour']
  }],
  pricing: {
    hourlyRate: Number,
    dayRate: Number,
    groupSizeMultiplier: {
      small: Number,  // 1-4 people
      medium: Number, // 5-10 people
      large: Number   // 11+ people
    }
  },
  availability: {
    schedule: Map,
    workingHours: {
      start: String,
      end: String
    },
    daysOff: [String]
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

// Indexes for faster queries
guideSchema.index({ email: 1 });
guideSchema.index({ location: '2dsphere' });
guideSchema.index({ specializations: 1 });
guideSchema.index({ languages: 1 });
guideSchema.index({ status: 1, isAvailable: 1 });

module.exports = mongoose.model('Guide', guideSchema, 'Guide_info');
