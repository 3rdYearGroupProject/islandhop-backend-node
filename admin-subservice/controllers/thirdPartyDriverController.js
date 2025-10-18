const mongoose = require("mongoose");

const driversDb = mongoose.createConnection(
  process.env.MONGODB_URI.replace(/\/[^\/]*$/, "/For_Drivers")
);

// Define schema for third_party_drivers collection
const thirdPartyDriverSchema = new mongoose.Schema({
  // Add your schema fields here based on your collection structure
  companyName: String,
  companyEmail: String,
  contactNumber1: String,
  contactNumber2: String,
  district: String
}, {
  timestamps: true
});

// Create model for third_party_drivers collection
const ThirdPartyDriver = driversDb.model('ThirdPartyDriver', thirdPartyDriverSchema, 'third_party_drivers');

// Controller functions
const thirdPartyDriverController = {
  // Get all third party drivers
  getAllDrivers: async (req, res) => {
    try {
      console.log('📋 Fetching all third party drivers');
      
      const drivers = await ThirdPartyDriver.find({}).sort({ createdAt: -1 });
      
      console.log(`Found ${drivers.length} third party drivers`);
      
      res.json({
        success: true,
        message: `Found ${drivers.length} third party drivers`,
        data: drivers,
        count: drivers.length
      });
    } catch (error) {
      console.error('Error fetching third party drivers:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch third party drivers',
        message: error.message
      });
    }
  },

  // Get driver by ID
  getDriverById: async (req, res) => {
    try {
      const { id } = req.params;
      console.log(`🔍 Fetching third party driver with ID: ${id}`);
      
      const driver = await ThirdPartyDriver.findById(id);
      
      if (!driver) {
        return res.status(404).json({
          success: false,
          error: 'Driver not found'
        });
      }
      
      res.json({
        success: true,
        data: driver
      });
    } catch (error) {
      console.error('Error fetching driver by ID:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch driver',
        message: error.message
      });
    }
  },

  // Create new third party driver
  createDriver: async (req, res) => {
    try {
      console.log('➕ Creating new third party driver');
      
      const newCompany = new ThirdPartyDriver(req.body);
      const savedDriver = await newCompany.save();

      console.log(`✅ Third party driver created with ID: ${savedDriver._id}`);
      
      res.status(201).json({
        success: true,
        message: 'Third party driver created successfully',
        data: savedDriver
      });
    } catch (error) {
      console.error('Error creating third party driver:', error);
      res.status(400).json({
        success: false,
        error: 'Failed to create driver',
        message: error.message
      });
    }
  },

  // Update third party driver
  updateDriver: async (req, res) => {
    try {
      const { id } = req.params;
      console.log(`🔄 Updating third party driver with ID: ${id}`);
      
      const updatedDriver = await ThirdPartyDriver.findByIdAndUpdate(
        id,
        { ...req.body, updatedAt: new Date() },
        { new: true, runValidators: true }
      );
      
      if (!updatedDriver) {
        return res.status(404).json({
          success: false,
          error: 'Driver not found'
        });
      }
      
      console.log(`✅ Third party driver updated: ${updatedDriver._id}`);
      
      res.json({
        success: true,
        message: 'Third party driver updated successfully',
        data: updatedDriver
      });
    } catch (error) {
      console.error('Error updating third party driver:', error);
      res.status(400).json({
        success: false,
        error: 'Failed to update driver',
        message: error.message
      });
    }
  },

  // Delete third party driver
  deleteDriver: async (req, res) => {
    try {
      const { id } = req.params;
      console.log(`🗑️ Deleting third party driver with ID: ${id}`);
      
      const deletedDriver = await ThirdPartyDriver.findByIdAndDelete(id);
      
      if (!deletedDriver) {
        return res.status(404).json({
          success: false,
          error: 'Driver not found'
        });
      }
      
      console.log(`✅ Third party driver deleted: ${deletedDriver._id}`);
      
      res.json({
        success: true,
        message: 'Third party driver deleted successfully',
        data: deletedDriver
      });
    } catch (error) {
      console.error('Error deleting third party driver:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to delete driver',
        message: error.message
      });
    }
  }
};

module.exports = thirdPartyDriverController;