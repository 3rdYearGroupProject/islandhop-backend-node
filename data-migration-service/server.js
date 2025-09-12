const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

// Import controllers
const migrationController = require('./controllers/migrationController');
const healthController = require('./controllers/healthController');
const tripSyncController = require('./controllers/tripSyncController');

const app = express();
const PORT = process.env.PORT || 5003;

// Security middleware
app.use(helmet());
app.use(cors());
app.use(compression());

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.'
});
app.use(limiter);

// Logging
app.use(morgan('combined'));

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// MongoDB Connection
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://2022cs056:dH4aTFn3IOerWlVZ@cluster0.9ccambx.mongodb.net/For_Drivers';

mongoose.connect(MONGODB_URI)
  .then(() => {
    console.log('✅ Connected to MongoDB Atlas - Data Migration Service');
  })
  .catch((error) => {
    console.error('❌ MongoDB connection failed:', error);
    process.exit(1);
  });

// Health check route
app.get('/health', healthController.checkHealth);
app.get('/', healthController.getServiceInfo);

// Migration routes
app.get('/api/migrations', migrationController.listMigrations);
app.post('/api/migrations/copy', migrationController.copyData);
app.post('/api/migrations/sync', migrationController.syncData);
app.post('/api/migrations/backup', migrationController.backupCollection);
app.post('/api/migrations/restore', migrationController.restoreCollection);
app.get('/api/migrations/:migrationId/status', migrationController.getMigrationStatus);
app.delete('/api/migrations/:migrationId', migrationController.deleteMigration);

// Collection management routes
app.get('/api/collections', migrationController.listCollections);
app.get('/api/collections/:collectionName/count', migrationController.getCollectionCount);
app.get('/api/collections/:collectionName/sample', migrationController.getSampleData);
app.post('/api/collections/:collectionName/validate', migrationController.validateCollection);

// Scheduled migration routes
app.post('/api/schedules', migrationController.createSchedule);
app.get('/api/schedules', migrationController.listSchedules);
app.delete('/api/schedules/:scheduleId', migrationController.deleteSchedule);

// Trip sync service routes
app.post('/api/trip-sync/initialize', tripSyncController.initializeService);
app.post('/api/trip-sync/start', tripSyncController.startMonitoring);
app.post('/api/trip-sync/stop', tripSyncController.stopMonitoring);
app.get('/api/trip-sync/status', tripSyncController.getStatus);
app.post('/api/trip-sync/sync-now', tripSyncController.manualSync);
app.get('/api/trip-sync/stats', tripSyncController.getSyncStats);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('❌ Error:', err);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal server error',
    error: process.env.NODE_ENV === 'development' ? err.stack : undefined
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'Endpoint not found',
    availableEndpoints: [
      'GET /health - Health check',
      'GET /api/collections - List all collections',
      'POST /api/migrations/copy - Copy data between collections',
      'POST /api/migrations/sync - Sync data between collections',
      'GET /api/migrations - List all migrations',
      'GET /api/migrations/:id/status - Get migration status'
    ]
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`🔄 Data Migration Microservice running on port ${PORT}`);
  console.log(`📍 Health check: http://localhost:${PORT}/health`);
  console.log(`📊 Collections: http://localhost:${PORT}/api/collections`);
  console.log(`🔄 Migrations: http://localhost:${PORT}/api/migrations`);
});

module.exports = app;