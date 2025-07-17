const express = require('express');
const Joi = require('joi');

module.exports = (pool, logger) => {
  const router = express.Router();

  // Validation schema
  const certificateSchema = Joi.object({
    email: Joi.string().email().max(100).required(),
    certificate_issuer: Joi.string().max(100).required(),
    issue_date: Joi.date().required(),
    expiry_date: Joi.date().required(),
    verification_number: Joi.string().max(50).required(),
    certificate_picture: Joi.string().base64().required(),
    status: Joi.string().valid('PENDING', 'APPROVED', 'REJECTED').optional()
  });

  // Log operation to log.txt
  const logOperation = (message) => {
    const timestamp = new Date().toISOString();
    logger.info(`${timestamp} - ${message}`);
  };

  // POST /guides/certificates
  router.post('/', async (req, res, next) => {
    try {
      const { error, value } = certificateSchema.validate(req.body);
      if (error) {
        logOperation(`Validation error: ${error.details[0].message}`);
        return res.status(400).json({ error: error.details[0].message });
      }
      const {
        email, certificate_issuer, issue_date, expiry_date,
        verification_number, certificate_picture, status
      } = value;
      const result = await pool.query(
        `INSERT INTO guide_certificates
        (email, certificate_issuer, issue_date, expiry_date, verification_number, certificate_picture, status)
        VALUES ($1, $2, $3, $4, $5, decode($6, 'base64'), $7)
        RETURNING *`,
        [email, certificate_issuer, issue_date, expiry_date, verification_number, certificate_picture, status || 'PENDING']
      );
      logOperation(`Guide certificate added: ${JSON.stringify(result.rows[0])}`);
      res.status(201).json(result.rows[0]);
    } catch (err) {
      logOperation(`Error adding guide certificate: ${err.message}`);
      logger.error(err);
      next(err);
    }
  });

  // GET /guides/certificates
  router.get('/', async (req, res, next) => {
    try {
      const { status } = req.query;
      let query = 'SELECT * FROM guide_certificates';
      let params = [];
      if (status) {
        query += ' WHERE status = $1';
        params.push(status); // Ensure status is passed as a parameter
      }
      const result = await pool.query(query, params);

      // Convert certificate_picture to base64 string
      const certificates = result.rows.map((row) => {
        if (row.certificate_picture) {
          row.certificate_picture = row.certificate_picture.toString('base64');
        }
        return row;
      });

      logOperation(`Fetched guide certificates with status: ${status || 'ALL'}`);
      res.json(certificates);
    } catch (err) {
      logOperation(`Error fetching guide certificates: ${err.message}`);
      logger.error(err);
      next(err);
    }
  });

  // PUT /guides/certificates/:id
  router.put('/:id', async (req, res, next) => {
    try {
      const { status, certificate_issuer, issue_date, expiry_date } = req.body;

      if (!['PENDING', 'APPROVED', 'REJECTED'].includes(status)) {
        return res.status(400).json({ error: 'Invalid status' });
      }

      const { id } = req.params;
      const result = await pool.query(
        `UPDATE guide_certificates 
         SET status = $1, certificate_issuer = $2, issue_date = $3, expiry_date = $4, updated_at = NOW() 
         WHERE id = $5 RETURNING *`,
        [status, certificate_issuer, issue_date, expiry_date, id]
      );

      if (result.rowCount === 0) return res.status(404).json({ error: 'Certificate not found' });

      res.json(result.rows[0]);
    } catch (err) {
      logger.error(err);
      next(err);
    }
  });

  return router;
};
