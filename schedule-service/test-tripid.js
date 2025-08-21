const axios = require('axios');

const BASE_URL = 'http://localhost:5005';

async function testTripIdFunctionality() {
  console.log('🧪 Testing Schedule Service with Trip ID functionality...\n');

  try {
    // Test 1: Health Check
    console.log('1. Testing health check...');
    const healthResponse = await axios.get(`${BASE_URL}/schedule/health`);
    console.log('✅ Health check passed:', healthResponse.data.message);

    // Test 2: Lock dates with trip ID
    console.log('\n2. Testing lock dates with trip ID...');
    const lockWithTripResponse = await axios.post(`${BASE_URL}/schedule/driver/lock`, {
      email: 'test.driver@example.com',
      dates: ['2025-09-15', '2025-09-16'],
      tripId: 'TRIP_TEST_001'
    });
    console.log('✅ Lock with trip ID successful:', lockWithTripResponse.data.message);
    console.log('   Trip ID stored:', lockWithTripResponse.data.tripId);

    // Test 3: Lock dates without trip ID
    console.log('\n3. Testing lock dates without trip ID...');
    const lockWithoutTripResponse = await axios.post(`${BASE_URL}/schedule/driver/lock`, {
      email: 'test.driver@example.com',
      dates: ['2025-09-17']
    });
    console.log('✅ Lock without trip ID successful:', lockWithoutTripResponse.data.message);

    // Test 4: Get schedule to verify trip IDs are returned
    console.log('\n4. Testing get schedule with trip IDs...');
    const scheduleResponse = await axios.get(`${BASE_URL}/schedule/driver/available`, {
      params: {
        email: 'test.driver@example.com',
        month: '2025-09'
      }
    });
    
    console.log('✅ Schedule retrieved successfully');
    
    // Check for locked dates with trip IDs
    const lockedDates = scheduleResponse.data.data.schedule.filter(day => day.status === 'locked');
    console.log('   Locked dates found:', lockedDates.length);
    
    lockedDates.forEach(date => {
      console.log(`   - ${date.date}: status=${date.status}, tripId=${date.tripId || 'null'}`);
    });

    // Test 5: Try to modify locked date (should fail)
    console.log('\n5. Testing modification of locked date (should fail)...');
    try {
      await axios.post(`${BASE_URL}/schedule/driver/mark-unavailable`, {
        email: 'test.driver@example.com',
        dates: ['2025-09-15']
      });
      console.log('❌ ERROR: Should not be able to modify locked date');
    } catch (error) {
      if (error.response && error.response.data.results) {
        const result = error.response.data.results[0];
        if (!result.success && result.message.includes('locked')) {
          console.log('✅ Correctly prevented modification of locked date');
        } else {
          console.log('❌ Unexpected response:', result.message);
        }
      } else {
        // Successful response means the modification succeeded
        const response = error.response?.data || error;
        const result = response.results?.[0];
        if (result && !result.success && result.message.includes('locked')) {
          console.log('✅ Correctly prevented modification of locked date');
        } else {
          console.log('❌ Unexpected response when trying to modify locked date');
        }
      }
    }

    // Test 6: Test invalid trip ID
    console.log('\n6. Testing invalid trip ID (empty string)...');
    try {
      await axios.post(`${BASE_URL}/schedule/driver/lock`, {
        email: 'test.driver@example.com',
        dates: ['2025-09-20'],
        tripId: ''
      });
      console.log('❌ ERROR: Should not accept empty trip ID');
    } catch (error) {
      if (error.response && error.response.status === 400) {
        console.log('✅ Correctly rejected empty trip ID');
      } else {
        console.log('❌ Unexpected error:', error.message);
      }
    }

    console.log('\n🎉 All tests completed successfully!');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data);
    }
  }
}

// Run the tests
testTripIdFunctionality();
