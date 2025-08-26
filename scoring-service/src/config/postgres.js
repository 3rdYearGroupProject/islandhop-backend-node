const { Pool } = require('pg');
const logger = require('../utils/logger');

let pool;

const connectPostgres = async () => {
  console.log('[POSTGRES CONFIG] Attempting to connect to PostgreSQL');
  if (pool) {
    console.log('[POSTGRES CONFIG] Using existing connection pool');
    return pool;
  }
  
  console.log('[POSTGRES CONFIG] Creating new connection pool');
  pool = new Pool({
    connectionString: process.env.PG_CONNECTION_STRING,
    ssl: { rejectUnauthorized: false }
  });
  
  try {
    console.log('[POSTGRES CONFIG] Testing database connection');
    await pool.query('SELECT 1');
    console.log('[POSTGRES CONFIG] PostgreSQL connection successful');
    logger.info('Connected to PostgreSQL');
  } catch (err) {
    console.log('[POSTGRES CONFIG] PostgreSQL connection failed:', err.message);
    logger.error('PostgreSQL connection error:', err);
    throw err;
  }
  return pool;
};

module.exports = { connectPostgres, getPool: () => pool };
