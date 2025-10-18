const mongoose = require('mongoose');
const cron = require('node-cron');

class GuideSyncService {
  constructor() {
    this.lastCheckTime = new Date();
    this.isRunning = false;
    this.processedTripIds = new Set();
    this.paymentServiceDB = null;
    this.guidesDB = null;
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

      console.log('🔄 Connecting to For_Guides database...');
      // Connect to For_Guides database  
      const guidesConnection = mongoose.createConnection(
        'mongodb+srv://2022cs056:dH4aTFn3IOerWlVZ@cluster0.9ccambx.mongodb.net/For_Guides',
        connectionOptions
      );
      
      // Wait for connection
      await new Promise((resolve, reject) => {
        guidesConnection.once('open', resolve);
        guidesConnection.once('error', reject);
        setTimeout(() => reject(new Error('Guides DB connection timeout')), 10000);
      });
      
      this.guidesDB = guidesConnection.db;
      console.log('✅ Connected to For_Guides database');
      
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
      const guideInfo = await this.guidesDB.collection('Guide_info').findOne({
        email: 'guide101@islandhop.lk'
      });

      if (guideInfo && guideInfo.tours && guideInfo.tours.history) {
        guideInfo.tours.history.forEach(tour => {
          if (tour.paymentTripId) {
            this.processedTripIds.add(tour.paymentTripId);
          }
        });
        console.log(`📋 Loaded ${this.processedTripIds.size} existing guide trip IDs`);
      }
    } catch (error) {
      console.error('⚠️ Error loading existing guide trip IDs:', error);
    }
  }

  async checkForNewPaidTours() {
    try {
      if (this.isRunning) {
        console.log('⏳ Previous guide check still running, skipping...');
        return;
      }

      this.isRunning = true;
      console.log(`🔍 Checking for all paid guide tours to sync`);

      const guidesCollection = this.paymentServiceDB.collection('guides');
      
      // Find ALL paid tours (no timestamp filtering)
      const newPaidTours = await guidesCollection.find({
        guideEmail: 'guide101@islandhop.lk',
        paid: 1
      }).toArray();

      console.log(`📊 Found ${newPaidTours.length} total paid guide tours`);

      let syncedCount = 0;
      if (newPaidTours.length > 0) {
        for (const tour of newPaidTours) {
          // Skip if already processed
          if (this.processedTripIds.has(tour._id.toString())) {
            console.log(`⏭️ Skipping already processed guide tour: ${tour.tripId}`);
            continue;
          }

          await this.copyTourToHistory(tour);
          this.processedTripIds.add(tour._id.toString());
          syncedCount++;
        }
      }

      console.log(`✅ Synced ${syncedCount} new guide tours`);

      // Update last check time
      this.lastCheckTime = new Date();

    } catch (error) {
      console.error('❌ Error checking for new guide tours:', error);
    } finally {
      this.isRunning = false;
    }
  }

  // New method for initial full sync
  async syncAllPaidTours() {
    try {
      if (this.isRunning) {
        console.log('⏳ Previous guide check still running, skipping...');
        return { success: false, message: 'Sync already running' };
      }

      this.isRunning = true;
      console.log('🔍 Starting full sync of all paid guide tours...');

      const guidesCollection = this.paymentServiceDB.collection('guides');
      
      // Find ALL paid tours for the guide
      const allPaidTours = await guidesCollection.find({
        guideEmail: 'guide101@islandhop.lk',
        paid: 1
      }).toArray();

      console.log(`📊 Found ${allPaidTours.length} total paid guide tours`);

      let syncedCount = 0;
      for (const tour of allPaidTours) {
        // Skip if already processed
        if (this.processedTripIds.has(tour._id.toString())) {
          console.log(`⏭️ Skipping already processed guide tour: ${tour.tripId}`);
          continue;
        }

        const success = await this.copyTourToHistory(tour);
        if (success) {
          this.processedTripIds.add(tour._id.toString());
          syncedCount++;
        }
      }

      console.log(`✅ Full sync completed: ${syncedCount} tours synced`);
      return { success: true, syncedCount, totalPaid: allPaidTours.length };

    } catch (error) {
      console.error('❌ Error in full guide sync:', error);
      return { success: false, error: error.message };
    } finally {
      this.isRunning = false;
    }
  }

  async copyTourToHistory(paymentTour) {
    try {
      console.log(`📝 Copying guide tour ${paymentTour.tripId} to Guide_info history`);

      const guideInfoCollection = this.guidesDB.collection('Guide_info');

      // Transform payment tour to Guide_info history format
      const historyTour = this.transformPaymentToHistory(paymentTour);

      // Update Guide_info document by pushing to tours.history array
      const result = await guideInfoCollection.updateOne(
        { email: 'guide101@islandhop.lk' },
        { 
          $push: { 
            'tours.history': historyTour 
          },
          $set: {
            updatedAt: new Date()
          }
        }
      );

      if (result.modifiedCount > 0) {
        console.log(`✅ Successfully added guide tour ${paymentTour.tripId} to history`);
        
        // Update stats
        await this.updateGuideStats();
        
        return true;
      } else {
        console.log(`⚠️ No Guide_info document updated for tour ${paymentTour.tripId}`);
        return false;
      }

    } catch (error) {
      console.error(`❌ Error copying guide tour ${paymentTour.tripId}:`, error);
      return false;
    }
  }

  async updateGuideStats() {
    try {
      const guideInfoCollection = this.guidesDB.collection('Guide_info');
      
      // Get current guide info to recalculate stats
      const guideInfo = await guideInfoCollection.findOne({
        email: 'guide101@islandhop.lk'
      });

      if (!guideInfo || !guideInfo.tours || !guideInfo.tours.history) {
        return;
      }

      const history = guideInfo.tours.history;
      const completedTours = history.filter(tour => tour.status === 'completed');
      
      // Calculate updated stats
      const totalEarnings = completedTours.reduce((sum, tour) => {
        return sum + (tour.fee || 0) + (tour.tip || 0);
      }, 0);

      const totalTours = completedTours.length;
      const averagePerTour = totalTours > 0 ? totalEarnings / totalTours : 0;

      // Update stats in the document
      await guideInfoCollection.updateOne(
        { email: 'guide101@islandhop.lk' },
        {
          $set: {
            'stats.totalTours': totalTours,
            'stats.completedTours': totalTours,
            'stats.totalEarnings': totalEarnings,
            'stats.averagePerTour': averagePerTour,
            'stats.lastUpdated': new Date()
          }
        }
      );

      console.log(`📊 Updated guide stats: ${totalTours} tours, LKR ${totalEarnings} earnings`);

    } catch (error) {
      console.error('❌ Error updating guide stats:', error);
    }
  }

  startMonitoring() {
    console.log('🚀 Starting guide sync monitoring (every 5 seconds)');
    console.log('📝 Note: Syncs ALL paid tours, not just new ones');
    
    // Schedule task to run every 5 seconds
    cron.schedule('*/5 * * * * *', async () => {
      await this.checkForNewPaidTours();
    });

    // Also run an initial check
    setTimeout(async () => {
      await this.checkForNewPaidTours();
    }, 1000);

    console.log('⏰ Guide sync service is now running...');
  }

  stopMonitoring() {
    console.log('🛑 Stopping guide sync monitoring');
    // Cron jobs will be automatically stopped when process exits
  }

  async getStatus() {
    return {
      isRunning: this.isRunning,
      lastCheckTime: this.lastCheckTime,
      processedToursCount: this.processedTripIds.size,
      nextCheckIn: '5 seconds'
    };
  }

  // Transform payment tour to Guide_info history format
  transformPaymentToHistory(paymentTour) {
    return {
      id: paymentTour.tripId,
      tourPackage: null, // Not available in payment data
      tourist: null, // Not available in payment data
      customerName: null, // Not available in payment data
      tourName: null, // Not available in payment data
      groupSize: null, // Not available in payment data
      startLocation: null, // Not available in payment data  
      endLocation: null, // Not available in payment data
      date: paymentTour.createdAt.toISOString().split('T')[0], // Extract date part
      startTime: null, // Not available in payment data
      endTime: null, // Not available in payment data
      duration: null, // Not available in payment data
      fee: paymentTour.cost,
      earnings: paymentTour.cost, // Same as fee from payment data
      rating: null, // Not available in payment data
      status: 'completed', // Assume completed since it's paid
      paymentMethod: null, // Not available in payment data
      tip: null, // Not available in payment data
      notes: paymentTour.evidence ? `Payment evidence: ${paymentTour.evidence}` : null,
      // Additional fields for tracking
      paymentTripId: paymentTour._id.toString() // For duplicate prevention
    };
  }

  async manualSync() {
    console.log('🔄 Running manual guide sync...');
    await this.checkForNewPaidTours();
    return {
      success: true,
      message: 'Manual guide sync completed',
      timestamp: new Date()
    };
  }

  async getTotalGuidePayments() {
    try {
      const guidesCollection = this.paymentServiceDB.collection('guides');
      
      // Get all guide payments for guide101@islandhop.lk
      const allPayments = await guidesCollection.find({
        guideEmail: 'guide101@islandhop.lk'
      }).toArray();

      const paidPayments = allPayments.filter(payment => payment.paid === 1);
      const unpaidPayments = allPayments.filter(payment => payment.paid === 0);
      
      const totalPaidAmount = paidPayments.reduce((sum, payment) => sum + payment.cost, 0);
      const totalUnpaidAmount = unpaidPayments.reduce((sum, payment) => sum + payment.cost, 0);

      return {
        totalPayments: allPayments.length,
        paidPayments: paidPayments.length,
        unpaidPayments: unpaidPayments.length,
        totalPaidAmount: totalPaidAmount,
        totalUnpaidAmount: totalUnpaidAmount,
        payments: allPayments
      };
    } catch (error) {
      console.error('❌ Error getting guide payments:', error);
      return null;
    }
  }

  async getGuideInfoSyncedTours() {
    try {
      const guideInfoCollection = this.guidesDB.collection('Guide_info');
      
      // Get guide info document
      const guideInfo = await guideInfoCollection.findOne({
        email: 'guide101@islandhop.lk'
      });

      if (!guideInfo) {
        return {
          found: false,
          message: 'Guide info document not found'
        };
      }

      const syncedTours = guideInfo.tours && guideInfo.tours.history 
        ? guideInfo.tours.history.filter(tour => tour.paymentTripId)
        : [];

      const totalEarnings = syncedTours.reduce((sum, tour) => sum + (tour.fee || 0), 0);

      return {
        found: true,
        totalSyncedTours: syncedTours.length,
        totalEarnings: totalEarnings,
        syncedTours: syncedTours,
        guideStats: guideInfo.stats || null
      };
    } catch (error) {
      console.error('❌ Error getting Guide_info synced tours:', error);
      return {
        found: false,
        error: error.message
      };
    }
  }
}

module.exports = GuideSyncService;