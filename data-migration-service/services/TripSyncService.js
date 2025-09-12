const mongoose = require('mongoose');
const cron = require('node-cron');

class TripSyncService {
  constructor() {
    this.lastCheckTime = new Date();
    this.isRunning = false;
    this.processedTripIds = new Set();
    this.paymentServiceDB = null;
    this.driversDB = null;
  }

  async initialize() {
    try {
      const connectionOptions = {
        serverSelectionTimeoutMS: 5000,
        socketTimeoutMS: 5000,
        connectTimeoutMS: 5000,
        maxPoolSize: 5
      };

      console.log('🔄 Connecting to payment-service database...');
      // Connect to payment-service database
      const paymentConnection = mongoose.createConnection(
        'mongodb+srv://2022cs056:dH4aTFn3IOerWlVZ@cluster0.9ccambx.mongodb.net/payment-service',
        connectionOptions
      );
      
      // Wait for connection
      await new Promise((resolve, reject) => {
        paymentConnection.once('open', resolve);
        paymentConnection.once('error', reject);
        setTimeout(() => reject(new Error('Payment DB connection timeout')), 10000);
      });
      
      this.paymentServiceDB = paymentConnection.db;
      console.log('✅ Connected to payment-service database');

      console.log('🔄 Connecting to For_Drivers database...');
      // Connect to For_Drivers database  
      const driversConnection = mongoose.createConnection(
        'mongodb+srv://2022cs056:dH4aTFn3IOerWlVZ@cluster0.9ccambx.mongodb.net/For_Drivers',
        connectionOptions
      );
      
      // Wait for connection
      await new Promise((resolve, reject) => {
        driversConnection.once('open', resolve);
        driversConnection.once('error', reject);
        setTimeout(() => reject(new Error('Drivers DB connection timeout')), 10000);
      });
      
      this.driversDB = driversConnection.db;
      console.log('✅ Connected to For_Drivers database');
      
      // Load existing trip IDs to avoid duplicates
      await this.loadExistingTripIds();
      
      return true;
    } catch (error) {
      console.error('❌ Database connection failed:', error);
      return false;
    }
  }

  async loadExistingTripIds() {
    try {
      const driverInfo = await this.driversDB.collection('Driver_info').findOne({
        email: 'driver101@islandhop.lk'
      });

      if (driverInfo && driverInfo.trips && driverInfo.trips.history) {
        driverInfo.trips.history.forEach(trip => {
          if (trip.paymentTripId) {
            this.processedTripIds.add(trip.paymentTripId);
          }
        });
        console.log(`📋 Loaded ${this.processedTripIds.size} existing trip IDs`);
      }
    } catch (error) {
      console.error('⚠️ Error loading existing trip IDs:', error);
    }
  }

  async checkForNewPaidTrips() {
    try {
      if (this.isRunning) {
        console.log('⏳ Previous check still running, skipping...');
        return;
      }

      this.isRunning = true;
      console.log(`🔍 Checking for new paid trips since ${this.lastCheckTime.toISOString()}`);

      const driversCollection = this.paymentServiceDB.collection('drivers');
      
      // Find new paid trips since last check
      const newPaidTrips = await driversCollection.find({
        driverEmail: 'driver101@islandhop.lk',
        paid: 1,
        createdAt: { $gte: this.lastCheckTime }
      }).toArray();

      console.log(`📊 Found ${newPaidTrips.length} new paid trips`);

      if (newPaidTrips.length > 0) {
        for (const trip of newPaidTrips) {
          // Skip if already processed
          if (this.processedTripIds.has(trip._id.toString())) {
            console.log(`⏭️ Skipping already processed trip: ${trip.tripId}`);
            continue;
          }

          await this.copyTripToHistory(trip);
          this.processedTripIds.add(trip._id.toString());
        }
      }

      // Update last check time
      this.lastCheckTime = new Date();

    } catch (error) {
      console.error('❌ Error checking for new trips:', error);
    } finally {
      this.isRunning = false;
    }
  }

  async copyTripToHistory(paymentTrip) {
    try {
      console.log(`📝 Copying trip ${paymentTrip.tripId} to Driver_info history`);

      const driverInfoCollection = this.driversDB.collection('Driver_info');

      // Transform payment trip to Driver_info history format
      const historyTrip = this.transformPaymentToHistory(paymentTrip);

      // Update Driver_info document by pushing to trips.history array
      const result = await driverInfoCollection.updateOne(
        { email: 'driver101@islandhop.lk' },
        { 
          $push: { 
            'trips.history': historyTrip 
          },
          $set: {
            updatedAt: new Date()
          }
        }
      );

      if (result.modifiedCount > 0) {
        console.log(`✅ Successfully added trip ${paymentTrip.tripId} to history`);
        
        // Update stats
        await this.updateDriverStats();
        
        return true;
      } else {
        console.log(`⚠️ No Driver_info document updated for trip ${paymentTrip.tripId}`);
        return false;
      }

    } catch (error) {
      console.error(`❌ Error copying trip ${paymentTrip.tripId}:`, error);
      return false;
    }
  }

  async updateDriverStats() {
    try {
      const driverInfoCollection = this.driversDB.collection('Driver_info');
      
      // Get current driver info to recalculate stats
      const driverInfo = await driverInfoCollection.findOne({
        email: 'driver101@islandhop.lk'
      });

      if (!driverInfo || !driverInfo.trips || !driverInfo.trips.history) {
        return;
      }

      const history = driverInfo.trips.history;
      const completedTrips = history.filter(trip => trip.status === 'completed');
      
      // Calculate updated stats
      const totalEarnings = completedTrips.reduce((sum, trip) => {
        return sum + (trip.fare || 0) + (trip.tip || 0);
      }, 0);

      const totalTrips = completedTrips.length;
      const averagePerTrip = totalTrips > 0 ? totalEarnings / totalTrips : 0;

      // Update stats in the document
      await driverInfoCollection.updateOne(
        { email: 'driver101@islandhop.lk' },
        {
          $set: {
            'stats.totalTrips': totalTrips,
            'stats.completedTrips': totalTrips,
            'stats.totalEarnings': totalEarnings,
            'stats.averagePerTrip': averagePerTrip,
            'stats.lastUpdated': new Date()
          }
        }
      );

      console.log(`📊 Updated driver stats: ${totalTrips} trips, LKR ${totalEarnings} earnings`);

    } catch (error) {
      console.error('❌ Error updating driver stats:', error);
    }
  }

  startMonitoring() {
    console.log('🚀 Starting trip sync monitoring (every 5 seconds)');
    
    // Schedule task to run every 5 seconds
    cron.schedule('*/5 * * * * *', async () => {
      await this.checkForNewPaidTrips();
    });

    // Also run an initial check
    setTimeout(async () => {
      await this.checkForNewPaidTrips();
    }, 1000);

    console.log('⏰ Trip sync service is now running...');
  }

  stopMonitoring() {
    console.log('🛑 Stopping trip sync monitoring');
    // Cron jobs will be automatically stopped when process exits
  }

  async getStatus() {
    return {
      isRunning: this.isRunning,
      lastCheckTime: this.lastCheckTime,
      processedTripsCount: this.processedTripIds.size,
      nextCheckIn: '5 seconds'
    };
  }

  // Transform payment trip to Driver_info history format
  transformPaymentToHistory(paymentTrip) {
    return {
      id: paymentTrip.tripId,
      tripName: null, // Not available in payment data
      passenger: null, // Not available in payment data
      pickupLocation: null, // Not available in payment data  
      destination: null, // Not available in payment data
      date: paymentTrip.createdAt.toISOString().split('T')[0], // Extract date part
      startTime: null, // Not available in payment data
      endTime: null, // Not available in payment data
      duration: null, // Not available in payment data
      distance: null, // Not available in payment data
      fare: paymentTrip.cost,
      rating: null, // Not available in payment data
      status: 'completed', // Assume completed since it's paid
      paymentMethod: null, // Not available in payment data
      tip: null, // Not available in payment data
      notes: paymentTrip.evidence ? `Payment evidence: ${paymentTrip.evidence}` : null,
      // Additional fields for tracking
      paymentTripId: paymentTrip._id.toString() // For duplicate prevention
    };
  }

  async manualSync() {
    console.log('🔄 Running manual sync...');
    await this.checkForNewPaidTrips();
    return {
      success: true,
      message: 'Manual sync completed',
      timestamp: new Date()
    };
  }
}

module.exports = TripSyncService;