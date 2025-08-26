const { getPool } = require('../config/postgres');
const { calculateScore } = require('./scoringService');

async function getAllDrivers() {
  console.log('[DRIVER SERVICE] Fetching all active, non-banned drivers');
  const pool = getPool();
  const res = await pool.query('SELECT * FROM driver_score WHERE active = 1 AND banned = 0');
  console.log('[DRIVER SERVICE] Query executed, found', res.rows.length, 'drivers');
  console.log('[DRIVER SERVICE] Sample driver data:', res.rows[0]); // Debug: show actual column names
  return res.rows;
}

async function getDriverByEmail(email) {
  console.log('[DRIVER SERVICE] Fetching driver by email:', email);
  const pool = getPool();
  const res = await pool.query('SELECT * FROM driver_score WHERE email = $1', [email]);
  console.log('[DRIVER SERVICE] Driver found:', res.rows.length > 0 ? 'Yes' : 'No');
  return res.rows[0];
}

async function getTopDriver(availableEmails) {
  console.log('[DRIVER SERVICE] Finding top driver from emails:', availableEmails);
  const pool = getPool();
  const res = await pool.query('SELECT * FROM driver_score WHERE email = ANY($1)', [availableEmails]);
  console.log('[DRIVER SERVICE] Found', res.rows.length, 'drivers to evaluate');
  
  if (!res.rows.length) {
    console.log('[DRIVER SERVICE] No drivers found for evaluation');
    return null;
  }
  
  let top = null;
  let topScore = -Infinity;
  
  console.log('[DRIVER SERVICE] Starting score calculation for each driver');
  for (const driver of res.rows) {
    const score = calculateScore(driver);
    console.log('[DRIVER SERVICE] Driver:', driver.email, 'Score:', score);
    
    if (score > topScore) {
      top = driver;
      topScore = score;
      console.log('[DRIVER SERVICE] New top driver:', driver.email, 'with score:', score);
    }
  }
  
  console.log('[DRIVER SERVICE] Final top driver:', top ? top.email : 'None', 'with score:', topScore);
  return top;
}

module.exports = { getAllDrivers, getDriverByEmail, getTopDriver };
