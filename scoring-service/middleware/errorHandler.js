/**
 * Custom error class for application-specific errors
 */
class AppError extends Error {
  constructor(message, statusCode = 500, isOperational = true) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    this.name = this.constructor.name;
    
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Handles MongoDB validation errors
 * @param {Error} err - MongoDB validation error
 * @returns {AppError} Formatted error
 */
function handleValidationError(err) {
  const errors = Object.values(err.errors).map(error => ({
    field: error.path,
    message: error.message
  }));
  
  return new AppError('Validation failed', 400, true, errors);
}

/**
 * Handles MongoDB duplicate key errors
 * @param {Error} err - MongoDB duplicate key error
 * @returns {AppError} Formatted error
 */
function handleDuplicateKeyError(err) {
  const field = Object.keys(err.keyValue)[0];
  const value = err.keyValue[field];
  
  return new AppError(`${field} '${value}' already exists`, 409);
}

/**
 * Handles MongoDB cast errors
 * @param {Error} err - MongoDB cast error
 * @returns {AppError} Formatted error
 */
function handleCastError(err) {
  return new AppError(`Invalid ${err.path}: ${err.value}`, 400);
}

/**
 * Global error handling middleware
 * @param {Error} err - Error object
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
function errorHandler(err, req, res, next) {
  let error = { ...err };
  error.message = err.message;

  // Log error for debugging
  console.error('\n=== ERROR ===');
  console.error('Time:', new Date().toISOString());
  console.error('URL:', req.originalUrl);
  console.error('Method:', req.method);
  console.error('Error:', err.stack || err);
  console.error('=============\n');

  // Handle specific MongoDB errors
  if (err.name === 'ValidationError') {
    error = handleValidationError(err);
  } else if (err.code === 11000) {
    error = handleDuplicateKeyError(err);
  } else if (err.name === 'CastError') {
    error = handleCastError(err);
  } else if (err.name === 'JsonWebTokenError') {
    error = new AppError('Invalid token', 401);
  } else if (err.name === 'TokenExpiredError') {
    error = new AppError('Token expired', 401);
  }

  // Default to generic error if not handled above
  if (!error.isOperational) {
    error = new AppError('Internal server error', 500);
  }

  // Send error response
  const response = {
    success: false,
    message: error.message,
    ...(process.env.NODE_ENV === 'development' && { 
      stack: err.stack,
      error: err 
    })
  };

  // Add errors array if it exists
  if (error.errors) {
    response.errors = error.errors;
  }

  res.status(error.statusCode || 500).json(response);
}

/**
 * Middleware for handling 404 errors
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
function notFoundHandler(req, res, next) {
  const error = new AppError(`Route ${req.originalUrl} not found`, 404);
  next(error);
}

/**
 * Async wrapper for route handlers
 * @param {Function} fn - Async function to wrap
 * @returns {Function} Express middleware function
 */
function catchAsync(fn) {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

module.exports = {
  AppError,
  errorHandler,
  notFoundHandler,
  catchAsync
};
