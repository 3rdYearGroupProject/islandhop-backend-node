const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 4011;

// Supabase client configuration
const supabaseUrl = process.env.SUPABASE_URL || 'https://hgpicovzphnrhsdhggqs.supabase.co';
const supabaseKey = process.env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhncGljb3Z6cGhucmhzZGhnZ3FzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY0NzI5MTYsImV4cCI6MjA3MjA0ODkxNn0.gpU5xvWw0ntPLMNHjuTuWfQS_-28oeXv_70NhS0Zkb0';

const supabase = createClient(supabaseUrl, supabaseKey);

console.log('📦 Supabase client initialized successfully');

// Middleware
app.use(helmet());

// CORS configuration to handle credentials
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
app.use(express.urlencoded({ extended: true }));
app.use(morgan('combined'));

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    service: 'User Service',
    timestamp: new Date().toISOString(),
    port: PORT
  });
});

// Database connectivity test endpoint
app.get('/health/db', async (req, res) => {
  try {
    // Test with a simple RPC call
    const { data, error } = await supabase.rpc('get_support_users');
    
    if (error) {
      throw error;
    }
    
    res.json({
      status: 'OK',
      message: 'Supabase connection successful',
      timestamp: new Date().toISOString(),
      testDataCount: data ? data.length : 0
    });
  } catch (error) {
    console.error('Supabase health check failed:', error);
    res.status(500).json({
      status: 'ERROR',
      message: 'Supabase connection failed',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Connection error',
      timestamp: new Date().toISOString()
    });
  }
});

// Main endpoint: GET /users/:role
app.get('/users/:role', async (req, res) => {
  try {
    const { role } = req.params;
    
    // Validate role parameter
    const validRoles = ['support', 'driver', 'guide', 'tourist'];
    if (!validRoles.includes(role.toLowerCase())) {
      return res.status(400).json({
        error: 'Invalid role',
        message: `Role must be one of: ${validRoles.join(', ')}`,
        validRoles
      });
    }

    const normalizedRole = role.toLowerCase();
    let query;
    let queryParams = [];

    // Build SQL query based on role
    switch (normalizedRole) {
      case 'support':
        query = 'SELECT * FROM get_support_users();';
        break;

      case 'driver':
        query = 'SELECT * FROM get_driver_users();';
        break;

      case 'guide':
        query = 'SELECT * FROM get_guide_users();';
        break;

      case 'tourist':
        query = 'SELECT * FROM get_tourist_users();';
        break;
    }

    // Execute query using Supabase RPC
    let result;
    
    try {
      // Call the appropriate stored procedure using Supabase RPC
      const { data, error } = await supabase.rpc(`get_${normalizedRole}_users`);
      
      if (error) {
        throw error;
      }
      
      result = data || [];
      
      res.json({
        success: true,
        role: normalizedRole,
        count: result.length,
        data: result
      });
      
    } catch (error) {
      throw error;
    }

  } catch (error) {
    console.error('Database query error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to fetch users',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Not Found',
    message: `Route ${req.method} ${req.originalUrl} not found`,
    availableEndpoints: [
      'GET /health',
      'GET /health/db',
      'GET /users/:role (where role is: support, driver, guide, tourist)'
    ]
  });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({
    error: 'Internal server error',
    message: 'Something went wrong',
    details: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 User Service running on port ${PORT}`);
  console.log(`📍 Health check: http://localhost:${PORT}/health`);
  console.log(`📍 Users endpoint: http://localhost:${PORT}/users/:role`);
  console.log(`   Supported roles: support, driver, guide, tourist`);
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('SIGTERM received, shutting down gracefully');
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('SIGINT received, shutting down gracefully');
  process.exit(0);
});

// Export app for testing
module.exports = app;
