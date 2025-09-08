const { PayedTripAdvance, CompletedTrip } = require('../models/Trip');

// @desc    Start a trip
// @route   POST /api/trips/start-trip
// @access  Public
const startTrip = async (req, res, next) => {
  console.log('[START_TRIP] Function called');
  console.log('[START_TRIP] Request body:', req.body);
  
  try {
    const { tripId } = req.body;
    console.log('[START_TRIP] Extracted tripId:', tripId);

    if (!tripId) {
      console.log('[START_TRIP] Error: Trip ID is required');
      return res.status(400).json({
        success: false,
        error: 'Trip ID is required'
      });
    }

    // Fetch trip from payed_trips_advance
    console.log('[START_TRIP] Fetching trip from payed_trips_advance collection');
    const payedTrip = await PayedTripAdvance.findById(tripId);
    console.log('[START_TRIP] Payed trip found:', payedTrip ? 'Yes' : 'No');
    
    if (!payedTrip) {
      console.log('[START_TRIP] Error: Trip not found in payed trips');
      return res.status(404).json({
        success: false,
        error: 'Trip not found in payed trips'
      });
    }

    // Check if trip already exists in completed_trips
    console.log('[START_TRIP] Checking if trip already exists in completed_trips');
    const existingTrip = await CompletedTrip.findById(tripId);
    console.log('[START_TRIP] Existing trip found:', existingTrip ? 'Yes' : 'No');
    if (existingTrip) {
      console.log('[START_TRIP] Error: Trip already started');
      return res.status(400).json({
        success: false,
        error: 'Trip already started'
      });
    }

    // Create new completed trip with additional fields
    console.log('[START_TRIP] Creating new completed trip data');
    const tripData = payedTrip.toObject();
    delete tripData.createdAt;
    delete tripData.updatedAt;
    delete tripData.__v;

    // Add new fields for each day in dailyPlans
    console.log('[START_TRIP] Enhancing daily plans with tracking fields');
    const enhancedDailyPlans = tripData.dailyPlans.map(day => ({
      ...day,
      start: null,
      end: null,
      start_confirmed: 0,
      end_confirmed: 0,
      start_meter_read: 0,
      end_meter_read: 0,
      deduct_amount: 0,
      day_complete: 0,
      additional_note: ''
    }));
    console.log('[START_TRIP] Enhanced daily plans count:', enhancedDailyPlans.length);

    console.log('[START_TRIP] Creating completed trip object');
    const completedTrip = new CompletedTrip({
      ...tripData,
      dailyPlans: enhancedDailyPlans,
      started: 1,
      startconfirmed: 1,
      ended: 0,
      endconfirmed: 0,
      driver_reviewed: 0,
      guide_reviewed: 0,
      driver_review: '',
      guide_review: ''
    });

    console.log('[START_TRIP] Saving completed trip to database');
    await completedTrip.save();
    console.log('[START_TRIP] Trip successfully saved with ID:', completedTrip._id);

    console.log('[START_TRIP] Sending success response');
    res.status(201).json({
      success: true,
      data: completedTrip
    });
  } catch (error) {
    console.log('[START_TRIP] Error occurred:', error.message);
    next(error);
  }
};

// @desc    Confirm trip start
// @route   POST /api/trips/confirm-start
// @access  Public
const confirmStart = async (req, res, next) => {
  console.log('[CONFIRM_START] Function called');
  console.log('[CONFIRM_START] Request body:', req.body);
  
  try {
    const { tripId } = req.body;
    console.log('[CONFIRM_START] Extracted tripId:', tripId);

    if (!tripId) {
      console.log('[CONFIRM_START] Error: Trip ID is required');
      return res.status(400).json({
        success: false,
        error: 'Trip ID is required'
      });
    }

    console.log('[CONFIRM_START] Updating trip startconfirmed status');
    const trip = await CompletedTrip.findByIdAndUpdate(
      tripId,
      { startconfirmed: 1 },
      { new: true }
    );
    console.log('[CONFIRM_START] Trip update result:', trip ? 'Success' : 'Failed');

    if (!trip) {
      console.log('[CONFIRM_START] Error: Trip not found');
      return res.status(404).json({
        success: false,
        error: 'Trip not found'
      });
    }

    console.log('[CONFIRM_START] Sending success response');
    res.status(200).json({
      success: true,
      data: trip
    });
  } catch (error) {
    console.log('[CONFIRM_START] Error occurred:', error.message);
    next(error);
  }
};

// @desc    End a trip
// @route   POST /api/trips/end-trip
// @access  Public
const endTrip = async (req, res, next) => {
  console.log('[END_TRIP] Function called');
  console.log('[END_TRIP] Request body:', req.body);
  
  try {
    const { tripId } = req.body;
    console.log('[END_TRIP] Extracted tripId:', tripId);

    if (!tripId) {
      console.log('[END_TRIP] Error: Trip ID is required');
      return res.status(400).json({
        success: false,
        error: 'Trip ID is required'
      });
    }

    console.log('[END_TRIP] Updating trip ended status');
    const trip = await CompletedTrip.findByIdAndUpdate(
      tripId,
      { ended: 1 },
      { new: true }
    );
    console.log('[END_TRIP] Trip update result:', trip ? 'Success' : 'Failed');

    if (!trip) {
      console.log('[END_TRIP] Error: Trip not found');
      return res.status(404).json({
        success: false,
        error: 'Trip not found'
      });
    }

    console.log('[END_TRIP] Sending success response');
    res.status(200).json({
      success: true,
      data: trip
    });
  } catch (error) {
    console.log('[END_TRIP] Error occurred:', error.message);
    next(error);
  }
};

// @desc    Confirm trip end
// @route   POST /api/trips/confirm-end
// @access  Public
const confirmEnd = async (req, res, next) => {
  console.log('[CONFIRM_END] Function called');
  console.log('[CONFIRM_END] Request body:', req.body);
  
  try {
    const { tripId } = req.body;
    console.log('[CONFIRM_END] Extracted tripId:', tripId);

    if (!tripId) {
      console.log('[CONFIRM_END] Error: Trip ID is required');
      return res.status(400).json({
        success: false,
        error: 'Trip ID is required'
      });
    }

    console.log('[CONFIRM_END] Updating trip endconfirmed status');
    const trip = await CompletedTrip.findByIdAndUpdate(
      tripId,
      { endconfirmed: 1 },
      { new: true }
    );
    console.log('[CONFIRM_END] Trip update result:', trip ? 'Success' : 'Failed');

    if (!trip) {
      console.log('[CONFIRM_END] Error: Trip not found');
      return res.status(404).json({
        success: false,
        error: 'Trip not found'
      });
    }

    console.log('[CONFIRM_END] Sending success response');
    res.status(200).json({
      success: true,
      data: trip
    });
  } catch (error) {
    console.log('[CONFIRM_END] Error occurred:', error.message);
    next(error);
  }
};

// @desc    Start a specific day
// @route   POST /api/trips/start-day-:dayNumber
// @access  Public
const startDay = async (req, res, next) => {
  console.log('[START_DAY] Function called');
  console.log('[START_DAY] Request params:', req.params);
  console.log('[START_DAY] Request body:', req.body);
  
  try {
    const { tripId, metervalue } = req.body;
    const dayNumber = parseInt(req.params.dayNumber);
    console.log('[START_DAY] Extracted values - tripId:', tripId, 'dayNumber:', dayNumber, 'metervalue:', metervalue);

    if (!tripId || metervalue === undefined) {
      console.log('[START_DAY] Error: Trip ID and meter value are required');
      return res.status(400).json({
        success: false,
        error: 'Trip ID and meter value are required'
      });
    }

    console.log('[START_DAY] Finding trip by ID');
    const trip = await CompletedTrip.findById(tripId);
    console.log('[START_DAY] Trip found:', trip ? 'Yes' : 'No');

    if (!trip) {
      console.log('[START_DAY] Error: Trip not found');
      return res.status(404).json({
        success: false,
        error: 'Trip not found'
      });
    }

    // Find and update the specific day
    console.log('[START_DAY] Finding day index for day number:', dayNumber);
    const dayIndex = trip.dailyPlans.findIndex(day => day.day === dayNumber);
    console.log('[START_DAY] Day index found:', dayIndex);
    
    if (dayIndex === -1) {
      console.log('[START_DAY] Error: Day not found');
      return res.status(404).json({
        success: false,
        error: `Day ${dayNumber} not found`
      });
    }

    console.log('[START_DAY] Updating day start time and meter reading');
    trip.dailyPlans[dayIndex].start = new Date();
    trip.dailyPlans[dayIndex].start_meter_read = metervalue;

    console.log('[START_DAY] Saving trip with updated day information');
    await trip.save();
    console.log('[START_DAY] Trip saved successfully');

    console.log('[START_DAY] Sending success response');
    res.status(200).json({
      success: true,
      data: trip.dailyPlans[dayIndex]
    });
  } catch (error) {
    console.log('[START_DAY] Error occurred:', error.message);
    next(error);
  }
};

// @desc    Confirm day start
// @route   POST /api/trips/confirm-day-:dayNumber-start
// @access  Public
const confirmDayStart = async (req, res, next) => {
  console.log('[CONFIRM_DAY_START] Function called');
  console.log('[CONFIRM_DAY_START] Request params:', req.params);
  console.log('[CONFIRM_DAY_START] Request body:', req.body);
  
  try {
    const { tripId } = req.body;
    const dayNumber = parseInt(req.params.dayNumber);
    console.log('[CONFIRM_DAY_START] Extracted values - tripId:', tripId, 'dayNumber:', dayNumber);

    if (!tripId) {
      console.log('[CONFIRM_DAY_START] Error: Trip ID is required');
      return res.status(400).json({
        success: false,
        error: 'Trip ID is required'
      });
    }

    console.log('[CONFIRM_DAY_START] Finding trip by ID');
    const trip = await CompletedTrip.findById(tripId);
    console.log('[CONFIRM_DAY_START] Trip found:', trip ? 'Yes' : 'No');

    if (!trip) {
      console.log('[CONFIRM_DAY_START] Error: Trip not found');
      return res.status(404).json({
        success: false,
        error: 'Trip not found'
      });
    }

    // Find and update the specific day
    console.log('[CONFIRM_DAY_START] Finding day index for day number:', dayNumber);
    const dayIndex = trip.dailyPlans.findIndex(day => day.day === dayNumber);
    console.log('[CONFIRM_DAY_START] Day index found:', dayIndex);
    
    if (dayIndex === -1) {
      console.log('[CONFIRM_DAY_START] Error: Day not found');
      return res.status(404).json({
        success: false,
        error: `Day ${dayNumber} not found`
      });
    }

    console.log('[CONFIRM_DAY_START] Updating day start confirmation');
    trip.dailyPlans[dayIndex].start_confirmed = 1;

    console.log('[CONFIRM_DAY_START] Saving trip with updated confirmation');
    await trip.save();
    console.log('[CONFIRM_DAY_START] Trip saved successfully');

    console.log('[CONFIRM_DAY_START] Sending success response');
    res.status(200).json({
      success: true,
      data: trip.dailyPlans[dayIndex]
    });
  } catch (error) {
    console.log('[CONFIRM_DAY_START] Error occurred:', error.message);
    next(error);
  }
};

// @desc    End a specific day
// @route   POST /api/trips/end-day-:dayNumber
// @access  Public
const endDay = async (req, res, next) => {
  console.log('[END_DAY] Function called');
  console.log('[END_DAY] Request params:', req.params);
  console.log('[END_DAY] Request body:', req.body);
  
  try {
    const { tripId, metervalue, deductvalue, note } = req.body;
    const dayNumber = parseInt(req.params.dayNumber);
    console.log('[END_DAY] Extracted values - tripId:', tripId, 'dayNumber:', dayNumber, 'metervalue:', metervalue, 'deductvalue:', deductvalue, 'note:', note);

    if (!tripId || metervalue === undefined) {
      console.log('[END_DAY] Error: Trip ID and meter value are required');
      return res.status(400).json({
        success: false,
        error: 'Trip ID and meter value are required'
      });
    }

    console.log('[END_DAY] Finding trip by ID');
    const trip = await CompletedTrip.findById(tripId);
    console.log('[END_DAY] Trip found:', trip ? 'Yes' : 'No');

    if (!trip) {
      console.log('[END_DAY] Error: Trip not found');
      return res.status(404).json({
        success: false,
        error: 'Trip not found'
      });
    }

    // Find and update the specific day
    console.log('[END_DAY] Finding day index for day number:', dayNumber);
    const dayIndex = trip.dailyPlans.findIndex(day => day.day === dayNumber);
    console.log('[END_DAY] Day index found:', dayIndex);
    
    if (dayIndex === -1) {
      console.log('[END_DAY] Error: Day not found');
      return res.status(404).json({
        success: false,
        error: `Day ${dayNumber} not found`
      });
    }

    console.log('[END_DAY] Updating day end information');
    trip.dailyPlans[dayIndex].end = new Date();
    trip.dailyPlans[dayIndex].end_meter_read = metervalue;
    trip.dailyPlans[dayIndex].deduct_amount = deductvalue || 0;
    trip.dailyPlans[dayIndex].additional_note = note || '';
    trip.dailyPlans[dayIndex].day_complete = 1;

    console.log('[END_DAY] Saving trip with updated day information');
    await trip.save();
    console.log('[END_DAY] Trip saved successfully');

    console.log('[END_DAY] Sending success response');
    res.status(200).json({
      success: true,
      data: trip.dailyPlans[dayIndex]
    });
  } catch (error) {
    console.log('[END_DAY] Error occurred:', error.message);
    next(error);
  }
};

// @desc    Confirm day end
// @route   POST /api/trips/confirm-day-:dayNumber-end
// @access  Public
const confirmDayEnd = async (req, res, next) => {
  console.log('[CONFIRM_DAY_END] Function called');
  console.log('[CONFIRM_DAY_END] Request params:', req.params);
  console.log('[CONFIRM_DAY_END] Request body:', req.body);
  
  try {
    const { tripId } = req.body;
    const dayNumber = parseInt(req.params.dayNumber);
    console.log('[CONFIRM_DAY_END] Extracted values - tripId:', tripId, 'dayNumber:', dayNumber);

    if (!tripId) {
      console.log('[CONFIRM_DAY_END] Error: Trip ID is required');
      return res.status(400).json({
        success: false,
        error: 'Trip ID is required'
      });
    }

    console.log('[CONFIRM_DAY_END] Finding trip by ID');
    const trip = await CompletedTrip.findById(tripId);
    console.log('[CONFIRM_DAY_END] Trip found:', trip ? 'Yes' : 'No');

    if (!trip) {
      console.log('[CONFIRM_DAY_END] Error: Trip not found');
      return res.status(404).json({
        success: false,
        error: 'Trip not found'
      });
    }

    // Find and update the specific day
    console.log('[CONFIRM_DAY_END] Finding day index for day number:', dayNumber);
    const dayIndex = trip.dailyPlans.findIndex(day => day.day === dayNumber);
    console.log('[CONFIRM_DAY_END] Day index found:', dayIndex);
    
    if (dayIndex === -1) {
      console.log('[CONFIRM_DAY_END] Error: Day not found');
      return res.status(404).json({
        success: false,
        error: `Day ${dayNumber} not found`
      });
    }

    console.log('[CONFIRM_DAY_END] Updating day end confirmation');
    trip.dailyPlans[dayIndex].end_confirmed = 1;

    console.log('[CONFIRM_DAY_END] Saving trip with updated confirmation');
    await trip.save();
    console.log('[CONFIRM_DAY_END] Trip saved successfully');

    console.log('[CONFIRM_DAY_END] Sending success response');
    res.status(200).json({
      success: true,
      data: trip.dailyPlans[dayIndex]
    });
  } catch (error) {
    console.log('[CONFIRM_DAY_END] Error occurred:', error.message);
    next(error);
  }
};

// @desc    Get day information
// @route   GET /api/trips/day-:dayNumber-info
// @access  Public
const getDayInfo = async (req, res, next) => {
  console.log('[GET_DAY_INFO] Function called');
  console.log('[GET_DAY_INFO] Request params:', req.params);
  console.log('[GET_DAY_INFO] Request query:', req.query);
  
  try {
    const { tripId } = req.query;
    const dayNumber = parseInt(req.params.dayNumber);
    console.log('[GET_DAY_INFO] Extracted values - tripId:', tripId, 'dayNumber:', dayNumber);

    if (!tripId) {
      console.log('[GET_DAY_INFO] Error: Trip ID is required');
      return res.status(400).json({
        success: false,
        error: 'Trip ID is required'
      });
    }

    console.log('[GET_DAY_INFO] Finding trip by ID');
    const trip = await CompletedTrip.findById(tripId);
    console.log('[GET_DAY_INFO] Trip found:', trip ? 'Yes' : 'No');

    if (!trip) {
      console.log('[GET_DAY_INFO] Error: Trip not found');
      return res.status(404).json({
        success: false,
        error: 'Trip not found'
      });
    }

    // Find the specific day
    console.log('[GET_DAY_INFO] Finding day for day number:', dayNumber);
    const day = trip.dailyPlans.find(day => day.day === dayNumber);
    console.log('[GET_DAY_INFO] Day found:', day ? 'Yes' : 'No');
    
    if (!day) {
      console.log('[GET_DAY_INFO] Error: Day not found');
      return res.status(404).json({
        success: false,
        error: `Day ${dayNumber} not found`
      });
    }

    console.log('[GET_DAY_INFO] Sending success response with day data');
    res.status(200).json({
      success: true,
      data: day
    });
  } catch (error) {
    console.log('[GET_DAY_INFO] Error occurred:', error.message);
    next(error);
  }
};

// @desc    Get total distance
// @route   GET /api/trips/total-distance
// @access  Public
const getTotalDistance = async (req, res, next) => {
  console.log('[GET_TOTAL_DISTANCE] Function called');
  console.log('[GET_TOTAL_DISTANCE] Request query:', req.query);
  
  try {
    const { tripId } = req.query;
    console.log('[GET_TOTAL_DISTANCE] Extracted tripId:', tripId);

    if (!tripId) {
      console.log('[GET_TOTAL_DISTANCE] Error: Trip ID is required');
      return res.status(400).json({
        success: false,
        error: 'Trip ID is required'
      });
    }

    console.log('[GET_TOTAL_DISTANCE] Finding trip by ID');
    const trip = await CompletedTrip.findById(tripId);
    console.log('[GET_TOTAL_DISTANCE] Trip found:', trip ? 'Yes' : 'No');

    if (!trip) {
      console.log('[GET_TOTAL_DISTANCE] Error: Trip not found');
      return res.status(404).json({
        success: false,
        error: 'Trip not found'
      });
    }

    // Calculate total distance
    console.log('[GET_TOTAL_DISTANCE] Calculating total distance');
    const sortedDays = trip.dailyPlans.sort((a, b) => a.day - b.day);
    const firstDay = sortedDays[0];
    const lastDay = sortedDays[sortedDays.length - 1];
    console.log('[GET_TOTAL_DISTANCE] First day:', firstDay?.day, 'Last day:', lastDay?.day);

    if (!firstDay || !lastDay || !firstDay.start_meter_read || !lastDay.end_meter_read) {
      console.log('[GET_TOTAL_DISTANCE] Error: Incomplete meter readings');
      return res.status(400).json({
        success: false,
        error: 'Incomplete meter readings for distance calculation'
      });
    }

    const totalDeductions = trip.dailyPlans.reduce((sum, day) => sum + (day.deduct_amount || 0), 0);
    const totalDistance = (lastDay.end_meter_read - firstDay.start_meter_read) - totalDeductions;
    console.log('[GET_TOTAL_DISTANCE] Calculated values - totalDistance:', totalDistance, 'totalDeductions:', totalDeductions);

    console.log('[GET_TOTAL_DISTANCE] Sending success response');
    res.status(200).json({
      success: true,
      data: {
        totalDistance,
        firstDayStartMeter: firstDay.start_meter_read,
        lastDayEndMeter: lastDay.end_meter_read,
        totalDeductions
      }
    });
  } catch (error) {
    console.log('[GET_TOTAL_DISTANCE] Error occurred:', error.message);
    next(error);
  }
};

// @desc    Submit guide review
// @route   POST /api/trips/guide-review
// @access  Public
const guideReview = async (req, res, next) => {
  console.log('[GUIDE_REVIEW] Function called');
  console.log('[GUIDE_REVIEW] Request body:', req.body);
  
  try {
    const { tripId, rate, review } = req.body;
    console.log('[GUIDE_REVIEW] Extracted values - tripId:', tripId, 'rate:', rate, 'review length:', review?.length);

    if (!tripId || rate === undefined || !review) {
      console.log('[GUIDE_REVIEW] Error: Trip ID, rate, and review are required');
      return res.status(400).json({
        success: false,
        error: 'Trip ID, rate, and review are required'
      });
    }

    console.log('[GUIDE_REVIEW] Updating trip with guide review');
    const trip = await CompletedTrip.findByIdAndUpdate(
      tripId,
      { 
        guide_reviewed: rate,
        guide_review: review
      },
      { new: true }
    );
    console.log('[GUIDE_REVIEW] Trip update result:', trip ? 'Success' : 'Failed');

    if (!trip) {
      console.log('[GUIDE_REVIEW] Error: Trip not found');
      return res.status(404).json({
        success: false,
        error: 'Trip not found'
      });
    }

    console.log('[GUIDE_REVIEW] Sending success response');
    res.status(200).json({
      success: true,
      data: {
        guide_reviewed: trip.guide_reviewed,
        guide_review: trip.guide_review
      }
    });
  } catch (error) {
    console.log('[GUIDE_REVIEW] Error occurred:', error.message);
    next(error);
  }
};

// @desc    Submit driver review
// @route   POST /api/trips/driver-review
// @access  Public
const driverReview = async (req, res, next) => {
  console.log('[DRIVER_REVIEW] Function called');
  console.log('[DRIVER_REVIEW] Request body:', req.body);
  
  try {
    const { tripId, rate, review } = req.body;
    console.log('[DRIVER_REVIEW] Extracted values - tripId:', tripId, 'rate:', rate, 'review length:', review?.length);

    if (!tripId || rate === undefined || !review) {
      console.log('[DRIVER_REVIEW] Error: Trip ID, rate, and review are required');
      return res.status(400).json({
        success: false,
        error: 'Trip ID, rate, and review are required'
      });
    }

    console.log('[DRIVER_REVIEW] Updating trip with driver review');
    const trip = await CompletedTrip.findByIdAndUpdate(
      tripId,
      { 
        driver_reviewed: rate,
        driver_review: review
      },
      { new: true }
    );
    console.log('[DRIVER_REVIEW] Trip update result:', trip ? 'Success' : 'Failed');

    if (!trip) {
      console.log('[DRIVER_REVIEW] Error: Trip not found');
      return res.status(404).json({
        success: false,
        error: 'Trip not found'
      });
    }

    console.log('[DRIVER_REVIEW] Sending success response');
    res.status(200).json({
      success: true,
      data: {
        driver_reviewed: trip.driver_reviewed,
        driver_review: trip.driver_review
      }
    });
  } catch (error) {
    console.log('[DRIVER_REVIEW] Error occurred:', error.message);
    next(error);
  }
};

// @desc    Get completed trip by driver email
// @route   GET /api/trips/driver/:driverEmail
// @access  Public
const getCompletedTripByDriverEmail = async (req, res, next) => {
  console.log('[GET_COMPLETED_TRIP_BY_DRIVER] Function called');
  console.log('[GET_COMPLETED_TRIP_BY_DRIVER] Request params:', req.params);
  
  try {
    const { driverEmail } = req.params;
    console.log('[GET_COMPLETED_TRIP_BY_DRIVER] Extracted driverEmail:', driverEmail);

    if (!driverEmail) {
      console.log('[GET_COMPLETED_TRIP_BY_DRIVER] Error: Driver email is required');
      return res.status(400).json({
        success: false,
        error: 'Driver email is required'
      });
    }

    console.log('[GET_COMPLETED_TRIP_BY_DRIVER] Finding completed trips by driver email');
    const trips = await CompletedTrip.find({ driver_email: driverEmail });
    console.log('[GET_COMPLETED_TRIP_BY_DRIVER] Found trips count:', trips.length);

    if (trips.length === 0) {
      console.log('[GET_COMPLETED_TRIP_BY_DRIVER] No completed trips found for driver');
      return res.status(404).json({
        success: false,
        error: 'No completed trips found for this driver'
      });
    }

    console.log('[GET_COMPLETED_TRIP_BY_DRIVER] Sending success response with trip data');
    res.status(200).json({
      success: true,
      data: {
        driverEmail: driverEmail,
        trips: trips,
        totalTrips: trips.length
      }
    });
  } catch (error) {
    console.log('[GET_COMPLETED_TRIP_BY_DRIVER] Error occurred:', error.message);
    next(error);
  }
};

// @desc    Get completed trip by guide email
// @route   GET /api/trips/guide/:guideEmail
// @access  Public
const getCompletedTripByGuideEmail = async (req, res, next) => {
  console.log('[GET_COMPLETED_TRIP_BY_GUIDE] Function called');
  console.log('[GET_COMPLETED_TRIP_BY_GUIDE] Request params:', req.params);
  
  try {
    const { guideEmail } = req.params;
    console.log('[GET_COMPLETED_TRIP_BY_GUIDE] Extracted guideEmail:', guideEmail);

    if (!guideEmail) {
      console.log('[GET_COMPLETED_TRIP_BY_GUIDE] Error: Guide email is required');
      return res.status(400).json({
        success: false,
        error: 'Guide email is required'
      });
    }

    console.log('[GET_COMPLETED_TRIP_BY_GUIDE] Finding completed trips by guide email');
    const trips = await CompletedTrip.find({ guide_email: guideEmail });
    console.log('[GET_COMPLETED_TRIP_BY_GUIDE] Found trips count:', trips.length);

    if (trips.length === 0) {
      console.log('[GET_COMPLETED_TRIP_BY_GUIDE] No completed trips found for guide');
      return res.status(404).json({
        success: false,
        error: 'No completed trips found for this guide'
      });
    }

    console.log('[GET_COMPLETED_TRIP_BY_GUIDE] Sending success response with trip data');
    res.status(200).json({
      success: true,
      data: {
        guideEmail: guideEmail,
        trips: trips,
        totalTrips: trips.length
      }
    });
  } catch (error) {
    console.log('[GET_COMPLETED_TRIP_BY_GUIDE] Error occurred:', error.message);
    next(error);
  }
};

// @desc    Get trip data by _id
// @route   GET /api/trips/trip/:id
// @access  Public
const getTripById = async (req, res, next) => {
  console.log('[GET_TRIP_BY_ID] Function called');
  console.log('[GET_TRIP_BY_ID] Request params:', req.params);

  try {
    const { id } = req.params;
    console.log('[GET_TRIP_BY_ID] Extracted id:', id);

    if (!id) {
      return res.status(400).json({ success: false, message: 'Trip ID is required' });
    }

    console.log('[GET_TRIP_BY_ID] Fetching trip by ID');
    const trip = await CompletedTrip.findById(id);
    console.log('[GET_TRIP_BY_ID] Trip found:', trip ? 'Yes' : 'No');

    if (!trip) {
      return res.status(404).json({ success: false, message: 'Trip not found' });
    }

    console.log('[GET_TRIP_BY_ID] Sending success response');
    res.status(200).json({ success: true, data: trip });
  } catch (error) {
    console.log('[GET_TRIP_BY_ID] Error occurred:', error.message);
    next(error);
  }
};

module.exports = {
  startTrip,
  confirmStart,
  endTrip,
  confirmEnd,
  startDay,
  confirmDayStart,
  endDay,
  confirmDayEnd,
  getDayInfo,
  getTotalDistance,
  guideReview,
  driverReview,
  getCompletedTripByDriverEmail,
  getCompletedTripByGuideEmail,
  getTripById
};
