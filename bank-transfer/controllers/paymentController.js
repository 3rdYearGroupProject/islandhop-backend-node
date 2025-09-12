const { DriversPayment, GuidesPayment } = require('../models/Payment');
const path = require('path');

// Update payment status with evidence
const updatePaymentStatus = async (req, res) => {
  try {
    const { role, tripId } = req.params;

    // Validate role parameter
    if (!['drivers', 'guides'].includes(role)) {
      return res.status(400).json({
        success: false,
        message: 'Role must be either "drivers" or "guides"'
      });
    }

    // Validate tripId parameter
    if (!tripId) {
      return res.status(400).json({
        success: false,
        message: 'Trip ID is required'
      });
    }

    // Check if evidence file was uploaded
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'Evidence image is required'
      });
    }

    // Select the appropriate model based on role
    const PaymentModel = role === 'drivers' ? DriversPayment : GuidesPayment;

    // Find the payment record by tripId
    const paymentRecord = await PaymentModel.findOne({ tripId });

    if (!paymentRecord) {
      return res.status(404).json({
        success: false,
        message: `Payment record not found for trip ID: ${tripId} in ${role} collection`
      });
    }

    // Update the payment record
    const evidencePath = `/uploads/${req.file.filename}`;
    const updatedPayment = await PaymentModel.findOneAndUpdate(
      { tripId },
      {
        paid: 1,
        evidence: evidencePath,
        updatedAt: new Date()
      },
      { new: true }
    );

    res.status(200).json({
      success: true,
      message: 'Payment status updated successfully',
      data: {
        tripId: updatedPayment.tripId,
        driverEmail: updatedPayment.driverEmail,
        cost: updatedPayment.cost,
        paid: updatedPayment.paid,
        evidence: updatedPayment.evidence,
        updatedAt: updatedPayment.updatedAt
      }
    });

  } catch (error) {
    console.error('Error updating payment status:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

// Get payment details by tripId and role
const getPaymentDetails = async (req, res) => {
  try {
    const { role, tripId } = req.params;

    // Validate role parameter
    if (!['drivers', 'guides'].includes(role)) {
      return res.status(400).json({
        success: false,
        message: 'Role must be either "drivers" or "guides"'
      });
    }

    // Validate tripId parameter
    if (!tripId) {
      return res.status(400).json({
        success: false,
        message: 'Trip ID is required'
      });
    }

    // Select the appropriate model based on role
    const PaymentModel = role === 'drivers' ? DriversPayment : GuidesPayment;

    // Find the payment record
    const paymentRecord = await PaymentModel.findOne({ tripId });

    if (!paymentRecord) {
      return res.status(404).json({
        success: false,
        message: `Payment record not found for trip ID: ${tripId} in ${role} collection`
      });
    }

    res.status(200).json({
      success: true,
      message: 'Payment details retrieved successfully',
      data: paymentRecord
    });

  } catch (error) {
    console.error('Error retrieving payment details:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

// Get all payments for a specific role
const getAllPayments = async (req, res) => {
  try {
    const { role } = req.params;

    // Validate role parameter
    if (!['drivers', 'guides'].includes(role)) {
      return res.status(400).json({
        success: false,
        message: 'Role must be either "drivers" or "guides"'
      });
    }

    // Select the appropriate model based on role
    const PaymentModel = role === 'drivers' ? DriversPayment : GuidesPayment;

    // Get all payment records
    const payments = await PaymentModel.find({}).sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      message: `All ${role} payments retrieved successfully`,
      count: payments.length,
      data: payments
    });

  } catch (error) {
    console.error('Error retrieving all payments:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

module.exports = {
  updatePaymentStatus,
  getPaymentDetails,
  getAllPayments
};
