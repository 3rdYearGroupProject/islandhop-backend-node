const express = require('express');
const router = express.Router();
const { requestDriver } = require('../controllers/driverController');

router.post('/request-driver', requestDriver);

module.exports = router;
