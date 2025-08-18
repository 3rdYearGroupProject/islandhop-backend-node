const GuideScore = require('../models/GuideScore');
const GuideTrips = require('../models/GuideTrips');
const { AppError, catchAsync } = require('../middleware/errorHandler');
const { datesOverlap } = require('../utils/scoring');

/**
 * Get the top available guide for a given time period
 * @route GET /api/v1/top-guide
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const getTopGuide = catchAsync(async (req, res) => {
  const { trip_start, trip_end } = req.query;
  
  // Convert dates for comparison
  const startDate = new Date(trip_start);
  const endDate = new Date(trip_end);
  
  // Get all active, non-banned guides
  const guides = await GuideScore.find({
    active: true,
    banned: false
  }).lean();
  
  if (!guides || guides.length === 0) {
    throw new AppError('No active guides found', 404);
  }
  
  // Get all guide trips to check availability
  const guideEmails = guides.map(guide => guide.email);
  const guideTrips = await GuideTrips.find({
    email: { $in: guideEmails }
  }).lean();
  
  // Create a map for quick lookup of trips by email
  const tripsMap = {};
  guideTrips.forEach(guideTrip => {
    tripsMap[guideTrip.email] = guideTrip.trips || [];
  });
  
  // Filter available guides and calculate scores
  const availableGuides = guides
    .filter(guide => {
      const trips = tripsMap[guide.email] || [];
      
      // Check if guide is available (no overlapping trips)
      return !trips.some(trip => {
        return datesOverlap(startDate, endDate, trip.start_date, trip.end_date);
      });
    })
    .map(guide => {
      // Calculate score using the same logic as the model method
      const ratingScore = guide.rating * 20;
      const activeScore = guide.active ? 10 : 0;
      const bannedPenalty = guide.banned ? 100 : 0;
      const newDriverBonus = guide.newDriver ? 5 : 0;
      const experienceBonus = (10 - guide.first10Rides) * 2;
      const penaltyDeduction = guide.penalty;
      
      const totalScore = ratingScore + activeScore - bannedPenalty + newDriverBonus + experienceBonus - penaltyDeduction;
      
      return {
        ...guide,
        totalScore
      };
    })
    .sort((a, b) => b.totalScore - a.totalScore); // Sort by score descending
  
  if (availableGuides.length === 0) {
    throw new AppError('No available guide found for the requested time period', 404);
  }
  
  const topGuide = availableGuides[0];
  
  res.status(200).json({
    success: true,
    message: 'Top guide found successfully',
    data: {
      email: topGuide.email,
      score: topGuide.totalScore,
      details: {
        rating: topGuide.rating,
        active: topGuide.active,
        banned: topGuide.banned,
        newDriver: topGuide.newDriver,
        first10Rides: topGuide.first10Rides,
        penalty: topGuide.penalty
      }
    }
  });
});

/**
 * Assign a guide to a trip
 * @route POST /api/v1/assign-guide
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const assignGuide = catchAsync(async (req, res) => {
  const { email, trip_id, start_date, end_date } = req.body;
  
  // Check if guide exists and is eligible
  const guide = await GuideScore.findOne({
    email: email.toLowerCase(),
    active: true,
    banned: false
  });
  
  if (!guide) {
    throw new AppError('Guide not found or not eligible for assignment', 404);
  }
  
  // Convert dates
  const startDate = new Date(start_date);
  const endDate = new Date(end_date);
  
  // Find or create guide trips record
  let guideTrips = await GuideTrips.findOne({ email: email.toLowerCase() });
  
  if (!guideTrips) {
    guideTrips = new GuideTrips({
      email: email.toLowerCase(),
      trips: []
    });
  }
  
  // Check availability
  if (!guideTrips.isAvailable(startDate, endDate)) {
    throw new AppError('Guide is not available for the requested time period', 409);
  }
  
  // Add the trip
  await guideTrips.addTrip(trip_id, startDate, endDate);
  
  res.status(200).json({
    success: true,
    message: 'Guide assigned successfully',
    data: {
      email: guide.email,
      trip_id,
      start_date: startDate,
      end_date: endDate,
      guide_score: guide.calculateScore()
    }
  });
});

/**
 * Get all guides with their scores
 * @route GET /api/v1/guides
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const getAllGuides = catchAsync(async (req, res) => {
  const guides = await GuideScore.find().lean();
  
  const guidesWithScores = guides.map(guide => {
    const ratingScore = guide.rating * 20;
    const activeScore = guide.active ? 10 : 0;
    const bannedPenalty = guide.banned ? 100 : 0;
    const newDriverBonus = guide.newDriver ? 5 : 0;
    const experienceBonus = (10 - guide.first10Rides) * 2;
    const penaltyDeduction = guide.penalty;
    
    const totalScore = ratingScore + activeScore - bannedPenalty + newDriverBonus + experienceBonus - penaltyDeduction;
    
    return {
      ...guide,
      totalScore
    };
  });
  
  res.status(200).json({
    success: true,
    message: 'Guides retrieved successfully',
    data: guidesWithScores,
    count: guidesWithScores.length
  });
});

/**
 * Create a new guide score record
 * @route POST /api/v1/guides
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const createGuide = catchAsync(async (req, res) => {
  const guide = new GuideScore(req.body);
  await guide.save();
  
  res.status(201).json({
    success: true,
    message: 'Guide created successfully',
    data: guide
  });
});

/**
 * Get guide trips
 * @route GET /api/v1/guides/:email/trips
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const getGuideTrips = catchAsync(async (req, res) => {
  const { email } = req.params;
  
  const guideTrips = await GuideTrips.findOne({ 
    email: email.toLowerCase() 
  });
  
  if (!guideTrips) {
    return res.status(200).json({
      success: true,
      message: 'Guide trips retrieved successfully',
      data: {
        email: email.toLowerCase(),
        trips: []
      }
    });
  }
  
  res.status(200).json({
    success: true,
    message: 'Guide trips retrieved successfully',
    data: guideTrips
  });
});

module.exports = {
  getTopGuide,
  assignGuide,
  getAllGuides,
  createGuide,
  getGuideTrips
};
