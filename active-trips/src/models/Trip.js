const mongoose = require('mongoose');

const tripSchema = new mongoose.Schema({
  _id: {
    type: String,
    required: true
  },
  userId: {
    type: String,
    required: true
  },
  tripName: {
    type: String,
    required: true
  },
  driverNeeded: {
    type: Number,
    default: 0
  },
  guideNeeded: {
    type: Number,
    default: 0
  },
  driver_status: {
    type: mongoose.Schema.Types.Mixed,
    default: ""
  },
  driver_email: {
    type: String,
    default: ""
  },
  guide_status: {
    type: mongoose.Schema.Types.Mixed,
    default: ""
  },
  guide_email: {
    type: String,
    default: ""
  }
}, {
  collection: 'payed_trips_advance',
  versionKey: false
});

module.exports = mongoose.model('Trip', tripSchema);
