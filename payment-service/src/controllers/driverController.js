const Driver = require('../models/driver');
const path = require('path');

const driverController = {
  // POST /driver - Create a new driver entry
  createDriver: async (req, res) => {
    try {
      const { tripId, driverEmail, cost } = req.body;

      // Validation
      if (!tripId || !driverEmail || cost === undefined || cost === null) {
        return res.status(400).json({
          success: false,
          error: 'tripId, driverEmail, and cost are required'
        });
      }

      if (typeof cost !== 'number' || cost < 0) {
        return res.status(400).json({
          success: false,
          error: 'cost must be a non-negative number'
        });
      }

      // Check if driver entry already exists for this tripId
      const existingDriver = await Driver.findOne({ tripId });
      if (existingDriver) {
        return res.status(409).json({
          success: false,
          error: 'Driver entry already exists for this tripId'
        });
      }

      // Create new driver entry
      const driver = new Driver({
        tripId,
        driverEmail: driverEmail.toLowerCase().trim(),
        cost,
        paid: 0
      });

      await driver.save();

      res.status(201).json({
        success: true,
        message: 'Driver entry created successfully',
        data: driver
      });
    } catch (error) {
      console.error('Error creating driver entry:', error);
      
      if (error.code === 11000) {
        return res.status(409).json({
          success: false,
          error: 'Driver entry already exists for this tripId'
        });
      }

      res.status(500).json({
        success: false,
        error: 'Failed to create driver entry',
        message: error.message
      });
    }
  },

  // PUT /driver/pay/:tripId - Update driver payment status with evidence
  payDriver: async (req, res) => {
    try {
      const { tripId } = req.params;

      if (!tripId) {
        return res.status(400).json({
          success: false,
          error: 'tripId is required'
        });
      }

      // Check if file was uploaded
      if (!req.file) {
        return res.status(400).json({
          success: false,
          error: 'Evidence file is required'
        });
      }

      // Find driver entry
      const driver = await Driver.findOne({ tripId });
      if (!driver) {
        return res.status(404).json({
          success: false,
          error: 'Driver entry not found for this tripId'
        });
      }

      // Update driver payment status and evidence
      const evidenceUrl = `/uploads/${req.file.filename}`;
      driver.paid = 1;
      driver.evidence = evidenceUrl;
      await driver.save();

      res.status(200).json({
        success: true,
        message: 'Driver payment updated successfully',
        data: driver
      });
    } catch (error) {
      console.error('Error updating driver payment:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to update driver payment',
        message: error.message
      });
    }
  },

  // GET /driver/:tripId - Get driver details by tripId
  getDriverByTripId: async (req, res) => {
    try {
      const { tripId } = req.params;

      const driver = await Driver.findOne({ tripId });
      if (!driver) {
        return res.status(404).json({
          success: false,
          error: 'Driver entry not found for this tripId'
        });
      }

      res.status(200).json({
        success: true,
        data: driver
      });
    } catch (error) {
      console.error('Error getting driver:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to retrieve driver',
        message: error.message
      });
    }
  },

  // GET /driver - Get all drivers
  getAllDrivers: async (req, res) => {
    try {
      const { paid } = req.query;
      let filter = {};
      
      if (paid !== undefined) {
        filter.paid = parseInt(paid);
      }

      const drivers = await Driver.find(filter).sort({ createdAt: -1 });

      res.status(200).json({
        success: true,
        count: drivers.length,
        data: drivers
      });
    } catch (error) {
      console.error('Error getting drivers:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to retrieve drivers',
        message: error.message
      });
    }
  }
};

module.exports = driverController;
