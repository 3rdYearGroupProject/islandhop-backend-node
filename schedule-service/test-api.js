const axios = require('axios');

const baseURL = 'http://localhost:5005';

// Test data
const testEmail = 'test.driver@example.com';
const testGuideEmail = 'test.guide@example.com';
const testDates = ['2025-09-01', '2025-09-02', '2025-09-03'];
const testMonth = '2025-09';

async function runTests() {
  console.log('🚀 Starting Schedule Service API Tests...\n');

  try {
    // Test 1: Health Check
    console.log('1. Testing Health Check...');
    const healthResponse = await axios.get(`${baseURL}/schedule/health`);
    console.log('✅ Health Check:', healthResponse.data.message);
    console.log('');

    // Test 2: Mark driver days as unavailable
    console.log('2. Testing Mark Driver Days Unavailable...');
    const markUnavailableResponse = await axios.post(
      `${baseURL}/schedule/driver/mark-unavailable`,
      {
        email: testEmail,
        dates: testDates
      }
    );
    console.log('✅ Mark Unavailable:', markUnavailableResponse.data.message);
    console.log('');

    // Test 3: Get driver availability for the month
    console.log('3. Testing Get Driver Availability...');
    const availabilityResponse = await axios.get(
      `${baseURL}/schedule/driver/available?email=${testEmail}&month=${testMonth}`
    );
    console.log('✅ Get Availability:', availabilityResponse.data.message);
    console.log(`Available days: ${availabilityResponse.data.data.summary.available}/${availabilityResponse.data.data.summary.totalDays}`);
    console.log('');

    // Test 4: Lock a date
    console.log('4. Testing Lock Days...');
    const lockResponse = await axios.post(
      `${baseURL}/schedule/driver/lock`,
      {
        email: testEmail,
        dates: ['2025-09-01']
      }
    );
    console.log('✅ Lock Days:', lockResponse.data.message);
    console.log('');

    // Test 5: Try to unmark a locked day (should fail)
    console.log('5. Testing Unmark Locked Day (should fail)...');
    const unmarkLockedResponse = await axios.post(
      `${baseURL}/schedule/driver/unmark-available`,
      {
        email: testEmail,
        dates: ['2025-09-01']
      }
    );
    console.log('⚠️ Unmark Locked:', unmarkLockedResponse.data.results[0].message);
    console.log('');

    // Test 6: Unmark an unlocked day
    console.log('6. Testing Unmark Available Day...');
    const unmarkResponse = await axios.post(
      `${baseURL}/schedule/driver/unmark-available`,
      {
        email: testEmail,
        dates: ['2025-09-02']
      }
    );
    console.log('✅ Unmark Available:', unmarkResponse.data.message);
    console.log('');

    // Test 7: Test guide functionality
    console.log('7. Testing Guide Functionality...');
    const guideMarkResponse = await axios.post(
      `${baseURL}/schedule/guide/mark-unavailable`,
      {
        email: testGuideEmail,
        dates: ['2025-09-05', '2025-09-06']
      }
    );
    console.log('✅ Guide Mark Unavailable:', guideMarkResponse.data.message);
    console.log('');

    // Test 8: Get guide availability
    console.log('8. Testing Get Guide Availability...');
    const guideAvailabilityResponse = await axios.get(
      `${baseURL}/schedule/guide/available?email=${testGuideEmail}&month=${testMonth}`
    );
    console.log('✅ Guide Availability:', guideAvailabilityResponse.data.message);
    console.log(`Available days: ${guideAvailabilityResponse.data.data.summary.available}/${guideAvailabilityResponse.data.data.summary.totalDays}`);
    console.log('');

    // Test 9: Error handling - invalid email
    console.log('9. Testing Error Handling (Invalid Email)...');
    try {
      await axios.post(
        `${baseURL}/schedule/driver/mark-unavailable`,
        {
          email: 'invalid-email',
          dates: ['2025-09-10']
        }
      );
    } catch (error) {
      console.log('✅ Error Handling:', error.response.data.message);
    }
    console.log('');

    // Test 10: Error handling - invalid user type
    console.log('10. Testing Error Handling (Invalid User Type)...');
    try {
      await axios.post(
        `${baseURL}/schedule/invalid/mark-unavailable`,
        {
          email: testEmail,
          dates: ['2025-09-10']
        }
      );
    } catch (error) {
      console.log('✅ Error Handling:', error.response.data.message);
    }
    console.log('');

    console.log('🎉 All tests completed successfully!');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    if (error.response) {
      console.error('Response:', error.response.data);
    }
  }
}

// Run tests if this file is executed directly
if (require.main === module) {
  runTests();
}

module.exports = { runTests };
