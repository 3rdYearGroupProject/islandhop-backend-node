import express from 'express';
import mongoose from 'mongoose';
import pkg from 'pg';
const { Client } = pkg;

const router = express.Router();

// Function to fetch user details from Neon DB
async function fetchUserDetails(driverIds, guideIds, touristEmails) {
    const client = new Client({
        connectionString: process.env.NEON_DATABASE_URL, // Add this to your .env file
        ssl: true
    });

    try {
        await client.connect();
        
        const userMap = {};
        
        // Fetch driver details from driver_profiles table
        if (driverIds.length > 0) {
            const driverQuery = `
                SELECT id, first_name,last_name, email, emergency_contact_number 
                FROM driver_profiles 
                WHERE id = ANY($1)
            `;
            
            const driverResult = await client.query(driverQuery, [driverIds]);
            driverResult.rows.forEach(driver => {
                userMap[driver.id] = {
                    ...driver,
                    user_type: 'driver'
                };
            });
            
            console.log(`Fetched ${driverResult.rows.length} driver details`);
        }
        
        // Fetch guide details from guide_profiles table
        if (guideIds.length > 0) {
            const guideQuery = `
                SELECT id, first_name,last_name, email, emergency_contact_number 
                FROM guide_profiles 
                WHERE id = ANY($1)
            `;
            
            const guideResult = await client.query(guideQuery, [guideIds]);
            guideResult.rows.forEach(guide => {
                userMap[guide.id] = {
                    ...guide,
                    user_type: 'guide'
                };
            });
            
            console.log(`Fetched ${guideResult.rows.length} guide details`);
        }
        
        // Fetch tourist details from tourist_profiles table
        if (touristEmails.length > 0) {
            const touristQuery = `
                SELECT id,email, first_name, last_name, nationality 
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
        console.error('Error fetching user details from Neon DB:', error);
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
        
        // Find records where status is "not found"
        const lostItems = await lostItemsDb.collection("lost-items-log").find({ 
            status: "not found" 
        }).toArray();

        console.log(`Found ${lostItems.length} lost items with "not found" status`);

        // Extract unique tripIds from lost items
        const tripIds = [...new Set(lostItems.map(item => item.tripId))];
        console.log(`Need to fetch details for ${tripIds.length} unique trips:`, tripIds);

        // Fetch trip details for all tripIds
        const trips = await tripsDb.collection("trips").find({ 
            tripId: { $in: tripIds }
        }).toArray();

        console.log(`Found ${trips.length} trip details`);

        // Create a map of tripId -> trip details for quick lookup
        const tripMap = {};
        trips.forEach(trip => {
            tripMap[trip.tripId] = trip;
        });

        // Extract unique driver and guide UIDs from trips
        const driverIds = [...new Set(trips.map(trip => trip.driver).filter(Boolean))];
        const guideIds = [...new Set(trips.map(trip => trip.guide).filter(Boolean))];
        
        // Extract unique tourist emails from lost items
        const touristEmails = [...new Set(lostItems.map(item => item.email).filter(Boolean))];

        console.log(`Fetching details for ${driverIds.length} drivers, ${guideIds.length} guides, and ${touristEmails.length} tourists from Neon DB`);
        console.log('Driver IDs:', driverIds);
        console.log('Guide IDs:', guideIds);
        console.log('Tourist emails:', touristEmails);

        // Fetch user details from Neon DB (separate tables)
        const userDetails = await fetchUserDetails(driverIds, guideIds, touristEmails);

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
                        uid: tripDetails.guide,
                        ...userDetails[tripDetails.guide] || { 
                            name: 'Guide Not Found', 
                            email: 'N/A', 
                            phone: 'N/A',
                            certification: 'N/A',
                            languages: 'N/A',
                            experience_years: 'N/A',
                            user_type: 'guide'
                        }
                    },
                    driver: {
                        uid: tripDetails.driver,
                        ...userDetails[tripDetails.driver] || { 
                            name: 'Driver Not Found', 
                            email: 'N/A', 
                            phone: 'N/A',
                            license_number: 'N/A',
                            vehicle_type: 'N/A',
                            user_type: 'driver'
                        }
                    },
                    // Add any other trip fields you need
                } : {
                    tripId: lostItem.tripId,
                    title: 'Trip Not Found',
                    destination: 'Unknown',
                    startDate: null,
                    endDate: null,
                    guide: {
                        uid: null,
                        name: 'Unknown',
                        email: 'N/A',
                        phone: 'N/A',
                        certification: 'N/A',
                        languages: 'N/A',
                        experience_years: 'N/A',
                        user_type: 'guide'
                    },
                    driver: {
                        uid: null,
                        name: 'Unknown', 
                        email: 'N/A',
                        phone: 'N/A',
                        license_number: 'N/A',
                        vehicle_type: 'N/A',
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
            data: lostItemsWithTripDetails
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

export default router;
