const express = require('express');
const mongoose = require('mongoose');
const router = express.Router();

router.get('/complaints', async (req, res) => {
    try {
        console.log('✅ GET /complaints route accessed - fetching unresolved complaints');
        
        // Get MongoDB connection
        const db = mongoose.connection.db;
        
        // Fetch complaints where status is "not_resolved"
        const unresolvedComplaints = await db.collection('complaints').find({ 
            status: "not_resolved" 
        }).toArray();

        console.log(`Found ${unresolvedComplaints.length} unresolved complaints`);

        // Return the results
        const response = {
            success: true,
            message: `Found ${unresolvedComplaints.length} unresolved complaints`,
            count: unresolvedComplaints.length,
            data: unresolvedComplaints
        };

        res.json(response);

    } catch (error) {
        console.error('Error fetching unresolved complaints:', error);
        res.status(500).json({ 
            success: false,
            error: 'Internal server error',
            message: 'Failed to fetch complaints'
        });
    }
});

// Route to get all complaints (optional)
router.get('/complaints/all', async (req, res) => {
    try {
        console.log('✅ GET /complaints/all route accessed - fetching all complaints');
        
        // Get MongoDB connection
        const db = mongoose.connection.db;
        
        // Fetch all complaints
        const allComplaints = await db.collection('complaints').find({}).toArray();

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

        // Get MongoDB connection
        const db = mongoose.connection.db;

        // Update the complaint status to "resolved"
        const result = await db.collection('complaints').updateOne(
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

module.exports = router;