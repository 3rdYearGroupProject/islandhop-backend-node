const mongoose = require('mongoose');

const scheduleSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    lowercase: true,
    trim: true
  },
  date: {
    type: Date,
    required: true
  },
  status: {
    type: String,
    enum: ['available', 'unavailable', 'locked'],
    default: 'available'
  },
  userType: {
    type: String,
    enum: ['driver', 'guide'],
    required: true
  },
  tripId: {
    type: String,
    required: false,
    default: null
  }
}, {
  timestamps: true
});

// Create compound index for efficient queries
scheduleSchema.index({ email: 1, date: 1, userType: 1 }, { unique: true });
scheduleSchema.index({ email: 1, userType: 1 });
scheduleSchema.index({ date: 1 });

// Static method to get available days for a month
scheduleSchema.statics.getAvailableDaysForMonth = async function(email, userType, year, month) {
  const startDate = new Date(year, month - 1, 1);
  const endDate = new Date(year, month, 0);
  
  const unavailableDays = await this.find({
    email,
    userType,
    date: {
      $gte: startDate,
      $lte: endDate
    },
    status: { $in: ['unavailable', 'locked'] }
  }).select('date status tripId');
  
  return unavailableDays;
};

// Static method to mark days as unavailable
scheduleSchema.statics.markDaysUnavailable = async function(email, userType, dates) {
  const results = [];
  
  for (const dateStr of dates) {
    const date = new Date(dateStr);
    
    try {
      const existingRecord = await this.findOne({ email, userType, date });
      
      if (existingRecord) {
        if (existingRecord.status === 'locked') {
          results.push({
            date: dateStr,
            success: false,
            message: 'Date is locked and cannot be modified'
          });
        } else {
          existingRecord.status = 'unavailable';
          await existingRecord.save();
          results.push({
            date: dateStr,
            success: true,
            message: 'Date marked as unavailable'
          });
        }
      } else {
        await this.create({
          email,
          userType,
          date,
          status: 'unavailable'
        });
        results.push({
          date: dateStr,
          success: true,
          message: 'Date marked as unavailable'
        });
      }
    } catch (error) {
      results.push({
        date: dateStr,
        success: false,
        message: error.message
      });
    }
  }
  
  return results;
};

// Static method to mark days as available
scheduleSchema.statics.markDaysAvailable = async function(email, userType, dates) {
  const results = [];
  
  for (const dateStr of dates) {
    const date = new Date(dateStr);
    
    try {
      const existingRecord = await this.findOne({ email, userType, date });
      
      if (existingRecord) {
        if (existingRecord.status === 'locked') {
          results.push({
            date: dateStr,
            success: false,
            message: 'Date is locked and cannot be modified'
          });
        } else {
          await this.deleteOne({ email, userType, date });
          results.push({
            date: dateStr,
            success: true,
            message: 'Date marked as available'
          });
        }
      } else {
        results.push({
          date: dateStr,
          success: true,
          message: 'Date was already available'
        });
      }
    } catch (error) {
      results.push({
        date: dateStr,
        success: false,
        message: error.message
      });
    }
  }
  
  return results;
};

// Static method to lock days
scheduleSchema.statics.lockDays = async function(email, userType, dates, tripId = null) {
  const results = [];
  
  for (const dateStr of dates) {
    const date = new Date(dateStr);
    
    try {
      const existingRecord = await this.findOne({ email, userType, date });
      
      if (existingRecord) {
        existingRecord.status = 'locked';
        if (tripId) {
          existingRecord.tripId = tripId;
        }
        await existingRecord.save();
        results.push({
          date: dateStr,
          success: true,
          message: 'Date locked successfully',
          tripId: tripId
        });
      } else {
        const newRecord = {
          email,
          userType,
          date,
          status: 'locked'
        };
        
        if (tripId) {
          newRecord.tripId = tripId;
        }
        
        await this.create(newRecord);
        results.push({
          date: dateStr,
          success: true,
          message: 'Date locked successfully',
          tripId: tripId
        });
      }
    } catch (error) {
      results.push({
        date: dateStr,
        success: false,
        message: error.message
      });
    }
  }
  
  return results;
};

module.exports = mongoose.model('Schedule', scheduleSchema);
