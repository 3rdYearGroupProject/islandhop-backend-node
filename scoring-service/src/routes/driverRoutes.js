const express = require('express');
const router = express.Router();
const { requestDriver, requestDriverExcept } = require('../controllers/driverController');

console.log('[DRIVER ROUTES] Driver routes module loaded');

router.post('/request-driver', (req, res, next) => {
  console.log('[DRIVER ROUTES] POST /request-driver endpoint hit');
  requestDriver(req, res, next);
});

router.post('/request-driver-except', (req, res, next) => {
  console.log('[DRIVER ROUTES] POST /request-driver-except endpoint hit');
  requestDriverExcept(req, res, next);
});

console.log('[DRIVER ROUTES] Driver routes configured');

module.exports = router;
