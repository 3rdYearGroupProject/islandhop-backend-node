const BankDetails = require('../models/BankDetails');

// Add new bank details
const addBankDetails = async (req, res) => {
  try {
    const { email, accountHolderName, bankName, accountNumber, branchCode, branchName } = req.body;

    // Validate required fields
    if (!email || !accountHolderName || !bankName || !accountNumber || !branchCode || !branchName) {
      return res.status(400).json({
        success: false,
        message: 'All fields are required: email, accountHolderName, bankName, accountNumber, branchCode, branchName'
      });
    }

    // Check if email already exists
    const existingBankDetails = await BankDetails.findOne({ email });
    if (existingBankDetails) {
      return res.status(409).json({
        success: false,
        message: 'Bank details for this email already exist'
      });
    }

    // Create new bank details
    const newBankDetails = new BankDetails({
      email,
      accountHolderName,
      bankName,
      accountNumber,
      branchCode,
      branchName
    });

    const savedBankDetails = await newBankDetails.save();

    res.status(201).json({
      success: true,
      message: 'Bank details added successfully',
      data: savedBankDetails
    });

  } catch (error) {
    console.error('Error adding bank details:', error);
    
    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: 'Email already exists'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

// Update bank details by email
const updateBankDetails = async (req, res) => {
  try {
    const { email } = req.params;
    const { accountHolderName, bankName, accountNumber, branchCode, branchName } = req.body;

    // Validate email parameter
    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Email parameter is required'
      });
    }

    // Find and update bank details
    const updatedBankDetails = await BankDetails.findOneAndUpdate(
      { email },
      {
        ...(accountHolderName && { accountHolderName }),
        ...(bankName && { bankName }),
        ...(accountNumber && { accountNumber }),
        ...(branchCode && { branchCode }),
        ...(branchName && { branchName })
      },
      { new: true, runValidators: true }
    );

    if (!updatedBankDetails) {
      return res.status(404).json({
        success: false,
        message: 'Bank details not found for the given email'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Bank details updated successfully',
      data: updatedBankDetails
    });

  } catch (error) {
    console.error('Error updating bank details:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

// Get bank details by email
const getBankDetails = async (req, res) => {
  try {
    const { email } = req.params;

    // Validate email parameter
    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Email parameter is required'
      });
    }

    // Find bank details
    const bankDetails = await BankDetails.findOne({ email });

    if (!bankDetails) {
      return res.status(404).json({
        success: false,
        message: 'Bank details not found for the given email'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Bank details retrieved successfully',
      data: bankDetails
    });

  } catch (error) {
    console.error('Error retrieving bank details:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

module.exports = {
  addBankDetails,
  updateBankDetails,
  getBankDetails
};
