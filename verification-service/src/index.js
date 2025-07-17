require('dotenv').config();
const express = require('express');
const winston = require('winston');
const { Pool } = require('pg');
const fs = require('fs');

const app = express();
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
