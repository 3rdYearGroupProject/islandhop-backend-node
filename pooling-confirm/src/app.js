const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
require('dotenv').config();

const connectDB = require('./config/database');
const logger = require('./config/logger');
const errorHandler = require('./middleware/errorHandler');
const rateLimiter = require('./middleware/rateLimiter');

// Import routes
const poolingConfirmRoutes = require('./routes/poolingConfirmRoutes');

const app = express();

// Connect to database
connectDB();

// Security middleware
app.use(helmet({
  contentSecurityPolicy: false,
  crossOriginEmbedderPolicy: false
}));

// CORS configuration
app.use(cors({
  origin: process.env.CORS_ORIGIN || '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'X-User-ID'],
  credentials: true
}));

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Request logging
app.use(morgan('combined', {
  stream: {
    write: (message) => logger.info(message.trim())
  }
}));

// Rate limiting
app.use(rateLimiter.middleware());

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Pooling Confirm Service is running',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    service: 'pooling-confirm-service',
    version: process.env.npm_package_version || '1.0.0'
  });
});

// API routes
app.use('/api/v1/pooling-confirm', poolingConfirmRoutes);

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    message: 'IslandHop Pooling Confirmation Service',
    version: '1.0.0',
    status: 'running',
    endpoints: {
      health: '/health',
      api: '/api/v1/pooling-confirm',
      documentation: '/api/v1/pooling-confirm/docs'
    }
  });
});

// API documentation endpoint
app.get('/api/v1/pooling-confirm/docs', (req, res) => {
  res.json({
    service: 'Pooling Confirmation Service',
    version: '1.0.0',
    description: 'Microservice for confirming pooling trips and handling payments',
    endpoints: {
      'POST /api/v1/pooling-confirm/initiate': {
        description: 'Initiate trip confirmation process',
        body: {
          groupId: 'string (required)',
          userId: 'string (required)',
          minMembers: 'number (optional, default: 2)',
          maxMembers: 'number (optional, default: 12)',
          tripStartDate: 'string ISO date (required)',
          tripEndDate: 'string ISO date (required)',
          confirmationHours: 'number (optional, default: 48)',
          totalAmount: 'number (optional, default: 0)',
          pricePerPerson: 'number (optional, default: 0)',
          currency: 'string (optional, default: LKR)',
          paymentDeadlineHours: 'number (optional, default: 72)',
          tripDetails: 'object (optional)'
        }
      },
      'POST /api/v1/pooling-confirm/:confirmedTripId/confirm': {
        description: 'Member confirms participation',
        params: { confirmedTripId: 'string (MongoDB ObjectId)' },
        body: { userId: 'string (required)' }
      },
      'GET /api/v1/pooling-confirm/:confirmedTripId/status': {
        description: 'Get confirmation status',
        params: { confirmedTripId: 'string (MongoDB ObjectId)' },
        query: { userId: 'string (required)' }
      },
      'POST /api/v1/pooling-confirm/:confirmedTripId/cancel': {
        description: 'Cancel trip confirmation',
        params: { confirmedTripId: 'string (MongoDB ObjectId)' },
        body: { userId: 'string (required)', reason: 'string (optional)' }
      },
      'GET /api/v1/pooling-confirm/user/:userId/trips': {
        description: 'Get user confirmed trips',
        params: { userId: 'string' },
        query: { status: 'string (optional)', page: 'number (optional)', limit: 'number (optional)' }
      }
    },
    statusCodes: {
      200: 'Success',
      201: 'Created',
      400: 'Bad Request',
      403: 'Forbidden',
      404: 'Not Found',
      409: 'Conflict',
      410: 'Gone (deadline passed)',
      429: 'Too Many Requests',
      500: 'Internal Server Error',
      503: 'Service Unavailable'
    }
  });
});

// Handle 404 for unknown routes
app.use('*', (req, res) => {
  logger.warn(`Route not found: ${req.method} ${req.originalUrl}`);
  res.status(404).json({
    success: false,
    message: `Route ${req.method} ${req.originalUrl} not found`,
    availableRoutes: [
      'GET /',
      'GET /health',
      'GET /api/v1/pooling-confirm/docs',
      'POST /api/v1/pooling-confirm/initiate',
      'POST /api/v1/pooling-confirm/:id/confirm',
      'GET /api/v1/pooling-confirm/:id/status',
      'POST /api/v1/pooling-confirm/:id/cancel',
      'GET /api/v1/pooling-confirm/user/:userId/trips'
    ]
  });
});

// Global error handler (must be last middleware)
app.use(errorHandler);

const PORT = process.env.PORT || 8071;
const HOST = process.env.HOST || '0.0.0.0';

const server = app.listen(PORT, HOST, () => {
  logger.info(`🚀 Pooling Confirm Service running on http://${HOST}:${PORT}`);
  logger.info(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
  logger.info(`📋 API Documentation: http://${HOST}:${PORT}/api/v1/pooling-confirm/docs`);
  logger.info(`💚 Health Check: http://${HOST}:${PORT}/health`);
});

// Graceful shutdown
const gracefulShutdown = (signal) => {
  logger.info(`${signal} received, shutting down gracefully...`);
  server.close(() => {
    logger.info('Server closed');
    process.exit(0);
  });
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Handle unhandled promise rejections
process.on('unhandledRejection', (err, promise) => {
  logger.error('Unhandled Promise Rejection:', err);
  server.close(() => {
    process.exit(1);
  });
});

module.exports = app;
