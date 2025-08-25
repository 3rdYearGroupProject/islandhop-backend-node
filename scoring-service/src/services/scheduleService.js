const mongoose = require('mongoose');

const scheduleSchema = new mongoose.Schema({
  email: String,
  date: Date,
  status: String,
  userType: String
}, { collection: 'schedule_service-schedules' });

const Schedule = mongoose.model('Schedule', scheduleSchema);

async function getUnavailableEmails(userType, tripDays) {
  console.log('[SCHEDULE SERVICE] Checking unavailable emails for userType:', userType, 'tripDays:', tripDays);
  
  // tripDays: array of ISO date strings
  const dateObjects = tripDays.map(d => new Date(d));
  console.log('[SCHEDULE SERVICE] Converted dates to objects:', dateObjects);
  
  const schedules = await Schedule.find({
    userType,
    date: { $in: dateObjects },
    status: 'unavailable'
  });
  
  console.log('[SCHEDULE SERVICE] Found', schedules.length, 'unavailable schedule entries');
  
  const unavailableEmails = schedules.map(s => s.email);
  console.log('[SCHEDULE SERVICE] Unavailable emails:', unavailableEmails);
  
  return unavailableEmails;
}

module.exports = { getUnavailableEmails };
