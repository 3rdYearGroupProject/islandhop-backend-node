const express = require('express');
const router = express.Router();
const healthController = require('../controllers/healthController');

// Health check endpoints
router.get('/', healthController.checkHealth);
router.get('/ready', healthController.checkReady);
router.get('/live', healthController.checkLive);
router.get('/stats', healthController.getStats);

module.exports = router;