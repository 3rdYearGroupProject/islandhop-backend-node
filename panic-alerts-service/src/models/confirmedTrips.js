import mongoose from 'mongoose';

const tripSchema = new mongoose.Schema({
  uid: { type: String, required: true },
  tripName: String,
  tripId: String,
  destination: String,
  startDate: Date,
  endDate: Date,
  guide: String,
  driver: String,
  status:  String
});

export default mongoose.model('Trip', tripSchema);