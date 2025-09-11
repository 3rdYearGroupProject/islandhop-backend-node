const Charges = require('../models/charges');

const chargesController = {
  // GET /charges - Get current charges
  getCharges: async (req, res) => {
    try {
      const charges = await Charges.getSingleton();
      res.status(200).json({
        success: true,
        data: {
          driverDailyCharge: charges.driverDailyCharge,
          guideDailyCharge: charges.guideDailyCharge,
          systemChargePercentage: charges.systemChargePercentage
        }
      });
    } catch (error) {
      console.error('Error getting charges:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to retrieve charges',
        message: error.message
      });
    }
  },

  // PUT /charges/driver - Update driver daily charge
  updateDriverCharge: async (req, res) => {
    try {
      const { driverDailyCharge } = req.body;

      if (driverDailyCharge === undefined || driverDailyCharge === null) {
        return res.status(400).json({
          success: false,
          error: 'driverDailyCharge is required'
        });
      }

      if (typeof driverDailyCharge !== 'number' || driverDailyCharge < 0) {
        return res.status(400).json({
          success: false,
          error: 'driverDailyCharge must be a non-negative number'
        });
      }

      const charges = await Charges.updateSingleton({ driverDailyCharge });
      
      res.status(200).json({
        success: true,
        message: 'Driver daily charge updated successfully',
        data: charges
      });
    } catch (error) {
      console.error('Error updating driver charge:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to update driver charge',
        message: error.message
      });
    }
  },

  // PUT /charges/guide - Update guide daily charge
  updateGuideCharge: async (req, res) => {
    try {
      const { guideDailyCharge } = req.body;

      if (guideDailyCharge === undefined || guideDailyCharge === null) {
        return res.status(400).json({
          success: false,
          error: 'guideDailyCharge is required'
        });
      }

      if (typeof guideDailyCharge !== 'number' || guideDailyCharge < 0) {
        return res.status(400).json({
          success: false,
          error: 'guideDailyCharge must be a non-negative number'
        });
      }

      const charges = await Charges.updateSingleton({ guideDailyCharge });
      
      res.status(200).json({
        success: true,
        message: 'Guide daily charge updated successfully',
        data: charges
      });
    } catch (error) {
      console.error('Error updating guide charge:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to update guide charge',
        message: error.message
      });
    }
  },

  // PUT /charges/system - Update system charge percentage
  updateSystemCharge: async (req, res) => {
    try {
      const { systemChargePercentage } = req.body;

      if (systemChargePercentage === undefined || systemChargePercentage === null) {
        return res.status(400).json({
          success: false,
          error: 'systemChargePercentage is required'
        });
      }

      if (typeof systemChargePercentage !== 'number' || systemChargePercentage < 0 || systemChargePercentage > 100) {
        return res.status(400).json({
          success: false,
          error: 'systemChargePercentage must be a number between 0 and 100'
        });
      }

      const charges = await Charges.updateSingleton({ systemChargePercentage });
      
      res.status(200).json({
        success: true,
        message: 'System charge percentage updated successfully',
        data: charges
      });
    } catch (error) {
      console.error('Error updating system charge:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to update system charge',
        message: error.message
      });
    }
  }
};

module.exports = chargesController;
