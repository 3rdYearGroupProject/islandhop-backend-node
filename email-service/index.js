require('dotenv').config();
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const config = require('./config');
const { logger, testEmailConfig } = require('./email');

const app = express();

// Enable CORS for all routes
app.use(cors({
  origin: config.FRONTEND_URL,
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
}));

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan('combined', { 
  stream: { write: message => logger.info(message.trim()) }
}));

// Import routes
const emailRoutes = require('./routes/email');

// Routes
app.use('/api/v1/email', emailRoutes);

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    service: 'email-service',
    timestamp: new Date().toISOString(),
    port: config.PORT
  });
});

// Test email configuration endpoint
app.get('/test-config', async (req, res) => {
  try {
    const isValid = await testEmailConfig();
    res.status(200).json({
      status: isValid ? 'OK' : 'FAILED',
      message: isValid ? 'Email configuration is valid' : 'Email configuration failed',
      service: 'email-service'
    });
  } catch (error) {
    res.status(500).json({
      status: 'ERROR',
      message: 'Failed to test email configuration',
      error: error.message
    });
  }
});

// Error handling middleware
app.use((err, req, res, next) => {
  logger.error('Unhandled error:', err);
  res.status(500).json({
    error: 'Internal Server Error',
    message: config.NODE_ENV === 'development' ? err.message : 'Something went wrong'
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Not Found',
    message: 'The requested resource was not found'
  });
});

// Start server
app.listen(config.PORT, () => {
  logger.info(`Email service running on port ${config.PORT}`);
  console.log(`Email service running on http://localhost:${config.PORT}`);
  
  // Test email configuration on startup
  testEmailConfig().then(isValid => {
    if (isValid) {
      logger.info('Email service initialized successfully');
    } else {
      logger.warn('Email service started but email configuration may need attention');
    }
  });
});

module.exports = app;
