const { getPool } = require('../config/postgres');
const { calculateScore } = require('./scoringService');

async function getAllGuides() {
  console.log('[GUIDE SERVICE] Fetching all active, non-banned guides');
  const pool = getPool();
  const res = await pool.query('SELECT * FROM guide_score WHERE active = 1 AND banned = 0');
  console.log('[GUIDE SERVICE] Query executed, found', res.rows.length, 'guides');
  console.log('[GUIDE SERVICE] Sample guide data:', res.rows[0]); // Debug: show actual column names
  return res.rows;
}

async function getGuideByEmail(email) {
  console.log('[GUIDE SERVICE] Fetching guide by email:', email);
  const pool = getPool();
  const res = await pool.query('SELECT * FROM guide_score WHERE email = $1', [email]);
  console.log('[GUIDE SERVICE] Guide found:', res.rows.length > 0 ? 'Yes' : 'No');
  return res.rows[0];
}

async function getTopGuide(availableEmails) {
  console.log('[GUIDE SERVICE] Finding top guide from emails:', availableEmails);
  const pool = getPool();
  const res = await pool.query('SELECT * FROM guide_score WHERE email = ANY($1)', [availableEmails]);
  console.log('[GUIDE SERVICE] Found', res.rows.length, 'guides to evaluate');
  
  if (!res.rows.length) {
    console.log('[GUIDE SERVICE] No guides found for evaluation');
    return null;
  }
  
  let top = null;
  let topScore = -Infinity;
  
  console.log('[GUIDE SERVICE] Starting score calculation for each guide');
  for (const guide of res.rows) {
    const score = calculateScore(guide);
    console.log('[GUIDE SERVICE] Guide:', guide.email, 'Score:', score);
    
    if (score > topScore) {
      top = guide;
      topScore = score;
      console.log('[GUIDE SERVICE] New top guide:', guide.email, 'with score:', score);
    }
  }
  
  console.log('[GUIDE SERVICE] Final top guide:', top ? top.email : 'None', 'with score:', topScore);
  return top;
}

module.exports = { getAllGuides, getGuideByEmail, getTopGuide };
