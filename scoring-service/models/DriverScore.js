const mongoose = require('mongoose');

const driverScoreSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email address']
  },
  rating: {
    type: Number,
    required: true,
    min: 0,
    max: 5,
    validate: {
      validator: function(v) {
        return v >= 0 && v <= 5;
      },
      message: 'Rating must be between 0 and 5'
    }
  },
  active: {
    type: Boolean,
    required: true,
    default: true
  },
  banned: {
    type: Boolean,
    required: true,
    default: false
  },
  newDriver: {
    type: Boolean,
    required: true,
    default: true
  },
  first10Rides: {
    type: Number,
    required: true,
    min: 1,
    max: 10,
    validate: {
      validator: function(v) {
        return Number.isInteger(v) && v >= 1 && v <= 10;
      },
      message: 'First10Rides must be an integer between 1 and 10'
    }
  },
  penalty: {
    type: Number,
    required: true,
    min: 0,
    max: 100,
    default: 0,
    validate: {
      validator: function(v) {
        return Number.isInteger(v) && v >= 0 && v <= 100;
      },
      message: 'Penalty must be an integer between 0 and 100'
    }
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual field for calculated total score
driverScoreSchema.virtual('totalScore').get(function() {
  return this.calculateScore();
});

// Method to calculate score
driverScoreSchema.methods.calculateScore = function() {
  const ratingScore = this.rating * 20;
  const activeScore = this.active ? 10 : 0;
  const bannedPenalty = this.banned ? 100 : 0;
  const newDriverBonus = this.newDriver ? 5 : 0;
  const experienceBonus = (10 - this.first10Rides) * 2;
  const penaltyDeduction = this.penalty;
  
  return ratingScore + activeScore - bannedPenalty + newDriverBonus + experienceBonus - penaltyDeduction;
};

// Index for better query performance
driverScoreSchema.index({ email: 1 });
driverScoreSchema.index({ active: 1, banned: 1 });

module.exports = mongoose.model('DriverScore', driverScoreSchema);
