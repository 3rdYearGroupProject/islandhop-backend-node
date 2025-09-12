const express = require('express');
const router = express.Router();
const tripSyncController = require('../controllers/tripSyncController');

// Trip sync service routes
router.post('/initialize', tripSyncController.initializeService);
router.post('/start', tripSyncController.startMonitoring);
router.post('/stop', tripSyncController.stopMonitoring);
router.get('/status', tripSyncController.getStatus);
router.post('/sync-now', tripSyncController.manualSync);
router.get('/stats', tripSyncController.getSyncStats);

module.exports = router;