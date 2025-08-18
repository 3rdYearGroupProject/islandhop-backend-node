/**
 * Calculates the total score for a driver or guide based on their attributes
 * Formula: (Rating * 20) + (Active ? 10 : 0) - (Banned ? 100 : 0) + (NewDriver ? 5 : 0) + (10 - First10Rides) * 2 - Penalty
 * 
 * @param {Object} profile - The driver or guide profile
 * @param {number} profile.rating - Rating from 0-5
 * @param {boolean} profile.active - Whether the person is active
 * @param {boolean} profile.banned - Whether the person is banned
 * @param {boolean} profile.newDriver - Whether the person is new
 * @param {number} profile.first10Rides - Number from 1-10 indicating experience level
 * @param {number} profile.penalty - Penalty points from 0-100
 * @returns {number} Total calculated score
 */
function calculateScore({ rating, active, banned, newDriver, first10Rides, penalty }) {
  // Validate inputs
  if (typeof rating !== 'number' || rating < 0 || rating > 5) {
    throw new Error('Rating must be a number between 0 and 5');
  }
  
  if (typeof active !== 'boolean') {
    throw new Error('Active must be a boolean');
  }
  
  if (typeof banned !== 'boolean') {
    throw new Error('Banned must be a boolean');
  }
  
  if (typeof newDriver !== 'boolean') {
    throw new Error('NewDriver must be a boolean');
  }
  
  if (!Number.isInteger(first10Rides) || first10Rides < 1 || first10Rides > 10) {
    throw new Error('First10Rides must be an integer between 1 and 10');
  }
  
  if (!Number.isInteger(penalty) || penalty < 0 || penalty > 100) {
    throw new Error('Penalty must be an integer between 0 and 100');
  }
  
  // Calculate score components
  const ratingScore = rating * 20;
  const activeScore = active ? 10 : 0;
  const bannedPenalty = banned ? 100 : 0;
  const newDriverBonus = newDriver ? 5 : 0;
  const experienceBonus = (10 - first10Rides) * 2;
  const penaltyDeduction = penalty;
  
  const totalScore = ratingScore + activeScore - bannedPenalty + newDriverBonus + experienceBonus - penaltyDeduction;
  
  return totalScore;
}

/**
 * Checks if two date ranges overlap
 * @param {Date} start1 - Start date of first range
 * @param {Date} end1 - End date of first range
 * @param {Date} start2 - Start date of second range
 * @param {Date} end2 - End date of second range
 * @returns {boolean} True if ranges overlap
 */
function datesOverlap(start1, end1, start2, end2) {
  const startDate1 = new Date(start1);
  const endDate1 = new Date(end1);
  const startDate2 = new Date(start2);
  const endDate2 = new Date(end2);
  
  // Validate dates
  if (isNaN(startDate1) || isNaN(endDate1) || isNaN(startDate2) || isNaN(endDate2)) {
    throw new Error('All dates must be valid');
  }
  
  if (startDate1 >= endDate1 || startDate2 >= endDate2) {
    throw new Error('Start date must be before end date');
  }
  
  // Check for overlap: ranges overlap if start of one is before end of other and vice versa
  return startDate1 < endDate2 && endDate1 > startDate2;
}

/**
 * Validates date string and converts to Date object
 * @param {string} dateString - Date string to validate
 * @param {string} fieldName - Name of the field for error messages
 * @returns {Date} Valid Date object
 */
function validateAndParseDate(dateString, fieldName = 'date') {
  if (!dateString) {
    throw new Error(`${fieldName} is required`);
  }
  
  const date = new Date(dateString);
  
  if (isNaN(date)) {
    throw new Error(`${fieldName} must be a valid date`);
  }
  
  return date;
}

/**
 * Validates email format
 * @param {string} email - Email to validate
 * @returns {boolean} True if email is valid
 */
function isValidEmail(email) {
  const emailRegex = /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/;
  return emailRegex.test(email);
}

/**
 * Validates trip ID format
 * @param {string} tripId - Trip ID to validate
 * @returns {boolean} True if trip ID is valid
 */
function isValidTripId(tripId) {
  return typeof tripId === 'string' && tripId.trim().length > 0;
}

module.exports = {
  calculateScore,
  datesOverlap,
  validateAndParseDate,
  isValidEmail,
  isValidTripId
};
