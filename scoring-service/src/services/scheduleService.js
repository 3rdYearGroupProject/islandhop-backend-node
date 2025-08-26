const mongoose = require('mongoose');

const scheduleSchema = new mongoose.Schema({
  email: String,
  date: Date,
  status: String,
  userType: String,
  tripId: mongoose.Schema.Types.Mixed
}, { collection: 'schedules' });

const Schedule = mongoose.model('Schedule', scheduleSchema);

async function getUnavailableEmails(userType, tripDays) {
  console.log('[SCHEDULE SERVICE] Checking unavailable emails for userType:', userType, 'tripDays:', tripDays);
  
  // tripDays: array of ISO date strings
  const dateObjects = tripDays.map(d => new Date(d));
  console.log('[SCHEDULE SERVICE] Converted dates to objects:', dateObjects);
  
  const query = {
    userType,
    date: { $in: dateObjects },
    status: 'unavailable'
  };
  console.log('[SCHEDULE SERVICE] MongoDB query:', JSON.stringify(query, null, 2));
  
  const schedules = await Schedule.find(query);
  
  console.log('[SCHEDULE SERVICE] Found', schedules.length, 'unavailable schedule entries');
  
  if (schedules.length > 0) {
    console.log('[SCHEDULE SERVICE] Sample schedule entry:', JSON.stringify(schedules[0], null, 2));
  }
  
  const unavailableEmails = schedules.map(s => s.email);
  console.log('[SCHEDULE SERVICE] Unavailable emails:', unavailableEmails);
  
  return unavailableEmails;
}

module.exports = { getUnavailableEmails };
