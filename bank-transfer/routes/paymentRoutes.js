const express = require('express');
const router = express.Router();
const upload = require('../middleware/upload');
const {
  updatePaymentStatus,
  getPaymentDetails,
  getAllPayments
} = require('../controllers/paymentController');

// POST /payment/update/:role/:tripId - Update payment status with evidence
router.post('/update/:role/:tripId', upload.single('evidence'), updatePaymentStatus);

// GET /payment/:role/:tripId - Get payment details by role and tripId
router.get('/:role/:tripId', getPaymentDetails);

// GET /payment/:role - Get all payments for a specific role
router.get('/:role', getAllPayments);

module.exports = router;
