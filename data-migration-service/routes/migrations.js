const express = require('express');
const router = express.Router();
const migrationController = require('../controllers/migrationController');
const seedController = require('../controllers/seedController');

// Collection management routes
router.get('/collections', migrationController.listCollections);
router.get('/collections/:collectionName/count', migrationController.getCollectionCount);
router.get('/collections/:collectionName/sample', migrationController.getSampleData);
router.post('/collections/:collectionName/validate', migrationController.validateCollection);

// Migration operation routes
router.post('/copy', migrationController.copyData);
router.post('/sync', migrationController.syncData);
router.post('/backup', migrationController.backupCollection);
router.post('/restore', migrationController.restoreCollection);

// Migration tracking routes
router.get('/', migrationController.listMigrations);
router.get('/:migrationId', migrationController.getMigrationStatus);
router.delete('/:migrationId', migrationController.deleteMigration);

// Scheduled migration routes
router.get('/schedules', migrationController.listSchedules);
router.post('/schedules', migrationController.createSchedule);
router.delete('/schedules/:scheduleId', migrationController.deleteSchedule);

// Data seeding routes
router.post('/seed/driver-data', seedController.seedDriverData);
router.post('/seed/guide-data', seedController.seedGuideData);
router.post('/seed/clear-collection', seedController.clearCollection);

module.exports = router;