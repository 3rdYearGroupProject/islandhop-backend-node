const express = require('express');
const router = express.Router();
const { CompletedTrip, PayedFinishedTrip } = require('../models/Trip');

// Endpoint 1: Process payment and move trip from completed_trips to payed_finished_trips
router.post('/process-payment', async (req, res) => {
  try {
    const { _id, payedAmount } = req.body;

    // Validate input
    if (!_id || payedAmount === undefined || payedAmount === null) {
      return res.status(400).json({ 
        error: 'Missing required fields: _id and payedAmount are required' 
      });
    }

    if (typeof payedAmount !== 'number' || payedAmount < 0) {
      return res.status(400).json({ 
        error: 'payedAmount must be a positive number' 
      });
    }

    // Find the trip in completed_trips using the provided _id (could be UUID or ObjectId)
    const completedTrip = await CompletedTrip.findOne({ _id: _id });
    
    if (!completedTrip) {
      return res.status(404).json({ 
        error: 'Trip not found in completed trips' 
      });
    }

    // Prepare the document for payed_finished_trips
    const tripData = completedTrip.toObject();
    
    // Update payedAmount
    const existingPayedAmount = parseFloat(tripData.payedAmount) || 0;
    tripData.payedAmount = existingPayedAmount + payedAmount;
    
    // Store the original trip ID for reference
    tripData.originalTripId = _id;

    // Create new document in payed_finished_trips
    const payedFinishedTrip = new PayedFinishedTrip(tripData);
    await payedFinishedTrip.save();

    // Remove from completed_trips
    await CompletedTrip.deleteOne({ _id: _id });

    res.status(200).json({ 
      message: 'Payment processed successfully',
      data: {
        newTripId: payedFinishedTrip._id,
        originalTripId: _id,
        totalPayedAmount: tripData.payedAmount
      }
    });

  } catch (error) {
    console.error('Error processing payment:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      message: error.message 
    });
  }
});

// Endpoint 2: Add driver review
router.post('/driver-review', async (req, res) => {
  try {
    const { tripId, review } = req.body;

    // Validate input
    if (!tripId || !review) {
      return res.status(400).json({ 
        error: 'Missing required fields: tripId and review are required' 
      });
    }

    // Find and update the trip in payed_finished_trips
    const updatedTrip = await PayedFinishedTrip.findOneAndUpdate(
      { _id: tripId },
      { 
        driver_reviewed: 1,
        driver_review: review 
      },
      { new: true }
    );

    if (!updatedTrip) {
      return res.status(404).json({ 
        error: 'Trip not found in payed finished trips' 
      });
    }

    res.status(200).json({ 
      message: 'Driver review added successfully',
      data: {
        tripId: updatedTrip._id,
        driver_reviewed: updatedTrip.driver_reviewed,
        driver_review: updatedTrip.driver_review
      }
    });

  } catch (error) {
    console.error('Error adding driver review:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      message: error.message 
    });
  }
});

// Endpoint 3: Add guide review
router.post('/guide-review', async (req, res) => {
  try {
    const { tripId, review } = req.body;

    // Validate input
    if (!tripId || !review) {
      return res.status(400).json({ 
        error: 'Missing required fields: tripId and review are required' 
      });
    }

    // Find and update the trip in payed_finished_trips
    const updatedTrip = await PayedFinishedTrip.findOneAndUpdate(
      { _id: tripId },
      { 
        guide_reviewed: 1,
        guide_review: review 
      },
      { new: true }
    );

    if (!updatedTrip) {
      return res.status(404).json({ 
        error: 'Trip not found in payed finished trips' 
      });
    }

    res.status(200).json({ 
      message: 'Guide review added successfully',
      data: {
        tripId: updatedTrip._id,
        guide_reviewed: updatedTrip.guide_reviewed,
        guide_review: updatedTrip.guide_review
      }
    });

  } catch (error) {
    console.error('Error adding guide review:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      message: error.message 
    });
  }
});

// Additional utility endpoints

// Get all payed finished trips
router.get('/payed-trips', async (req, res) => {
  try {
    const trips = await PayedFinishedTrip.find();
    res.status(200).json({ 
      message: 'Payed finished trips retrieved successfully',
      count: trips.length,
      data: trips 
    });
  } catch (error) {
    console.error('Error retrieving payed trips:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      message: error.message 
    });
  }
});

// Get all payed finished trips for a specific user
router.get('/user-trips/:userId', async (req, res) => {
  try {
    const { userId } = req.params;

    // Validate input
    if (!userId) {
      return res.status(400).json({ 
        error: 'Missing required parameter: userId' 
      });
    }

    // Find all trips for the given userId
    const trips = await PayedFinishedTrip.find({ userId: userId });

    res.status(200).json({ 
      message: 'User trips retrieved successfully',
      userId: userId,
      count: trips.length,
      data: trips 
    });
  } catch (error) {
    console.error('Error retrieving user trips:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      message: error.message 
    });
  }
});

// Get specific payed finished trip by ID
router.get('/payed-trips/:id', async (req, res) => {
  try {
    const trip = await PayedFinishedTrip.findOne({ _id: req.params.id });
    
    if (!trip) {
      return res.status(404).json({ 
        error: 'Trip not found' 
      });
    }

    res.status(200).json({ 
      message: 'Trip retrieved successfully',
      data: trip 
    });
  } catch (error) {
    console.error('Error retrieving trip:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      message: error.message 
    });
  }
});

module.exports = router;
