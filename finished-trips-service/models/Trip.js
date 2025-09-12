const mongoose = require('mongoose');

// Schema for completed trips
const completedTripSchema = new mongoose.Schema({
  _id: {
    type: mongoose.Schema.Types.Mixed, // Allow both ObjectId and string (UUID)
    required: true
  }
  // This will be flexible to accept any trip document structure
}, { 
  strict: false,
  collection: 'completed_trips',
  _id: false // Disable automatic _id generation since we're handling it manually
});

// Schema for payed finished trips
const payedFinishedTripSchema = new mongoose.Schema({
  _id: {
    type: mongoose.Schema.Types.Mixed, // Allow both ObjectId and string (UUID)
    required: true
  },
  originalTripId: {
    type: mongoose.Schema.Types.Mixed // Store the original trip ID for reference
  },
  // This will be flexible to accept any trip document structure
  payedAmount: {
    type: Number,
    default: 0
  },
  driver_reviewed: {
    type: Number,
    default: 0
  },
  driver_review: {
    type: String,
    default: ''
  },
  guide_reviewed: {
    type: Number,
    default: 0
  },
  guide_review: {
    type: String,
    default: ''
  }
}, { 
  strict: false,
  collection: 'payed_finished_trips',
  _id: false // Disable automatic _id generation since we're handling it manually
});

const CompletedTrip = mongoose.model('CompletedTrip', completedTripSchema);
const PayedFinishedTrip = mongoose.model('PayedFinishedTrip', payedFinishedTripSchema);

module.exports = {
  CompletedTrip,
  PayedFinishedTrip
};
