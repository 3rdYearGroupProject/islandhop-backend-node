import express from 'express';
import mongoose from 'mongoose';
import { createLostItemModel } from '../models/lost-items-log.js';
import pkg from 'pg';
const { Client } = pkg;

const router = express.Router();

// Function to fetch user details from Supabase DB
async function fetchUserDetails(driverEmails, guideEmails, touristEmails) {
    const client = new Client({
        connectionString: process.env.NEON_DATABASE_URL, // Supabase URL
        ssl: { 
            rejectUnauthorized: false
        }
    });

    try {
        await client.connect();
        const userMap = {};
        
        // Fetch driver details
        if (driverEmails.length > 0) {
            const driverQuery = `
                SELECT id, first_name, last_name, email, emergency_contact_number 
                FROM driver_profiles 
                WHERE email = ANY($1)
            `;
            
            const driverResult = await client.query(driverQuery, [driverEmails]);
            driverResult.rows.forEach(driver => {
                userMap[driver.email] = {
                    ...driver,
                    user_type: 'driver'
                };
            });
            
            console.log(`Fetched ${driverResult.rows.length} driver details`);
        }
        
        // Fetch guide details
        if (guideEmails.length > 0) {
            const guideQuery = `
                SELECT id, first_name, last_name, email, emergency_contact_number 
                FROM guide_profiles 
                WHERE email = ANY($1)
            `;
            
            const guideResult = await client.query(guideQuery, [guideEmails]);
            guideResult.rows.forEach(guide => {
                userMap[guide.email] = {
                    ...guide,
                    user_type: 'guide'
                };
            });
            
            console.log(`Fetched ${guideResult.rows.length} guide details`);
        }
        
        // Fetch tourist details
        if (touristEmails.length > 0) {
            const touristQuery = `
                SELECT id, email, first_name, last_name, nationality 
                FROM tourist_profiles 
                WHERE email = ANY($1)
            `;
            
            const touristResult = await client.query(touristQuery, [touristEmails]);
            touristResult.rows.forEach(tourist => {
                userMap[tourist.email] = {
                    ...tourist,
                    user_type: 'tourist'
                };
            });
            
            console.log(`Fetched ${touristResult.rows.length} tourist details`);
        }
        
        return userMap;
    } catch (error) {
        console.error('Error fetching user details from Supabase:', error);
        return {};
    } finally {
        await client.end();
    }
}


router.get('/getLostItems', async (req, res) => {
    console.log('✅ GET /getLostItems route was accessed!');

    try {
        // Access the database connections
        const { lostItemsDb } = req.app.locals.dbConnections;
        
        // Get main database connection for trips
        const tripsDb = mongoose.connection.client.db("islandhop_trips");
        
        // Dashboard Statistics - Count all cases
        const countOfTotalCases = await lostItemsDb.collection("lost-items-log").countDocuments({});
        
        // Count not found cases (status: 'reported' or 'investigating' or 'not found')
        const countOfNotFoundCases = await lostItemsDb.collection("lost-items-log").countDocuments({
            status: 'not found'
        });
        
        // Count found cases (status: 'resolved' or 'found')
        const countOfFoundCases = await lostItemsDb.collection("lost-items-log").countDocuments({
            status: 'found'
        });
        
        
        // Find records where status is "not found"
        const lostItems = await lostItemsDb.collection("lost-items-log").find({ 
            status: "not found" 
        }).toArray();

        console.log(`Found ${lostItems.length} lost items with "not found" status`);

        // Extract unique tripIds from lost items
        const tripIds = [...new Set(lostItems.map(item => item.tripId))];
        console.log(`Need to fetch details for ${tripIds.length} unique trips:`, tripIds);

        // Fetch trip details for all tripIds
        const trips = await tripsDb.collection("payed_finished_trips").find({ 
            originalTripId: { $in: tripIds }
        }).toArray();

        console.log(`Found ${trips.length} trip details`);
        console.log('Trip details found:', trips.map(t => ({ originalTripId: t.originalTripId, tripId: t.tripId })));

        // Create a map of originalTripId -> trip details for quick lookup
        const tripMap = {};
        trips.forEach(trip => {
            tripMap[trip.originalTripId] = trip;
        });

        console.log('Trip mapping created:', Object.keys(tripMap));

        // Extract unique driver and guide emails from trips
        const driverEmails = [...new Set(trips.map(trip => trip.driver_email).filter(Boolean))];
        const guideEmails = [...new Set(trips.map(trip => trip.guide_email).filter(Boolean))];
        
        // Extract unique tourist emails from lost items
        const touristEmails = [...new Set(lostItems.map(item => item.email).filter(Boolean))];

        console.log(`Fetching details for ${driverEmails.length} drivers, ${guideEmails.length} guides, and ${touristEmails.length} tourists from Supabase`);

        // Fetch user details from Supabase DB (separate tables)
        const userDetails = await fetchUserDetails(driverEmails, guideEmails, touristEmails);

        // Merge trip details with lost items
        const lostItemsWithTripDetails = lostItems.map(lostItem => {
            const tripDetails = tripMap[lostItem.tripId] || null;
            const touristDetails = userDetails[lostItem.email] || null;

            return {
                ...lostItem,
                touristDetails: touristDetails ? {
                    id: touristDetails.id,
                    email: touristDetails.email,
                    first_name: touristDetails.first_name,
                    last_name: touristDetails.last_name,
                    nationality: touristDetails.nationality,
                    user_type: touristDetails.user_type
                } : {
                    id: null,
                    email: lostItem.email || 'Unknown Email',
                    first_name: 'Unknown',
                    last_name: 'Tourist',
                    nationality: 'Unknown',
                    user_type: 'tourist'
                },
                tripDetails: tripDetails ? {
                    tripId: tripDetails.tripId,
                    title: tripDetails.title || 'Unknown Trip',
                    destination: tripDetails.destination || 'Unknown Destination',
                    startDate: tripDetails.startDate || null,
                    endDate: tripDetails.endDate || null,
                    guide: {
                        email: tripDetails.guide_email,
                        ...(userDetails[tripDetails.guide_email] ? {
                            ...userDetails[tripDetails.guide_email],
                            // Handle null names in database
                            first_name: userDetails[tripDetails.guide_email].first_name || 'Guide',
                            last_name: userDetails[tripDetails.guide_email].last_name || 'Name Not Set',
                            emergency_contact_number: userDetails[tripDetails.guide_email].emergency_contact_number || 'N/A'
                        } : { 
                            first_name: 'Guide', 
                            last_name: 'Not Found',
                            email: tripDetails.guide_email || 'N/A', 
                            emergency_contact_number: 'N/A',
                            user_type: 'guide'
                        })
                    },
                    driver: {
                        email: tripDetails.driver_email,
                        ...(userDetails[tripDetails.driver_email] ? {
                            ...userDetails[tripDetails.driver_email],
                            // Handle null names in database
                            first_name: userDetails[tripDetails.driver_email].first_name || 'Driver',
                            last_name: userDetails[tripDetails.driver_email].last_name || 'Name Not Set',
                            emergency_contact_number: userDetails[tripDetails.driver_email].emergency_contact_number || 'N/A'
                        } : { 
                            first_name: 'Driver',
                            last_name: 'Not Found',
                            email: tripDetails.driver_email || 'N/A', 
                            emergency_contact_number: 'N/A',
                            user_type: 'driver'
                        })
                    },
                    // Add any other trip fields you need
                } : {
                    tripId: lostItem.tripId,
                    title: 'Trip Not Found',
                    destination: 'Unknown',
                    startDate: null,
                    endDate: null,
                    guide: {
                        email: null,
                        first_name: 'Unknown',
                        last_name: 'Guide',
                        emergency_contact_number: 'N/A',
                        user_type: 'guide'
                    },
                    driver: {
                        email: null,
                        first_name: 'Unknown',
                        last_name: 'Driver', 
                        emergency_contact_number: 'N/A',
                        user_type: 'driver'
                    }
                }
            };
        });

        // Return the merged results
        const response = {
            success: true,
            message: `Found ${lostItems.length} lost items with trip and tourist details`,
            count: lostItems.length,
            data: lostItemsWithTripDetails,
            dashboardStats: {
                totalCases: countOfTotalCases,
                notFoundCases: countOfNotFoundCases,
                foundCases: countOfFoundCases
            }
        };

        res.json(response);
        
    } catch (error) {
        console.error('Error fetching lost items with trip details:', error);
        res.status(500).json({ 
            success: false,
            error: 'Internal server error',
            message: 'Failed to fetch lost items with trip details'
        });
    }
});

router.put('/updateProgressNotes/:id', async (req, res) => {
  const { id } = req.params;
  const { progressNotes } = req.body;

  try {
    console.log(`✅ PUT /updateProgressNotes/${id} route accessed`);
    console.log('Progress notes to update:', progressNotes);

    // Create the lost item model using the separate database connection
    const LostItem = createLostItemModel();

    // Convert string id to ObjectId
    const objectId = new mongoose.Types.ObjectId(id);

    // Update only the progress notes field
    const updatedReport = await LostItem.findByIdAndUpdate(
      objectId,
      {
        $set: {
          progressNotes: progressNotes,
          updatedAt: new Date()
        }
      },
      { new: true } // return the updated document
    );

    if (!updatedReport) {
      console.log(`Lost item not found with ID: ${id}`);
      return res.status(404).json({ 
        success: false, 
        message: 'Lost item not found' 
      });
    }

    console.log('Progress notes updated successfully:', updatedReport.progressNotes);

    res.json({ 
      success: true, 
      message: 'Progress notes updated successfully',
      data: {
        id: updatedReport._id,
        progressNotes: updatedReport.progressNotes,
        updatedAt: updatedReport.updatedAt
      }
    });

  } catch (error) {
    console.error('Error updating progress notes:', error);
    
    // Handle specific MongoDB errors
    if (error.name === 'CastError') {
      return res.status(400).json({ 
        success: false, 
        error: 'Invalid ID format' 
      });
    }
    
    res.status(500).json({ 
      success: false, 
      error: 'Internal server error',
      message: 'Failed to update progress notes'
    });
  }
});

router.put('/resolve-item/:id', async (req, res) => {
  const { id } = req.params;
  const { resolutionNotes } = req.body;
  
    try {
    console.log(`✅ PUT /resolve-item/${id} route accessed`);
    console.log('Resolution notes to update:', resolutionNotes);
    // Create the lost item model using the separate database connection
    const LostItem = createLostItemModel();
    // Convert string id to ObjectId
    const objectId = new mongoose.Types.ObjectId(id);
    // Update the status to "found" and add resolution notes
    const updatedReport = await LostItem.findByIdAndUpdate(
        objectId,
        {
            $set: {
                status: "found",
                resolutionNotes: resolutionNotes
            }
        },
        { new: true } // return the updated document
    );

    if (!updatedReport) {
        console.log(`Lost item not found with ID: ${id}`);
        return res.status(404).json({
            success: false,
            message: 'Lost item not found'
        });
    }

    console.log('Lost item resolved successfully:', updatedReport);

    res.json({
        success: true,
        message: 'Lost item resolved successfully',
        data: updatedReport
    });

} catch (error) {
    console.error('Error resolving lost item:', error);

    // Handle specific MongoDB errors
    if (error.name === 'CastError') {
        return res.status(400).json({
            success: false,
            error: 'Invalid ID format'
        });
    }

    res.status(500).json({
        success: false,
        error: 'Internal server error',
        message: 'Failed to resolve lost item'
    });
}
});

export default router;
