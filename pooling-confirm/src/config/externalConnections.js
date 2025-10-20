const mongoose = require('mongoose');
const logger = require('./logger');

// Connection cache to reuse connections
const connections = {
  initiatedTrips: null,
  poolingGroups: null
};

// Retry configuration
const RETRY_CONFIG = {
  maxRetries: 3,
  retryDelay: 2000, // Start with 2 seconds
  maxRetryDelay: 10000 // Max 10 seconds
};

/**
 * Sleep utility for retry delays
 */
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Create connection with retry logic
 */
const createConnectionWithRetry = async (uri, dbName, retryCount = 0) => {
  try {
    logger.info(`Attempting to connect to ${dbName}... (Attempt ${retryCount + 1}/${RETRY_CONFIG.maxRetries + 1})`);
    
    const conn = await mongoose.createConnection(uri, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      maxPoolSize: 10,
      minPoolSize: 2,
      serverSelectionTimeoutMS: 30000, // Increased to 30 seconds
      socketTimeoutMS: 45000,
      connectTimeoutMS: 30000, // Increased to 30 seconds
      heartbeatFrequencyMS: 10000,
      retryWrites: true,
      retryReads: true,
      // DNS options to help with resolution
      family: 4 // Force IPv4
    });

    logger.info(`✅ Successfully connected to ${dbName} database`);
    return conn;

  } catch (error) {
    logger.error(`Failed to connect to ${dbName} (Attempt ${retryCount + 1}):`, error.message);
    
    // If we haven't exceeded max retries, try again
    if (retryCount < RETRY_CONFIG.maxRetries) {
      const delay = Math.min(
        RETRY_CONFIG.retryDelay * Math.pow(2, retryCount),
        RETRY_CONFIG.maxRetryDelay
      );
      logger.warn(`Retrying connection to ${dbName} in ${delay}ms...`);
      await sleep(delay);
      return createConnectionWithRetry(uri, dbName, retryCount + 1);
    }
    
    // All retries exhausted
    logger.error(`❌ Failed to connect to ${dbName} after ${retryCount + 1} attempts`);
    throw new Error(`Unable to connect to ${dbName}: ${error.message}`);
  }
};

/**
 * Get or create connection to initiated_trips database
 */
const getInitiatedTripsConnection = async () => {
  // Check if connection exists and is healthy
  if (connections.initiatedTrips) {
    const state = connections.initiatedTrips.readyState;
    if (state === 1) { // Connected
      return connections.initiatedTrips;
    } else if (state === 0 || state === 3) { // Disconnected or disconnecting
      logger.warn('Initiated trips connection is disconnected, creating new connection...');
      connections.initiatedTrips = null;
    } else if (state === 2) { // Connecting
      logger.info('Connection to initiated trips is already in progress, waiting...');
      await sleep(1000);
      return getInitiatedTripsConnection(); // Recursive retry
    }
  }

  try {
    const uri = 'mongodb+srv://2022cs056:dH4aTFn3IOerWlVZ@cluster0.9ccambx.mongodb.net/islandhop_trips?retryWrites=true&w=majority';
    connections.initiatedTrips = await createConnectionWithRetry(uri, 'initiated_trips');

    // Set up event handlers
    connections.initiatedTrips.on('error', (err) => {
      logger.error('Initiated trips DB connection error:', err.message);
      // Don't set to null on error, let it try to recover
    });

    connections.initiatedTrips.on('disconnected', () => {
      logger.warn('⚠️ Initiated trips DB disconnected');
      connections.initiatedTrips = null;
    });

    connections.initiatedTrips.on('reconnected', () => {
      logger.info('✅ Initiated trips DB reconnected');
    });

    return connections.initiatedTrips;
  } catch (error) {
    logger.error('Failed to connect to initiated_trips database:', error.message);
    connections.initiatedTrips = null;
    throw error;
  }
};

/**
 * Get or create connection to pooling groups database
 */
const getPoolingGroupsConnection = async () => {
  // Check if connection exists and is healthy
  if (connections.poolingGroups) {
    const state = connections.poolingGroups.readyState;
    if (state === 1) { // Connected
      return connections.poolingGroups;
    } else if (state === 0 || state === 3) { // Disconnected or disconnecting
      logger.warn('Pooling groups connection is disconnected, creating new connection...');
      connections.poolingGroups = null;
    } else if (state === 2) { // Connecting
      logger.info('Connection to pooling groups is already in progress, waiting...');
      await sleep(1000);
      return getPoolingGroupsConnection(); // Recursive retry
    }
  }

  try {
    const uri = 'mongodb+srv://2022cs056:dH4aTFn3IOerWlVZ@cluster0.9ccambx.mongodb.net/islandhop_pooling?retryWrites=true&w=majority';
    connections.poolingGroups = await createConnectionWithRetry(uri, 'pooling_groups');

    // Set up event handlers
    connections.poolingGroups.on('error', (err) => {
      logger.error('Pooling groups DB connection error:', err.message);
      // Don't set to null on error, let it try to recover
    });

    connections.poolingGroups.on('disconnected', () => {
      logger.warn('⚠️ Pooling groups DB disconnected');
      connections.poolingGroups = null;
    });

    connections.poolingGroups.on('reconnected', () => {
      logger.info('✅ Pooling groups DB reconnected');
    });

    return connections.poolingGroups;
  } catch (error) {
    logger.error('Failed to connect to pooling_groups database:', error.message);
    connections.poolingGroups = null;
    throw error;
  }
};

/**
 * Get InitiatedTrip model with error handling
 */
const getInitiatedTripModel = async () => {
  try {
    const conn = await getInitiatedTripsConnection();
    
    // Check if model already exists in this connection
    if (conn.models.InitiatedTrip) {
      return conn.models.InitiatedTrip;
    }

    const initiatedTripSchema = new mongoose.Schema(
      { _id: String },
      { strict: false, collection: 'initiated_trips' }
    );
    
    return conn.model('InitiatedTrip', initiatedTripSchema);
  } catch (error) {
    logger.error('Failed to get InitiatedTrip model:', error.message);
    throw new Error(`Database connection failed for initiated_trips: ${error.message}`);
  }
};

/**
 * Get Group model with error handling
 */
const getGroupModel = async () => {
  try {
    const conn = await getPoolingGroupsConnection();
    
    // Check if model already exists in this connection
    if (conn.models.Group) {
      return conn.models.Group;
    }

    const groupSchema = new mongoose.Schema(
      { _id: String },
      { strict: false, collection: 'groups' }
    );
    
    return conn.model('Group', groupSchema);
  } catch (error) {
    logger.error('Failed to get Group model:', error.message);
    throw new Error(`Database connection failed for pooling_groups: ${error.message}`);
  }
};

/**
 * Close all external connections
 */
const closeExternalConnections = async () => {
  try {
    if (connections.initiatedTrips) {
      await connections.initiatedTrips.close();
      logger.info('Closed initiated_trips connection');
    }
    if (connections.poolingGroups) {
      await connections.poolingGroups.close();
      logger.info('Closed pooling_groups connection');
    }
  } catch (error) {
    logger.error('Error closing external connections:', error);
  }
};

// Graceful shutdown
process.on('SIGINT', async () => {
  await closeExternalConnections();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  await closeExternalConnections();
  process.exit(0);
});

// Handle unhandled promise rejections to prevent crashes
process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
  // Don't exit the process, just log the error
});

module.exports = {
  getInitiatedTripsConnection,
  getPoolingGroupsConnection,
  getInitiatedTripModel,
  getGroupModel,
  closeExternalConnections
};
