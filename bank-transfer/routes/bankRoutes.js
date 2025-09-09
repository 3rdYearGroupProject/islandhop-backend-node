const express = require('express');
const router = express.Router();
const {
  addBankDetails,
  updateBankDetails,
  getBankDetails
} = require('../controllers/bankController');

// POST /bank/add - Add new bank details
router.post('/add', addBankDetails);

// PUT /bank/update/:email - Update bank details by email
router.put('/update/:email', updateBankDetails);

// GET /bank/:email - Get bank details by email
router.get('/:email', getBankDetails);

module.exports = router;
