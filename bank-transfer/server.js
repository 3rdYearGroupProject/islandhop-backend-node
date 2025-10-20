const express = require('express');
const cors = require('cors');
const path = require('path');
const connectDB = require('./config/db');
require('dotenv').config();

// Import routes
const bankRoutes = require('./routes/bankRoutes');
const paymentRoutes = require('./routes/paymentRoutes');

// Initialize Express app
const app = express();

// Connect to MongoDB and start server only after successful connection
const startServer = async () => {
  try {
    await connectDB();
    console.log('✅ Database connection established successfully');
    
    // Start the server only after database connection is ready
    const PORT = process.env.PORT || 4021;
    app.listen(PORT, () => {
      console.log(`🚀 Bank Transfer Service running on port ${PORT}`);
      console.log(`📊 Database: payment_service`);
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
};

// Middleware
const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    // Get allowed origins from environment variable or use defaults
    const allowedOrigins = process.env.CORS_ORIGIN 
      ? process.env.CORS_ORIGIN.split(',').map(origin => origin.trim())
      : [
          'http://localhost:3000',
          'http://localhost:3001', 
          'http://localhost:3002',
          'http://127.0.0.1:3000',
          'http://127.0.0.1:3001',
          'http://127.0.0.1:3002'
        ];
    
    // In development, be more permissive
    if (process.env.NODE_ENV === 'development') {
      // Allow localhost on any port for development
      if (origin.match(/^http:\/\/localhost:\d+$/) || origin.match(/^http:\/\/127\.0\.0\.1:\d+$/)) {
        return callback(null, true);
      }
    }
    
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      console.warn(`CORS blocked origin: ${origin}`);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true, // Allow credentials (cookies, authorization headers, etc.)
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept'],
  optionsSuccessStatus: 200 // Some legacy browsers (IE11, various SmartTVs) choke on 204
};

app.use(cors(corsOptions));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Serve static files from uploads directory
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Bank Transfer Service is running',
    timestamp: new Date().toISOString(),
    service: 'bank-transfer-service',
    version: '1.0.0'
  });
});

// API Routes
app.use('/bank', bankRoutes);
app.use('/payment', paymentRoutes);

// Default route
app.get('/', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Welcome to Bank Transfer Microservice',
    service: 'bank-transfer-service',
    version: '1.0.0',
    endpoints: {
      bank: {
        'POST /bank/add': 'Add new bank details',
        'PUT /bank/update/:email': 'Update bank details by email',
        'GET /bank/:email': 'Get bank details by email'
      },
      payment: {
        'POST /payment/update/:role/:tripId': 'Update payment status with evidence (multipart/form-data)',
        'GET /payment/:role/:tripId': 'Get payment details by role and tripId',
        'GET /payment/:role': 'Get all payments for a specific role'
      },
      utility: {
        'GET /health': 'Health check endpoint',
        'GET /uploads/:filename': 'Access uploaded evidence files'
      }
    }
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err);

  // Multer errors
  if (err instanceof require('multer').MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        success: false,
        message: 'File too large. Maximum size is 5MB.'
      });
    }
    return res.status(400).json({
      success: false,
      message: 'File upload error: ' + err.message
    });
  }

  // File filter errors
  if (err.message.includes('Only image files')) {
    return res.status(400).json({
      success: false,
      message: err.message
    });
  }

  // Default error response
  res.status(500).json({
    success: false,
    message: 'Internal server error',
    error: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong'
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found',
    path: req.originalUrl
  });
});

// Start server after database connection is established
startServer();
