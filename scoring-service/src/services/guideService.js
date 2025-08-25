const { getPool } = require('../config/postgres');
const { calculateScore } = require('./scoringService');

async function getAllGuides() {
  const pool = getPool();
  const res = await pool.query('SELECT * FROM guide_score WHERE active = 1 AND banned = 0');
  return res.rows;
}

async function getGuideByEmail(email) {
  const pool = getPool();
  const res = await pool.query('SELECT * FROM guide_score WHERE email = $1', [email]);
  return res.rows[0];
}

async function getTopGuide(availableEmails) {
  const pool = getPool();
  const res = await pool.query('SELECT * FROM guide_score WHERE email = ANY($1)', [availableEmails]);
  if (!res.rows.length) return null;
  let top = null;
  let topScore = -Infinity;
  for (const guide of res.rows) {
    const score = calculateScore(guide);
    if (score > topScore) {
      top = guide;
      topScore = score;
    }
  }
  return top;
}

module.exports = { getAllGuides, getGuideByEmail, getTopGuide };
