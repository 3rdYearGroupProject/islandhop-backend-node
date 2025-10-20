const { DriversPayment, GuidesPayment } = require('../models/Payment');
const path = require('path');
const mongoose = require('mongoose');

// Function to create sample data for testing
const createSampleData = async () => {
  try {
    // Check if we have any driver payments
    const driverCount = await DriversPayment.countDocuments();
    const guideCount = await GuidesPayment.countDocuments();
    
    console.log(`📊 Current counts - Drivers: ${driverCount}, Guides: ${guideCount}`);
    
    if (driverCount === 0) {
      console.log('🔧 Creating sample driver payment data...');
      await DriversPayment.create([
        {
          tripId: 'trip-123',
          driverEmail: 'driver1@example.com',
          cost: 5000,
          paid: 4500,
          evidence: null
        },
        {
          tripId: 'trip-124',
          driverEmail: 'driver2@example.com',
          cost: 3000,
          paid: 3000,
          evidence: '/uploads/evidence1.jpg'
        }
      ]);
      console.log('✅ Sample driver payment data created');
    }
    
    if (guideCount === 0) {
      console.log('🔧 Creating sample guide payment data...');
      await GuidesPayment.create([
        {
          tripId: 'trip-125',
          driverEmail: 'guide1@example.com',
          cost: 2000,
          paid: 1800,
          evidence: null
        },
        {
          tripId: 'trip-126',
          driverEmail: 'guide2@example.com',
          cost: 2500,
          paid: 2500,
          evidence: '/uploads/evidence2.jpg'
        }
      ]);
      console.log('✅ Sample guide payment data created');
    }
  } catch (error) {
    console.error('❌ Error creating sample data:', error);
  }
};

// Update payment status with evidence
const updatePaymentStatus = async (req, res) => {
  try {
    console.log('✅ POST /payment/:role/:tripId route was accessed!');
    const { role, tripId } = req.params;

    console.log(`🔍 Updating payment for role: ${role}, tripId: ${tripId}`);

    // Validate role parameter
    if (!['drivers', 'guides'].includes(role)) {
      return res.status(400).json({
        success: false,
        message: 'Role must be either "drivers" or "guides"'
      });
    }

    // Validate tripId parameter
    if (!tripId) {
      return res.status(400).json({
        success: false,
        message: 'Trip ID is required'
      });
    }

    // Check if evidence file was uploaded
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'Evidence image is required'
      });
    }

    // Ensure we're using the existing connection
    if (mongoose.connection.readyState !== 1) {
      console.log('❌ MongoDB connection not ready. Connection state:', mongoose.connection.readyState);
      return res.status(500).json({
        success: false,
        message: 'Database connection not ready'
      });
    }

    // Get the database connection and verify we're connected to the right database
    const db = mongoose.connection.db;
    const databaseName = mongoose.connection.name;
    
    console.log(`📊 Connected to database: ${databaseName}`);

    // Verify we're connected to the payment-service database
    if (databaseName !== 'payment-service') {
      console.log(`⚠️  Warning: Expected 'payment-service' database but connected to '${databaseName}'`);
      return res.status(500).json({
        success: false,
        message: `Connected to wrong database: ${databaseName}. Expected: payment-service`
      });
    }

    // Get the correct collection name based on role
    const collectionName = role; // 'drivers' or 'guides'
    console.log(`📊 Querying collection: ${collectionName} in database: ${databaseName}`);

    // Get the collection
    const collection = db.collection(collectionName);

    // Find the payment record by tripId
    console.log(`🔍 Looking for tripId: ${tripId} in ${collectionName} collection`);
    const paymentRecord = await collection.findOne({ tripId: tripId });

    if (!paymentRecord) {
      console.log(`❌ Payment record not found for tripId: ${tripId}`);
      
      // Debug: Let's see what records exist
      const allRecords = await collection.find({}).limit(5).toArray();
      console.log(`📊 Sample records in ${collectionName} collection:`, allRecords.map(r => ({ tripId: r.tripId, _id: r._id })));
      
      return res.status(404).json({
        success: false,
        message: `Payment record not found for trip ID: ${tripId} in ${collectionName} collection`
      });
    }

    console.log(`✅ Found payment record:`, JSON.stringify(paymentRecord, null, 2));

    // Update the payment record
    const evidencePath = `/uploads/${req.file.filename}`;
    const updatedPayment = await collection.findOneAndUpdate(
      { tripId: tripId },
      {
        $set: {
          paid: 1,
          evidence: evidencePath,
          updatedAt: new Date()
        }
      },
      { returnDocument: 'after' }
    );

    console.log(`✅ Payment updated successfully for tripId: ${tripId}`);

    res.status(200).json({
      success: true,
      message: 'Payment status updated successfully',
      data: {
        tripId: updatedPayment.tripId,
        driverEmail: updatedPayment.driverEmail,
        cost: updatedPayment.cost,
        paid: updatedPayment.paid,
        evidence: updatedPayment.evidence,
        updatedAt: updatedPayment.updatedAt
      }
    });

  } catch (error) {
    console.error('❌ Error updating payment status:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

// Get payment details by tripId and role
const getPaymentDetails = async (req, res) => {
  try {
    console.log('✅ GET /payment/:role/:tripId route was accessed!');
    const { role, tripId } = req.params;

    console.log(`🔍 Getting payment details for role: ${role}, tripId: ${tripId}`);

    // Validate role parameter
    if (!['drivers', 'guides'].includes(role)) {
      return res.status(400).json({
        success: false,
        message: 'Role must be either "drivers" or "guides"'
      });
    }

    // Validate tripId parameter
    if (!tripId) {
      return res.status(400).json({
        success: false,
        message: 'Trip ID is required'
      });
    }

    // Ensure we're using the existing connection
    if (mongoose.connection.readyState !== 1) {
      console.log('❌ MongoDB connection not ready. Connection state:', mongoose.connection.readyState);
      return res.status(500).json({
        success: false,
        message: 'Database connection not ready'
      });
    }

    // Get the database connection and verify we're connected to the right database
    const db = mongoose.connection.db;
    const databaseName = mongoose.connection.name;
    
    console.log(`📊 Connected to database: ${databaseName}`);

    // Verify we're connected to the payment-service database
    if (databaseName !== 'payment-service') {
      console.log(`⚠️  Warning: Expected 'payment-service' database but connected to '${databaseName}'`);
      return res.status(500).json({
        success: false,
        message: `Connected to wrong database: ${databaseName}. Expected: payment-service`
      });
    }

    // Get the correct collection name based on role
    const collectionName = role; // 'drivers' or 'guides'
    console.log(`📊 Querying collection: ${collectionName} in database: ${databaseName}`);

    // Get the collection
    const collection = db.collection(collectionName);

    // Find the payment record by tripId
    console.log(`🔍 Looking for tripId: ${tripId} in ${collectionName} collection`);
    const paymentRecord = await collection.findOne({ tripId: tripId });

    if (!paymentRecord) {
      console.log(`❌ Payment record not found for tripId: ${tripId}`);
      
      // Debug: Let's see what records exist
      const allRecords = await collection.find({}).limit(5).toArray();
      console.log(`📊 Sample records in ${collectionName} collection:`, allRecords.map(r => ({ tripId: r.tripId, _id: r._id })));
      
      return res.status(404).json({
        success: false,
        message: `Payment record not found for trip ID: ${tripId} in ${collectionName} collection`
      });
    }

    console.log(`✅ Found payment record:`, JSON.stringify(paymentRecord, null, 2));

    res.status(200).json({
      success: true,
      message: 'Payment details retrieved successfully',
      data: paymentRecord
    });

  } catch (error) {
    console.error('❌ Error retrieving payment details:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

// Get all payments for a specific role
/* COMMENTED OUT - OLD FUNCTION
const getAllPayments = async (req, res) => {
  try {
    const { role } = req.params;
    
    console.log(`🔍 getAllPayments called with role: ${role}`);

    // List all collections in the database
    const collections = await mongoose.connection.db.listCollections().toArray();
    console.log('📋 Available collections in database:');
    collections.forEach(col => console.log(`  - ${col.name}`));

    // Create sample data if collections are empty (for testing)
    await createSampleData();

    // Validate role parameter
    if (!['drivers', 'guides'].includes(role)) {
      console.log(`❌ Invalid role provided: ${role}`);
      return res.status(400).json({
        success: false,
        message: 'Role must be either "drivers" or "guides"'
      });
    }

    // Select the appropriate model based on role
    const PaymentModel = role === 'drivers' ? DriversPayment : GuidesPayment;
    
    console.log(`📊 Using model for ${role}: ${PaymentModel.modelName}`);
    console.log(`📊 Collection name: ${PaymentModel.collection.name}`);

    // Check if the collection exists
    const collectionExists = collections.some(col => col.name === PaymentModel.collection.name);
    console.log(`📋 Collection '${PaymentModel.collection.name}' exists: ${collectionExists}`);

    // Get all payment records
    console.log(`🔍 Querying ${role} payments...`);
    const payments = await PaymentModel.find({}).sort({ createdAt: -1 });
    
    console.log(`✅ Found ${payments.length} payment records for ${role}`);
    if (payments.length > 0) {
      console.log(`📄 First payment record:`, JSON.stringify(payments[0], null, 2));
    } else {
      console.log('📄 No payment records found');
    }

    res.status(200).json({
      success: true,
      message: `All ${role} payments retrieved successfully`,
      count: payments.length,
      data: payments
    });

  } catch (error) {
    console.error('❌ Error retrieving all payments:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};
*/

// NEW FUNCTION - Get all payments for a specific role from drivers/guides collections
const getAllPayments = async (req, res) => {
  try {
    const { role } = req.params;
    
    console.log(`🔍 getAllPayments called with role: ${role}`);

    // Validate role parameter
    if (!['drivers', 'guides'].includes(role)) {
      console.log(`❌ Invalid role provided: ${role}`);
      return res.status(400).json({
        success: false,
        message: 'Role must be either "drivers" or "guides"'
      });
    }

    // Ensure we're using the existing connection
    if (mongoose.connection.readyState !== 1) {
      console.log('❌ MongoDB connection not ready. Connection state:', mongoose.connection.readyState);
      return res.status(500).json({
        success: false,
        message: 'Database connection not ready'
      });
    }

    // Get the database connection and verify we're connected to the right database
    const db = mongoose.connection.db;
    const databaseName = mongoose.connection.name;
    
    console.log(`📊 Connected to database: ${databaseName}`);
    console.log(`📊 Connection state: ${mongoose.connection.readyState}`);

    // Verify we're connected to the payment-service database
    if (databaseName !== 'payment-service') {
      console.log(`⚠️  Warning: Expected 'payment-service' database but connected to '${databaseName}'`);
      return res.status(500).json({
        success: false,
        message: `Connected to wrong database: ${databaseName}. Expected: payment-service`
      });
    }

    // Get the correct collection name based on role (matching your actual collections)
    const collectionName = role === 'drivers' ? 'drivers' : 'guides';
    console.log(`📊 Querying collection: ${collectionName} in database: ${databaseName}`);

    // Get the collection
    const collection = db.collection(collectionName);

    // List all available collections for debugging
    const collections = await db.listCollections().toArray();
    console.log('📋 Available collections in payment_service database:');
    collections.forEach(col => console.log(`  - ${col.name}`));

    // Find all documents where paid > 0 (indicating paid transactions)
    const paidTransactions = await collection.find({ 
      paid: { $gt: 0 } 
    }).sort({ createdAt: -1 }).toArray();
    
    console.log(`✅ Found ${paidTransactions.length} paid transactions for ${role} in ${collectionName} collection`);
    
    if (paidTransactions.length > 0) {
      console.log(`📄 First paid transaction:`, JSON.stringify(paidTransactions[0], null, 2));
    } else {
      console.log('📄 No paid transactions found');
      
      // Also check total documents in the collection for debugging
      const totalDocs = await collection.countDocuments({});
      console.log(`📊 Total documents in ${collectionName} collection: ${totalDocs}`);
      
      if (totalDocs > 0) {
        const sampleDoc = await collection.findOne({});
        console.log(`📄 Sample document structure:`, JSON.stringify(sampleDoc, null, 2));
      }
    }

    res.status(200).json({
      success: true,
      message: `All ${role} paid transactions retrieved successfully from ${collectionName} collection`,
      count: paidTransactions.length,
      database: databaseName,
      collection: collectionName,
      data: paidTransactions
    });

  } catch (error) {
    console.error('❌ Error retrieving paid transactions:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

module.exports = {
  updatePaymentStatus,
  getPaymentDetails,
  getAllPayments
};
