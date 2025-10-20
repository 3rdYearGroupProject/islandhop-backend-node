const mongoose = require('mongoose');
const logger = require('./logger');

// Connection cache to reuse connections
const connections = {
  initiatedTrips: null,
  poolingGroups: null
};

/**
 * Get or create connection to initiated_trips database
 */
const getInitiatedTripsConnection = async () => {
  if (connections.initiatedTrips && connections.initiatedTrips.readyState === 1) {
    return connections.initiatedTrips;
  }

  try {
    connections.initiatedTrips = await mongoose.createConnection(
      'mongodb+srv://2022cs056:dH4aTFn3IOerWlVZ@cluster0.9ccambx.mongodb.net/islandhop_trips?retryWrites=true&w=majority',
      {
        useNewUrlParser: true,
        useUnifiedTopology: true,
        maxPoolSize: 10,
        serverSelectionTimeoutMS: 5000,
        socketTimeoutMS: 45000,
        connectTimeoutMS: 10000
      }
    );

    logger.info('✅ Connected to initiated_trips database');

    connections.initiatedTrips.on('error', (err) => {
      logger.error('Initiated trips DB connection error:', err);
    });

    connections.initiatedTrips.on('disconnected', () => {
      logger.warn('Initiated trips DB disconnected');
      connections.initiatedTrips = null;
    });

    return connections.initiatedTrips;
  } catch (error) {
    logger.error('Failed to connect to initiated_trips database:', error);
    connections.initiatedTrips = null;
    throw error;
  }
};

/**
 * Get or create connection to pooling groups database
 */
const getPoolingGroupsConnection = async () => {
  if (connections.poolingGroups && connections.poolingGroups.readyState === 1) {
    return connections.poolingGroups;
  }

  try {
    connections.poolingGroups = await mongoose.createConnection(
      'mongodb+srv://2022cs056:dH4aTFn3IOerWlVZ@cluster0.9ccambx.mongodb.net/islandhop_pooling?retryWrites=true&w=majority',
      {
        useNewUrlParser: true,
        useUnifiedTopology: true,
        maxPoolSize: 10,
        serverSelectionTimeoutMS: 5000,
        socketTimeoutMS: 45000,
        connectTimeoutMS: 10000
      }
    );

    logger.info('✅ Connected to pooling_groups database');

    connections.poolingGroups.on('error', (err) => {
      logger.error('Pooling groups DB connection error:', err);
    });

    connections.poolingGroups.on('disconnected', () => {
      logger.warn('Pooling groups DB disconnected');
      connections.poolingGroups = null;
    });

    return connections.poolingGroups;
  } catch (error) {
    logger.error('Failed to connect to pooling_groups database:', error);
    connections.poolingGroups = null;
    throw error;
  }
};

/**
 * Get InitiatedTrip model
 */
const getInitiatedTripModel = async () => {
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
};

/**
 * Get Group model
 */
const getGroupModel = async () => {
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

module.exports = {
  getInitiatedTripsConnection,
  getPoolingGroupsConnection,
  getInitiatedTripModel,
  getGroupModel,
  closeExternalConnections
};
