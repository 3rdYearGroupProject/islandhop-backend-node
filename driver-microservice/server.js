const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const mongoose = require('mongoose');
require('dotenv').config();

const controllers = require('./controllers/noAuthControllers');

const app = express();
const PORT = process.env.PORT || 5001;

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(morgan('combined'));

// MongoDB Connection
mongoose.connect(process.env.MONGODB_URI || 'mongodb+srv://2022cs056:dH4aTFn3IOerWlVZ@cluster0.9ccambx.mongodb.net/For_Drivers', {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(() => {
  console.log('✅ Connected to MongoDB Atlas');
})
.catch((error) => {
  console.error('❌ MongoDB connection error:', error);
  process.exit(1);
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    service: 'Driver Microservice',
    timestamp: new Date().toISOString(),
    port: PORT
  });
});

// All driver endpoints with exact URL structure as specified

// Dashboard Routes - both with and without /api/drivers prefix
app.get('/:driverId', controllers.getDashboard);
app.get('/:driverId/stats', controllers.getStats);
app.get('/:driverId/active', controllers.getActiveTrips);
app.get('/:driverId/pending', controllers.getPendingTrips);

// API Routes with /api/drivers prefix (for frontend compatibility)
app.get('/api/drivers/:driverId', controllers.getDashboard);
app.get('/api/drivers/:driverId/stats', controllers.getStats);
app.get('/api/drivers/:driverId/active-trips', controllers.getActiveTrips);
app.get('/api/drivers/:driverId/pending-requests', controllers.getPendingTrips);

// Analytics Routes
app.get('/:driverId/analytics', controllers.getAnalytics);
app.get('/:driverId/analytics/routes/top', controllers.getTopRoutes);
app.get('/:driverId/analytics/hours/busy', controllers.getBusyHours);
app.get('/api/drivers/:driverId/analytics', controllers.getAnalytics);
app.get('/api/drivers/:driverId/analytics/routes/top', controllers.getTopRoutes);
app.get('/api/drivers/:driverId/analytics/hours/busy', controllers.getBusyHours);

// Additional Analytics Routes (frontend expects these specific endpoints)
app.get('/api/drivers/:driverId/top-routes', controllers.getTopRoutesAnalytics);
app.get('/api/drivers/:driverId/busy-hours', controllers.getBusyHoursAnalytics);
app.get('/api/drivers/:driverId/weekly-earnings', controllers.getWeeklyEarningsChart);

// Trips Routes
app.get('/:driverId/trips', controllers.getTrips);
app.get('/:driverId/trips/:tripId', controllers.getTripDetails);
app.put('/:driverId/trips/:tripId/status', controllers.updateTripStatus);
app.post('/:driverId/trips/:tripId/accept', controllers.acceptTrip);
app.post('/:driverId/trips/:tripId/decline', controllers.declineTrip);
app.get('/api/drivers/:driverId/trips', controllers.getTrips);
app.get('/api/drivers/:driverId/trips/:tripId', controllers.getTripDetails);
app.put('/api/drivers/:driverId/trips/:tripId/status', controllers.updateTripStatus);
app.post('/api/drivers/:driverId/trips/:tripId/accept', controllers.acceptTrip);
app.post('/api/drivers/:driverId/trips/:tripId/decline', controllers.declineTrip);

// Earnings Routes
app.get('/:driverId/earnings', controllers.getEarnings);
app.get('/:driverId/earnings/daily', controllers.getDailyEarnings);
app.get('/:driverId/earnings/weekly', controllers.getWeeklyEarnings);
app.get('/:driverId/earnings/monthly', controllers.getMonthlyEarnings);
app.get('/api/drivers/:driverId/earnings', controllers.getEarnings);
app.get('/api/drivers/:driverId/earnings/daily', controllers.getDailyEarnings);
app.get('/api/drivers/:driverId/earnings/weekly', controllers.getWeeklyEarnings);
app.get('/api/drivers/:driverId/earnings/monthly', controllers.getMonthlyEarnings);

// Additional Earnings Routes
app.get('/api/drivers/:driverId/transactions', controllers.getTransactions);

// Reviews Routes
app.get('/:driverId/reviews', controllers.getReviews);
app.post('/:driverId/reviews/:reviewId/respond', controllers.respondToReview);
app.get('/api/drivers/:driverId/reviews', controllers.getReviews);
app.post('/api/drivers/:driverId/reviews/:reviewId/respond', controllers.respondToReview);

// Schedule Routes
app.get('/:driverId/schedule', controllers.getSchedule);
app.put('/:driverId/schedule', controllers.updateSchedule);
app.get('/api/drivers/:driverId/schedule', controllers.getSchedule);
app.put('/api/drivers/:driverId/schedule', controllers.updateSchedule);

// Additional Schedule Routes (POST endpoints for availability management)
app.post('/api/drivers/:driverId/schedule/mark-unavailable', controllers.markUnavailable);
app.post('/api/drivers/:driverId/schedule/mark-available', controllers.markAvailable);
app.post('/api/drivers/:driverId/schedule/lock-days', controllers.lockDays);

// Chat Routes
app.get('/:driverId/groups', controllers.getGroups);
app.get('/:driverId/groups/:groupId/messages', controllers.getMessages);
app.get('/api/drivers/:driverId/groups', controllers.getGroups);
app.get('/api/drivers/:driverId/groups/:groupId/messages', controllers.getMessages);

// Profile Routes
app.get('/:driverId/profile', controllers.getProfile);
app.put('/:driverId/profile', controllers.updateProfile);
app.get('/:driverId/notifications', controllers.getNotifications);
app.post('/:driverId/notifications/:notificationId/read', controllers.markNotificationAsRead);
app.get('/api/drivers/:driverId/profile', controllers.getProfile);
app.put('/api/drivers/:driverId/profile', controllers.updateProfile);
app.get('/api/drivers/:driverId/notifications', controllers.getNotifications);
app.post('/api/drivers/:driverId/notifications/:notificationId/read', controllers.markNotificationAsRead);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({
    success: false,
    message: 'Internal server error',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: `Route ${req.originalUrl} not found`,
    availableEndpoints: [
      'GET /:driverId - Dashboard',
      'GET /:driverId/stats - Driver stats',
      'GET /:driverId/active - Active trips',
      'GET /:driverId/pending - Pending trips',
      'GET /:driverId/analytics - Analytics overview',
      'GET /:driverId/analytics/routes/top - Top routes',
      'GET /:driverId/analytics/hours/busy - Busy hours',
      'GET /:driverId/trips - Trip history',
      'GET /:driverId/trips/:tripId - Trip details',
      'GET /:driverId/earnings - Earnings overview',
      'GET /:driverId/earnings/daily - Daily earnings',
      'GET /:driverId/earnings/weekly - Weekly earnings',
      'GET /:driverId/earnings/monthly - Monthly earnings',
      'GET /:driverId/reviews - Driver reviews',
      'GET /:driverId/schedule - Driver schedule',
      'GET /:driverId/groups - Chat groups',
      'GET /:driverId/groups/:groupId/messages - Group messages',
      'GET /:driverId/profile - Driver profile',
      'GET /:driverId/notifications - Driver notifications'
    ]
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Driver Microservice running on port ${PORT}`);
  console.log(`📍 Health check: http://localhost:${PORT}/health`);
  console.log(`📖 Sample endpoint: http://localhost:${PORT}/68baa74ac925feea49d80149`);
});

module.exports = app;
