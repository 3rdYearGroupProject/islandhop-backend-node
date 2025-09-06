const express = require('express');
const { createProxyMiddleware } = require('http-proxy-middleware');
const cors = require('cors');
const morgan = require('morgan');
const winston = require('winston');
require('dotenv').config();

const app = express();

// Configure Winston logger
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp({
      format: 'YYYY-MM-DD HH:mm:ss'
    }),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  defaultMeta: { service: 'api-gateway' },
  transports: [
    new winston.transports.File({ filename: 'logs/error.log', level: 'error' }),
    new winston.transports.File({ filename: 'logs/combined.log' }),
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      )
    })
  ]
});

// Enable CORS for all routes
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  credentials: true
}));

// Basic request logging with morgan
app.use(morgan('combined', {
  stream: {
    write: (message) => logger.info(message.trim())
  }
}));

// Parse JSON bodies
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    service: 'api-gateway'
  });
});

// Service configuration
const services = {
  // Existing services
  verification: {
    target: process.env.VERIFICATION_SERVICE_URL || 'http://localhost:8060',
    changeOrigin: true,
    timeout: 30000,
    retries: 3
  },
  supportAgent: {
    target: process.env.SUPPORT_AGENT_SERVICE_URL || 'http://localhost:8061',
    changeOrigin: true,
    timeout: 30000,
    retries: 3
  },
  email: {
    target: process.env.EMAIL_SERVICE_URL || 'http://localhost:8062',
    changeOrigin: true,
    timeout: 30000,
    retries: 3
  },
  users: {
    target: process.env.USER_SERVICE_URL || 'http://localhost:8063',
    changeOrigin: true,
    timeout: 30000,
    retries: 3
  },
  orders: {
    target: process.env.ORDER_SERVICE_URL || 'http://localhost:8064',
    changeOrigin: true,
    timeout: 30000,
    retries: 3
  },
  tripPlanning: {
    target: process.env.TRIP_PLANNING_SERVICE_URL || 'http://localhost:8065',
    changeOrigin: true,
    timeout: 30000,
    retries: 3
  },
  auth: {
    target: process.env.FIREBASE_AUTH_SERVICE_URL || 'http://localhost:8066',
    changeOrigin: true,
    timeout: 30000,
    retries: 3
  },
  emergency: {
    target: process.env.EMERGENCY_SERVICE_URL || 'http://localhost:8067',
    changeOrigin: true,
    timeout: 30000,
    retries: 3
  },
  payhere: {
    target: process.env.PAYHERE_SERVICE_URL || 'http://localhost:8068',
    changeOrigin: true,
    timeout: 30000,
    retries: 3
  },
  tripInitiation: {
    target: process.env.TRIP_INITIATION_SERVICE_URL || 'http://localhost:8069',
    changeOrigin: true,
    timeout: 30000,
    retries: 3
  },
  itinerary: {
    target: process.env.ITINERARY_SERVICE_URL || 'http://localhost:8084',
    changeOrigin: true,
    timeout: 30000,
    retries: 3
  },
  poolingConfirm: {
    target: process.env.POOLING_CONFIRM_SERVICE_URL || 'http://localhost:8071',
    changeOrigin: true,
    timeout: 30000,
    retries: 3
  }
};

// Proxy middleware configuration with error handling and logging
const createProxy = (serviceName, config) => {
  return createProxyMiddleware({
    ...config,
    onProxyReq: (proxyReq, req, res) => {
      logger.info(`[${serviceName.toUpperCase()}] Proxying ${req.method} ${req.originalUrl} to ${config.target}`);
    },
    onProxyRes: (proxyRes, req, res) => {
      logger.info(`[${serviceName.toUpperCase()}] Response ${proxyRes.statusCode} for ${req.method} ${req.originalUrl}`);
    },
    onError: (err, req, res) => {
      logger.error(`[${serviceName.toUpperCase()}] Proxy Error:`, {
        error: err.message,
        url: req.originalUrl,
        method: req.method,
        target: config.target
      });
      
      if (!res.headersSent) {
        res.status(503).json({
          error: 'Service Unavailable',
          message: `${serviceName} service is currently unavailable`,
          timestamp: new Date().toISOString()
        });
      }
    }
  });
};

// API Routes
app.use('/api/verification', createProxy('verification', services.verification));
app.use('/api/support-agent', createProxy('supportAgent', services.supportAgent));
app.use('/api/email', createProxy('email', services.email));
app.use('/api/users', createProxy('users', services.users));
app.use('/api/orders', createProxy('orders', services.orders));
app.use('/api/trip-planning', createProxy('tripPlanning', services.tripPlanning));
app.use('/api/auth', createProxy('auth', services.auth));
app.use('/api/emergency', createProxy('emergency', services.emergency));
app.use('/api/payments', createProxy('payhere', services.payhere));
app.use('/api/trip-initiation', createProxy('tripInitiation', services.tripInitiation));
app.use('/api/itinerary', createProxy('itinerary', services.itinerary));
app.use('/api/pooling-confirm', createProxy('poolingConfirm', services.poolingConfirm));

// API documentation endpoint
app.get('/api', (req, res) => {
  res.json({
    message: 'IslandHop API Gateway',
    version: '1.0.0',
    services: {
      '/api/verification': 'Driver and guide verification service',
      '/api/support-agent': 'Support agent management service',
      '/api/email': 'Email notification service',
      '/api/users': 'User management service',
      '/api/orders': 'Order management service',
      '/api/trip-planning': 'Trip planning and booking service',
      '/api/auth': 'Firebase authentication service',
      '/api/emergency': 'Emergency services',
      '/api/payments': 'PayHere payment processing',
      '/api/trip-initiation': 'Trip initiation service',
      '/api/itinerary': 'Trip itinerary management service',
      '/api/pooling-confirm': 'Pooling trip confirmation and payment service'
    },
    documentation: {
      health: 'GET /health - Service health check',
      api: 'GET /api - This documentation'
    }
  });
});

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    message: 'IslandHop API Gateway',
    status: 'running',
    version: '1.0.0',
    endpoints: {
      health: '/health',
      api: '/api'
    }
  });
});

// Global error handler for unhandled routes
app.use('*', (req, res) => {
  logger.warn(`Route not found: ${req.method} ${req.originalUrl}`);
  res.status(404).json({
    error: 'Route Not Found',
    message: `The requested route ${req.method} ${req.originalUrl} was not found`,
    timestamp: new Date().toISOString(),
    availableRoutes: [
      '/health',
      '/api',
      '/api/verification',
      '/api/support-agent',
      '/api/email',
      '/api/users',
      '/api/orders',
      '/api/trip-planning',
      '/api/auth',
      '/api/emergency',
      '/api/payments',
      '/api/trip-initiation',
      '/api/itinerary',
      '/api/pooling-confirm'
    ]
  });
});

// Global error handler for application errors
app.use((err, req, res, next) => {
  logger.error('Unhandled application error:', {
    error: err.message,
    stack: err.stack,
    url: req.originalUrl,
    method: req.method,
    ip: req.ip,
    userAgent: req.get('User-Agent')
  });

  if (!res.headersSent) {
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'An unexpected error occurred',
      timestamp: new Date().toISOString()
    });
  }
});

// Start the server
const PORT = process.env.PORT || 3000;
const HOST = process.env.HOST || '0.0.0.0';

app.listen(PORT, HOST, () => {
  logger.info(`🚀 API Gateway running on http://${HOST}:${PORT}`);
  logger.info('📋 Available services:');
  Object.entries(services).forEach(([name, config]) => {
    logger.info(`   • ${name}: ${config.target}`);
  });
  logger.info('📖 API Documentation: http://localhost:3000/api');
  logger.info('💚 Health Check: http://localhost:3000/health');
});

// Graceful shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM received, shutting down gracefully...');
  process.exit(0);
});

process.on('SIGINT', () => {
  logger.info('SIGINT received, shutting down gracefully...');
  process.exit(0);
});

module.exports = app;
