const mongoose = require('mongoose');
const Driver = require('./models/Driver');
require('dotenv').config();

const checkCollection = async () => {
  try {
    console.log('🔗 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB Atlas');

    // Check collection name
    console.log('📋 Collection Details:');
    console.log('  - Collection Name:', Driver.collection.collectionName);
    console.log('  - Model Name:', Driver.modelName);
    console.log('  - Database Name:', mongoose.connection.db.databaseName);
    
    // List all collections in the database
    const collections = await mongoose.connection.db.listCollections().toArray();
    console.log('\n📊 All Collections in Database:');
    collections.forEach((collection, index) => {
      console.log(`  ${index + 1}. ${collection.name}`);
    });

    // Check if our collection exists
    const driverCollectionExists = collections.some(col => col.name === Driver.collection.collectionName);
    console.log(`\n✅ Driver collection (${Driver.collection.collectionName}) exists:`, driverCollectionExists);
    console.log('📝 Expected collection name: Driver_info');

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
  }
};

checkCollection();
