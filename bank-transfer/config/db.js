const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    // Ensure we always connect to the same database
    const connectionString = process.env.MONGODB_URL || 'mongodb+srv://2022cs056:dH4aTFn3IOerWlVZ@cluster0.9ccambx.mongodb.net/payment-service';
    
    // Prevent multiple connections
    if (mongoose.connection.readyState === 1) {
      console.log('Already connected to MongoDB');
      return mongoose.connection;
    }
    
    const conn = await mongoose.connect(connectionString, {
      maxPoolSize: 10, // Maintain up to 10 socket connections
      serverSelectionTimeoutMS: 5000, // Keep trying to send operations for 5 seconds
      socketTimeoutMS: 45000, // Close sockets after 45 seconds of inactivity
    });

    console.log(`✅ MongoDB Connected to: ${conn.connection.host}`);
    console.log(`✅ Database: ${conn.connection.name}`);
    console.log(`✅ Connection State: ${mongoose.connection.readyState}`);
    
    return conn.connection;
  } catch (error) {
    console.error('❌ Error connecting to MongoDB:', error.message);
    process.exit(1);
  }
};

module.exports = connectDB;
