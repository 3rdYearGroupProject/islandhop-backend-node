const mongoose = require('mongoose');
const DriverScore = require('./models/DriverScore');
const GuideScore = require('./models/GuideScore');
const DriverTrips = require('./models/DriverTrips');
const GuideTrips = require('./models/GuideTrips');

// Sample data for testing
const sampleDrivers = [
  {
    email: 'driver1@example.com',
    rating: 4.5,
    active: true,
    banned: false,
    newDriver: false,
    first10Rides: 8,
    penalty: 5
  },
  {
    email: 'driver2@example.com',
    rating: 3.8,
    active: true,
    banned: false,
    newDriver: true,
    first10Rides: 2,
    penalty: 0
  },
  {
    email: 'driver3@example.com',
    rating: 4.9,
    active: false,
    banned: false,
    newDriver: false,
    first10Rides: 10,
    penalty: 10
  }
];

const sampleGuides = [
  {
    email: 'guide1@example.com',
    rating: 4.8,
    active: true,
    banned: false,
    newDriver: true,
    first10Rides: 3,
    penalty: 0
  },
  {
    email: 'guide2@example.com',
    rating: 4.2,
    active: true,
    banned: false,
    newDriver: false,
    first10Rides: 9,
    penalty: 15
  },
  {
    email: 'guide3@example.com',
    rating: 5.0,
    active: true,
    banned: true,
    newDriver: false,
    first10Rides: 10,
    penalty: 0
  }
];

async function seedDatabase() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/tourism_platform');
    console.log('Connected to MongoDB');

    // Clear existing data
    await DriverScore.deleteMany({});
    await GuideScore.deleteMany({});
    await DriverTrips.deleteMany({});
    await GuideTrips.deleteMany({});
    console.log('Cleared existing data');

    // Insert sample drivers
    await DriverScore.insertMany(sampleDrivers);
    console.log('Inserted sample drivers');

    // Insert sample guides
    await GuideScore.insertMany(sampleGuides);
    console.log('Inserted sample guides');

    // Create some sample trips
    const driverTrip = new DriverTrips({
      email: 'driver3@example.com',
      trips: [
        {
          trip_id: 'trip001',
          start_date: new Date('2024-01-15T08:00:00Z'),
          end_date: new Date('2024-01-15T16:00:00Z')
        }
      ]
    });
    await driverTrip.save();

    const guideTrip = new GuideTrips({
      email: 'guide2@example.com',
      trips: [
        {
          trip_id: 'trip002',
          start_date: new Date('2024-01-16T10:00:00Z'),
          end_date: new Date('2024-01-16T18:00:00Z')
        }
      ]
    });
    await guideTrip.save();

    console.log('Sample data inserted successfully!');
    
    // Calculate and display scores
    console.log('\n--- Driver Scores ---');
    const drivers = await DriverScore.find();
    drivers.forEach(driver => {
      console.log(`${driver.email}: ${driver.calculateScore()} points`);
    });

    console.log('\n--- Guide Scores ---');
    const guides = await GuideScore.find();
    guides.forEach(guide => {
      console.log(`${guide.email}: ${guide.calculateScore()} points`);
    });

    await mongoose.connection.close();
    console.log('\nDatabase seeding completed!');
    
  } catch (error) {
    console.error('Error seeding database:', error);
    process.exit(1);
  }
}

// Run the seeding function
if (require.main === module) {
  require('dotenv').config();
  seedDatabase();
}

module.exports = { seedDatabase };
