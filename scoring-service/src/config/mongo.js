const mongoose = require('mongoose');
const logger = require('../utils/logger');

const connectMongo = async () => {
  try {
    console.log('[MONGO CONFIG] Attempting to connect to MongoDB');
    await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      dbName: 'schedule_service'
    });
    console.log('[MONGO CONFIG] MongoDB connection successful');
    logger.info('Connected to MongoDB');
  } catch (err) {
    console.log('[MONGO CONFIG] MongoDB connection failed:', err.message);
    logger.error('MongoDB connection error:', err);
    throw err;
  }
};

module.exports = { connectMongo };
