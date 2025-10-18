const express = require('express');
const mongoose = require('mongoose');
const pkg = require('pg');
const { Client } = pkg;
const router = express.Router();

// router.get('/complaints', async (req, res) => {
//     try {
//         console.log('✅ GET /complaints route accessed - fetching unresolved complaints');
        
//         // Get MongoDB connection to lost-items database for complaints
//         const lostItemsDb = mongoose.connection.db;
        
//         // Fetch complaints where status is "not_resolved"
//         const unresolvedComplaints = await lostItemsDb.collection('complaints').find({ 
//             status: "not resolved" 
//         }).toArray();

//         console.log(`Found ${unresolvedComplaints.length} unresolved complaints`);

//         // Return the results
//         const response = {
//             success: true,
//             message: `Found ${unresolvedComplaints.length} unresolved complaints`,
//             count: unresolvedComplaints.length,
//             data: unresolvedComplaints
//         };

//         res.json(response);

//     } catch (error) {
//         console.error('Error fetching unresolved complaints:', error);
//         res.status(500).json({ 
//             success: false,
//             error: 'Internal server error',
//             message: 'Failed to fetch complaints'
//         });
//     }
// });


router.get('/complaints', async (req, res) => {
    try {
        console.log('✅ Fetching unresolved complaints from lost-items and matching trip data from islandhop_trips');

        // Get MongoDB connection to 'lost-items' database for complaints
        const lostItemsDb = mongoose.connection.db;
        
        // Get MongoDB connection to 'islandhop_trips' database for trip data
        const tripsDb = mongoose.connection.client.db("islandhop_trips");

        // Step 1: Fetch unresolved complaints
        const complaints = await lostItemsDb.collection('complaints')
            .find({ status: "not resolved" })
            .toArray();

        console.log(`Fetched complaints found: ${complaints.length}`);

        if (!complaints.length) {
            return res.json({
                success: true,
                count: 0,
                data: [],
                message: 'No unresolved complaints found'
            });
        }

        // Step 2: Extract trip IDs (they are stored as strings, not ObjectIds)
        const tripIds = complaints
            .filter(c => c.tripId && c.tripId.trim() !== '')
            .map(c => c.tripId);

        console.log(`Fetched trip IDs found: ${tripIds.length}`);

        // Step 3: Fetch trip details from correct collection using originalTripId
        const trips = await tripsDb.collection('payed_finished_trips')
            .find({ originalTripId: { $in: tripIds } })
            .toArray();

        console.log(`Fetched trips found: ${trips.length}`);

        // Step 4: Merge complaint + trip data
        const merged = complaints.map(complaint => {
            const trip = trips.find(t => t.originalTripId === complaint.tripId);
            return {
                ...complaint,
                trip_details: trip || null
            };
        });

        // Step 5: Respond with merged data
        res.json({
            success: true,
            count: merged.length,
            data: merged,
            message: `Found ${merged.length} unresolved complaints`
        });

    } catch (error) {
        console.error('❌ Error fetching unresolved complaints:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error',
            error: error.message
        });
    }
});


// Route to get all complaints (optional)
router.get('/complaints/all', async (req, res) => {
    try {
        console.log('✅ GET /complaints/all route accessed - fetching all complaints');
        
        // Get MongoDB connection to lost-items database for complaints
        const lostItemsDb = mongoose.connection.db;
        
        // Fetch all complaints
        const allComplaints = await lostItemsDb.collection('complaints').find({}).toArray();

        console.log(`Found ${allComplaints.length} total complaints`);

        // Return the results
        const response = {
            success: true,
            message: `Found ${allComplaints.length} total complaints`,
            count: allComplaints.length,
            data: allComplaints
        };

        res.json(response);

    } catch (error) {
        console.error('Error fetching all complaints:', error);
        res.status(500).json({ 
            success: false,
            error: 'Internal server error',
            message: 'Failed to fetch all complaints'
        });
    }
});

router.post('/mark-resolved/:id', async (req, res) => {
    const complaintId = req.params.id;

    try {
        console.log(`✅ POST /mark-resolved/${complaintId} route accessed - marking complaint as resolved`);

        // Get MongoDB connection to lost-items database for complaints
        const lostItemsDb = mongoose.connection.db;

        // Update the complaint status to "resolved"
        const result = await lostItemsDb.collection('complaints').updateOne(
            { _id: new mongoose.Types.ObjectId(complaintId) },
            { $set: { status: "resolved" } }
        );

        if (result.modifiedCount === 0) {
            console.log(`No complaint found with ID: ${complaintId}`);
            return res.status(404).json({
                success: false,
                message: `No complaint found with ID: ${complaintId}`
            });
        }

        console.log(`Complaint with ID: ${complaintId} marked as resolved`);

        // Return success response
        res.json({
            success: true,
            message: `Complaint with ID: ${complaintId} marked as resolved`
        });

    } catch (error) {
        console.error('Error marking complaint as resolved:', error);
        res.status(500).json({
            success: false,
            error: 'Internal server error',
            message: 'Failed to mark complaint as resolved'
        });
    }
});

router.post('/add-complaint', async (req, res) => {
    console.log('Request body:', req.body);

    const { description, tripId, userId, email, complaintType } = req.body;

    console.log('Extracted data:', { description, tripId, userId, email, complaintType });

    const userEmail = email; // Use email from the request body

    // Determine priority based on complaint type
    const determinePriority = (type) => {
        // High priority complaints that require immediate attention
        if (type === 'Driver_didnt_show_up') {
            return 'high';
        }
        
        // You can add more high priority types here if needed
        // if (type === 'safety_security') {
        //     return 'high';
        // }
        
        // Default priority for all other complaint types
        return 'medium';
    };

    const priority = determinePriority(complaintType);
    console.log(`Complaint type: ${complaintType}, Priority set to: ${priority}`);

    try {
        console.log(`✅ POST /add-complaint route accessed - adding new complaint`);

        // Get MongoDB connection to 'lost-items' database for complaints
        const lostItemsDb = mongoose.connection.db;
        
        // Get MongoDB connection to 'islandhop_trips' database for trip data
        const tripsDb = mongoose.connection.client.db("islandhop_trips");

        const tripData = await tripsDb.collection('payed_finished_trips').findOne({ originalTripId: tripId });

        const driverEmail= tripData ? tripData.driver_email : 'No Driver Assigned';
        const guideEmail= tripData ? tripData.guide_email : 'No Guide Assigned';

        const client = new Client({
        connectionString: process.env.DATABASE_URL, // Add this to your .env file
        ssl: { 
            rejectUnauthorized: false // This fixes the self-signed certificate issue
        }
        });

        await client.connect();

        // Initialize variables outside if blocks
        let driverInfo = null;
        let guideInfo = null;
        let touristInfo = null;

        if(driverEmail !== 'No Driver Assigned'){
            const driverDetailsQuery  = `
            SELECT * FROM driver_profiles WHERE email = $1`
            const driverDetails = await client.query(driverDetailsQuery, [driverEmail]);
            
            if(driverDetails.rows.length > 0) {
                driverInfo = {
                    first_name: driverDetails.rows[0].first_name,
                    last_name: driverDetails.rows[0].last_name,
                    email: driverDetails.rows[0].email,
                    phone: driverDetails.rows[0].phone_number,
                }
            }
        }

        if(guideEmail !== 'No Guide Assigned'){
            const guideDetailsQuery  = `
            SELECT * FROM guide_profiles WHERE email = $1`
            const guideDetails = await client.query(guideDetailsQuery, [guideEmail]);
            
            if(guideDetails.rows.length > 0) {
                guideInfo = {
                    first_name: guideDetails.rows[0].first_name,
                    last_name: guideDetails.rows[0].last_name,
                    email: guideDetails.rows[0].email,
                    phone: guideDetails.rows[0].phone_number,
                }
            }
        }

        if(userEmail){
            const userDetailsQuery  = `
            SELECT * FROM tourist_profiles WHERE email = $1`
            const touristDetails = await client.query(userDetailsQuery, [userEmail]);
            
            if(touristDetails.rows.length > 0) {
                touristInfo = {
                    first_name: touristDetails.rows[0].first_name,
                    last_name: touristDetails.rows[0].last_name,
                    email: touristDetails.rows[0].email,
                    nationality: touristDetails.rows[0].nationality
                }
            }
        }

        // Insert the new complaint into the lost-items database
        const result = await lostItemsDb.collection('complaints').insertOne({
            description: description,
            type: complaintType,
            priority: priority,
            tripId: tripId,
            tourist: touristInfo || { message: 'Tourist details not found' },
            driver: driverInfo || { message: 'No Driver Assigned' },
            guide: guideInfo || { message: 'No Guide Assigned' },
            status: "not resolved",
            createdAt: new Date()
        });

        console.log(`New complaint added with ID: ${result.insertedId}`);

        // Return success response
        res.json({
            success: true,
            message: `New complaint added with ID: ${result.insertedId}`
        });

    } catch (error) {
        console.error('Error adding new complaint:', error);
        res.status(500).json({
            success: false,
            error: 'Internal server error',
            message: 'Failed to add new complaint'
        });
    }
});

router.get('/3rd-party-drivers', async (req, res) => {
    try {
        console.log('✅ GET /3rd-party-drivers route accessed - fetching all third party drivers');

        // Get MongoDB connection to 'For_Drivers' database
        const forDriversDb = mongoose.connection.client.db("For_Drivers");
        
        // Fetch all third party drivers from third_party_drivers collection
        const thirdPartyDrivers = await forDriversDb.collection('third_party_drivers')
            .find({})
            .sort({ createdAt: -1 }) // Sort by most recent first
            .toArray();

        console.log(`Found ${thirdPartyDrivers.length} third party drivers`);

        // Return the results
        res.json({
            success: true,
            message: `Found ${thirdPartyDrivers.length} third party drivers`,
            count: thirdPartyDrivers.length,
            data: thirdPartyDrivers
        });

    } catch (error) {
        console.error('❌ Error fetching third party drivers:', error);
        res.status(500).json({
            success: false,
            error: 'Internal server error',
            message: 'Failed to fetch third party drivers',
            details: error.message
        });
    }
});

module.exports = router;