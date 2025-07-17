const express = require('express');
const Joi = require('joi');

module.exports = (pool, logger) => {
  const router = express.Router();

  // Validation schema
  const driverSchema = Joi.object({
    accept_partial_trips: Joi.number().integer().optional(),
    address: Joi.string().max(255).optional(),
    auto_accept_trips: Joi.number().integer().optional(),
    date_of_birth: Joi.date().required(),
    driving_license_expiry_date: Joi.date().optional(),
    driving_license_image: Joi.string().optional(),
    driving_license_number: Joi.string().max(255).optional(),
    driving_license_uploaded_date: Joi.date().optional(),
    driving_license_verified: Joi.number().integer().optional(),
    email: Joi.string().email().max(255).required(),
    emergency_contact_name: Joi.string().max(255).optional(),
    emergency_contact_number: Joi.string().max(255).optional(),
    first_name: Joi.string().max(255).optional(),
    last_name: Joi.string().max(255).optional(),
    maximum_trip_distance: Joi.number().integer().optional(),
    number_of_reviews: Joi.number().integer().optional(),
    phone_number: Joi.string().max(255).optional(),
    profile_completion: Joi.number().integer().optional(),
    profile_picture_url: Joi.string().optional(),
    rating: Joi.number().optional(),
    sltda_license_expiry_date: Joi.date().optional(),
    sltda_license_image: Joi.string().optional(),
    sltda_license_number: Joi.string().max(255).optional(),
    sltda_license_uploaded_date: Joi.date().optional(),
    sltda_license_verified: Joi.number().integer().optional(),
    total_completed_trips: Joi.number().integer().optional(),
    ac_available: Joi.string().max(255).optional(),
    body_type: Joi.string().max(255).optional(),
    contact_number: Joi.string().max(255).optional(),
    full_name: Joi.string().max(255).optional(),
    nic_passport: Joi.string().max(255).optional(),
    number_of_seats: Joi.number().integer().optional(),
    vehicle_number: Joi.string().max(255).optional(),
    vehicle_type: Joi.string().max(255).optional()
  });

  // Log operation to file
  const logOperation = (message) => {
    const timestamp = new Date().toISOString();
    const logMessage = `${timestamp} - ${message}\n`;
    require('fs').appendFile('log.txt', logMessage, (err) => {
      if (err) console.error('Error writing to log file', err);
    });
  };

  // POST /drivers
  router.post('/', async (req, res, next) => {
    try {
      const { error, value } = driverSchema.validate(req.body);
      if (error) {
        logOperation(`Validation error: ${error.details[0].message}`);
        return res.status(400).json({ error: error.details[0].message });
      }
      const fields = Object.keys(value);
      const values = Object.values(value);
      const placeholders = fields.map((_, i) => `$${i + 1}`);
      const query = `INSERT INTO driver_profiles (${fields.join(',')}) VALUES (${placeholders.join(',')}) RETURNING *`;
      const result = await pool.query(query, values);
      logOperation(`Driver added: ${JSON.stringify(result.rows[0])}`);
      res.status(201).json(result.rows[0]);
    } catch (err) {
      if (err.code === '23505') {
        logOperation(`Error adding driver: Email already exists`);
        return res.status(409).json({ error: 'Email already exists' });
      }
      logOperation(`Error adding driver: ${err.message}`);
      logger.error(err);
      next(err);
    }
  });

  // GET /drivers
  router.get('/', async (req, res, next) => {
    try {
      const filters = [];
      const params = [];
      let idx = 1;
      for (const key in req.query) {
        filters.push(`${key} = $${idx++}`);
        params.push(req.query[key]);
      }
      let query = 'SELECT * FROM driver_profiles';
      if (filters.length) query += ' WHERE ' + filters.join(' AND ');
      const result = await pool.query(query, params);
      logOperation(`Fetched drivers with filters: ${JSON.stringify(req.query)}`);
      res.json(result.rows);
    } catch (err) {
      logOperation(`Error fetching drivers: ${err.message}`);
      logger.error(err);
      next(err);
    }
  });

  // PUT /drivers/:id
  router.put('/:id', async (req, res, next) => {
    try {
      const { error, value } = driverSchema.min(1).validate(req.body);
      if (error) return res.status(400).json({ error: error.details[0].message });
      const fields = Object.keys(value);
      const values = Object.values(value);
      if (!fields.length) return res.status(400).json({ error: 'No fields to update' });
      const setClause = fields.map((f, i) => `${f} = $${i + 1}`).join(', ');
      const query = `UPDATE driver_profiles SET ${setClause}, updated_at = NOW() WHERE id = $${fields.length + 1} RETURNING *`;
      values.push(req.params.id);
      const result = await pool.query(query, values);
      if (result.rowCount === 0) return res.status(404).json({ error: 'Driver not found' });
      res.json(result.rows[0]);
    } catch (err) {
      logger.error(err);
      next(err);
    }
  });

  return router;
};
