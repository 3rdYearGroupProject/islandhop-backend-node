const mongoose = require('mongoose');
const Driver = require('./models/Driver');
require('dotenv').config();

const createTestDriver = async () => {
  try {
    console.log('🔗 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB Atlas');

    // Check if driver already exists
    const existingDriver = await Driver.findOne({ email: 'driver101@islandhop.lk' });
    if (existingDriver) {
      console.log('✅ Driver already exists:', existingDriver.email);
      return;
    }

    // Create test driver
    const testDriver = new Driver({
      email: 'driver101@islandhop.lk',
      firstName: 'John',
      lastName: 'Driver',
      phone: '+94771234567',
      licenseNumber: 'DL123456789',
      vehicleDetails: {
        make: 'Toyota',
        model: 'Hiace',
        year: 2020,
        plateNumber: 'ABC-1234',
        color: 'White'
      },
      status: 'active',
      rating: 4.5,
      totalTrips: 25,
      earnings: {
        total: 125000,
        daily: 5000,
        weekly: 35000,
        monthly: 125000
      },
      location: {
        latitude: 6.9271,
        longitude: 79.8612,
        address: 'Colombo, Sri Lanka'
      },
      isAvailable: true
    });

    await testDriver.save();
    console.log('✅ Test driver created successfully in Driver_info collection!');
    console.log('📧 Email:', testDriver.email);
    console.log('👤 Name:', testDriver.firstName, testDriver.lastName);
    console.log('🚗 Vehicle:', testDriver.vehicleDetails.make, testDriver.vehicleDetails.model);
    console.log('📊 Collection:', 'Driver_info');

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
  }
};

createTestDriver();
