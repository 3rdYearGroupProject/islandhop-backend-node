const Trip = require('../models/Trip');
const PoolingGroup = require('../models/PoolingGroup');
const axios = require('axios');
const mongoose = require('mongoose');

// Chat database connection and schema
const chatDbConnection = mongoose.createConnection('mongodb+srv://2022cs056:dH4aTFn3IOerWlVZ@cluster0.9ccambx.mongodb.net/islandhop_chat');

const groupSchema = new mongoose.Schema({
  group_name: String,
  member_ids: [String],
  admin_id: String,
  trip_id: String,
  created_at: Date,
  description: String,
  group_type: String,
  _class: String
}, { collection: 'groups' });

const Group = chatDbConnection.model('Group', groupSchema);

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
    let updatedTrip;
    // Use collection.findOneAndUpdate to avoid Mongoose ObjectId casting
    try {
      const result = await Trip.collection.findOneAndUpdate(
        { _id: tripId },
        {
          $set: {
            driver_email: email,
            driver_status: 1
          }
        },
        { returnDocument: 'after' }
      );
      
      if (result && result.value) {
        // Convert the raw MongoDB document back to a Mongoose document
        updatedTrip = new Trip(result.value);
      }
    } catch (collectionError) {
      console.log('[SET_DRIVER] Direct collection search failed, trying tripId field');
      // Fallback to searching by tripId field
      updatedTrip = await Trip.findOneAndUpdate(
        { tripId: tripId },
        {
          driver_email: email,
          driver_status: 1
        },
        { new: true }
      );
    }
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

    // First, get the current trip data
    console.log('[REMOVE_DRIVER] Fetching trip data from database');
    const trip = await Trip.findById(tripId);
    
    if (!trip) {
      console.log('[REMOVE_DRIVER] Trip not found in database');
      return res.status(404).json({
        success: false,
        message: 'Trip not found'
      });
    }

    console.log('[REMOVE_DRIVER] Trip found, extracting trip details for driver request');
    
    // Generate trip days array from start and end dates
    let tripDays = [];
    if (trip.startDate && trip.endDate) {
      const startDate = new Date(trip.startDate);
      const endDate = new Date(trip.endDate);
      
      for (let date = new Date(startDate); date <= endDate; date.setDate(date.getDate() + 1)) {
        tripDays.push(date.toISOString().split('T')[0]);
      }
    } else {
      console.log('[REMOVE_DRIVER] Warning: Trip missing start or end date');
      tripDays = [new Date().toISOString().split('T')[0]]; // Default to today
    }

    // Prepare excluded emails (current rejected emails + the email being removed)
    const excludeEmails = [...(trip.rejectedEmails || []), email];
    
    console.log('[REMOVE_DRIVER] Requesting replacement driver from scoring service');
    console.log('[REMOVE_DRIVER] Trip days:', tripDays);
    console.log('[REMOVE_DRIVER] Vehicle type:', trip.vehicleType);
    console.log('[REMOVE_DRIVER] Exclude emails:', excludeEmails);

    // Request a new driver from scoring service
    try {
      const driverResponse = await axios.post('http://localhost:4000/api/request-driver-except', {
        tripDays: tripDays,
        vehicleType: trip.vehicleType || 'Hatchback',
        excludeEmails: excludeEmails
      });

      console.log('[REMOVE_DRIVER] Replacement driver found:', driverResponse.data.email);
      
      // Update trip with new driver and add rejected email
      console.log('[REMOVE_DRIVER] Updating trip with replacement driver');
      const updatedTrip = await Trip.findByIdAndUpdate(
        tripId,
        {
          driver_email: driverResponse.data.email,
          $addToSet: { rejectedEmails: email }
          // Note: Not changing driver_status, keeping it as is
        },
        { new: true }
      );

      console.log(`[REMOVE_DRIVER] Driver replaced for trip ${tripId}. Old: ${email}, New: ${driverResponse.data.email}`);
      console.log('[REMOVE_DRIVER] Sending success response with replacement driver');

      res.json({
        success: true,
        message: 'Driver removed and replaced successfully',
        data: {
          trip: updatedTrip,
          oldDriverEmail: email,
          newDriverEmail: driverResponse.data.email
        }
      });

    } catch (scoringServiceError) {
      console.error('[REMOVE_DRIVER] Failed to get replacement driver from scoring service:', scoringServiceError.message);
      
      // If no replacement driver available, just remove the current driver
      console.log('[REMOVE_DRIVER] No replacement driver available, removing current driver without replacement');
      const updatedTrip = await Trip.findByIdAndUpdate(
        tripId,
        {
          driver_status: 0,
          driver_email: "",
          $addToSet: { rejectedEmails: email }
        },
        { new: true }
      );

      console.log(`[REMOVE_DRIVER] Driver removed for trip ${tripId}, no replacement found`);
      
      res.json({
        success: true,
        message: 'Driver removed successfully, but no replacement driver available',
        data: {
          trip: updatedTrip,
          replacementFound: false
        }
      });
    }

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
        guide_status: 0,
        guide_email: "",
        $addToSet: { rejectedEmails: email }
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
          updateData.driver_status = 0;
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
          tripDays: tripDays
        };
        console.log('[NEW_ACTIVATE_TRIP] Guide request data:', guideRequestData);
        
        const guideResponse = await axios.post('http://localhost:4000/api/request-guide', guideRequestData);
        console.log('[NEW_ACTIVATE_TRIP] Guide service response received:', guideResponse.status);
        
        if (guideResponse.data && guideResponse.data.email) {
          console.log('[NEW_ACTIVATE_TRIP] Guide email received:', guideResponse.data.email);
          updateData.guide_email = guideResponse.data.email;
          updateData.guide_status = 0;
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
      id: trip._id || trip.id,
      tripId: trip._id || trip.id,
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
      id: trip._id || trip.id,
      tripId: trip._id || trip.id,
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

// Get all trips for a given guide email
const getTripsByGuideEmail = async (req, res) => {
  console.log('[GET_TRIPS_BY_GUIDE_EMAIL] Function called');
  console.log('[GET_TRIPS_BY_GUIDE_EMAIL] Request params:', req.params);
  console.log('[GET_TRIPS_BY_GUIDE_EMAIL] Request query:', req.query);
  
  try {
    const { guideEmail } = req.params;
    console.log('[GET_TRIPS_BY_GUIDE_EMAIL] Extracted guideEmail:', guideEmail);

    if (!guideEmail) {
      console.log('[GET_TRIPS_BY_GUIDE_EMAIL] Validation failed - missing guideEmail');
      return res.status(400).json({
        success: false,
        message: 'guideEmail is required'
      });
    }

    console.log('[GET_TRIPS_BY_GUIDE_EMAIL] Searching for trips in database for guideEmail:', guideEmail);
    const trips = await Trip.find({ guide_email: guideEmail });
    console.log('[GET_TRIPS_BY_GUIDE_EMAIL] Database search completed');
    console.log('[GET_TRIPS_BY_GUIDE_EMAIL] Found', trips.length, 'trips for guide');

    if (trips.length === 0) {
      console.log('[GET_TRIPS_BY_GUIDE_EMAIL] No trips found for this guide');
      return res.json({
        success: true,
        message: 'No trips found for this guide',
        data: {
          guideEmail: guideEmail,
          trips: [],
          totalTrips: 0
        }
      });
    }

    console.log('[GET_TRIPS_BY_GUIDE_EMAIL] Trips found for guide:', trips.map(trip => ({
      id: trip._id || trip.id,
      tripId: trip._id || trip.id,
      tripName: trip.tripName,
      startDate: trip.startDate,
      endDate: trip.endDate,
      userId: trip.userId,
      guide_status: trip.guide_status,
      vehicleType: trip.vehicleType
    })));

    console.log('[GET_TRIPS_BY_GUIDE_EMAIL] Sending success response with trips data');

    res.json({
      success: true,
      message: 'Trips retrieved successfully for guide',
      data: {
        guideEmail: guideEmail,
        trips: trips,
        totalTrips: trips.length
      }
    });
  } catch (error) {
    console.error('[GET_TRIPS_BY_GUIDE_EMAIL] Error occurred:', error);
    console.error('[GET_TRIPS_BY_GUIDE_EMAIL] Error message:', error.message);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

// Accept driver for a trip
const acceptDriver = async (req, res) => {
  console.log('[ACCEPT_DRIVER] Function called');
  console.log('[ACCEPT_DRIVER] Request body:', req.body);
  
  try {
    const { tripId, email, driverUID, adminID } = req.body;
    console.log('[ACCEPT_DRIVER] Extracted tripId:', tripId, 'email:', email, 'driverUID:', driverUID, 'adminID:', adminID);

    if (!tripId || !email) {
      console.log('[ACCEPT_DRIVER] Validation failed - missing required fields');
      return res.status(400).json({
        success: false,
        message: 'tripId and email are required'
      });
    }

    console.log('[ACCEPT_DRIVER] Attempting to update driver status in database');
    
    // Try to find trip by MongoDB ObjectId first, then by custom tripId field
    let updatedTrip;
    const isValidObjectId = mongoose.Types.ObjectId.isValid(tripId);
    
    if (isValidObjectId) {
      console.log('[ACCEPT_DRIVER] Using MongoDB ObjectId search');
      updatedTrip = await Trip.findByIdAndUpdate(
        tripId,
        {
          driver_status: 1
        },
        { new: true }
      );
    } else {
      console.log('[ACCEPT_DRIVER] Using custom tripId field search');
      updatedTrip = await Trip.findOneAndUpdate(
        { _id: tripId },
        {
          driver_status: 1
        },
        { new: true }
      );
    }
    
    console.log('[ACCEPT_DRIVER] Database update completed');

    // Continue to chat group update even if trip not found (for testing purposes)
    let tripUpdateSuccess = false;
    if (!updatedTrip) {
      console.log('[ACCEPT_DRIVER] Trip not found in database, but continuing with chat group update');
    } else {
      tripUpdateSuccess = true;
      console.log('[ACCEPT_DRIVER] Trip found and updated successfully');
    }

    // Add driver to chat group if driverUID is provided
    let chatGroupUpdated = false;
    let chatGroupMessage = '';
    
    if (driverUID) {
      try {
        console.log('[ACCEPT_DRIVER] Attempting to add driver to chat group');
        
        // Use the tripId directly for chat group search (always use the provided tripId, not MongoDB _id)
        const group = await Group.findOne({ trip_id: tripId });
        
        if (group) {
          console.log('[ACCEPT_DRIVER] Found chat group for tripId:', tripId);
          console.log('[ACCEPT_DRIVER] Current member_ids:', group.member_ids);
          
          // Check if driver is already in the group
          if (!group.member_ids.includes(driverUID)) {
            // Add driver to member_ids array
            const updatedGroup = await Group.findByIdAndUpdate(
              group._id,
              {
                $addToSet: { member_ids: driverUID }
              },
              { new: true }
            );
            
            console.log(`[ACCEPT_DRIVER] Driver ${driverUID} added to chat group for trip ${tripId}`);
            console.log('[ACCEPT_DRIVER] Updated group member_ids:', updatedGroup.member_ids);
            chatGroupUpdated = true;
            chatGroupMessage = 'Driver added to chat group successfully';
          } else {
            console.log(`[ACCEPT_DRIVER] Driver ${driverUID} already exists in chat group`);
            chatGroupMessage = 'Driver already in chat group';
          }
        } else {
          console.log(`[ACCEPT_DRIVER] No chat group found for tripId: ${tripId}`);
          chatGroupMessage = 'No chat group found';
          
          if (!tripUpdateSuccess) {
            return res.status(404).json({
              success: false,
              message: 'Trip not found in database and no chat group found',
              data: {
                tripUpdateSuccess: false,
                chatGroupFound: false
              }
            });
          }
        }
      } catch (chatError) {
        console.error('[ACCEPT_DRIVER] Error updating chat group:', chatError);
        console.error('[ACCEPT_DRIVER] Chat error message:', chatError.message);
        chatGroupMessage = `Chat group update failed: ${chatError.message}`;
        
        if (!tripUpdateSuccess) {
          return res.status(500).json({
            success: false,
            message: 'Trip not found and error updating chat group',
            error: chatError.message
          });
        }
        // Continue execution if trip was updated successfully
      }
    } else {
      console.log('[ACCEPT_DRIVER] No driverUID provided, skipping chat group update');
    }

    // If we reach here and trip was not found, return error
    if (!tripUpdateSuccess) {
      return res.status(404).json({
        success: false,
        message: 'Trip not found'
      });
    }

    console.log(`[ACCEPT_DRIVER] Driver accepted for trip ${tripId}: ${email}, status: 1`);
    
    // Check if guide is also needed and confirmed, then proceed to next stage
    if (updatedTrip.guideNeeded == 1 && updatedTrip.guide_status == 1) {
      console.log('[ACCEPT_DRIVER] Guide is also needed and confirmed. Proceeding to start trip...');
      try {
        const startTripResponse = await axios.post('http://localhost:5007/api/trips/start-trip', {
          tripId: tripId
        });
        console.log('[ACCEPT_DRIVER] Trip started successfully:', startTripResponse.data);
        
        console.log('[ACCEPT_DRIVER] Sending success response with trip started');
        return res.json({
          success: true,
          message: 'Driver accepted successfully and trip started',
          data: updatedTrip,
          chatGroupUpdated,
          chatGroupMessage,
          tripStarted: true,
          startTripResponse: startTripResponse.data
        });
      } catch (startTripError) {
        console.error('[ACCEPT_DRIVER] Error starting trip:', startTripError.message);
        // Continue with normal response even if start-trip fails
        console.log('[ACCEPT_DRIVER] Sending success response without trip start');
        return res.json({
          success: true,
          message: 'Driver accepted successfully but failed to start trip',
          data: updatedTrip,
          chatGroupUpdated,
          chatGroupMessage,
          tripStarted: false,
          startTripError: startTripError.message
        });
      }
    }
    
    console.log('[ACCEPT_DRIVER] Sending success response');

    res.json({
      success: true,
      message: 'Driver accepted successfully',
      data: updatedTrip,
      chatGroupUpdated,
      chatGroupMessage
    });
  } catch (error) {
    console.error('[ACCEPT_DRIVER] Error occurred:', error);
    console.error('[ACCEPT_DRIVER] Error message:', error.message);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

// Accept guide for a trip
const acceptGuide = async (req, res) => {
  console.log('[ACCEPT_GUIDE] Function called');
  console.log('[ACCEPT_GUIDE] Request body:', req.body);
  
  try {
    const { tripId, email, guideUID, adminID } = req.body;
    console.log('[ACCEPT_GUIDE] Extracted tripId:', tripId, 'email:', email, 'guideUID:', guideUID, 'adminID:', adminID);

    if (!tripId || !email) {
      console.log('[ACCEPT_GUIDE] Validation failed - missing required fields');
      return res.status(400).json({
        success: false,
        message: 'tripId and email are required'
      });
    }

    console.log('[ACCEPT_GUIDE] Attempting to update guide status in database');
    
    // Try to find trip by MongoDB ObjectId first, then by custom tripId field
    let updatedTrip;
    const isValidObjectId = mongoose.Types.ObjectId.isValid(tripId);
    
    if (isValidObjectId) {
      console.log('[ACCEPT_GUIDE] Using MongoDB ObjectId search');
      updatedTrip = await Trip.findByIdAndUpdate(
        tripId,
        {
          guide_status: 1
        },
        { new: true }
      );
    } else {
      console.log('[ACCEPT_GUIDE] Using custom tripId field search');
      updatedTrip = await Trip.findOneAndUpdate(
        { _id: tripId },
        {
          guide_status: 1
        },
        { new: true }
      );
    }
    
    console.log('[ACCEPT_GUIDE] Database update completed');

    // Continue to chat group update even if trip not found (for testing purposes)
    let tripUpdateSuccess = false;
    if (!updatedTrip) {
      console.log('[ACCEPT_GUIDE] Trip not found in database, but continuing with chat group update');
    } else {
      tripUpdateSuccess = true;
      console.log('[ACCEPT_GUIDE] Trip found and updated successfully');
    }

    // Add guide to chat group if guideUID is provided
    let chatGroupUpdated = false;
    let chatGroupMessage = '';
    
    if (guideUID) {
      try {
        console.log('[ACCEPT_GUIDE] Attempting to add guide to chat group');
        
        // Use the tripId directly for chat group search (always use the provided tripId, not MongoDB _id)
        const group = await Group.findOne({ trip_id: tripId });
        
        if (group) {
          console.log('[ACCEPT_GUIDE] Found chat group for tripId:', tripId);
          console.log('[ACCEPT_GUIDE] Current member_ids:', group.member_ids);
          
          // Check if guide is already in the group
          if (!group.member_ids.includes(guideUID)) {
            // Add guide to member_ids array
            const updatedGroup = await Group.findByIdAndUpdate(
              group._id,
              {
                $addToSet: { member_ids: guideUID }
              },
              { new: true }
            );
            
            console.log(`[ACCEPT_GUIDE] Guide ${guideUID} added to chat group for trip ${tripId}`);
            console.log('[ACCEPT_GUIDE] Updated group member_ids:', updatedGroup.member_ids);
            chatGroupUpdated = true;
            chatGroupMessage = 'Guide added to chat group successfully';
          } else {
            console.log(`[ACCEPT_GUIDE] Guide ${guideUID} already exists in chat group`);
            chatGroupMessage = 'Guide already in chat group';
          }
        } else {
          console.log(`[ACCEPT_GUIDE] No chat group found for tripId: ${tripId}`);
          chatGroupMessage = 'No chat group found';
          
          if (!tripUpdateSuccess) {
            return res.status(404).json({
              success: false,
              message: 'Trip not found in database and no chat group found',
              data: {
                tripUpdateSuccess: false,
                chatGroupFound: false
              }
            });
          }
        }
      } catch (chatError) {
        console.error('[ACCEPT_GUIDE] Error updating chat group:', chatError);
        console.error('[ACCEPT_GUIDE] Chat error message:', chatError.message);
        chatGroupMessage = `Chat group update failed: ${chatError.message}`;
        
        if (!tripUpdateSuccess) {
          return res.status(500).json({
            success: false,
            message: 'Trip not found and error updating chat group',
            error: chatError.message
          });
        }
        // Continue execution if trip was updated successfully
      }
    } else {
      console.log('[ACCEPT_GUIDE] No guideUID provided, skipping chat group update');
    }

    // If we reach here and trip was not found, return error
    if (!tripUpdateSuccess) {
      return res.status(404).json({
        success: false,
        message: 'Trip not found'
      });
    }

    console.log(`[ACCEPT_GUIDE] Guide accepted for trip ${tripId}: ${email}, status: 1`);
    
    // Check if driver is also needed and confirmed, then proceed to next stage
    if (updatedTrip.driverNeeded == 1 && updatedTrip.driver_status == 1) {
      console.log('[ACCEPT_GUIDE] Driver is also needed and confirmed. Proceeding to start trip...');
      try {
        const startTripResponse = await axios.post('http://localhost:5007/api/trips/start-trip', {
          tripId: tripId
        });
        console.log('[ACCEPT_GUIDE] Trip started successfully:', startTripResponse.data);
        
        console.log('[ACCEPT_GUIDE] Sending success response with trip started');
        return res.json({
          success: true,
          message: 'Guide accepted successfully and trip started',
          data: updatedTrip,
          chatGroupUpdated,
          chatGroupMessage,
          tripStarted: true,
          startTripResponse: startTripResponse.data
        });
      } catch (startTripError) {
        console.error('[ACCEPT_GUIDE] Error starting trip:', startTripError.message);
        // Continue with normal response even if start-trip fails
        console.log('[ACCEPT_GUIDE] Sending success response without trip start');
        return res.json({
          success: true,
          message: 'Guide accepted successfully but failed to start trip',
          data: updatedTrip,
          chatGroupUpdated,
          chatGroupMessage,
          tripStarted: false,
          startTripError: startTripError.message
        });
      }
    }
    
    console.log('[ACCEPT_GUIDE] Sending success response');

    res.json({
      success: true,
      message: 'Guide accepted successfully',
      data: updatedTrip,
      chatGroupUpdated,
      chatGroupMessage
    });
  } catch (error) {
    console.error('[ACCEPT_GUIDE] Error occurred:', error);
    console.error('[ACCEPT_GUIDE] Error message:', error.message);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

// Get ongoing pools for a user
const getOngoingPoolsForUser = async (req, res) => {
  console.log('[GET_ONGOING_POOLS] Function called');
  console.log('[GET_ONGOING_POOLS] Request params:', req.params);
  
  try {
    const { userId } = req.params;
    console.log('[GET_ONGOING_POOLS] Extracted userId:', userId);

    if (!userId) {
      console.log('[GET_ONGOING_POOLS] Validation failed - missing userId');
      return res.status(400).json({
        success: false,
        message: 'userId is required'
      });
    }

    console.log('[GET_ONGOING_POOLS] Fetching pools where user is a member');
    // Step 1: Get all active pools where user is a member
    const pools = await PoolingGroup.find({
      userIds: userId,
      status: 'active'
    });

    console.log(`[GET_ONGOING_POOLS] Found ${pools.length} active pools for user`);

    if (pools.length === 0) {
      console.log('[GET_ONGOING_POOLS] No active pools found for user');
      return res.json({
        success: true,
        message: 'No ongoing pools found for this user',
        data: []
      });
    }

    console.log('[GET_ONGOING_POOLS] Fetching trip details from payed_trips_advance collection');
    // Step 2: For each pool, get the trip details from payed_trips_advance
    const ongoingPoolsWithTrips = [];
    
    for (const pool of pools) {
      console.log(`[GET_ONGOING_POOLS] Processing pool: ${pool._id}, tripId: ${pool.tripId}`);
      
      // Find the trip in payed_trips_advance where _id matches pool.tripId
      const trip = await Trip.findById(pool.tripId);
      
      if (trip) {
        console.log(`[GET_ONGOING_POOLS] Found trip details for pool ${pool._id}`);
        ongoingPoolsWithTrips.push({
          poolDetails: {
            poolId: pool._id,
            tripId: pool.tripId,
            groupName: pool.groupName,
            tripName: pool.tripName,
            creatorUserId: pool.creatorUserId,
            creatorEmail: pool.creatorEmail,
            members: pool.members,
            visibility: pool.visibility,
            preferences: pool.preferences,
            status: pool.status,
            createdAt: pool.createdAt,
            lastUpdated: pool.lastUpdated,
            maxMembers: pool.maxMembers,
            averageDriverCost: pool.averageDriverCost,
            averageGuideCost: pool.averageGuideCost,
            totalCost: pool.totalCost,
            costPerPerson: pool.costPerPerson,
            vehicleType: pool.vehicleType,
            needDriver: pool.needDriver,
            needGuide: pool.needGuide
          },
          tripDetails: {
            tripId: trip._id,
            userId: trip.userId,
            tripName: trip.tripName,
            startDate: trip.startDate,
            endDate: trip.endDate,
            arrivalTime: trip.arrivalTime,
            baseCity: trip.baseCity,
            multiCityAllowed: trip.multiCityAllowed,
            activityPacing: trip.activityPacing,
            budgetLevel: trip.budgetLevel,
            preferredTerrains: trip.preferredTerrains,
            preferredActivities: trip.preferredActivities,
            dailyPlans: trip.dailyPlans,
            mapData: trip.mapData,
            lastUpdated: trip.lastUpdated,
            driverNeeded: trip.driverNeeded,
            guideNeeded: trip.guideNeeded,
            averageTripDistance: trip.averageTripDistance,
            averageDriverCost: trip.averageDriverCost,
            averageGuideCost: trip.averageGuideCost,
            vehicleType: trip.vehicleType,
            driverStatus: trip.driver_status,
            driverEmail: trip.driver_email,
            guideStatus: trip.guide_status,
            guideEmail: trip.guide_email,
            payedAmount: trip.payedAmount
          }
        });
      } else {
        console.log(`[GET_ONGOING_POOLS] Warning: No trip found for pool ${pool._id} with tripId ${pool.tripId}`);
        // Include pool even if trip details not found
        ongoingPoolsWithTrips.push({
          poolDetails: {
            poolId: pool._id,
            tripId: pool.tripId,
            groupName: pool.groupName,
            tripName: pool.tripName,
            creatorUserId: pool.creatorUserId,
            creatorEmail: pool.creatorEmail,
            members: pool.members,
            visibility: pool.visibility,
            preferences: pool.preferences,
            status: pool.status,
            createdAt: pool.createdAt,
            lastUpdated: pool.lastUpdated,
            maxMembers: pool.maxMembers,
            averageDriverCost: pool.averageDriverCost,
            averageGuideCost: pool.averageGuideCost,
            totalCost: pool.totalCost,
            costPerPerson: pool.costPerPerson,
            vehicleType: pool.vehicleType,
            needDriver: pool.needDriver,
            needGuide: pool.needGuide
          },
          tripDetails: null
        });
      }
    }

    console.log(`[GET_ONGOING_POOLS] Successfully processed ${ongoingPoolsWithTrips.length} pools with trip details`);
    console.log('[GET_ONGOING_POOLS] Sending success response');

    res.json({
      success: true,
      message: 'Ongoing pools retrieved successfully',
      count: ongoingPoolsWithTrips.length,
      data: ongoingPoolsWithTrips
    });

  } catch (error) {
    console.error('[GET_ONGOING_POOLS] Error occurred:', error);
    console.error('[GET_ONGOING_POOLS] Error message:', error.message);
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
  getTripsByDriverEmail,
  getTripsByGuideEmail,
  acceptDriver,
  acceptGuide,
  getOngoingPoolsForUser
};
