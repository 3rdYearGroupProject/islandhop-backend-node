// touristRoutes.js
import express from 'express';
import Trip from '../models/confirmedTrips.js';
import { createLostItemModel } from '../models/lost-items-log.js';
import mongoose from 'mongoose';



const router = express.Router();

router.get('/trips/:userId', async (req, res) => {
  console.log('✅ GET /trips route was accessed!');

  try {
    const { userId } = req.params;
    console.log('Fetching trips for UID: from touristroutes', userId);
    //const tripsData = await Trip.find({ userId: userId });
    const tripsData = await mongoose.connection
  .collection('payed_finished_trips')
  .find({ userId: userId })
  .toArray();

    console.log('Trips data fetched:', tripsData);
    if (tripsData.length != 0) {
      const data = {
        success: true,
        trips: tripsData
      };
      return res.json(data);
    }
    const data = {
      success: false,
      message: 'No trips found for this user.'
    };
    return res.status(404).json(data);
  } catch (error) {
    console.error('Error fetching trips:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});


router.post('/addLostItem', async (req, res) => {
  console.log('✅ POST /addLostItem route was accessed!');

  try {
    const { userId, description, dateLost, tripId , email} = req.body;
    console.log('Adding lost item for UID:', userId);

    // Create the model using the lost-items database connection
    const LostItem = createLostItemModel();

    // Create new lost item using the Mongoose model
    const newLostItem = new LostItem({
      userId: userId,
      description: description,
      lostDate: dateLost,
      tripId: tripId,
      email: email,
      // status will default to "not found" as defined in the schema
      // timestamp will be automatically set by default: Date.now
    });

    // Save the lost item to the lost-items database
    const savedLostItem = await newLostItem.save();

    console.log('Lost item saved to lost-items database with ID:', savedLostItem._id);

    const data = {
      success: true,
      message: 'Lost item reported successfully.',
      item: {
        id: savedLostItem._id,
        userId: savedLostItem.userId,
        description: savedLostItem.description,
        email: savedLostItem.email,
        lostDate: savedLostItem.lostDate,
        tripId: savedLostItem.tripId,
        status: savedLostItem.status,
        timestamp: savedLostItem.timestamp,
        createdAt: savedLostItem.createdAt,
        updatedAt: savedLostItem.updatedAt
      }
    };
    return res.json(data);
  } catch (error) {
    console.error('Error adding lost item:', error);
    
    // Handle validation errors specifically
    if (error.name === 'ValidationError') {
      return res.status(400).json({ 
        success: false,
        error: 'Validation Error',
        details: error.message 
      });
    }
    
    res.status(500).json({ 
      success: false,
      error: 'Internal server error' 
    });
  }
});

export default router;