const mongoose = require('mongoose');

// Schema for payed_trips_advance collection
const payedTripAdvanceSchema = new mongoose.Schema({
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
  startDate: {
    type: String,
    required: true
  },
  endDate: {
    type: String,
    required: true
  },
  arrivalTime: {
    type: String,
    required: true
  },
  baseCity: {
    type: String,
    required: true
  },
  multiCityAllowed: {
    type: Boolean,
    default: false
  },
  activityPacing: {
    type: String,
    enum: ['Slow', 'Normal', 'Fast'],
    default: 'Normal'
  },
  budgetLevel: {
    type: String,
    enum: ['Low', 'Medium', 'High'],
    default: 'Medium'
  },
  preferredTerrains: [{
    type: String
  }],
  preferredActivities: [{
    type: String
  }],
  dailyPlans: [{
    day: {
      type: Number,
      required: true
    },
    city: {
      type: String,
      required: true
    },
    attractions: [{
      type: mongoose.Schema.Types.Mixed
    }]
  }],
  mapData: [{
    type: mongoose.Schema.Types.Mixed
  }],
  driverNeeded: {
    type: Number,
    default: 0
  },
  guideNeeded: {
    type: Number,
    default: 0
  },
  averageTripDistance: {
    type: Number,
    default: 0
  },
  vehicleType: {
    type: String
  },
  driver_email: {
    type: String
  },
  guide_email: {
    type: String
  },
  payedAmount: {
    type: String
  }
}, {
  timestamps: true,
  _id: false
});

// Schema for completed_trips collection
const completedTripSchema = new mongoose.Schema({
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
  startDate: {
    type: String,
    required: true
  },
  endDate: {
    type: String,
    required: true
  },
  arrivalTime: {
    type: String,
    required: true
  },
  baseCity: {
    type: String,
    required: true
  },
  multiCityAllowed: {
    type: Boolean,
    default: false
  },
  activityPacing: {
    type: String,
    enum: ['Slow', 'Normal', 'Fast'],
    default: 'Normal'
  },
  budgetLevel: {
    type: String,
    enum: ['Low', 'Medium', 'High'],
    default: 'Medium'
  },
  preferredTerrains: [{
    type: String
  }],
  preferredActivities: [{
    type: String
  }],
  dailyPlans: [{
    day: {
      type: Number,
      required: true
    },
    city: {
      type: String,
      required: true
    },
    attractions: [{
      type: mongoose.Schema.Types.Mixed
    }],
    start: {
      type: Date
    },
    end: {
      type: Date
    },
    start_confirmed: {
      type: Number,
      default: 0
    },
    end_confirmed: {
      type: Number,
      default: 0
    },
    start_meter_read: {
      type: Number,
      default: 0
    },
    end_meter_read: {
      type: Number,
      default: 0
    },
    deduct_amount: {
      type: Number,
      default: 0
    },
    day_complete: {
      type: Number,
      default: 0
    },
    additional_note: {
      type: String,
      default: ''
    }
  }],
  mapData: [{
    type: mongoose.Schema.Types.Mixed
  }],
  driverNeeded: {
    type: Number,
    default: 0
  },
  guideNeeded: {
    type: Number,
    default: 0
  },
  averageTripDistance: {
    type: Number,
    default: 0
  },
  vehicleType: {
    type: String
  },
  driver_email: {
    type: String
  },
  guide_email: {
    type: String
  },
  payedAmount: {
    type: String
  },
  // Additional fields for completed trips
  started: {
    type: Number,
    default: 1
  },
  startconfirmed: {
    type: Number,
    default: 0
  },
  ended: {
    type: Number,
    default: 0
  },
  endconfirmed: {
    type: Number,
    default: 0
  },
  driver_reviewed: {
    type: Number,
    default: 0
  },
  guide_reviewed: {
    type: Number,
    default: 0
  },
  driver_review: {
    type: String,
    default: ''
  },
  guide_review: {
    type: String,
    default: ''
  }
}, {
  timestamps: true,
  _id: false
});

const PayedTripAdvance = mongoose.model('PayedTripAdvance', payedTripAdvanceSchema, 'payed_trips_advance');
const CompletedTrip = mongoose.model('CompletedTrip', completedTripSchema, 'completed_trips');

module.exports = {
  PayedTripAdvance,
  CompletedTrip
};
