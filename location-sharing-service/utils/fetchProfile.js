const axios = require('axios');

/**
 * Fetches the tourist profile from the Java service.
 * @param {string} email
 * @returns {Promise<Object|null>} Profile object or null if not found/error
 */
async function fetchProfile(email) {
  try {
    const res = await axios.get(`http://localhost:8083/api/v1/tourist/profile?email=${encodeURIComponent(email)}`);
    return res.data;
  } catch (err) {
    return null;
  }
}

module.exports = fetchProfile;
