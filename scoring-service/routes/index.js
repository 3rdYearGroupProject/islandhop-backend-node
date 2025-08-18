const express = require('express');
const router = express.Router();

// Import route modules
const driverRoutes = require('./driverRoutes');
const guideRoutes = require('./guideRoutes');

// Health check endpoint
router.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Scoring service is healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// API information endpoint
router.get('/', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Tourism Platform Scoring Service API',
    version: '1.0.0',
    endpoints: {
      drivers: {
        'GET /top-driver': 'Get top available driver',
        'POST /assign-driver': 'Assign driver to trip',
        'GET /drivers': 'Get all drivers',
        'POST /drivers': 'Create driver score',
        'GET /drivers/:email/trips': 'Get driver trips'
      },
      guides: {
        'GET /top-guide': 'Get top available guide',
        'POST /assign-guide': 'Assign guide to trip',
        'GET /guides': 'Get all guides',
        'POST /guides': 'Create guide score',
        'GET /guides/:email/trips': 'Get guide trips'
      }
    }
  });
});

// Use route modules
router.use('/', driverRoutes);
router.use('/', guideRoutes);

module.exports = router;
