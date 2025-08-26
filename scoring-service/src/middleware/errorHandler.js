const logger = require('../utils/logger');

module.exports = (err, req, res, next) => {
  console.log('[ERROR HANDLER] Error caught:', err.message);
  console.log('[ERROR HANDLER] Error stack:', err.stack);
  console.log('[ERROR HANDLER] Request URL:', req.url);
  console.log('[ERROR HANDLER] Request method:', req.method);
  console.log('[ERROR HANDLER] Request body:', req.body);
  
  logger.error(err.stack || err.message);
  
  const statusCode = err.status || 500;
  const errorMessage = err.message || 'Internal Server Error';
  
  console.log('[ERROR HANDLER] Sending error response - Status:', statusCode, 'Message:', errorMessage);
  
  res.status(statusCode).json({
    error: errorMessage
  });
};
