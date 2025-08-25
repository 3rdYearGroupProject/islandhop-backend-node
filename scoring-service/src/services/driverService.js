const { getPool } = require('../config/postgres');
const { calculateScore } = require('./scoringService');

async function getAllDrivers() {
  const pool = getPool();
  const res = await pool.query('SELECT * FROM driver_score WHERE active = 1 AND banned = 0');
  return res.rows;
}

async function getDriverByEmail(email) {
  const pool = getPool();
  const res = await pool.query('SELECT * FROM driver_score WHERE email = $1', [email]);
  return res.rows[0];
}

async function getTopDriver(availableEmails) {
  const pool = getPool();
  const res = await pool.query('SELECT * FROM driver_score WHERE email = ANY($1)', [availableEmails]);
  if (!res.rows.length) return null;
  let top = null;
  let topScore = -Infinity;
  for (const driver of res.rows) {
    const score = calculateScore(driver);
    if (score > topScore) {
      top = driver;
      topScore = score;
    }
  }
  return top;
}

module.exports = { getAllDrivers, getDriverByEmail, getTopDriver };
