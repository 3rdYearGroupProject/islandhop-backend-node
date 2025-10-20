const mongoose = require('mongoose');


const LocationSchema = new mongoose.Schema({
  tripId: { type: String, required: true },
  userId: { type: String, required: true },
  latitude: { type: Number, required: true },
  longitude: { type: Number, required: true },
  timestamp: { type: Date, default: Date.now },
  // Profile fields
  email: String,
  firstName: String,
  lastName: String,
  dob: String,
  nationality: String,
  languages: [String],
  profilePic: String,
  profileCompletion: Number
});

module.exports = mongoose.model('Location', LocationSchema);
