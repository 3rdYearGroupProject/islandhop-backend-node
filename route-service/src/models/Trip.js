const mongoose = require('mongoose');

const tripSchema = new mongoose.Schema({
  userId: { type: String, required: true },
  tripName: { type: String, required: true },
  startDate: { type: Date, required: true },
  endDate: { type: Date, required: true },
  arrivalTime: { type: String, required: true },
  baseCity: { type: String, required: true },
  multiCityAllowed: { type: Boolean, default: false },
  activityPacing: { type: String, enum: ['Slow', 'Normal', 'Fast'], default: 'Normal' },
  budgetLevel: { type: String, enum: ['Low', 'Medium', 'High'], default: 'Medium' },
  preferredTerrains: { type: [String], default: [] },
  preferredActivities: { type: [String], default: [] },
  dailyPlans: [{
    day: { type: Number, required: true },
    city: { type: String, required: true },
    userSelected: { type: Boolean, default: true },
    attractions: [{
      id: String,
      name: String,
      type: { type: String, default: 'attraction' },
      location: String,
      coordinates: {
        lat: Number,
        lng: Number
      },
      rating: Number,
      thumbnailUrl: String,
      source: String,
      completed: { type: Boolean, default: false },
      completedAt: Date,
      estimatedDuration: String,
      estimatedArrival: String
    }],
    restaurants: [{
      id: String,
      name: String,
      type: { type: String, default: 'restaurant' },
      location: String,
      coordinates: {
        lat: Number,
        lng: Number
      },
      rating: Number,
      thumbnailUrl: String,
      source: String,
      completed: { type: Boolean, default: false },
      completedAt: Date,
      estimatedDuration: String,
      estimatedArrival: String
    }],
    hotels: [{
      id: String,
      name: String,
      type: { type: String, default: 'hotel' },
      location: String,
      coordinates: {
        lat: Number,
        lng: Number
      },
      rating: Number,
      thumbnailUrl: String,
      source: String,
      completed: { type: Boolean, default: false },
      completedAt: Date,
      estimatedDuration: String,
      estimatedArrival: String
    }],
    notes: { type: [String], default: [] }
  }],
  mapData: { type: [Object], default: [] },
  optimizedRoute: {
    coordinates: [{ lat: Number, lng: Number }],
    totalDistance: String,
    totalDuration: String,
    lastOptimized: { type: Date, default: Date.now }
  },
  currentLocation: {
    lat: Number,
    lng: Number,
    lastUpdated: { type: Date, default: Date.now }
  },
  createdAt: { type: Date, default: Date.now },
  lastUpdated: { type: Date, default: Date.now },
  driverNeeded: { type: Number, default: 0 },
  guideNeeded: { type: Number, default: 0 },
  averageTripDistance: { type: Number, default: 0 },
  averageDriverCost: { type: Number, default: 0 },
  averageGuideCost: { type: Number, default: 0 },
  vehicleType: { type: String, default: 'Not specified' },
}, { timestamps: true });

const Trip = mongoose.model('Trip', tripSchema);

module.exports = Trip;