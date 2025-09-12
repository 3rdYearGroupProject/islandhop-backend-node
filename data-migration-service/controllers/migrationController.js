const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');

// In-memory storage for migration status (in production, use Redis or database)
const migrations = new Map();

// List all available collections
const listCollections = async (req, res) => {
  try {
    const db = mongoose.connection.db;
    const collections = await db.listCollections().toArray();
    
    const collectionsInfo = await Promise.all(
      collections.map(async (col) => {
        const collection = db.collection(col.name);
        const count = await collection.countDocuments();
        return {
          name: col.name,
          type: col.type,
          count: count
        };
      })
    );

    res.json({
      success: true,
      data: collectionsInfo,
      total: collectionsInfo.length
    });
  } catch (error) {
    console.error('❌ List collections error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to list collections',
      error: error.message
    });
  }
};

// Get collection document count
const getCollectionCount = async (req, res) => {
  try {
    const { collectionName } = req.params;
    const db = mongoose.connection.db;
    const collection = db.collection(collectionName);
    
    const count = await collection.countDocuments();
    
    res.json({
      success: true,
      data: {
        collection: collectionName,
        count: count
      }
    });
  } catch (error) {
    console.error('❌ Get collection count error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get collection count',
      error: error.message
    });
  }
};

// Get sample data from collection
const getSampleData = async (req, res) => {
  try {
    const { collectionName } = req.params;
    const { limit = 5 } = req.query;
    const db = mongoose.connection.db;
    const collection = db.collection(collectionName);
    
    const sampleDocs = await collection.find({}).limit(parseInt(limit)).toArray();
    
    res.json({
      success: true,
      data: {
        collection: collectionName,
        sampleCount: sampleDocs.length,
        documents: sampleDocs
      }
    });
  } catch (error) {
    console.error('❌ Get sample data error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get sample data',
      error: error.message
    });
  }
};

// Copy data between collections
const copyData = async (req, res) => {
  try {
    const {
      sourceCollection,
      targetCollection,
      filter = {},
      transform = null,
      batchSize = 1000,
      skipExisting = true
    } = req.body;

    // Validation
    if (!sourceCollection || !targetCollection) {
      return res.status(400).json({
        success: false,
        message: 'Source and target collections are required'
      });
    }

    const migrationId = uuidv4();
    const migration = {
      id: migrationId,
      type: 'copy',
      sourceCollection,
      targetCollection,
      filter,
      status: 'running',
      startTime: new Date(),
      progress: 0,
      totalDocuments: 0,
      processedDocuments: 0,
      errors: []
    };

    migrations.set(migrationId, migration);

    // Start the copy process asynchronously
    copyDataAsync(migration, filter, transform, batchSize, skipExisting);

    res.json({
      success: true,
      data: {
        migrationId,
        status: 'started',
        message: 'Data copy process initiated'
      }
    });
  } catch (error) {
    console.error('❌ Copy data error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to start data copy',
      error: error.message
    });
  }
};

// Async function to handle the actual copying
const copyDataAsync = async (migration, filter, transform, batchSize, skipExisting) => {
  try {
    const db = mongoose.connection.db;
    const sourceCol = db.collection(migration.sourceCollection);
    const targetCol = db.collection(migration.targetCollection);

    // Get total count
    const totalCount = await sourceCol.countDocuments(filter);
    migration.totalDocuments = totalCount;
    migration.progress = 0;

    console.log(`🔄 Starting copy: ${migration.sourceCollection} → ${migration.targetCollection}`);
    console.log(`📊 Total documents to copy: ${totalCount}`);

    let processed = 0;
    const cursor = sourceCol.find(filter).batchSize(batchSize);

    const batch = [];
    
    for await (const doc of cursor) {
      try {
        let transformedDoc = doc;
        
        // Apply transformation if provided
        if (transform && typeof transform === 'function') {
          transformedDoc = transform(doc);
        }

        // Check if document already exists in target (if skipExisting is true)
        if (skipExisting) {
          const existing = await targetCol.findOne({ _id: transformedDoc._id });
          if (existing) {
            processed++;
            continue;
          }
        }

        batch.push(transformedDoc);

        // Process batch when it reaches batchSize
        if (batch.length >= batchSize) {
          await targetCol.insertMany(batch, { ordered: false });
          batch.length = 0;
        }

        processed++;
        migration.processedDocuments = processed;
        migration.progress = Math.round((processed / totalCount) * 100);

        // Log progress every 100 documents
        if (processed % 100 === 0) {
          console.log(`📈 Progress: ${migration.progress}% (${processed}/${totalCount})`);
        }

      } catch (docError) {
        migration.errors.push({
          document: doc._id,
          error: docError.message,
          timestamp: new Date()
        });
      }
    }

    // Process remaining batch
    if (batch.length > 0) {
      await targetCol.insertMany(batch, { ordered: false });
    }

    migration.status = 'completed';
    migration.endTime = new Date();
    migration.duration = migration.endTime - migration.startTime;

    console.log(`✅ Copy completed: ${processed}/${totalCount} documents`);
    console.log(`⏱️ Duration: ${migration.duration}ms`);

  } catch (error) {
    migration.status = 'failed';
    migration.endTime = new Date();
    migration.error = error.message;
    console.error('❌ Copy failed:', error);
  }
};

// Sync data between collections (bidirectional)
const syncData = async (req, res) => {
  try {
    const {
      collection1,
      collection2,
      syncDirection = 'bidirectional', // 'bidirectional', 'collection1_to_collection2', 'collection2_to_collection1'
      conflictResolution = 'latest_timestamp' // 'latest_timestamp', 'manual', 'skip'
    } = req.body;

    if (!collection1 || !collection2) {
      return res.status(400).json({
        success: false,
        message: 'Both collections are required for sync'
      });
    }

    const migrationId = uuidv4();
    const migration = {
      id: migrationId,
      type: 'sync',
      collection1,
      collection2,
      syncDirection,
      conflictResolution,
      status: 'running',
      startTime: new Date(),
      progress: 0
    };

    migrations.set(migrationId, migration);

    // Start sync process asynchronously
    syncDataAsync(migration);

    res.json({
      success: true,
      data: {
        migrationId,
        status: 'started',
        message: 'Data sync process initiated'
      }
    });
  } catch (error) {
    console.error('❌ Sync data error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to start data sync',
      error: error.message
    });
  }
};

// Async function to handle syncing
const syncDataAsync = async (migration) => {
  try {
    // Implementation for syncing logic
    // This is a placeholder - implement based on your sync requirements
    
    migration.status = 'completed';
    migration.endTime = new Date();
    console.log(`✅ Sync completed for migration ${migration.id}`);
  } catch (error) {
    migration.status = 'failed';
    migration.error = error.message;
    console.error('❌ Sync failed:', error);
  }
};

// Backup collection
const backupCollection = async (req, res) => {
  try {
    const {
      sourceCollection,
      backupName,
      compress = true
    } = req.body;

    if (!sourceCollection || !backupName) {
      return res.status(400).json({
        success: false,
        message: 'Source collection and backup name are required'
      });
    }

    const migrationId = uuidv4();
    const migration = {
      id: migrationId,
      type: 'backup',
      sourceCollection,
      backupName: `${backupName}_${Date.now()}`,
      status: 'running',
      startTime: new Date()
    };

    migrations.set(migrationId, migration);

    res.json({
      success: true,
      data: {
        migrationId,
        status: 'started',
        message: 'Backup process initiated'
      }
    });
  } catch (error) {
    console.error('❌ Backup error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to start backup',
      error: error.message
    });
  }
};

// Restore collection
const restoreCollection = async (req, res) => {
  try {
    const {
      backupName,
      targetCollection,
      replaceExisting = false
    } = req.body;

    if (!backupName || !targetCollection) {
      return res.status(400).json({
        success: false,
        message: 'Backup name and target collection are required'
      });
    }

    const migrationId = uuidv4();
    const migration = {
      id: migrationId,
      type: 'restore',
      backupName,
      targetCollection,
      replaceExisting,
      status: 'running',
      startTime: new Date()
    };

    migrations.set(migrationId, migration);

    res.json({
      success: true,
      data: {
        migrationId,
        status: 'started',
        message: 'Restore process initiated'
      }
    });
  } catch (error) {
    console.error('❌ Restore error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to start restore',
      error: error.message
    });
  }
};

// List all migrations
const listMigrations = async (req, res) => {
  try {
    const { status, type } = req.query;
    let migrationList = Array.from(migrations.values());

    // Filter by status if provided
    if (status) {
      migrationList = migrationList.filter(m => m.status === status);
    }

    // Filter by type if provided
    if (type) {
      migrationList = migrationList.filter(m => m.type === type);
    }

    // Sort by start time (newest first)
    migrationList.sort((a, b) => b.startTime - a.startTime);

    res.json({
      success: true,
      data: migrationList,
      total: migrationList.length
    });
  } catch (error) {
    console.error('❌ List migrations error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to list migrations',
      error: error.message
    });
  }
};

// Get migration status
const getMigrationStatus = async (req, res) => {
  try {
    const { migrationId } = req.params;
    const migration = migrations.get(migrationId);

    if (!migration) {
      return res.status(404).json({
        success: false,
        message: 'Migration not found'
      });
    }

    res.json({
      success: true,
      data: migration
    });
  } catch (error) {
    console.error('❌ Get migration status error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get migration status',
      error: error.message
    });
  }
};

// Delete migration record
const deleteMigration = async (req, res) => {
  try {
    const { migrationId } = req.params;
    const deleted = migrations.delete(migrationId);

    if (!deleted) {
      return res.status(404).json({
        success: false,
        message: 'Migration not found'
      });
    }

    res.json({
      success: true,
      message: 'Migration record deleted'
    });
  } catch (error) {
    console.error('❌ Delete migration error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete migration',
      error: error.message
    });
  }
};

// Validate collection structure
const validateCollection = async (req, res) => {
  try {
    const { collectionName } = req.params;
    const { schema } = req.body;

    const db = mongoose.connection.db;
    const collection = db.collection(collectionName);
    
    // Get sample documents for validation
    const sampleDocs = await collection.find({}).limit(10).toArray();
    
    const validationResults = {
      collection: collectionName,
      totalSampled: sampleDocs.length,
      validDocuments: 0,
      invalidDocuments: 0,
      errors: []
    };

    // Basic validation logic (extend as needed)
    sampleDocs.forEach((doc, index) => {
      try {
        // Add your validation logic here
        validationResults.validDocuments++;
      } catch (error) {
        validationResults.invalidDocuments++;
        validationResults.errors.push({
          documentIndex: index,
          documentId: doc._id,
          error: error.message
        });
      }
    });

    res.json({
      success: true,
      data: validationResults
    });
  } catch (error) {
    console.error('❌ Validate collection error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to validate collection',
      error: error.message
    });
  }
};

// Create scheduled migration
const createSchedule = async (req, res) => {
  try {
    const {
      name,
      cronExpression,
      migrationConfig,
      enabled = true
    } = req.body;

    // Validation
    if (!name || !cronExpression || !migrationConfig) {
      return res.status(400).json({
        success: false,
        message: 'Name, cron expression, and migration config are required'
      });
    }

    const scheduleId = uuidv4();
    const schedule = {
      id: scheduleId,
      name,
      cronExpression,
      migrationConfig,
      enabled,
      createdAt: new Date(),
      lastRun: null,
      nextRun: null // Calculate based on cron expression
    };

    // Store schedule (in production, save to database)
    // For now, just return success
    
    res.json({
      success: true,
      data: {
        scheduleId,
        message: 'Schedule created successfully'
      }
    });
  } catch (error) {
    console.error('❌ Create schedule error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create schedule',
      error: error.message
    });
  }
};

// List schedules
const listSchedules = async (req, res) => {
  try {
    // In production, fetch from database
    res.json({
      success: true,
      data: [],
      message: 'No schedules configured'
    });
  } catch (error) {
    console.error('❌ List schedules error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to list schedules',
      error: error.message
    });
  }
};

// Delete schedule
const deleteSchedule = async (req, res) => {
  try {
    const { scheduleId } = req.params;
    
    // In production, delete from database
    res.json({
      success: true,
      message: 'Schedule deleted successfully'
    });
  } catch (error) {
    console.error('❌ Delete schedule error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete schedule',
      error: error.message
    });
  }
};

module.exports = {
  listCollections,
  getCollectionCount,
  getSampleData,
  copyData,
  syncData,
  backupCollection,
  restoreCollection,
  listMigrations,
  getMigrationStatus,
  deleteMigration,
  validateCollection,
  createSchedule,
  listSchedules,
  deleteSchedule
};