const DriverScore = require('../models/DriverScore');
const DriverTrips = require('../models/DriverTrips');
const { AppError, catchAsync } = require('../middleware/errorHandler');
const { datesOverlap } = require('../utils/scoring');

/**
 * Get the top available driver for a given time period
 * @route GET /api/v1/top-driver
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const getTopDriver = catchAsync(async (req, res) => {
  const { trip_start, trip_end } = req.query;
  
  // Convert dates for comparison
  const startDate = new Date(trip_start);
  const endDate = new Date(trip_end);
  
  // Get all active, non-banned drivers
  const drivers = await DriverScore.find({
    active: true,
    banned: false
  }).lean();
  
  if (!drivers || drivers.length === 0) {
    throw new AppError('No active drivers found', 404);
  }
  
  // Get all driver trips to check availability
  const driverEmails = drivers.map(driver => driver.email);
  const driverTrips = await DriverTrips.find({
    email: { $in: driverEmails }
  }).lean();
  
  // Create a map for quick lookup of trips by email
  const tripsMap = {};
  driverTrips.forEach(driverTrip => {
    tripsMap[driverTrip.email] = driverTrip.trips || [];
  });
  
  // Filter available drivers and calculate scores
  const availableDrivers = drivers
    .filter(driver => {
      const trips = tripsMap[driver.email] || [];
      
      // Check if driver is available (no overlapping trips)
      return !trips.some(trip => {
        return datesOverlap(startDate, endDate, trip.start_date, trip.end_date);
      });
    })
    .map(driver => {
      // Calculate score using the same logic as the model method
      const ratingScore = driver.rating * 20;
      const activeScore = driver.active ? 10 : 0;
      const bannedPenalty = driver.banned ? 100 : 0;
      const newDriverBonus = driver.newDriver ? 5 : 0;
      const experienceBonus = (10 - driver.first10Rides) * 2;
      const penaltyDeduction = driver.penalty;
      
      const totalScore = ratingScore + activeScore - bannedPenalty + newDriverBonus + experienceBonus - penaltyDeduction;
      
      return {
        ...driver,
        totalScore
      };
    })
    .sort((a, b) => b.totalScore - a.totalScore); // Sort by score descending
  
  if (availableDrivers.length === 0) {
    throw new AppError('No available driver found for the requested time period', 404);
  }
  
  const topDriver = availableDrivers[0];
  
  res.status(200).json({
    success: true,
    message: 'Top driver found successfully',
    data: {
      email: topDriver.email,
      score: topDriver.totalScore,
      details: {
        rating: topDriver.rating,
        active: topDriver.active,
        banned: topDriver.banned,
        newDriver: topDriver.newDriver,
        first10Rides: topDriver.first10Rides,
        penalty: topDriver.penalty
      }
    }
  });
});

/**
 * Assign a driver to a trip
 * @route POST /api/v1/assign-driver
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const assignDriver = catchAsync(async (req, res) => {
  const { email, trip_id, start_date, end_date } = req.body;
  
  // Check if driver exists and is eligible
  const driver = await DriverScore.findOne({
    email: email.toLowerCase(),
    active: true,
    banned: false
  });
  
  if (!driver) {
    throw new AppError('Driver not found or not eligible for assignment', 404);
  }
  
  // Convert dates
  const startDate = new Date(start_date);
  const endDate = new Date(end_date);
  
  // Find or create driver trips record
  let driverTrips = await DriverTrips.findOne({ email: email.toLowerCase() });
  
  if (!driverTrips) {
    driverTrips = new DriverTrips({
      email: email.toLowerCase(),
      trips: []
    });
  }
  
  // Check availability
  if (!driverTrips.isAvailable(startDate, endDate)) {
    throw new AppError('Driver is not available for the requested time period', 409);
  }
  
  // Add the trip
  await driverTrips.addTrip(trip_id, startDate, endDate);
  
  res.status(200).json({
    success: true,
    message: 'Driver assigned successfully',
    data: {
      email: driver.email,
      trip_id,
      start_date: startDate,
      end_date: endDate,
      driver_score: driver.calculateScore()
    }
  });
});

/**
 * Get all drivers with their scores
 * @route GET /api/v1/drivers
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const getAllDrivers = catchAsync(async (req, res) => {
  const drivers = await DriverScore.find().lean();
  
  const driversWithScores = drivers.map(driver => {
    const ratingScore = driver.rating * 20;
    const activeScore = driver.active ? 10 : 0;
    const bannedPenalty = driver.banned ? 100 : 0;
    const newDriverBonus = driver.newDriver ? 5 : 0;
    const experienceBonus = (10 - driver.first10Rides) * 2;
    const penaltyDeduction = driver.penalty;
    
    const totalScore = ratingScore + activeScore - bannedPenalty + newDriverBonus + experienceBonus - penaltyDeduction;
    
    return {
      ...driver,
      totalScore
    };
  });
  
  res.status(200).json({
    success: true,
    message: 'Drivers retrieved successfully',
    data: driversWithScores,
    count: driversWithScores.length
  });
});

/**
 * Create a new driver score record
 * @route POST /api/v1/drivers
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const createDriver = catchAsync(async (req, res) => {
  const driver = new DriverScore(req.body);
  await driver.save();
  
  res.status(201).json({
    success: true,
    message: 'Driver created successfully',
    data: driver
  });
});

/**
 * Get driver trips
 * @route GET /api/v1/drivers/:email/trips
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const getDriverTrips = catchAsync(async (req, res) => {
  const { email } = req.params;
  
  const driverTrips = await DriverTrips.findOne({ 
    email: email.toLowerCase() 
  });
  
  if (!driverTrips) {
    return res.status(200).json({
      success: true,
      message: 'Driver trips retrieved successfully',
      data: {
        email: email.toLowerCase(),
        trips: []
      }
    });
  }
  
  res.status(200).json({
    success: true,
    message: 'Driver trips retrieved successfully',
    data: driverTrips
  });
});

module.exports = {
  getTopDriver,
  assignDriver,
  getAllDrivers,
  createDriver,
  getDriverTrips
};
