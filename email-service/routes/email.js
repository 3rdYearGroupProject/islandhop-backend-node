const express = require('express');
const nodemailer = require('nodemailer');
const winston = require('winston');
const Joi = require('joi');
const { v4: uuidv4 } = require('uuid');

const router = express.Router();

// Logger
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  defaultMeta: { service: 'email-service' },
  transports: [
    new winston.transports.Console()
  ]
});

// Email transporter configuration
const createTransporter = () => {
  return nodemailer.createTransporter({
    service: process.env.EMAIL_SERVICE || 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASSWORD
    }
  });
};

// Validation schemas
const emailSchema = Joi.object({
  to: Joi.string().email().required(),
  subject: Joi.string().required(),
  text: Joi.string().optional(),
  html: Joi.string().optional(),
  from: Joi.string().email().optional()
});

const bulkEmailSchema = Joi.object({
  recipients: Joi.array().items(Joi.string().email()).min(1).required(),
  subject: Joi.string().required(),
  text: Joi.string().optional(),
  html: Joi.string().optional(),
  from: Joi.string().email().optional()
});

const contactFormSchema = Joi.object({
  name: Joi.string().required(),
  email: Joi.string().email().required(),
  subject: Joi.string().required(),
  message: Joi.string().required()
});

const welcomeEmailSchema = Joi.object({
  email: Joi.string().email().required(),
  name: Joi.string().required(),
  userType: Joi.string().valid('tourist', 'guide', 'driver').required()
});

const verificationEmailSchema = Joi.object({
  email: Joi.string().email().required(),
  name: Joi.string().required(),
  userType: Joi.string().valid('tourist', 'guide', 'driver').required(),
  verificationToken: Joi.string().required(),
  verificationUrl: Joi.string().uri().required()
});

const poolRequestSchema = Joi.object({
  requesterEmail: Joi.string().email().required(),
  requesterName: Joi.string().required(),
  poolName: Joi.string().required(),
  poolOwnerEmail: Joi.string().email().required(),
  poolOwnerName: Joi.string().required(),
  requestType: Joi.string().valid('public', 'private').required(),
  message: Joi.string().optional()
});

const serviceRequestSchema = Joi.object({
  requestorEmail: Joi.string().email().required(),
  requestorName: Joi.string().required(),
  serviceProviderEmail: Joi.string().email().required(),
  serviceProviderName: Joi.string().required(),
  serviceType: Joi.string().valid('guide', 'driver', 'hotel').required(),
  location: Joi.string().required(),
  dates: Joi.string().required(),
  message: Joi.string().required(),
  budget: Joi.string().optional()
});

const lostItemSchema = Joi.object({
  reporterEmail: Joi.string().email().required(),
  reporterName: Joi.string().required(),
  itemDescription: Joi.string().required(),
  locationLost: Joi.string().required(),
  dateLost: Joi.string().required(),
  contactPhone: Joi.string().optional(),
  rewardOffered: Joi.string().optional(),
  adminEmail: Joi.string().email().optional()
});

// Route: Send single email
router.post('/send', async (req, res) => {
  try {
    const { error, value } = emailSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        error: 'Validation Error',
        details: error.details[0].message
      });
    }

    const { to, subject, text, html, from } = value;
    const transporter = createTransporter();

    const mailOptions = {
      from: from || process.env.EMAIL_FROM || process.env.EMAIL_USER,
      to,
      subject,
      text,
      html
    };

    const result = await transporter.sendMail(mailOptions);
    const emailId = uuidv4();

    logger.info('Email sent successfully', {
      emailId,
      to,
      subject,
      messageId: result.messageId
    });

    res.status(200).json({
      success: true,
      message: 'Email sent successfully',
      emailId,
      messageId: result.messageId
    });

  } catch (error) {
    logger.error('Failed to send email', error);
    res.status(500).json({
      error: 'Failed to send email',
      message: error.message
    });
  }
});

// Route: Send bulk emails
router.post('/send-bulk', async (req, res) => {
  try {
    const { error, value } = bulkEmailSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        error: 'Validation Error',
        details: error.details[0].message
      });
    }

    const { recipients, subject, text, html, from } = value;
    const transporter = createTransporter();
    const results = [];
    const errors = [];

    for (const recipient of recipients) {
      try {
        const mailOptions = {
          from: from || process.env.EMAIL_FROM || process.env.EMAIL_USER,
          to: recipient,
          subject,
          text,
          html
        };

        const result = await transporter.sendMail(mailOptions);
        results.push({
          email: recipient,
          success: true,
          messageId: result.messageId
        });

        logger.info('Bulk email sent', {
          to: recipient,
          subject,
          messageId: result.messageId
        });

      } catch (error) {
        errors.push({
          email: recipient,
          success: false,
          error: error.message
        });

        logger.error('Failed to send bulk email', {
          to: recipient,
          error: error.message
        });
      }
    }

    res.status(200).json({
      success: true,
      message: 'Bulk email processing completed',
      results,
      errors,
      summary: {
        total: recipients.length,
        successful: results.length,
        failed: errors.length
      }
    });

  } catch (error) {
    logger.error('Failed to process bulk emails', error);
    res.status(500).json({
      error: 'Failed to process bulk emails',
      message: error.message
    });
  }
});

// Route: Send contact form email
router.post('/contact', async (req, res) => {
  try {
    const { error, value } = contactFormSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        error: 'Validation Error',
        details: error.details[0].message
      });
    }

    const { name, email, subject, message } = value;
    const transporter = createTransporter();

    const mailOptions = {
      from: process.env.EMAIL_FROM || process.env.EMAIL_USER,
      to: process.env.CONTACT_EMAIL || process.env.EMAIL_USER,
      subject: `Contact Form: ${subject}`,
      html: `
        <h3>New Contact Form Submission</h3>
        <p><strong>Name:</strong> ${name}</p>
        <p><strong>Email:</strong> ${email}</p>
        <p><strong>Subject:</strong> ${subject}</p>
        <p><strong>Message:</strong></p>
        <p>${message.replace(/\n/g, '<br>')}</p>
      `,
      replyTo: email
    };

    const result = await transporter.sendMail(mailOptions);

    logger.info('Contact form email sent', {
      from: email,
      name,
      subject,
      messageId: result.messageId
    });

    res.status(200).json({
      success: true,
      message: 'Contact form submitted successfully',
      messageId: result.messageId
    });

  } catch (error) {
    logger.error('Failed to send contact form email', error);
    res.status(500).json({
      error: 'Failed to submit contact form',
      message: error.message
    });
  }
});

// Route: Send welcome email
router.post('/welcome', async (req, res) => {
  try {
    const { error, value } = welcomeEmailSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        error: 'Validation Error',
        details: error.details[0].message
      });
    }

    const { email, name, userType } = value;
    const transporter = createTransporter();

    const welcomeMessages = {
      tourist: {
        subject: 'Welcome to IslandHop - Start Your Adventure!',
        html: `
          <h2>Welcome to IslandHop, ${name}!</h2>
          <p>Thank you for joining our community of travelers and explorers.</p>
          <p>You can now:</p>
          <ul>
            <li>Book amazing island tours</li>
            <li>Connect with local guides</li>
            <li>Discover hidden gems</li>
            <li>Share your travel experiences</li>
          </ul>
          <p>Start exploring now and make unforgettable memories!</p>
          <p>Best regards,<br>The IslandHop Team</p>
        `
      },
      guide: {
        subject: 'Welcome to IslandHop - Share Your Expertise!',
        html: `
          <h2>Welcome to IslandHop, ${name}!</h2>
          <p>Thank you for joining our platform as a professional guide.</p>
          <p>As a guide, you can:</p>
          <ul>
            <li>Create and manage tour listings</li>
            <li>Connect with travelers</li>
            <li>Share your local knowledge</li>
            <li>Build your professional profile</li>
          </ul>
          <p>We're excited to have you share your expertise with our community!</p>
          <p>Best regards,<br>The IslandHop Team</p>
        `
      },
      driver: {
        subject: 'Welcome to IslandHop - Provide Safe Transportation!',
        html: `
          <h2>Welcome to IslandHop, ${name}!</h2>
          <p>Thank you for joining our platform as a professional driver.</p>
          <p>As a driver, you can:</p>
          <ul>
            <li>Offer transportation services</li>
            <li>Connect with travelers and guides</li>
            <li>Manage your vehicle listings</li>
            <li>Build your professional reputation</li>
          </ul>
          <p>We appreciate your commitment to providing safe and reliable transportation!</p>
          <p>Best regards,<br>The IslandHop Team</p>
        `
      }
    };

    const mailOptions = {
      from: process.env.EMAIL_FROM || process.env.EMAIL_USER,
      to: email,
      subject: welcomeMessages[userType].subject,
      html: welcomeMessages[userType].html
    };

    const result = await transporter.sendMail(mailOptions);

    logger.info('Welcome email sent', {
      to: email,
      name,
      userType,
      messageId: result.messageId
    });

    res.status(200).json({
      success: true,
      message: 'Welcome email sent successfully',
      messageId: result.messageId
    });

  } catch (error) {
    logger.error('Failed to send welcome email', error);
    res.status(500).json({
      error: 'Failed to send welcome email',
      message: error.message
    });
  }
});

// Route: Send verification email
router.post('/verify', async (req, res) => {
  try {
    const { error, value } = verificationEmailSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        error: 'Validation Error',
        details: error.details[0].message
      });
    }

    const { email, name, userType, verificationToken, verificationUrl } = value;
    const transporter = createTransporter();

    const mailOptions = {
      from: process.env.EMAIL_FROM || process.env.EMAIL_USER,
      to: email,
      subject: 'Please verify your email address',
      html: `
        <h2>Hi ${name},</h2>
        <p>Thank you for registering on our platform.</p>
        <p>Please verify your email address by clicking the link below:</p>
        <p><a href="${verificationUrl}?token=${verificationToken}">Verify Email</a></p>
        <p>If you did not create an account, please ignore this email.</p>
        <p>Best regards,<br>The IslandHop Team</p>
      `
    };

    const result = await transporter.sendMail(mailOptions);

    logger.info('Verification email sent', {
      to: email,
      userType,
      messageId: result.messageId
    });

    res.status(200).json({
      success: true,
      message: 'Verification email sent successfully',
      messageId: result.messageId
    });

  } catch (error) {
    logger.error('Failed to send verification email', error);
    res.status(500).json({
      error: 'Failed to send verification email',
      message: error.message
    });
  }
});

// Route: Send account verification email
router.post('/verification', async (req, res) => {
  try {
    const { error, value } = verificationEmailSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        error: 'Validation Error',
        details: error.details[0].message
      });
    }

    const { email, name, userType, verificationToken, verificationUrl } = value;
    const transporter = createTransporter();

    const userTypeDisplayNames = {
      tourist: 'Tourist',
      guide: 'Guide',
      driver: 'Driver'
    };

    const mailOptions = {
      from: process.env.EMAIL_FROM || process.env.EMAIL_USER,
      to: email,
      subject: `Verify Your ${userTypeDisplayNames[userType]} Account - IslandHop`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #2563eb;">Verify Your IslandHop Account</h2>
          <p>Hello ${name},</p>
          <p>Thank you for registering as a ${userTypeDisplayNames[userType]} on IslandHop!</p>
          <p>To complete your registration and verify your account, please click the button below:</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${verificationUrl}?token=${verificationToken}" 
               style="background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
              Verify My Account
            </a>
          </div>
          <p>If the button doesn't work, you can copy and paste this link into your browser:</p>
          <p style="word-break: break-all; color: #6b7280;">${verificationUrl}?token=${verificationToken}</p>
          <p><strong>Note:</strong> This verification link will expire in 24 hours.</p>
          <p>If you didn't create this account, please ignore this email.</p>
          <p>Best regards,<br>The IslandHop Team</p>
        </div>
      `
    };

    const result = await transporter.sendMail(mailOptions);

    logger.info('Verification email sent', {
      to: email,
      name,
      userType,
      messageId: result.messageId
    });

    res.status(200).json({
      success: true,
      message: 'Verification email sent successfully',
      messageId: result.messageId
    });

  } catch (error) {
    logger.error('Failed to send verification email', error);
    res.status(500).json({
      error: 'Failed to send verification email',
      message: error.message
    });
  }
});

// Route: Send pool request email
router.post('/request-pool', async (req, res) => {
  try {
    const { error, value } = poolRequestSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        error: 'Validation Error',
        details: error.details[0].message
      });
    }

    const { requesterEmail, requesterName, poolName, poolOwnerEmail, poolOwnerName, requestType, message } = value;
    const transporter = createTransporter();

    const mailOptions = {
      from: process.env.EMAIL_FROM || process.env.EMAIL_USER,
      to: poolOwnerEmail,
      subject: `New ${requestType} request for ${poolName}`,
      html: `
        <h3>Pool Request Details</h3>
        <p><strong>Requester:</strong> ${requesterName} (${requesterEmail})</p>
        <p><strong>Pool Name:</strong> ${poolName}</p>
        <p><strong>Request Type:</strong> ${requestType}</p>
        <p><strong>Message:</strong> ${message || 'No message'}</p>
      `
    };

    const result = await transporter.sendMail(mailOptions);

    logger.info('Pool request email sent', {
      to: poolOwnerEmail,
      poolName,
      requestType,
      messageId: result.messageId
    });

    res.status(200).json({
      success: true,
      message: 'Pool request email sent successfully',
      messageId: result.messageId
    });

  } catch (error) {
    logger.error('Failed to send pool request email', error);
    res.status(500).json({
      error: 'Failed to send pool request email',
      message: error.message
    });
  }
});

// Route: Send pool request notification
router.post('/pool-request', async (req, res) => {
  try {
    const { error, value } = poolRequestSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        error: 'Validation Error',
        details: error.details[0].message
      });
    }

    const { requesterEmail, requesterName, poolName, poolOwnerEmail, poolOwnerName, requestType, message } = value;
    const transporter = createTransporter();

    const requestTypeDisplay = requestType === 'public' ? 'Public Pool' : 'Private Pool';

    // Email to pool owner
    const ownerMailOptions = {
      from: process.env.EMAIL_FROM || process.env.EMAIL_USER,
      to: poolOwnerEmail,
      subject: `New ${requestTypeDisplay} Request - ${poolName}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #2563eb;">New ${requestTypeDisplay} Request</h2>
          <p>Hello ${poolOwnerName},</p>
          <p><strong>${requesterName}</strong> has requested to join your ${requestType} pool: <strong>${poolName}</strong></p>
          
          <div style="background-color: #f8fafc; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="margin-top: 0;">Request Details:</h3>
            <p><strong>Requester:</strong> ${requesterName}</p>
            <p><strong>Email:</strong> ${requesterEmail}</p>
            <p><strong>Pool:</strong> ${poolName}</p>
            <p><strong>Type:</strong> ${requestTypeDisplay}</p>
            ${message ? `<p><strong>Message:</strong><br>${message.replace(/\n/g, '<br>')}</p>` : ''}
          </div>

          <p>Please log in to your IslandHop account to review and respond to this request.</p>
          <p>Best regards,<br>The IslandHop Team</p>
        </div>
      `,
      replyTo: requesterEmail
    };

    // Email confirmation to requester
    const requesterMailOptions = {
      from: process.env.EMAIL_FROM || process.env.EMAIL_USER,
      to: requesterEmail,
      subject: `Pool Request Submitted - ${poolName}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #2563eb;">Pool Request Submitted</h2>
          <p>Hello ${requesterName},</p>
          <p>Your request to join the ${requestType} pool "<strong>${poolName}</strong>" has been submitted successfully.</p>
          
          <div style="background-color: #f8fafc; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="margin-top: 0;">Request Summary:</h3>
            <p><strong>Pool:</strong> ${poolName}</p>
            <p><strong>Pool Owner:</strong> ${poolOwnerName}</p>
            <p><strong>Type:</strong> ${requestTypeDisplay}</p>
          </div>

          <p>You will receive a notification once the pool owner responds to your request.</p>
          <p>Best regards,<br>The IslandHop Team</p>
        </div>
      `
    };

    const [ownerResult, requesterResult] = await Promise.all([
      transporter.sendMail(ownerMailOptions),
      transporter.sendMail(requesterMailOptions)
    ]);

    logger.info('Pool request emails sent', {
      poolName,
      requesterEmail,
      poolOwnerEmail,
      requestType,
      messageIds: [ownerResult.messageId, requesterResult.messageId]
    });

    res.status(200).json({
      success: true,
      message: 'Pool request emails sent successfully',
      messageIds: [ownerResult.messageId, requesterResult.messageId]
    });

  } catch (error) {
    logger.error('Failed to send pool request emails', error);
    res.status(500).json({
      error: 'Failed to send pool request emails',
      message: error.message
    });
  }
});

// Route: Send service request (guide/driver/hotel)
router.post('/service-request', async (req, res) => {
  try {
    const { error, value } = serviceRequestSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        error: 'Validation Error',
        details: error.details[0].message
      });
    }

    const { requestorEmail, requestorName, serviceProviderEmail, serviceProviderName, serviceType, location, dates, message, budget } = value;
    const transporter = createTransporter();

    const serviceTypeDisplayNames = {
      guide: 'Tour Guide',
      driver: 'Driver',
      hotel: 'Hotel'
    };

    // Email to service provider
    const providerMailOptions = {
      from: process.env.EMAIL_FROM || process.env.EMAIL_USER,
      to: serviceProviderEmail,
      subject: `New ${serviceTypeDisplayNames[serviceType]} Service Request`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #2563eb;">New Service Request</h2>
          <p>Hello ${serviceProviderName},</p>
          <p>You have received a new ${serviceTypeDisplayNames[serviceType]} service request from <strong>${requestorName}</strong>.</p>
          
          <div style="background-color: #f8fafc; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="margin-top: 0;">Request Details:</h3>
            <p><strong>Client:</strong> ${requestorName}</p>
            <p><strong>Email:</strong> ${requestorEmail}</p>
            <p><strong>Service Type:</strong> ${serviceTypeDisplayNames[serviceType]}</p>
            <p><strong>Location:</strong> ${location}</p>
            <p><strong>Dates:</strong> ${dates}</p>
            ${budget ? `<p><strong>Budget:</strong> ${budget}</p>` : ''}
            <p><strong>Message:</strong><br>${message.replace(/\n/g, '<br>')}</p>
          </div>

          <p>Please log in to your IslandHop account to review and respond to this request.</p>
          <p>Best regards,<br>The IslandHop Team</p>
        </div>
      `,
      replyTo: requestorEmail
    };

    // Email confirmation to requestor
    const requestorMailOptions = {
      from: process.env.EMAIL_FROM || process.env.EMAIL_USER,
      to: requestorEmail,
      subject: `Service Request Submitted - ${serviceTypeDisplayNames[serviceType]}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #2563eb;">Service Request Submitted</h2>
          <p>Hello ${requestorName},</p>
          <p>Your ${serviceTypeDisplayNames[serviceType]} service request has been submitted successfully to <strong>${serviceProviderName}</strong>.</p>
          
          <div style="background-color: #f8fafc; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="margin-top: 0;">Request Summary:</h3>
            <p><strong>Service Provider:</strong> ${serviceProviderName}</p>
            <p><strong>Service Type:</strong> ${serviceTypeDisplayNames[serviceType]}</p>
            <p><strong>Location:</strong> ${location}</p>
            <p><strong>Dates:</strong> ${dates}</p>
          </div>

          <p>You will receive a notification once the service provider responds to your request.</p>
          <p>Best regards,<br>The IslandHop Team</p>
        </div>
      `
    };

    const [providerResult, requestorResult] = await Promise.all([
      transporter.sendMail(providerMailOptions),
      transporter.sendMail(requestorMailOptions)
    ]);

    logger.info('Service request emails sent', {
      serviceType,
      requestorEmail,
      serviceProviderEmail,
      location,
      messageIds: [providerResult.messageId, requestorResult.messageId]
    });

    res.status(200).json({
      success: true,
      message: 'Service request emails sent successfully',
      messageIds: [providerResult.messageId, requestorResult.messageId]
    });

  } catch (error) {
    logger.error('Failed to send service request emails', error);
    res.status(500).json({
      error: 'Failed to send service request emails',
      message: error.message
    });
  }
});

// Route: Send lost item report
router.post('/lost-item', async (req, res) => {
  try {
    const { error, value } = lostItemSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        error: 'Validation Error',
        details: error.details[0].message
      });
    }

    const { reporterEmail, reporterName, itemDescription, locationLost, dateLost, contactPhone, rewardOffered, adminEmail } = value;
    const transporter = createTransporter();

    // Email to admin/support team
    const adminMailOptions = {
      from: process.env.EMAIL_FROM || process.env.EMAIL_USER,
      to: adminEmail || process.env.CONTACT_EMAIL || process.env.EMAIL_USER,
      subject: `Lost Item Report - ${itemDescription}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #dc2626;">Lost Item Report</h2>
          <p>A new lost item has been reported on IslandHop.</p>
          
          <div style="background-color: #fef2f2; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #dc2626;">
            <h3 style="margin-top: 0; color: #dc2626;">Item Details:</h3>
            <p><strong>Reporter:</strong> ${reporterName}</p>
            <p><strong>Email:</strong> ${reporterEmail}</p>
            ${contactPhone ? `<p><strong>Phone:</strong> ${contactPhone}</p>` : ''}
            <p><strong>Item Description:</strong> ${itemDescription}</p>
            <p><strong>Location Lost:</strong> ${locationLost}</p>
            <p><strong>Date Lost:</strong> ${dateLost}</p>
            ${rewardOffered ? `<p><strong>Reward Offered:</strong> ${rewardOffered}</p>` : ''}
            <p><strong>Report Time:</strong> ${new Date().toLocaleString()}</p>
          </div>

          <p>Please take appropriate action to help locate this item and contact the reporter if found.</p>
          <p>IslandHop Lost Item System</p>
        </div>
      `,
      replyTo: reporterEmail
    };

    // Confirmation email to reporter
    const reporterMailOptions = {
      from: process.env.EMAIL_FROM || process.env.EMAIL_USER,
      to: reporterEmail,
      subject: `Lost Item Report Submitted - ${itemDescription}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #2563eb;">Lost Item Report Submitted</h2>
          <p>Hello ${reporterName},</p>
          <p>Your lost item report has been submitted successfully. Our team will review it and help you locate your item.</p>
          
          <div style="background-color: #f8fafc; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="margin-top: 0;">Report Summary:</h3>
            <p><strong>Item:</strong> ${itemDescription}</p>
            <p><strong>Location Lost:</strong> ${locationLost}</p>
            <p><strong>Date Lost:</strong> ${dateLost}</p>
            ${rewardOffered ? `<p><strong>Reward Offered:</strong> ${rewardOffered}</p>` : ''}
            <p><strong>Report ID:</strong> ${Date.now()}-${Math.random().toString(36).substr(2, 9)}</p>
          </div>

          <div style="background-color: #fef3c7; padding: 15px; border-radius: 8px; margin: 20px 0;">
            <p style="margin: 0;"><strong>What happens next?</strong></p>
            <ul style="margin: 10px 0 0 0;">
              <li>Our team will review your report</li>
              <li>We'll contact local guides and drivers</li>
              <li>We'll post alerts in relevant areas</li>
              <li>You'll be notified if your item is found</li>
            </ul>
          </div>

          <p>We'll keep you updated on any developments. Thank you for using IslandHop's lost item service.</p>
          <p>Best regards,<br>The IslandHop Team</p>
        </div>
      `
    };

    const [adminResult, reporterResult] = await Promise.all([
      transporter.sendMail(adminMailOptions),
      transporter.sendMail(reporterMailOptions)
    ]);

    logger.info('Lost item report emails sent', {
      reporterEmail,
      itemDescription,
      locationLost,
      messageIds: [adminResult.messageId, reporterResult.messageId]
    });

    res.status(200).json({
      success: true,
      message: 'Lost item report emails sent successfully',
      messageIds: [adminResult.messageId, reporterResult.messageId],
      reportId: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    });

  } catch (error) {
    logger.error('Failed to send lost item report emails', error);
    res.status(500).json({
      error: 'Failed to send lost item report emails',
      message: error.message
    });
  }
});

// Route: Test email configuration
router.get('/test', async (req, res) => {
  try {
    const transporter = createTransporter();
    await transporter.verify();

    res.status(200).json({
      success: true,
      message: 'Email configuration is valid'
    });

  } catch (error) {
    logger.error('Email configuration test failed', error);
    res.status(500).json({
      error: 'Email configuration test failed',
      message: error.message
    });
  }
});

module.exports = router;
