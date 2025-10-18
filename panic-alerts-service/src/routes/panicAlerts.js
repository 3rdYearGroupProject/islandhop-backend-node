import express from 'express';
import mongoose from 'mongoose';
import { createPanicAlertModel } from '../models/panicAlert.js';
import pkg from 'pg';
const { Client } = pkg;

const router = express.Router();

// Function to fetch tourist details from Supabase DB
async function fetchTouristDetails(emails) {
    const client = new Client({
        connectionString: process.env.NEON_DATABASE_URL,
        ssl: { 
            rejectUnauthorized: false
        }
    });

    try {
        await client.connect();
        
        const touristMap = {};
        
        if (emails.length > 0) {
            const touristQuery = `
                SELECT email, first_name, last_name, nationality 
                FROM tourist_profiles 
                WHERE email = ANY($1)
            `;
            
            const touristResult = await client.query(touristQuery, [emails]);
            touristResult.rows.forEach(tourist => {
                touristMap[tourist.email] = {
                    first_name: tourist.first_name,
                    last_name: tourist.last_name,
                    nationality: tourist.nationality
                };
            });
            
            console.log(`Fetched ${touristResult.rows.length} tourist details`);
        }
        
        return touristMap;
    } catch (error) {
        console.error('Error fetching tourist details from Supabase:', error);
        return {};
    } finally {
        await client.end();
    }
}

// POST /panic-alerts - Create a new panic alert
router.post('/', async (req, res) => {
  try {
    console.log('🚨 Panic alert received:', req.body);
    
    const {
      userId,
      userEmail,
      userName,
      userPhone,
      location,
      alertTimestamp,
      status,
      priority,
      type,
      message,
      deviceInfo
    } = req.body;

    // Validate required fields
    if (!userId || !userEmail || !location || !location.latitude || !location.longitude) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields',
        message: 'userId, userEmail, and location (latitude, longitude) are required'
      });
    }

    // const client = new Client({
    //     connectionString: process.env.DATABASE_URL, // Add this to your .env file
    //     ssl: { 
    //         rejectUnauthorized: false // This fixes the self-signed certificate issue
    //     }
    // });

    // await client.connect();

    // const touristDetails = await client.query('SELECT first_name, last_name, nationality FROM tourist_profiles WHERE email = $1', [userEmail]);

    // console.log('Tourist details fetched:', touristDetails.rows);
    // Get lost-items database connection
    const { lostItemsDb } = req.app.locals.dbConnections;
    
    // Create new panic alert document directly in the collection
    const newPanicAlert = {
      userId,
      userEmail,
      userName: userName || 'Unknown User',
      userPhone: userPhone || null,
      location: {
        latitude: location.latitude,
        longitude: location.longitude,
        accuracy: location.accuracy || null,
        timestamp: location.timestamp || new Date().toISOString()
      },
      alertTimestamp: alertTimestamp || new Date().toISOString(),
      status: status || 'not_resolved',
      priority: priority || 'high',
      type: type || 'panic_alert',
      message: message || 'Emergency panic alert triggered by user',
      deviceInfo: {
        userAgent: deviceInfo?.userAgent || null,
        platform: deviceInfo?.platform || null,
        language: deviceInfo?.language || null
      },
      createdAt: new Date(),
      updatedAt: new Date()
    };

    // Save to lost-items database
    const result = await lostItemsDb.collection('panic_alerts').insertOne(newPanicAlert);

    console.log(`✅ Panic alert saved with ID: ${result.insertedId}`);

    // Return success response
    res.status(201).json({
      success: true,
      message: 'Panic alert created successfully',
      data: {
        alertId: result.insertedId,
        userId: newPanicAlert.userId,
        userEmail: newPanicAlert.userEmail,
        status: newPanicAlert.status,
        priority: newPanicAlert.priority,
        timestamp: newPanicAlert.alertTimestamp,
        location: newPanicAlert.location
      }
    });

  } catch (error) {
    console.error('❌ Error creating panic alert:', error);
    
    res.status(500).json({
      success: false,
      error: 'Internal Server Error',
      message: 'Failed to create panic alert'
    });
  }
});

// GET /panic-alerts - Get all panic alerts (for admin/support)
router.get('/', async (req, res) => {
  try {
    console.log('📋 Fetching all panic alerts');
    
    const { limit = 50, skip = 0 } = req.query;
    
    // Get lost-items database connection
    const { lostItemsDb } = req.app.locals.dbConnections;
    
    // Fetch only unresolved panic alerts
    const alerts = await lostItemsDb.collection('panic_alerts')
      .find({ status: "not_resolved" }) // Filter for only unresolved alerts
      .sort({ createdAt: -1 }) // Most recent first using createdAt
      .limit(parseInt(limit))
      .skip(parseInt(skip))
      .toArray();
    
    console.log(`📋 Found ${alerts.length} unresolved panic alerts`);

    // Extract unique emails from panic alerts
    const emails = [...new Set(alerts.map(alert => alert.userEmail).filter(Boolean))];
    console.log(`Fetching tourist details for ${emails.length} unique emails:`, emails);

    // Fetch tourist details from Supabase
    const touristDetails = await fetchTouristDetails(emails);

    // Map panic alerts with tourist details
    const alertsWithTouristDetails = alerts.map(alert => {
      const touristInfo = touristDetails[alert.userEmail];
      
      return {
        ...alert,
        touristDetails: touristInfo ? {
          first_name: touristInfo.first_name,
          last_name: touristInfo.last_name,
          nationality: touristInfo.nationality,
          email: alert.userEmail
        } : {
          first_name: 'Unknown',
          last_name: 'Tourist',
          nationality: 'Unknown',
          email: alert.userEmail || 'Unknown Email'
        }
      };
    });
    
    const totalCount = await lostItemsDb.collection('panic_alerts').countDocuments({ status: "not_resolved" });
    
    console.log(`📋 Mapped ${alertsWithTouristDetails.length} panic alerts with tourist details`);
    
    res.json({
      success: true,
      message: `Found ${alerts.length} panic alerts with tourist details`,
      data: alertsWithTouristDetails,
      pagination: {
        total: totalCount,
        limit: parseInt(limit),
        skip: parseInt(skip),
        hasMore: (parseInt(skip) + parseInt(limit)) < totalCount
      }
    });
    
  } catch (error) {
    console.error('❌ Error fetching panic alerts:', error);
    res.status(500).json({
      success: false,
      error: 'Internal Server Error',
      message: 'Failed to fetch panic alerts'
    });
  }
});

// PUT /panic-alerts/:id/status - Update panic alert status
router.put('/:id/status', async (req, res) => {
  try {
    const { id } = req.params;
    const { status} = req.body;
    
    console.log(`🔄 Updating panic alert ${id} status to: ${status}`);
    
    // Validate status
    const validStatuses = ['not_resolved', 'investigating', 'resolved'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid status',
        message: `Status must be one of: ${validStatuses.join(', ')}`
      });
    }
    
    // Get lost-items database connection
    const { lostItemsDb } = req.app.locals.dbConnections;
    
    const updateData = {
      status,
      updatedAt: new Date()
    };
    
    //if (notes) updateData.notes = notes;
    if (status === 'resolved') updateData.resolvedAt = new Date();
    
    // Update the panic alert
    const result = await lostItemsDb.collection('panic_alerts').updateOne(
      { _id: new mongoose.Types.ObjectId(id) },
      { $set: updateData }
    );
    
    if (result.matchedCount === 0) {
      return res.status(404).json({
        success: false,
        error: 'Panic alert not found',
        message: `No panic alert found with ID: ${id}`
      });
    }
    
    // Fetch the updated document
    const updatedAlert = await lostItemsDb.collection('panic_alerts').findOne(
      { _id: new mongoose.Types.ObjectId(id) }
    );
    
    console.log(`✅ Panic alert ${id} status updated to: ${status}`);
    
    res.json({
      success: true,
      message: 'Panic alert status updated successfully',
      data: {
        alertId: updatedAlert._id,
        status: updatedAlert.status,
        updatedAt: updatedAlert.updatedAt,
        resolvedAt: updatedAlert.resolvedAt,
        notes: updatedAlert.notes
      }
    });
    
  } catch (error) {
    console.error('❌ Error updating panic alert status:', error);
    
    if (error.name === 'CastError' || error.message.includes('ObjectId')) {
      return res.status(400).json({
        success: false,
        error: 'Invalid ID format',
        message: 'Please provide a valid panic alert ID'
      });
    }
    
    res.status(500).json({
      success: false,
      error: 'Internal Server Error',
      message: 'Failed to update panic alert status'
    });
  }
});

export default router;