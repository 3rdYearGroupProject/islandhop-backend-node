const express = require('express');
const connectDB = require('./src/utils/db');
const tripRoutes = require('./src/routes/tripRoutes');

const app = express();
const PORT = process.env.PORT || 5006;

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Add CORS headers
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  next();
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'Active trips service is running',
    timestamp: new Date().toISOString()
  });
});

// Routes
app.use('/api', tripRoutes);

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found'
  });
});

// Global error handler
app.use((error, req, res, next) => {
  console.error('Global error handler:', error);
  res.status(500).json({
    success: false,
    message: 'Internal server error',
    error: error.message
  });
});

// Start server only after MongoDB connection is established
const startServer = async () => {
  try {
    // Connect to MongoDB
    await connectDB();
    
    // Start the server
    app.listen(PORT, () => {
      console.log(`Active trips service is running on port ${PORT}`);
      console.log(`Health check available at: http://localhost:${PORT}/health`);
      console.log('Available endpoints:');
      console.log('  POST /api/set_driver');
      console.log('  POST /api/set_guide');
      console.log('  POST /api/remove_driver');
      console.log('  POST /api/remove_guide');
      console.log('  POST /api/new_activate_trip');
      console.log('  GET  /api/trips/user/:userId');
      console.log('  GET  /api/trips/driver/:driverEmail');
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

// Start the server
startServer();

// Export app for testing purposes
module.exports = app;
