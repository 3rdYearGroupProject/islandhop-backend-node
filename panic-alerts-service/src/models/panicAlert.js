import mongoose from 'mongoose';

const panicAlertSchema = new mongoose.Schema({
  userId: {
    type: String,
    required: true
  },
  userEmail: {
    type: String,
    required: true
  },
  userName: {
    type: String,
    required: false
  },
  userPhone: {
    type: String,
    required: false
  },
  location: {
    latitude: {
      type: Number,
      required: true
    },
    longitude: {
      type: Number,
      required: true
    },
    accuracy: {
      type: Number,
      required: false
    },
    timestamp: {
      type: String,
      required: true
    }
  },
  alertTimestamp: {
    type: String,
    required: true
  },
  status: {
    type: String,
    enum: ['not_resolved', 'investigating', 'resolved'],
    default: 'not_resolved'
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'critical'],
    default: 'high'
  },
  type: {
    type: String,
    default: 'panic_alert'
  },
  message: {
    type: String,
    required: true
  },
  deviceInfo: {
    userAgent: {
      type: String,
      required: false
    },
    platform: {
      type: String,
      required: false
    },
    language: {
      type: String,
      required: false
    }
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  },
  resolvedAt: {
    type: Date,
    required: false
  },
  notes: {
    type: String,
    required: false
  }
}, {
  timestamps: true
});

// Create a function to get the PanicAlert model with the lost-items database connection
export function createPanicAlertModel(lostItemsDb = null) {
  if (!lostItemsDb) {
    throw new Error('Lost-items database connection is required for PanicAlert model');
  }
  return lostItemsDb.model('PanicAlert', panicAlertSchema, 'panic_alerts');
}

export default panicAlertSchema;