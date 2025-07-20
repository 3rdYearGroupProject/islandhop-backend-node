require('dotenv').config();
const express = require('express');
const { Pool } = require('pg');
const registerRoute = require('./routes/register');
const config = require('./config');
const cors = require('cors');

const app = express();
app.use(express.json());

// Enable CORS for specific origin
app.use(cors({
  origin: 'http://localhost:3000',
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Database connection
const pool = new Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_DATABASE,
  ssl: { rejectUnauthorized: false } // Enable SSL
});

// Routes
app.use('/register-support-agent', registerRoute(pool));

// Add permission route directly to main app
app.get('/permission/:email', async (req, res) => {
  const client = await pool.connect();
  const { email } = req.params;

  try {
    console.log(`Fetching permission for email: ${email}`);
    const result = await client.query(
      `SELECT permission FROM support_profiles WHERE email = $1`,
      [email]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Email not found' });
    }

    const permission = result.rows[0].permission;
    console.log('Permission fetched successfully:', { email, permission });
    res.status(200).json({ success: true, permission });
  } catch (error) {
    console.error('Error fetching permission:', error);
    res.status(500).json({ success: false, message: 'Internal Server Error' });
  } finally {
    client.release();
  }
});

const PORT = process.env.PORT || config.PORT;
app.listen(PORT, () => {
  console.log(`Support Agent Service running on port ${PORT}`);
});
