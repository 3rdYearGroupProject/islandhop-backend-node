const TripSyncService = require('../services/TripSyncService');

// Initialize the sync service
const tripSyncService = new TripSyncService();
let isServiceInitialized = false;

// Initialize service
const initializeService = async (req, res) => {
  try {
    if (isServiceInitialized) {
      return res.json({
        success: true,
        message: 'Trip sync service is already initialized',
        status: await tripSyncService.getStatus()
      });
    }

    const initialized = await tripSyncService.initialize();
    
    if (initialized) {
      isServiceInitialized = true;
      res.json({
        success: true,
        message: 'Trip sync service initialized successfully',
        status: await tripSyncService.getStatus()
      });
    } else {
      res.status(500).json({
        success: false,
        message: 'Failed to initialize trip sync service'
      });
    }
  } catch (error) {
    console.error('❌ Initialize service error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to initialize service',
      error: error.message
    });
  }
};

// Start monitoring
const startMonitoring = async (req, res) => {
  try {
    if (!isServiceInitialized) {
      return res.status(400).json({
        success: false,
        message: 'Service not initialized. Call /initialize first.'
      });
    }

    tripSyncService.startMonitoring();
    
    res.json({
      success: true,
      message: 'Trip sync monitoring started (every 5 seconds)',
      status: await tripSyncService.getStatus()
    });
  } catch (error) {
    console.error('❌ Start monitoring error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to start monitoring',
      error: error.message
    });
  }
};

// Stop monitoring
const stopMonitoring = async (req, res) => {
  try {
    tripSyncService.stopMonitoring();
    
    res.json({
      success: true,
      message: 'Trip sync monitoring stopped',
      status: await tripSyncService.getStatus()
    });
  } catch (error) {
    console.error('❌ Stop monitoring error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to stop monitoring',
      error: error.message
    });
  }
};

// Get service status
const getStatus = async (req, res) => {
  try {
    const status = await tripSyncService.getStatus();
    
    res.json({
      success: true,
      data: {
        ...status,
        serviceInitialized: isServiceInitialized,
        description: 'Monitors payment-service/drivers collection for new paid trips and syncs to Driver_info/trips.history'
      }
    });
  } catch (error) {
    console.error('❌ Get status error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get service status',
      error: error.message
    });
  }
};

// Manual sync trigger
const manualSync = async (req, res) => {
  try {
    if (!isServiceInitialized) {
      return res.status(400).json({
        success: false,
        message: 'Service not initialized. Call /initialize first.'
      });
    }

    const result = await tripSyncService.manualSync();
    
    res.json({
      success: true,
      data: result,
      status: await tripSyncService.getStatus()
    });
  } catch (error) {
    console.error('❌ Manual sync error:', error);
    res.status(500).json({
      success: false,
      message: 'Manual sync failed',
      error: error.message
    });
  }
};

// Get sync statistics
const getSyncStats = async (req, res) => {
  try {
    const mongoose = require('mongoose');
    
    // Connect to check current state
    const paymentConnection = mongoose.createConnection(
      'mongodb+srv://2022cs056:dH4aTFn3IOerWlVZ@cluster0.9ccambx.mongodb.net/payment-service'
    );
    const driversConnection = mongoose.createConnection(
      'mongodb+srv://2022cs056:dH4aTFn3IOerWlVZ@cluster0.9ccambx.mongodb.net/For_Drivers'
    );

    const paymentDB = paymentConnection.db;
    const driversDB = driversConnection.db;

    // Get payment service stats
    const totalPaymentTrips = await paymentDB.collection('drivers').countDocuments({
      driverEmail: 'driver101@islandhop.lk'
    });
    
    const paidTrips = await paymentDB.collection('drivers').countDocuments({
      driverEmail: 'driver101@islandhop.lk',
      paid: 1
    });

    // Get Driver_info stats
    const driverInfo = await driversDB.collection('Driver_info').findOne({
      email: 'driver101@islandhop.lk'
    });

    const syncedTrips = driverInfo && driverInfo.trips && driverInfo.trips.history 
      ? driverInfo.trips.history.filter(trip => trip.paymentTripId).length
      : 0;

    const stats = {
      paymentService: {
        totalTrips: totalPaymentTrips,
        paidTrips: paidTrips,
        unpaidTrips: totalPaymentTrips - paidTrips
      },
      driverInfo: {
        totalHistoryTrips: driverInfo && driverInfo.trips && driverInfo.trips.history 
          ? driverInfo.trips.history.length : 0,
        syncedFromPaymentService: syncedTrips
      },
      sync: {
        processed: tripSyncService.processedTripIds ? tripSyncService.processedTripIds.size : 0,
        pendingSync: Math.max(0, paidTrips - syncedTrips),
        lastSyncTime: tripSyncService.lastCheckTime
      }
    };

    await paymentConnection.close();
    await driversConnection.close();

    res.json({
      success: true,
      data: stats
    });

  } catch (error) {
    console.error('❌ Get sync stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get sync statistics',
      error: error.message
    });
  }
};

module.exports = {
  initializeService,
  startMonitoring,
  stopMonitoring,
  getStatus,
  manualSync,
  getSyncStats
};