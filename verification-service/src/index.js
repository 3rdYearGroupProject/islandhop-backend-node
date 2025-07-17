require('dotenv').config();
const express = require('express');
const winston = require('winston');
const { Pool } = require('pg');
const fs = require('fs');
const cors = require('cors');

const app = express();

// Enable CORS for all routes (MUST be before routes)
app.use(cors({
  origin: '*', // Allow all origins
  methods: ['GET', 'POST', 'PUT', 'DELETE'], // Allowed HTTP methods
  allowedHeaders: ['Content-Type', 'Authorization'] // Allowed headers
}));

// Explicitly set CORS headers for all responses
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*'); // Allow all origins
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE'); // Allowed methods
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization'); // Allowed headers
  next();
});

app.use(express.json({ limit: '10mb' }));

// Logger setup
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.Console()
  ]
});

// Database pool
const pool = new Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_DATABASE,
  ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false
});

// Routes
const guideCertificatesRouter = require('./routes/guideCertificates');
const driversRouter = require('./routes/drivers');

app.use('/guides/certificates', guideCertificatesRouter(pool, logger));
app.use('/drivers', driversRouter(pool, logger));

// Function to log operations to log.txt
const logOperation = (message) => {
  const timestamp = new Date().toISOString();
  const logMessage = `[${timestamp}] ${message}\n`;
  fs.appendFileSync('log.txt', logMessage, 'utf8');
};

// Example usage of logOperation
logOperation('Verification service started.');

// Middleware to log each request
app.use((req, res, next) => {
  logOperation(`Incoming request: ${req.method} ${req.url}`);
  next();
});

// Error handler
app.use((err, req, res, next) => {
  logger.error(err);
  res.status(500).json({ error: 'Internal Server Error' });
});

const PORT = 8060;
app.listen(PORT, () => {
  logger.info(`Verification service running on port ${PORT}`);
});