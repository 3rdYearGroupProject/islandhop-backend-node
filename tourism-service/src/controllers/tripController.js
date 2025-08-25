const Trip = require('../models/Trip');
const axios = require('axios');

// Set driver for a trip
const setDriver = async (req, res) => {
  try {
    const { tripId, email } = req.body;

    if (!tripId || !email) {
      return res.status(400).json({
        success: false,
        message: 'tripId and email are required'
      });
    }

    const updatedTrip = await Trip.findByIdAndUpdate(
      tripId,
      {
        driver_email: email,
        driver_status: 1
      },
      { new: true }
    );

    if (!updatedTrip) {
      return res.status(404).json({
        success: false,
        message: 'Trip not found'
      });
    }

    console.log(`Driver set for trip ${tripId}: ${email}, status: 1`);

    res.json({
      success: true,
      message: 'Driver set successfully',
      data: updatedTrip
    });
  } catch (error) {
    console.error('Error setting driver:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

// Set guide for a trip
const setGuide = async (req, res) => {
  try {
    const { tripId, email } = req.body;

    if (!tripId || !email) {
      return res.status(400).json({
        success: false,
        message: 'tripId and email are required'
      });
    }

    const updatedTrip = await Trip.findByIdAndUpdate(
      tripId,
      {
        guide_email: email,
        guide_status: 1
      },
      { new: true }
    );

    if (!updatedTrip) {
      return res.status(404).json({
        success: false,
        message: 'Trip not found'
      });
    }

    console.log(`Guide set for trip ${tripId}: ${email}, status: 1`);

    res.json({
      success: true,
      message: 'Guide set successfully',
      data: updatedTrip
    });
  } catch (error) {
    console.error('Error setting guide:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

// Remove driver from a trip
const removeDriver = async (req, res) => {
  try {
    const { tripId, email } = req.body;

    if (!tripId || !email) {
      return res.status(400).json({
        success: false,
        message: 'tripId and email are required'
      });
    }

    const updatedTrip = await Trip.findByIdAndUpdate(
      tripId,
      {
        driver_status: 0
      },
      { new: true }
    );

    if (!updatedTrip) {
      return res.status(404).json({
        success: false,
        message: 'Trip not found'
      });
    }

    console.log(`Driver removed for trip ${tripId}, status set to: 0`);

    res.json({
      success: true,
      message: 'Driver removed successfully',
      data: updatedTrip
    });
  } catch (error) {
    console.error('Error removing driver:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

// Remove guide from a trip
const removeGuide = async (req, res) => {
  try {
    const { tripId, email } = req.body;

    if (!tripId || !email) {
      return res.status(400).json({
        success: false,
        message: 'tripId and email are required'
      });
    }

    const updatedTrip = await Trip.findByIdAndUpdate(
      tripId,
      {
        guide_status: 0
      },
      { new: true }
    );

    if (!updatedTrip) {
      return res.status(404).json({
        success: false,
        message: 'Trip not found'
      });
    }

    console.log(`Guide removed for trip ${tripId}, status set to: 0`);

    res.json({
      success: true,
      message: 'Guide removed successfully',
      data: updatedTrip
    });
  } catch (error) {
    console.error('Error removing guide:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

// Activate trip with automatic driver/guide assignment
const newActivateTrip = async (req, res) => {
  try {
    const { tripId } = req.body;

    if (!tripId) {
      return res.status(400).json({
        success: false,
        message: 'tripId is required'
      });
    }

    // Find the trip
    const trip = await Trip.findById(tripId);
    if (!trip) {
      return res.status(404).json({
        success: false,
        message: 'Trip not found'
      });
    }

    console.log(`Activating trip ${tripId}...`);

    let updateData = {};
    let driverAssigned = false;
    let guideAssigned = false;

    // Handle driver assignment if needed
    if (trip.driverNeeded === 1) {
      try {
        console.log('Requesting driver from scoring service...');
        const driverResponse = await axios.post('http://localhost:4000/api/request-driver');
        
        if (driverResponse.data && driverResponse.data.email) {
          updateData.driver_email = driverResponse.data.email;
          updateData.driver_status = 1;
          driverAssigned = true;
          console.log(`Driver assigned: ${driverResponse.data.email}`);

          // Notify schedule service about driver assignment
          try {
            await axios.post('http://localhost:4001/api/request-driver-email', {
              email: driverResponse.data.email
            });
            console.log(`Driver email sent to schedule service: ${driverResponse.data.email}`);
          } catch (scheduleError) {
            console.error('Error notifying schedule service about driver:', scheduleError.message);
          }
        }
      } catch (driverError) {
        console.error('Error requesting driver:', driverError.message);
      }
    }

    // Handle guide assignment if needed
    if (trip.guideNeeded === 1) {
      try {
        console.log('Requesting guide from scoring service...');
        const guideResponse = await axios.post('http://localhost:4000/api/request-guide');
        
        if (guideResponse.data && guideResponse.data.email) {
          updateData.guide_email = guideResponse.data.email;
          updateData.guide_status = 1;
          guideAssigned = true;
          console.log(`Guide assigned: ${guideResponse.data.email}`);

          // Notify schedule service about guide assignment
          try {
            await axios.post('http://localhost:4001/api/request-guide-email', {
              email: guideResponse.data.email
            });
            console.log(`Guide email sent to schedule service: ${guideResponse.data.email}`);
          } catch (scheduleError) {
            console.error('Error notifying schedule service about guide:', scheduleError.message);
          }
        }
      } catch (guideError) {
        console.error('Error requesting guide:', guideError.message);
      }
    }

    // Update the trip with new assignments
    const updatedTrip = await Trip.findByIdAndUpdate(
      tripId,
      updateData,
      { new: true }
    );

    console.log(`Trip ${tripId} activation completed. Driver assigned: ${driverAssigned}, Guide assigned: ${guideAssigned}`);

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
    console.error('Error activating trip:', error);
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
  newActivateTrip
};
