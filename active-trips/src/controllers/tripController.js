const Trip = require('../models/Trip');
const axios = require('axios');

// Set driver for a trip
const setDriver = async (req, res) => {
  console.log('[SET_DRIVER] Function called');
  console.log('[SET_DRIVER] Request body:', req.body);
  
  try {
    const { tripId, email } = req.body;
    console.log('[SET_DRIVER] Extracted tripId:', tripId, 'email:', email);

    if (!tripId || !email) {
      console.log('[SET_DRIVER] Validation failed - missing required fields');
      return res.status(400).json({
        success: false,
        message: 'tripId and email are required'
      });
    }

    console.log('[SET_DRIVER] Attempting to update trip in database');
    const updatedTrip = await Trip.findByIdAndUpdate(
      tripId,
      {
        driver_email: email,
        driver_status: 1
      },
      { new: true }
    );
    console.log('[SET_DRIVER] Database update completed');

    if (!updatedTrip) {
      console.log('[SET_DRIVER] Trip not found in database');
      return res.status(404).json({
        success: false,
        message: 'Trip not found'
      });
    }

    console.log(`[SET_DRIVER] Driver set for trip ${tripId}: ${email}, status: 1`);
    console.log('[SET_DRIVER] Sending success response');

    res.json({
      success: true,
      message: 'Driver set successfully',
      data: updatedTrip
    });
  } catch (error) {
    console.error('[SET_DRIVER] Error occurred:', error);
    console.error('[SET_DRIVER] Error message:', error.message);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

// Set guide for a trip
const setGuide = async (req, res) => {
  console.log('[SET_GUIDE] Function called');
  console.log('[SET_GUIDE] Request body:', req.body);
  
  try {
    const { tripId, email } = req.body;
    console.log('[SET_GUIDE] Extracted tripId:', tripId, 'email:', email);

    if (!tripId || !email) {
      console.log('[SET_GUIDE] Validation failed - missing required fields');
      return res.status(400).json({
        success: false,
        message: 'tripId and email are required'
      });
    }

    console.log('[SET_GUIDE] Attempting to update trip in database');
    const updatedTrip = await Trip.findByIdAndUpdate(
      tripId,
      {
        guide_email: email,
        guide_status: 1
      },
      { new: true }
    );
    console.log('[SET_GUIDE] Database update completed');

    if (!updatedTrip) {
      console.log('[SET_GUIDE] Trip not found in database');
      return res.status(404).json({
        success: false,
        message: 'Trip not found'
      });
    }

    console.log(`[SET_GUIDE] Guide set for trip ${tripId}: ${email}, status: 1`);
    console.log('[SET_GUIDE] Sending success response');

    res.json({
      success: true,
      message: 'Guide set successfully',
      data: updatedTrip
    });
  } catch (error) {
    console.error('[SET_GUIDE] Error occurred:', error);
    console.error('[SET_GUIDE] Error message:', error.message);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

// Remove driver from a trip
const removeDriver = async (req, res) => {
  console.log('[REMOVE_DRIVER] Function called');
  console.log('[REMOVE_DRIVER] Request body:', req.body);
  
  try {
    const { tripId, email } = req.body;
    console.log('[REMOVE_DRIVER] Extracted tripId:', tripId, 'email:', email);

    if (!tripId || !email) {
      console.log('[REMOVE_DRIVER] Validation failed - missing required fields');
      return res.status(400).json({
        success: false,
        message: 'tripId and email are required'
      });
    }

    console.log('[REMOVE_DRIVER] Attempting to update trip status in database');
    const updatedTrip = await Trip.findByIdAndUpdate(
      tripId,
      {
        driver_status: 0
      },
      { new: true }
    );
    console.log('[REMOVE_DRIVER] Database update completed');

    if (!updatedTrip) {
      console.log('[REMOVE_DRIVER] Trip not found in database');
      return res.status(404).json({
        success: false,
        message: 'Trip not found'
      });
    }

    console.log(`[REMOVE_DRIVER] Driver removed for trip ${tripId}, status set to: 0`);
    console.log('[REMOVE_DRIVER] Sending success response');

    res.json({
      success: true,
      message: 'Driver removed successfully',
      data: updatedTrip
    });
  } catch (error) {
    console.error('[REMOVE_DRIVER] Error occurred:', error);
    console.error('[REMOVE_DRIVER] Error message:', error.message);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

// Remove guide from a trip
const removeGuide = async (req, res) => {
  console.log('[REMOVE_GUIDE] Function called');
  console.log('[REMOVE_GUIDE] Request body:', req.body);
  
  try {
    const { tripId, email } = req.body;
    console.log('[REMOVE_GUIDE] Extracted tripId:', tripId, 'email:', email);

    if (!tripId || !email) {
      console.log('[REMOVE_GUIDE] Validation failed - missing required fields');
      return res.status(400).json({
        success: false,
        message: 'tripId and email are required'
      });
    }

    console.log('[REMOVE_GUIDE] Attempting to update trip status in database');
    const updatedTrip = await Trip.findByIdAndUpdate(
      tripId,
      {
        guide_status: 0
      },
      { new: true }
    );
    console.log('[REMOVE_GUIDE] Database update completed');

    if (!updatedTrip) {
      console.log('[REMOVE_GUIDE] Trip not found in database');
      return res.status(404).json({
        success: false,
        message: 'Trip not found'
      });
    }

    console.log(`[REMOVE_GUIDE] Guide removed for trip ${tripId}, status set to: 0`);
    console.log('[REMOVE_GUIDE] Sending success response');

    res.json({
      success: true,
      message: 'Guide removed successfully',
      data: updatedTrip
    });
  } catch (error) {
    console.error('[REMOVE_GUIDE] Error occurred:', error);
    console.error('[REMOVE_GUIDE] Error message:', error.message);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

// Activate trip with automatic driver/guide assignment
const newActivateTrip = async (req, res) => {
  console.log('[NEW_ACTIVATE_TRIP] Function called');
  console.log('[NEW_ACTIVATE_TRIP] Request body:', req.body);
  
  try {
    const { tripId } = req.body;
    console.log('[NEW_ACTIVATE_TRIP] Extracted tripId:', tripId);

    if (!tripId) {
      console.log('[NEW_ACTIVATE_TRIP] Validation failed - missing tripId');
      return res.status(400).json({
        success: false,
        message: 'tripId is required'
      });
    }

    // Find the trip
    console.log('[NEW_ACTIVATE_TRIP] Searching for trip in database');
    const trip = await Trip.findById(tripId);
    console.log('[NEW_ACTIVATE_TRIP] Database search completed');
    
    if (!trip) {
      console.log('[NEW_ACTIVATE_TRIP] Trip not found in database');
      return res.status(404).json({
        success: false,
        message: 'Trip not found'
      });
    }

    console.log('[NEW_ACTIVATE_TRIP] Trip found:', { 
      id: trip._id, 
      driverNeeded: trip.driverNeeded, 
      guideNeeded: trip.guideNeeded,
      startDate: trip.startDate,
      endDate: trip.endDate,
      vehicleType: trip.vehicleType
    });
    console.log(`[NEW_ACTIVATE_TRIP] Activating trip ${tripId}...`);

    // Generate trip days array from start and end dates
    let tripDays = [];
    if (trip.startDate && trip.endDate) {
      const startDate = new Date(trip.startDate);
      const endDate = new Date(trip.endDate);
      
      for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
        tripDays.push(d.toISOString().split('T')[0]); // Format as YYYY-MM-DD
      }
      console.log('[NEW_ACTIVATE_TRIP] Generated trip days:', tripDays);
    } else {
      console.log('[NEW_ACTIVATE_TRIP] Warning: Start date or end date missing from trip data');
    }

    let updateData = {};
    let driverAssigned = false;
    let guideAssigned = false;
    console.log('[NEW_ACTIVATE_TRIP] Initialized assignment tracking variables');

    // Handle driver assignment if needed
    if (trip.driverNeeded === 1) {
      console.log('[NEW_ACTIVATE_TRIP] Driver is needed for this trip');
      try {
        console.log('[NEW_ACTIVATE_TRIP] Requesting driver from scoring service...');
        
        // Prepare request data for driver assignment
        const driverRequestData = {
          tripDays: tripDays,
          vehicleType: trip.vehicleType || 'Unknown'
        };
        console.log('[NEW_ACTIVATE_TRIP] Driver request data:', driverRequestData);
        
        const driverResponse = await axios.post('http://localhost:4000/api/request-driver', driverRequestData);
        console.log('[NEW_ACTIVATE_TRIP] Driver service response received:', driverResponse.status);
        
        if (driverResponse.data && driverResponse.data.email) {
          console.log('[NEW_ACTIVATE_TRIP] Driver email received:', driverResponse.data.email);
          updateData.driver_email = driverResponse.data.email;
          updateData.driver_status = 1;
          driverAssigned = true;
          console.log(`[NEW_ACTIVATE_TRIP] Driver assigned: ${driverResponse.data.email}`);

          // Notify schedule service about driver assignment
          try {
            console.log('[NEW_ACTIVATE_TRIP] Notifying schedule service about driver assignment');
            await axios.post('http://localhost:4001/api/request-driver-email', {
              email: driverResponse.data.email
            });
            console.log(`[NEW_ACTIVATE_TRIP] Driver email sent to schedule service: ${driverResponse.data.email}`);
          } catch (scheduleError) {
            console.error('[NEW_ACTIVATE_TRIP] Error notifying schedule service about driver:', scheduleError.message);
          }
        } else {
          console.log('[NEW_ACTIVATE_TRIP] No driver email received from scoring service');
        }
      } catch (driverError) {
        console.error('[NEW_ACTIVATE_TRIP] Error requesting driver:', driverError.message);
        console.error('[NEW_ACTIVATE_TRIP] Driver request failed, continuing without driver assignment');
      }
    } else {
      console.log('[NEW_ACTIVATE_TRIP] No driver needed for this trip');
    }

    // Handle guide assignment if needed
    if (trip.guideNeeded === 1) {
      console.log('[NEW_ACTIVATE_TRIP] Guide is needed for this trip');
      try {
        console.log('[NEW_ACTIVATE_TRIP] Requesting guide from scoring service...');
        
        // Prepare request data for guide assignment
        const guideRequestData = {
          tripDays: tripDays,
          vehicleType: trip.vehicleType || 'Unknown'
        };
        console.log('[NEW_ACTIVATE_TRIP] Guide request data:', guideRequestData);
        
        const guideResponse = await axios.post('http://localhost:4000/api/request-guide', guideRequestData);
        console.log('[NEW_ACTIVATE_TRIP] Guide service response received:', guideResponse.status);
        
        if (guideResponse.data && guideResponse.data.email) {
          console.log('[NEW_ACTIVATE_TRIP] Guide email received:', guideResponse.data.email);
          updateData.guide_email = guideResponse.data.email;
          updateData.guide_status = 1;
          guideAssigned = true;
          console.log(`[NEW_ACTIVATE_TRIP] Guide assigned: ${guideResponse.data.email}`);

          // Notify schedule service about guide assignment
          try {
            console.log('[NEW_ACTIVATE_TRIP] Notifying schedule service about guide assignment');
            await axios.post('http://localhost:4001/api/request-guide-email', {
              email: guideResponse.data.email
            });
            console.log(`[NEW_ACTIVATE_TRIP] Guide email sent to schedule service: ${guideResponse.data.email}`);
          } catch (scheduleError) {
            console.error('[NEW_ACTIVATE_TRIP] Error notifying schedule service about guide:', scheduleError.message);
          }
        } else {
          console.log('[NEW_ACTIVATE_TRIP] No guide email received from scoring service');
        }
      } catch (guideError) {
        console.error('[NEW_ACTIVATE_TRIP] Error requesting guide:', guideError.message);
        console.error('[NEW_ACTIVATE_TRIP] Guide request failed, continuing without guide assignment');
      }
    } else {
      console.log('[NEW_ACTIVATE_TRIP] No guide needed for this trip');
    }

    // Update the trip with new assignments
    console.log('[NEW_ACTIVATE_TRIP] Updating trip in database with assignment data:', updateData);
    const updatedTrip = await Trip.findByIdAndUpdate(
      tripId,
      updateData,
      { new: true }
    );
    console.log('[NEW_ACTIVATE_TRIP] Trip update completed in database');

    console.log(`[NEW_ACTIVATE_TRIP] Trip ${tripId} activation completed. Driver assigned: ${driverAssigned}, Guide assigned: ${guideAssigned}`);
    console.log('[NEW_ACTIVATE_TRIP] Sending success response');

    res.json({
      success: true,
      message: 'Trip activation completed',
      data: {
        trip: updatedTrip,
        driverAssigned,
        guideAssigned
      }
    });
  } catch (error) {
    console.error('[NEW_ACTIVATE_TRIP] Error occurred during trip activation:', error);
    console.error('[NEW_ACTIVATE_TRIP] Error message:', error.message);
    console.error('[NEW_ACTIVATE_TRIP] Error stack:', error.stack);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

// Get all trips for a given userId
const getTripsByUserId = async (req, res) => {
  console.log('[GET_TRIPS_BY_USER_ID] Function called');
  console.log('[GET_TRIPS_BY_USER_ID] Request params:', req.params);
  console.log('[GET_TRIPS_BY_USER_ID] Request query:', req.query);
  
  try {
    const { userId } = req.params;
    console.log('[GET_TRIPS_BY_USER_ID] Extracted userId:', userId);

    if (!userId) {
      console.log('[GET_TRIPS_BY_USER_ID] Validation failed - missing userId');
      return res.status(400).json({
        success: false,
        message: 'userId is required'
      });
    }

    console.log('[GET_TRIPS_BY_USER_ID] Searching for trips in database for userId:', userId);
    const trips = await Trip.find({ userId: userId });
    console.log('[GET_TRIPS_BY_USER_ID] Database search completed');
    console.log('[GET_TRIPS_BY_USER_ID] Found', trips.length, 'trips for user');

    if (trips.length === 0) {
      console.log('[GET_TRIPS_BY_USER_ID] No trips found for this user');
      return res.json({
        success: true,
        message: 'No trips found for this user',
        data: {
          userId: userId,
          trips: [],
          totalTrips: 0
        }
      });
    }

    console.log('[GET_TRIPS_BY_USER_ID] Trips found for user:', trips.map(trip => ({
      id: trip._id,
      tripName: trip.tripName,
      startDate: trip.startDate,
      endDate: trip.endDate,
      driverNeeded: trip.driverNeeded,
      guideNeeded: trip.guideNeeded,
      driver_status: trip.driver_status,
      guide_status: trip.guide_status
    })));

    console.log('[GET_TRIPS_BY_USER_ID] Sending success response with trips data');

    res.json({
      success: true,
      message: 'Trips retrieved successfully',
      data: {
        userId: userId,
        trips: trips,
        totalTrips: trips.length
      }
    });
  } catch (error) {
    console.error('[GET_TRIPS_BY_USER_ID] Error occurred:', error);
    console.error('[GET_TRIPS_BY_USER_ID] Error message:', error.message);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

// Get all trips for a given driver email
const getTripsByDriverEmail = async (req, res) => {
  console.log('[GET_TRIPS_BY_DRIVER_EMAIL] Function called');
  console.log('[GET_TRIPS_BY_DRIVER_EMAIL] Request params:', req.params);
  console.log('[GET_TRIPS_BY_DRIVER_EMAIL] Request query:', req.query);
  
  try {
    const { driverEmail } = req.params;
    console.log('[GET_TRIPS_BY_DRIVER_EMAIL] Extracted driverEmail:', driverEmail);

    if (!driverEmail) {
      console.log('[GET_TRIPS_BY_DRIVER_EMAIL] Validation failed - missing driverEmail');
      return res.status(400).json({
        success: false,
        message: 'driverEmail is required'
      });
    }

    console.log('[GET_TRIPS_BY_DRIVER_EMAIL] Searching for trips in database for driverEmail:', driverEmail);
    const trips = await Trip.find({ driver_email: driverEmail });
    console.log('[GET_TRIPS_BY_DRIVER_EMAIL] Database search completed');
    console.log('[GET_TRIPS_BY_DRIVER_EMAIL] Found', trips.length, 'trips for driver');

    if (trips.length === 0) {
      console.log('[GET_TRIPS_BY_DRIVER_EMAIL] No trips found for this driver');
      return res.json({
        success: true,
        message: 'No trips found for this driver',
        data: {
          driverEmail: driverEmail,
          trips: [],
          totalTrips: 0
        }
      });
    }

    console.log('[GET_TRIPS_BY_DRIVER_EMAIL] Trips found for driver:', trips.map(trip => ({
      id: trip._id,
      tripName: trip.tripName,
      startDate: trip.startDate,
      endDate: trip.endDate,
      userId: trip.userId,
      driver_status: trip.driver_status,
      vehicleType: trip.vehicleType
    })));

    console.log('[GET_TRIPS_BY_DRIVER_EMAIL] Sending success response with trips data');

    res.json({
      success: true,
      message: 'Trips retrieved successfully for driver',
      data: {
        driverEmail: driverEmail,
        trips: trips,
        totalTrips: trips.length
      }
    });
  } catch (error) {
    console.error('[GET_TRIPS_BY_DRIVER_EMAIL] Error occurred:', error);
    console.error('[GET_TRIPS_BY_DRIVER_EMAIL] Error message:', error.message);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

module.exports = {
  setDriver,
  setGuide,
  removeDriver,
  removeGuide,
  newActivateTrip,
  getTripsByUserId,
  getTripsByDriverEmail
};
