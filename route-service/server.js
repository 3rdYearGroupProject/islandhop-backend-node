const dotenv = require('dotenv');
dotenv.config();

console.log('🔍 Environment variables loaded:');
console.log('PORT:', process.env.PORT);
console.log('GOOGLE_MAPS_API_KEY:', process.env.GOOGLE_MAPS_API_KEY ? `${process.env.GOOGLE_MAPS_API_KEY.substring(0, 10)}...` : 'NOT SET');
console.log('USE_MOCK_DATA:', process.env.USE_MOCK_DATA);

const express = require('express');
const mongoose = require('mongoose');
const app = require('./src/app');

const PORT = process.env.PORT || 3000;
const USE_MOCK_DATA = process.env.USE_MOCK_DATA === 'true' || true; // Set to true for mock data

if (USE_MOCK_DATA) {
    console.log('🚀 Starting server with MOCK DATA (no database connection)');
    app.listen(PORT, () => {
        console.log(`✅ Route Service is running on port ${PORT} with mock data`);
        console.log(`📍 Health check: http://localhost:${PORT}/health`);
        console.log(`🧪 Demo endpoint: http://localhost:${PORT}/trips/demo/sample-trip`);
        console.log(`🗺️  Optimized route: http://localhost:${PORT}/trips/any-id/optimized-route`);
    });
} else {
    console.log('🚀 Starting server with DATABASE connection');
    mongoose.connect(process.env.MONGODB_URI, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
    })
    .then(() => {
        console.log('✅ Connected to MongoDB');
        app.listen(PORT, () => {
            console.log(`✅ Route Service is running on port ${PORT} with database`);
        });
    })
    .catch(err => {
        console.error('❌ MongoDB connection error:', err);
        process.exit(1);
    });
}