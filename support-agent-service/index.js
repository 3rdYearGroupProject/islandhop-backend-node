require('dotenv').config();
const express = require('express');
const { Pool } = require('pg');
const registerRoute = require('./routes/register');

const app = express();
app.use(express.json());

// Database connection
const pool = new Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_DATABASE
});

// Routes
app.use('/register-support-agent', registerRoute(pool));

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  console.log(`Support Agent Service running on port ${PORT}`);
});
