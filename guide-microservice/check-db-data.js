const mongoose = require('mongoose');
const Guide = require('./models/Guide');
require('dotenv').config();

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb+srv://2022cs056:dH4aTFn3IOerWlVZ@cluster0.9ccambx.mongodb.net/For_Guides', {
  useNewUrlParser: true,
  useUnifiedTopology: true
});

async function checkGuideData() {
  try {
    console.log('🔍 Checking Guide_info collection...');
    
    // Count total guides
    const totalGuides = await Guide.countDocuments();
    console.log(`📊 Total guides in collection: ${totalGuides}`);
    
    if (totalGuides > 0) {
      // Get a sample guide
      const sampleGuide = await Guide.findOne().lean();
      console.log('\n📋 Sample guide structure:');
      console.log('Keys:', Object.keys(sampleGuide));
      console.log('\n📄 Sample guide data:');
      console.log(JSON.stringify(sampleGuide, null, 2));
      
      // List all guide emails
      const allGuides = await Guide.find({}, 'email firstName lastName').lean();
      console.log('\n👥 Available guides:');
      allGuides.forEach(guide => {
        console.log(`- ${guide.email} (${guide.firstName} ${guide.lastName})`);
      });
    } else {
      console.log('❌ No guides found in the collection');
    }
    
  } catch (error) {
    console.error('❌ Error checking guide data:', error);
  } finally {
    await mongoose.connection.close();
    console.log('\n✅ Database connection closed');
  }
}

checkGuideData();
