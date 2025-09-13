const express = require('express');
const router = express.Router();
const guideSyncController = require('../controllers/guideSyncController');

// Guide sync routes
router.get('/status', guideSyncController.getGuideSyncStatus);
router.post('/manual-sync', guideSyncController.triggerManualGuideSync);
router.get('/payments', guideSyncController.getAllGuidePayments);

module.exports = router;