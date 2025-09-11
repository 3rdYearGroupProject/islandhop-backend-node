console.log('🚀 Starting test...');

const mongoose = require('mongoose');
console.log('✅ Mongoose imported');

const Guide = require('./models/Guide');
console.log('✅ Guide model imported');

async function test() {
  console.log('🔍 Testing database connection...');
  
  try {
    const mongoURI = 'mongodb+srv://touristdbapp:NDlvfXXjnmKoB8g0@cluster0.cjhgokv.mongodb.net/For_Guides?retryWrites=true&w=majority&appName=Cluster0';
    console.log('📡 Connecting to MongoDB...');
    
    await mongoose.connect(mongoURI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('✅ Connected to MongoDB Atlas');
    
    const guide = await Guide.findOne({ email: 'guide@islandhop.lk' });
    console.log('🔍 Guide lookup result:', guide ? 'Found' : 'Not found');
    
    if (guide) {
      console.log('📧 Guide email:', guide.email);
      console.log('🏢 Personal info available:', !!guide.personalInfo);
      console.log('🎯 Tours data available:', !!guide.tours);
    }
    
    await mongoose.disconnect();
    console.log('👋 Disconnected');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

test();
