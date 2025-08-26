const express = require('express');
const router = express.Router();
const { requestDriver } = require('../controllers/driverController');

console.log('[DRIVER ROUTES] Driver routes module loaded');

router.post('/request-driver', (req, res, next) => {
  console.log('[DRIVER ROUTES] POST /request-driver endpoint hit');
  requestDriver(req, res, next);
});

console.log('[DRIVER ROUTES] Driver routes configured');

module.exports = router;
