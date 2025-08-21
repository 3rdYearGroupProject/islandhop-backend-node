const validator = require('validator');

// Validate email format
const validateEmail = (email) => {
  return validator.isEmail(email);
};

// Validate date format (YYYY-MM-DD)
const validateDate = (dateString) => {
  const date = new Date(dateString);
  return !isNaN(date.getTime()) && dateString.match(/^\d{4}-\d{2}-\d{2}$/);
};

// Validate user type
const validateUserType = (userType) => {
  return ['driver', 'guide'].includes(userType);
};

// Validate month format (YYYY-MM)
const validateMonth = (monthString) => {
  return monthString.match(/^\d{4}-\d{2}$/);
};

// Middleware to validate mark unavailable request
const validateMarkUnavailable = (req, res, next) => {
  const { userType } = req.params;
  const { email, dates } = req.body;

  // Validate user type
  if (!validateUserType(userType)) {
    return res.status(400).json({
      success: false,
      message: 'Invalid user type. Must be either "driver" or "guide"'
    });
  }

  // Validate email
  if (!email || !validateEmail(email)) {
    return res.status(400).json({
      success: false,
      message: 'Valid email is required'
    });
  }

  // Validate dates
  if (!dates || !Array.isArray(dates) || dates.length === 0) {
    return res.status(400).json({
      success: false,
      message: 'Dates array is required and must not be empty'
    });
  }

  // Validate each date
  for (const date of dates) {
    if (!validateDate(date)) {
      return res.status(400).json({
        success: false,
        message: `Invalid date format: ${date}. Use YYYY-MM-DD format`
      });
    }
  }

  next();
};

// Middleware to validate unmark available request
const validateUnmarkAvailable = (req, res, next) => {
  const { userType } = req.params;
  const { email, dates } = req.body;

  // Validate user type
  if (!validateUserType(userType)) {
    return res.status(400).json({
      success: false,
      message: 'Invalid user type. Must be either "driver" or "guide"'
    });
  }

  // Validate email
  if (!email || !validateEmail(email)) {
    return res.status(400).json({
      success: false,
      message: 'Valid email is required'
    });
  }

  // Validate dates
  if (!dates || !Array.isArray(dates) || dates.length === 0) {
    return res.status(400).json({
      success: false,
      message: 'Dates array is required and must not be empty'
    });
  }

  // Validate each date
  for (const date of dates) {
    if (!validateDate(date)) {
      return res.status(400).json({
        success: false,
        message: `Invalid date format: ${date}. Use YYYY-MM-DD format`
      });
    }
  }

  next();
};

// Middleware to validate lock request
const validateLock = (req, res, next) => {
  const { userType } = req.params;
  const { email, dates, tripId } = req.body;

  // Validate user type
  if (!validateUserType(userType)) {
    return res.status(400).json({
      success: false,
      message: 'Invalid user type. Must be either "driver" or "guide"'
    });
  }

  // Validate email
  if (!email || !validateEmail(email)) {
    return res.status(400).json({
      success: false,
      message: 'Valid email is required'
    });
  }

  // Validate dates
  if (!dates || !Array.isArray(dates) || dates.length === 0) {
    return res.status(400).json({
      success: false,
      message: 'Dates array is required and must not be empty'
    });
  }

  // Validate each date
  for (const date of dates) {
    if (!validateDate(date)) {
      return res.status(400).json({
        success: false,
        message: `Invalid date format: ${date}. Use YYYY-MM-DD format`
      });
    }
  }

  // Validate tripId if provided (optional)
  if (tripId !== undefined && tripId !== null) {
    if (typeof tripId !== 'string' || tripId.trim() === '') {
      return res.status(400).json({
        success: false,
        message: 'Trip ID must be a non-empty string if provided'
      });
    }
  }

  next();
};

// Middleware to validate get available days request
const validateGetAvailable = (req, res, next) => {
  const { userType } = req.params;
  const { email, month } = req.query;

  // Validate user type
  if (!validateUserType(userType)) {
    return res.status(400).json({
      success: false,
      message: 'Invalid user type. Must be either "driver" or "guide"'
    });
  }

  // Validate email
  if (!email || !validateEmail(email)) {
    return res.status(400).json({
      success: false,
      message: 'Valid email is required'
    });
  }

  // Validate month
  if (!month || !validateMonth(month)) {
    return res.status(400).json({
      success: false,
      message: 'Valid month is required in YYYY-MM format'
    });
  }

  next();
};

module.exports = {
  validateMarkUnavailable,
  validateUnmarkAvailable,
  validateLock,
  validateGetAvailable
};
