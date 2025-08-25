const mongoose = require('mongoose');
const logger = require('../utils/logger');

const connectMongo = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      dbName: 'schedule_service'
    });
    logger.info('Connected to MongoDB');
  } catch (err) {
    logger.error('MongoDB connection error:', err);
    throw err;
  }
};

module.exports = { connectMongo };
