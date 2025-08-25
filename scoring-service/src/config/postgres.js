const { Pool } = require('pg');
const logger = require('../utils/logger');

let pool;

const connectPostgres = async () => {
  if (pool) return pool;
  pool = new Pool({
    connectionString: process.env.PG_CONNECTION_STRING,
    ssl: { rejectUnauthorized: false }
  });
  try {
    await pool.query('SELECT 1');
    logger.info('Connected to PostgreSQL');
  } catch (err) {
    logger.error('PostgreSQL connection error:', err);
    throw err;
  }
  return pool;
};

module.exports = { connectPostgres, getPool: () => pool };
