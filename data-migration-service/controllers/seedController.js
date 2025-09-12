const fs = require('fs');
const path = require('path');

// Add data seeding functionality to migration controller
const seedDriverData = async (req, res) => {
  try {
    const mongoose = require('mongoose');
    
    // Read the mock data file
    const filePath = path.join(__dirname, '../mock-data/driver-documents.json');
    const jsonData = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    
    console.log(`📂 Found ${jsonData.length} documents to seed`);
    
    // Convert JSON format to MongoDB format
    const mongoData = jsonData.map(doc => ({
      _id: new mongoose.Types.ObjectId(doc._id.$oid),
      tripId: doc.tripId,
      driverEmail: doc.driverEmail,
      cost: doc.cost,
      paid: doc.paid,
      evidence: doc.evidence,
      createdAt: new Date(doc.createdAt.$date),
      updatedAt: new Date(doc.updatedAt.$date),
      __v: doc.__v
    }));
    
    // Get target collection (from request body or default)
    const { targetCollection = 'driver_payments' } = req.body;
    
    const db = mongoose.connection.db;
    const collection = db.collection(targetCollection);
    
    // Insert documents with upsert to avoid duplicates
    let insertedCount = 0;
    let skippedCount = 0;
    
    for (const doc of mongoData) {
      try {
        await collection.replaceOne(
          { _id: doc._id },
          doc,
          { upsert: true }
        );
        insertedCount++;
      } catch (error) {
        if (error.code === 11000) {
          skippedCount++;
        } else {
          throw error;
        }
      }
    }
    
    // Verify insertion
    const totalCount = await collection.countDocuments({ 
      driverEmail: 'driver101@islandhop.lk' 
    });
    
    res.json({
      success: true,
      data: {
        targetCollection,
        totalDocuments: jsonData.length,
        insertedCount,
        skippedCount,
        finalCount: totalCount,
        message: 'Driver payment data seeded successfully'
      }
    });
    
    console.log(`✅ Seeded ${insertedCount} documents to ${targetCollection}`);
    console.log(`⏭️ Skipped ${skippedCount} existing documents`);
    console.log(`📊 Total driver101@islandhop.lk documents: ${totalCount}`);
    
  } catch (error) {
    console.error('❌ Seed data error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to seed driver data',
      error: error.message
    });
  }
};

// Seed guide data (placeholder for future use)
const seedGuideData = async (req, res) => {
  try {
    res.json({
      success: true,
      message: 'Guide data seeding not implemented yet'
    });
  } catch (error) {
    console.error('❌ Seed guide data error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to seed guide data',
      error: error.message
    });
  }
};

// Clear collection data
const clearCollection = async (req, res) => {
  try {
    const { collectionName, confirm } = req.body;
    
    if (!collectionName) {
      return res.status(400).json({
        success: false,
        message: 'Collection name is required'
      });
    }
    
    if (confirm !== 'YES_DELETE_ALL') {
      return res.status(400).json({
        success: false,
        message: 'Please confirm deletion by sending confirm: "YES_DELETE_ALL"'
      });
    }
    
    const mongoose = require('mongoose');
    const db = mongoose.connection.db;
    const collection = db.collection(collectionName);
    
    const result = await collection.deleteMany({});
    
    res.json({
      success: true,
      data: {
        collectionName,
        deletedCount: result.deletedCount,
        message: 'Collection cleared successfully'
      }
    });
    
    console.log(`🗑️ Cleared ${result.deletedCount} documents from ${collectionName}`);
    
  } catch (error) {
    console.error('❌ Clear collection error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to clear collection',
      error: error.message
    });
  }
};

module.exports = {
  seedDriverData,
  seedGuideData,
  clearCollection
};