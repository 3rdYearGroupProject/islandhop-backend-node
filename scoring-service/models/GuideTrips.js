const mongoose = require('mongoose');

const tripSchema = new mongoose.Schema({
  trip_id: {
    type: String,
    required: true,
    trim: true
  },
  start_date: {
    type: Date,
    required: true,
    validate: {
      validator: function(v) {
        return v instanceof Date && !isNaN(v);
      },
      message: 'Start date must be a valid date'
    }
  },
  end_date: {
    type: Date,
    required: true,
    validate: {
      validator: function(v) {
        return v instanceof Date && !isNaN(v) && v >= this.start_date;
      },
      message: 'End date must be a valid date and after start date'
    }
  }
}, { _id: false });

const guideTripsSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email address']
  },
  trips: {
    type: [tripSchema],
    default: []
  }
}, {
  timestamps: true
});

// Method to check if guide is available for a given period
guideTripsSchema.methods.isAvailable = function(startDate, endDate) {
  return !this.trips.some(trip => {
    const tripStart = new Date(trip.start_date);
    const tripEnd = new Date(trip.end_date);
    const requestStart = new Date(startDate);
    const requestEnd = new Date(endDate);
    
    // Check for overlap: trips overlap if start of one is before end of other and vice versa
    return (requestStart < tripEnd && requestEnd > tripStart);
  });
};

// Method to add a new trip
guideTripsSchema.methods.addTrip = function(tripId, startDate, endDate) {
  if (!this.isAvailable(startDate, endDate)) {
    throw new Error('Guide is not available for the requested time period');
  }
  
  this.trips.push({
    trip_id: tripId,
    start_date: new Date(startDate),
    end_date: new Date(endDate)
  });
  
  return this.save();
};

// Index for better query performance
guideTripsSchema.index({ email: 1 });
guideTripsSchema.index({ 'trips.start_date': 1, 'trips.end_date': 1 });

module.exports = mongoose.model('GuideTrips', guideTripsSchema);
