const express = require('express');
const { v4: uuidv4 } = require('uuid');
const admin = require('../firebase');

module.exports = (pool) => {
  const router = express.Router();

  router.post('/', async (req, res) => {
    const client = await pool.connect();
    const { email, first_name, last_name, address, contact_no, profile_picture, permission } = req.body;

    try {
      // Start transaction
      await client.query('BEGIN');

      // Create Firebase user
      let firebaseUser;
      try {
        firebaseUser = await admin.auth().createUser({ email });
      } catch (error) {
        if (error.code === 'auth/email-already-exists') {
          return res.status(400).json({ success: false, message: 'Email already exists in Firebase' });
        }
        throw error;
      }

      // Generate UUIDs
      const accountId = uuidv4();
      const profileId = uuidv4();

      // Insert into support_accounts
      await client.query(
        `INSERT INTO support_accounts (id, email, status) VALUES ($1, $2, $3)`,
        [accountId, email, 'ACTIVE']
      );

      // Insert into support_profiles
      await client.query(
        `INSERT INTO support_profiles (id, address, contact_no, email, first_name, last_name, profile_completion, profile_picture, permission)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
        [profileId, address, contact_no, email, first_name, last_name, 0, profile_picture, permission]
      );

      // Commit transaction
      await client.query('COMMIT');

      res.status(201).json({ success: true, message: 'Support agent registered successfully' });
    } catch (error) {
      await client.query('ROLLBACK');
      console.error('Error registering support agent:', error);
      res.status(500).json({ success: false, message: 'Internal Server Error' });
    } finally {
      client.release();
    }
  });

  return router;
};
