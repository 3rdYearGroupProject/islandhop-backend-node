#!/usr/bin/env node

const mongoose = require('mongoose');
require('dotenv').config();

// Import the controller functions
const { getTours, findGuideByEmail } = require('./controllers/authControllers');

// MongoDB Connection
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://2022cs056:dH4aTFn3IOerWlVZ@cluster0.9ccambx.mongodb.net/For_Drivers';

async function verifyMicroserviceFunctionality() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB');
    
    // Test 1: Direct database lookup with URL decoding
    console.log('\n🧪 TEST 1: Direct Database Lookup');
    console.log('=' .repeat(50));
    
    const testEmails = [
      'guide101@islandhop.lk',           // Normal email
      'guide101%40islandhop.lk'          // URL encoded email
    ];
    
    for (const email of testEmails) {
      console.log(`\n🔍 Testing email: "${email}"`);
      
      // Simulate URL decoding (what our fix does)
      const decodedEmail = decodeURIComponent(email);
      console.log(`📧 Decoded email: "${decodedEmail}"`);
      
      // Test database lookup
      const db = mongoose.connection.db;
      const collection = db.collection('Guide_info');
      const guide = await collection.findOne({ 
        $or: [
          { email: decodedEmail },
          { "personalInfo.email": decodedEmail }
        ]
      });
      
      if (guide) {
        console.log(`✅ Found guide: ${guide.personalInfo?.firstName} ${guide.personalInfo?.lastName}`);
        console.log(`📊 Tours data: ${guide.tours?.active?.length || 0} active, ${guide.tours?.pending?.length || 0} pending, ${guide.tours?.history?.length || 0} history`);
      } else {
        console.log('❌ Guide not found');
      }
    }
    
    // Test 2: Full endpoint simulation
    console.log('\n🧪 TEST 2: Full Endpoint Simulation');
    console.log('=' .repeat(50));
    
    // Mock request with URL encoded email (what happens in real HTTP requests)
    const mockReq = {
      params: {
        guideId: 'guide101%40islandhop.lk'  // URL encoded
      },
      query: {
        status: 'all',
        limit: 20,
        page: 1
      }
    };
    
    let responseData = null;
    let responseStatus = null;
    
    const mockRes = {
      status: function(code) {
        responseStatus = code;
        return this;
      },
      json: function(data) {
        responseData = data;
        return this;
      }
    };
    
    console.log(`🌐 Simulating request: /api/guides/${mockReq.params.guideId}/tours`);
    
    // Call the actual getTours function
    await getTours(mockReq, mockRes);
    
    // Analyze results
    console.log(`📊 Response Status: ${responseStatus}`);
    console.log(`✅ Success: ${responseData?.success}`);
    console.log(`📈 Tours Count: ${responseData?.data?.length || 0}`);
    
    if (responseData?.data && responseData.data.length > 0) {
      console.log('\n🎯 Sample Tours Retrieved:');
      responseData.data.slice(0, 3).forEach((tour, i) => {
        console.log(`  ${i + 1}. ${tour.tourName} - ${tour.customerName} (${tour.status})`);
      });
      
      console.log('\n🏆 VERIFICATION RESULT: ✅ MICROSERVICE IS WORKING CORRECTLY!');
      console.log(`   - Authentication: Fixed (URL decoding works)`);
      console.log(`   - Database Access: Working (${responseData.data.length} tours retrieved)`);
      console.log(`   - Real Data: Confirmed (actual guide and tour data)`);
    } else {
      console.log('\n❌ VERIFICATION RESULT: FAILED');
      console.log('   - No tours data returned');
      console.log('   - Check authentication or database connection');
    }
    
  } catch (error) {
    console.error('🔥 Verification error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n👋 Disconnected from MongoDB');
  }
}

console.log('🔍 VERIFYING GUIDE MICROSERVICE FUNCTIONALITY');
console.log('=' .repeat(60));
verifyMicroserviceFunctionality();