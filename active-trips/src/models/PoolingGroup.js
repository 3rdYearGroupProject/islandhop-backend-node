const mongoose = require('mongoose');

// Schema for pooling groups from islandhop_pooling database
const poolingGroupSchema = new mongoose.Schema({
  _id: {
    type: String,
    required: true
  },
  tripId: {
    type: String,
    required: true
  },
  groupName: String,
  tripName: String,
  creatorUserId: String,
  creatorEmail: String,
  createdBy: String,
  userIds: [String],
  members: [{
    userId: String,
    email: String,
    firstName: String,
    lastName: String,
    nationality: String,
    languages: [String],
    dob: String,
    profileCompletion: Number,
    joinedAt: Date,
    isCreator: Boolean
  }],
  visibility: String,
  preferences: mongoose.Schema.Types.Mixed,
  status: String,
  joinRequests: [mongoose.Schema.Types.Mixed],
  actions: [mongoose.Schema.Types.Mixed],
  createdAt: Date,
  lastUpdated: Date,
  pendingInvitations: [mongoose.Schema.Types.Mixed],
  requiresApproval: Boolean,
  maxMembers: Number,
  averageDriverCost: Number,
  averageGuideCost: Number,
  totalCost: Number,
  costPerPerson: Number,
  maxParticipants: Number,
  vehicleType: String,
  needDriver: Boolean,
  needGuide: Boolean,
  _class: String
}, { 
  collection: 'groups',
  strict: false // Allow additional fields not defined in schema
});

// Create a separate connection to the islandhop_pooling database
const poolingDbConnection = mongoose.createConnection(
  'mongodb+srv://2022cs056:dH4aTFn3IOerWlVZ@cluster0.9ccambx.mongodb.net/islandhop_pooling',
  {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  }
);

poolingDbConnection.on('connected', () => {
  console.log('Mongoose connected to islandhop_pooling database');
});

poolingDbConnection.on('error', (err) => {
  console.error('Mongoose pooling database connection error:', err);
});

const PoolingGroup = poolingDbConnection.model('PoolingGroup', poolingGroupSchema);

module.exports = PoolingGroup;
