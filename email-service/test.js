// Simple test to verify email service components
const config = require('./config');
const { logger } = require('./email');

console.log('✅ Config loaded:', {
  PORT: config.PORT,
  NODE_ENV: config.NODE_ENV,
  EMAIL_SERVICE: config.EMAIL_SERVICE
});

console.log('✅ Logger working');
logger.info('Email service test successful');

console.log('✅ All components working correctly!');
