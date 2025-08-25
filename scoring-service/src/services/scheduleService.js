const mongoose = require('mongoose');

const scheduleSchema = new mongoose.Schema({
  email: String,
  date: Date,
  status: String,
  userType: String
}, { collection: 'schedule_service-schedules' });

const Schedule = mongoose.model('Schedule', scheduleSchema);

async function getUnavailableEmails(userType, tripDays) {
  // tripDays: array of ISO date strings
  const schedules = await Schedule.find({
    userType,
    date: { $in: tripDays.map(d => new Date(d)) },
    status: 'unavailable'
  });
  return schedules.map(s => s.email);
}

module.exports = { getUnavailableEmails };
