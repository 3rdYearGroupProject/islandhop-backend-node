const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const mongoose = require('mongoose');
require('dotenv').config();

const controllers = require('./controllers/authControllers');

const app = express();
const PORT = process.env.PORT || 5002;

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(morgan('combined'));

// MongoDB Connection
mongoose.connect(process.env.MONGODB_URI || 'mongodb+srv://2022cs056:dH4aTFn3IOerWlVZ@cluster0.9ccambx.mongodb.net/For_Guides', {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(() => {
  console.log('✅ Connected to MongoDB Atlas - Guides Database');
})
.catch((error) => {
  console.error('❌ MongoDB connection error:', error);
  process.exit(1);
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    service: 'Guide Microservice',
    timestamp: new Date().toISOString(),
    port: PORT
  });
});

// All guide endpoints with exact URL structure

// Dashboard Routes - both with and without /api/guides prefix
app.get('/:guideId', controllers.getDashboard);
app.get('/:guideId/stats', controllers.getStats);
app.get('/:guideId/active', controllers.getActiveTours);
app.get('/:guideId/pending', controllers.getPendingTours);

// API Routes with /api/guides prefix (for frontend compatibility)
app.get('/api/guides/:guideId', controllers.getDashboard);
app.get('/api/guides/:guideId/stats', controllers.getStats);
app.get('/api/guides/:guideId/active-tours', controllers.getActiveTours);
app.get('/api/guides/:guideId/pending-requests', controllers.getPendingTours);

// Analytics Routes
app.get('/:guideId/analytics', controllers.getAnalytics);
app.get('/:guideId/analytics/locations/top', controllers.getTopLocations);
app.get('/:guideId/analytics/seasons/busy', controllers.getBusySeasons);
app.get('/api/guides/:guideId/analytics', controllers.getAnalytics);
app.get('/api/guides/:guideId/analytics/locations/top', controllers.getTopLocations);
app.get('/api/guides/:guideId/analytics/seasons/busy', controllers.getBusySeasons);

// Additional Analytics Routes (frontend expects these specific endpoints)
app.get('/api/guides/:guideId/top-locations', controllers.getTopLocationsAnalytics);
app.get('/api/guides/:guideId/busy-seasons', controllers.getBusySeasonsAnalytics);
app.get('/api/guides/:guideId/weekly-earnings', controllers.getWeeklyEarningsChart);

// NEW ANALYTICS ENDPOINTS REQUESTED BY USER
app.get('/api/guides/:guideId/top-tours', controllers.getTopTours);
app.get('/api/guides/:guideId/busy-hours', controllers.getBusyHours);
app.get('/api/guides/:guideId/customer-insights', controllers.getCustomerInsights);

// Tours Routes
app.get('/:guideId/tours', controllers.getTours);
app.get('/:guideId/tours/:tourId', controllers.getTourDetails);
app.put('/:guideId/tours/:tourId/status', controllers.updateTourStatus);
app.post('/:guideId/tours/:tourId/accept', controllers.acceptTour);
app.post('/:guideId/tours/:tourId/decline', controllers.declineTour);
app.get('/api/guides/:guideId/tours', controllers.getTours);
app.get('/api/guides/:guideId/tours/:tourId', controllers.getTourDetails);
app.put('/api/guides/:guideId/tours/:tourId/status', controllers.updateTourStatus);
app.post('/api/guides/:guideId/tours/:tourId/accept', controllers.acceptTour);
app.post('/api/guides/:guideId/tours/:tourId/decline', controllers.declineTour);

// Earnings Routes
app.get('/:guideId/earnings', controllers.getEarnings);
app.get('/:guideId/earnings/daily', controllers.getDailyEarnings);
app.get('/:guideId/earnings/weekly', controllers.getWeeklyEarnings);
app.get('/:guideId/earnings/monthly', controllers.getMonthlyEarnings);
app.get('/api/guides/:guideId/earnings', controllers.getEarnings);
app.get('/api/guides/:guideId/earnings/daily', controllers.getDailyEarnings);
app.get('/api/guides/:guideId/earnings/weekly', controllers.getWeeklyEarnings);
app.get('/api/guides/:guideId/earnings/monthly', controllers.getMonthlyEarnings);

// Additional Earnings Routes
app.get('/api/guides/:guideId/transactions', controllers.getTransactions);

// Reviews Routes
app.get('/:guideId/reviews', controllers.getReviews);
app.post('/:guideId/reviews/:reviewId/respond', controllers.respondToReview);
app.get('/api/guides/:guideId/reviews', controllers.getReviews);
app.post('/api/guides/:guideId/reviews/:reviewId/respond', controllers.respondToReview);

// Schedule Routes
app.get('/:guideId/schedule', controllers.getSchedule);
app.put('/:guideId/schedule', controllers.updateSchedule);
app.get('/api/guides/:guideId/schedule', controllers.getSchedule);
app.put('/api/guides/:guideId/schedule', controllers.updateSchedule);

// Additional Schedule Routes (POST endpoints for availability management)
app.post('/api/guides/:guideId/schedule/mark-unavailable', controllers.markUnavailable);
app.post('/api/guides/:guideId/schedule/mark-available', controllers.markAvailable);
app.post('/api/guides/:guideId/schedule/lock-days', controllers.lockDays);

// Chat Routes
app.get('/:guideId/groups', controllers.getGroups);
app.get('/:guideId/groups/:groupId/messages', controllers.getMessages);
app.get('/api/guides/:guideId/groups', controllers.getGroups);
app.get('/api/guides/:guideId/groups/:groupId/messages', controllers.getMessages);

// Profile Routes
app.get('/:guideId/profile', controllers.getProfile);
app.put('/:guideId/profile', controllers.updateProfile);
app.get('/:guideId/notifications', controllers.getNotifications);
app.post('/:guideId/notifications/:notificationId/read', controllers.markNotificationAsRead);
app.get('/api/guides/:guideId/profile', controllers.getProfile);
app.put('/api/guides/:guideId/profile', controllers.updateProfile);
app.get('/api/guides/:guideId/notifications', controllers.getNotifications);
app.post('/api/guides/:guideId/notifications/:notificationId/read', controllers.markNotificationAsRead);

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
      'GET /:guideId - Dashboard',
      'GET /:guideId/stats - Guide stats',
      'GET /:guideId/active - Active tours',
      'GET /:guideId/pending - Pending tours',
      'GET /:guideId/analytics - Analytics overview',
      'GET /:guideId/analytics/locations/top - Top locations',
      'GET /:guideId/analytics/seasons/busy - Busy seasons',
      'GET /:guideId/tours - Tour history',
      'GET /:guideId/tours/:tourId - Tour details',
      'GET /:guideId/earnings - Earnings overview',
      'GET /:guideId/earnings/daily - Daily earnings',
      'GET /:guideId/earnings/weekly - Weekly earnings',
      'GET /:guideId/earnings/monthly - Monthly earnings',
      'GET /:guideId/reviews - Guide reviews',
      'GET /:guideId/schedule - Guide schedule',
      'GET /:guideId/groups - Chat groups',
      'GET /:guideId/groups/:groupId/messages - Group messages',
      'GET /:guideId/profile - Guide profile',
      'GET /:guideId/notifications - Guide notifications'
    ]
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`🗺️ Guide Microservice running on port ${PORT}`);
  console.log(`📍 Health check: http://localhost:${PORT}/health`);
  console.log(`📖 Sample endpoint: http://localhost:${PORT}/guide@islandhop.lk`);
});

module.exports = app;
