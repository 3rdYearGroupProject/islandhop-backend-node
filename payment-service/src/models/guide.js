const mongoose = require('mongoose');

const guideSchema = new mongoose.Schema({
  tripId: {
    type: String,
    required: true,
    unique: true
  },
  guideEmail: {
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
guideSchema.index({ tripId: 1 });
guideSchema.index({ guideEmail: 1 });
guideSchema.index({ paid: 1 });

module.exports = mongoose.model('Guide', guideSchema);
