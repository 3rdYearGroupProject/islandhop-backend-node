const mongoose = require('mongoose');

const tripSchema = new mongoose.Schema({
  _id: {
    type: mongoose.Schema.Types.ObjectId,
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
  startDate: {
    type: String
  },
  endDate: {
    type: String
  },
  arrivalTime: {
    type: String
  },
  baseCity: {
    type: String
  },
  multiCityAllowed: {
    type: Boolean
  },
  activityPacing: {
    type: String
  },
  budgetLevel: {
    type: String
  },
  preferredTerrains: [{
    type: String
  }],
  preferredActivities: [{
    type: String
  }],
  dailyPlans: [{
    day: Number,
    city: String,
    attractions: [mongoose.Schema.Types.Mixed],
    restaurants: [mongoose.Schema.Types.Mixed],
    hotels: [mongoose.Schema.Types.Mixed],
    notes: [mongoose.Schema.Types.Mixed]
  }],
  mapData: [mongoose.Schema.Types.Mixed],
  lastUpdated: {
    type: Date
  },
  driverNeeded: {
    type: Number,
    default: 0
  },
  guideNeeded: {
    type: Number,
    default: 0
  },
  averageTripDistance: {
    type: Number
  },
  averageDriverCost: {
    type: Number
  },
  averageGuideCost: {
    type: Number
  },
  vehicleType: {
    type: String
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
  },
  payedAmount: {
    type: String
  },
  _class: {
    type: String
  }
}, {
  collection: 'payed_trips_advance',
  versionKey: false
});

module.exports = mongoose.model('Trip', tripSchema);
