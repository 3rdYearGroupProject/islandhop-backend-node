const { Client } = require('@googlemaps/google-maps-services-js');
require('dotenv').config();

const client = new Client({});
const apiKey = process.env.GOOGLE_MAPS_API_KEY;

console.log('🔍 Testing Google Maps API...');
console.log('API Key (first 10 chars):', apiKey ? apiKey.substring(0, 10) + '...' : 'NOT SET');

async function testGoogleMapsAPI() {
  try {
    console.log('\n1️⃣ Testing Geocoding API...');
    const geocodeResponse = await client.geocode({
      params: {
        address: 'Colombo, Sri Lanka',
        key: apiKey,
      },
    });
    console.log('✅ Geocoding API: SUCCESS');
    console.log('Result:', geocodeResponse.data.results[0]?.formatted_address);

    console.log('\n2️⃣ Testing Directions API...');
    const directionsResponse = await client.directions({
      params: {
        origin: 'Colombo, Sri Lanka',
        destination: 'Kandy, Sri Lanka',
        key: apiKey,
      },
    });
    console.log('✅ Directions API: SUCCESS');
    console.log('Route found:', directionsResponse.data.routes.length > 0 ? 'Yes' : 'No');

    console.log('\n🎉 All Google Maps APIs are working correctly!');
    
  } catch (error) {
    console.error('\n❌ Google Maps API Error:');
    console.error('Status:', error.response?.status);
    console.error('Error:', error.response?.data?.error_message || error.message);
    
    if (error.response?.data?.status === 'REQUEST_DENIED') {
      console.log('\n🔧 Troubleshooting steps:');
      console.log('1. Check API key restrictions in Google Cloud Console');
      console.log('2. Ensure billing is enabled for your project');
      console.log('3. Verify the required APIs are enabled');
      console.log('4. Check API quotas and usage limits');
    }
  }
}

testGoogleMapsAPI();
