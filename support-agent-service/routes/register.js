const express = require('express');
const { v4: uuidv4 } = require('uuid');
const admin = require('../firebase');
const fs = require('fs');
const nodemailer = require('nodemailer');
const crypto = require('crypto');
const path = require('path');
const { parsePhoneNumberFromString } = require('libphonenumber-js');
const morgan = require('morgan');
const winston = require('winston');

const DEFAULT_AVATAR_URL = path.join(__dirname, '/image.png');

// Configure Winston logger
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.Console(),
    new winston.transports.File({ filename: 'combined.log' })
  ]
});

module.exports = (pool) => {
  const router = express.Router();

  // Use Morgan for HTTP request logging
  router.use(morgan('combined', { stream: { write: (message) => logger.info(message.trim()) } }));

  router.post('/', async (req, res) => {
    logger.info('POST / - Register support agent', { body: req.body });
    const client = await pool.connect();
    const { email, first_name, last_name, address, contact_no, permission } = req.body;

    // Convert default avatar to base64
    const profile_picture = fs.readFileSync(DEFAULT_AVATAR_URL, { encoding: 'base64' });

    console.log('Received request to register support agent:', req.body);

    try {
      console.log('Starting transaction');
      await client.query('BEGIN');

      // Generate a valid UUID for the account ID
      const accountId = uuidv4();

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
        [profileId, address, contact_no, email, first_name, last_name, 1, profile_picture, permission]
      );

      // Commit transaction
      console.log('Committing transaction');
      await client.query('COMMIT');

      // Create Firebase user only after successful database operations
      console.log('Creating Firebase user');
      const phoneNumber = parsePhoneNumberFromString(contact_no, 'LK'); // Use 'LK' for Sri Lanka
      if (!phoneNumber || !phoneNumber.isValid()) {
        return res.status(400).json({ success: false, message: 'Invalid phone number format' });
      }
      const formattedPhoneNumber = phoneNumber.number;

      firebaseUser = await admin.auth().createUser({
        email,
        displayName: `${first_name} ${last_name}`,
        phoneNumber: formattedPhoneNumber
      });
      console.log('Firebase user created:', firebaseUser);

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
      logger.info('Support agent registered successfully', { email });
      res.status(201).json({ success: true, message: 'Support agent registered successfully' });
    } catch (error) {
      logger.error('Error registering support agent', { error });
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
