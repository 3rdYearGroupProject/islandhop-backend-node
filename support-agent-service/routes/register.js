const express = require('express');
const { v4: uuidv4 } = require('uuid');
const admin = require('../firebase');
const fs = require('fs');
const nodemailer = require('nodemailer');
const crypto = require('crypto');

const DEFAULT_AVATAR_URL = 'image.png';

module.exports = (pool) => {
  const router = express.Router();

  router.post('/', async (req, res) => {
    const client = await pool.connect();
    const { email, first_name, last_name, address, contact_no, permission } = req.body;

    // Convert default avatar to base64
    const profile_picture = fs.readFileSync(DEFAULT_AVATAR_URL, { encoding: 'base64' });

    console.log('Received request to register support agent:', req.body);

    try {
      console.log('Starting transaction');
      await client.query('BEGIN');

      // Create Firebase user
      let firebaseUser;
      try {
        console.log('Creating Firebase user');
        firebaseUser = await admin.auth().createUser({ email });
        console.log('Firebase user created:', firebaseUser);
      } catch (error) {
        console.error('Error creating Firebase user:', error);
        if (error.code === 'auth/email-already-exists') {
          return res.status(400).json({ success: false, message: 'Email already exists in Firebase' });
        }
        throw error;
      }

      // Use Firebase UID as the account ID
      const accountId = firebaseUser.uid;

      // Generate UUID for the profile
      const profileId = uuidv4();
      console.log('Generated IDs:', { accountId, profileId });

      // Insert into support_accounts
      console.log('Inserting into support_accounts');
      await client.query(
        `INSERT INTO support_accounts (id, email, status) VALUES ($1, $2, $3)`,
        [accountId, email, 'ACTIVE']
      );

      // Insert into support_profiles
      console.log('Inserting into support_profiles');
      await client.query(
        `INSERT INTO support_profiles (id, address, contact_no, email, first_name, last_name, profile_completion, profile_picture, permission)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
        [profileId, address, contact_no, email, first_name, last_name, 0, profile_picture, permission]
      );

      // Commit transaction
      console.log('Committing transaction');
      await client.query('COMMIT');

      // Generate a secure temporary password
      const temporaryPassword = crypto.randomBytes(8).toString('hex');

      // Update Firebase user with the temporary password
      await admin.auth().updateUser(firebaseUser.uid, { password: temporaryPassword });

      // Send email with account credentials
      console.log('Sending email with account credentials');
      const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASS
        }
      });

      const mailOptions = {
        from: process.env.EMAIL_USER,
        to: email,
        subject: 'Your Support Agent Account Credentials',
        text: `Hello ${first_name} ${last_name},

Your support agent account has been created successfully.

Email: ${email}
Password: ${temporaryPassword}
Status: ACTIVE

You can log in using the above credentials.

Thank you for joining us!

Best regards,
Support Team`
      };

      await transporter.sendMail(mailOptions);
      console.log('Email sent successfully');

      console.log('Support agent registered successfully');
      res.status(201).json({ success: true, message: 'Support agent registered successfully' });
    } catch (error) {
      console.error('Error registering support agent:', error);
      await client.query('ROLLBACK');
      res.status(500).json({ success: false, message: 'Internal Server Error' });
    } finally {
      console.log('Releasing database client');
      client.release();
    }
  });

  return router;
};
