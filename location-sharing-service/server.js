// Load environment variables from .env
require('dotenv').config();

const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const locationRoutes = require('./routes/locationRoutes');

const app = express();
const PORT = process.env.PORT;
const MONGO_URI = process.env.MONGO_URI;


app.use(bodyParser.json());

// Logging middleware
app.use((req, res, next) => {
  const now = new Date().toISOString();
  console.log(`[${now}] ${req.method} ${req.originalUrl}`);
  next();
});


if (!MONGO_URI) {
  console.error('MONGO_URI is not set in environment variables.');
  process.exit(1);
}

mongoose.connect(MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log('MongoDB connected'))
  .catch(err => {
    console.error('MongoDB connection error:', err);
    process.exit(1);
  });


// Use base URL from environment variable or default to /api/v1
const BASE_URL = process.env.BASE_URL || '/api/v1';
app.use(BASE_URL, locationRoutes);


if (!PORT) {
  console.error('PORT is not set in environment variables.');
  process.exit(1);
}

app.listen(PORT, () => {
  console.log(`Location Sharing Service running on port ${PORT} with base url ${BASE_URL}`);
});
