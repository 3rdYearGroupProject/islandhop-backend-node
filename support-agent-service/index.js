require('dotenv').config();
const express = require('express');
const { Pool } = require('pg');
const mongoose = require('mongoose');
const registerRoute = require('./routes/register');
const ticketsRoute = require('./routes/tickets');
const dashboardStatsRoute = require('./routes/dashboard-stats');
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

// Database connections
// PostgreSQL (Neon) connection
const pool = new Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_DATABASE,
  ssl: { rejectUnauthorized: false } // Enable SSL
});

// MongoDB connection
async function connectMongoDB() {
  try {
    await mongoose.connect(process.env.MONGODB_URI, {
      dbName: process.env.MONGODB_DB_NAME || "lost-items",
    });
    console.log('✅ Connected to MongoDB');
  } catch (error) {
    console.error('❌ MongoDB connection error:', error);
    process.exit(1);
  }
}

// Initialize MongoDB connection
connectMongoDB();

// Routes
app.use('/register-support-agent', registerRoute(pool));
app.use('/tickets', ticketsRoute);
app.use('/dashboard-stats', dashboardStatsRoute);

// Make database connections available to routes
app.locals.pgPool = pool;
app.locals.mongoose = mongoose;

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

// Test route to demonstrate both database connections
app.get('/test-databases', async (req, res) => {
  try {
    // Test PostgreSQL connection
    const pgClient = await pool.connect();
    const pgResult = await pgClient.query('SELECT NOW() as pg_time');
    pgClient.release();

    // Test MongoDB connection
    const mongoDb = mongoose.connection.db;
    const mongoCollections = await mongoDb.listCollections().toArray();

    res.json({
      success: true,
      message: 'Both databases connected successfully',
      postgresql: {
        status: 'connected',
        time: pgResult.rows[0].pg_time,
        database: process.env.DB_DATABASE
      },
      mongodb: {
        status: 'connected',
        database: mongoose.connection.name,
        collections_count: mongoCollections.length
      }
    });
  } catch (error) {
    console.error('Database test error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Database connection test failed',
      error: error.message 
    });
  }
});

const PORT = process.env.PORT || config.PORT;
app.listen(PORT, () => {
  console.log(`Support Agent Service running on port ${PORT}`);
  console.log('✅ PostgreSQL (Neon) connection ready');
  console.log('✅ MongoDB connection ready');
});
