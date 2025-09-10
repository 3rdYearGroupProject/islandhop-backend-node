const express = require('express');
const mongoose = require('mongoose');
const router = express.Router();

// Route to get dashboard statistics
router.get('/', async (req, res) => {
    try {
        console.log('✅ GET /dashboard-stats route accessed - fetching dashboard statistics');

        // Get MongoDB connection
        const db = mongoose.connection.db;

        // Fetch dashboard statistics
        const totalComplaints = await db.collection('complaints').countDocuments();
        const unresolvedComplaints = await db.collection('complaints').countDocuments({ status: "not_resolved" });
        const resolvedComplaints = totalComplaints - unresolvedComplaints;
        const lostItems = await db.collection('lost-items-log').countDocuments({ status: "not found" });

        console.log(`Dashboard statistics - Total Complaints: ${totalComplaints}, Unresolved Complaints: ${unresolvedComplaints}`);

        // Return the results
        const response = {
            success: true,
            message: 'Dashboard statistics fetched successfully',
            data: {
                totalComplaints,
                unresolvedComplaints,
                resolvedComplaints,
                lostItems
            }
        };

        res.json(response);

    } catch (error) {
        console.error('Error fetching dashboard statistics:', error);
        res.status(500).json({
            success: false,
            error: 'Internal server error',
            message: 'Failed to fetch dashboard statistics'
        });
    }
});

module.exports = router;