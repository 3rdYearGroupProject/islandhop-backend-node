#!/usr/bin/env node

/**
 * Tourism Platform Scoring Service Startup Script
 * This script validates the environment and starts the service
 */

require('dotenv').config();
const { connectDB } = require('./config/database');

async function validateEnvironment() {
  console.log('🔍 Validating environment...');
  
  // Check required environment variables
  const requiredVars = ['MONGODB_URI'];
  const missingVars = requiredVars.filter(varName => !process.env[varName]);
  
  if (missingVars.length > 0) {
    console.error('❌ Missing required environment variables:', missingVars);
    console.error('Please check your .env file');
    process.exit(1);
  }
  
  console.log('✅ Environment variables validated');
}

async function validateDatabase() {
  console.log('🔍 Validating database connection...');
  
  try {
    await connectDB();
    console.log('✅ Database connection validated');
  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
    console.error('Please check your MongoDB connection string');
    process.exit(1);
  }
}

async function startService() {
  try {
    await validateEnvironment();
    
    // For production, validate database connection
    if (process.env.NODE_ENV === 'production') {
      await validateDatabase();
    }
    
    console.log('🚀 Starting Tourism Platform Scoring Service...');
    require('./server.js');
    
  } catch (error) {
    console.error('❌ Failed to start service:', error.message);
    process.exit(1);
  }
}

// Only run if this script is executed directly
if (require.main === module) {
  startService();
}

module.exports = { validateEnvironment, validateDatabase, startService };
