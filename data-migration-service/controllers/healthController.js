// Health check endpoint for the data migration service
const checkHealth = async (req, res) => {
  try {
    const mongoose = require('mongoose');
    
    // Check database connection
    const dbStatus = mongoose.connection.readyState === 1 ? 'connected' : 'disconnected';
    
    // Check system metrics
    const uptime = process.uptime();
    const memoryUsage = process.memoryUsage();
    
    const healthInfo = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      service: 'data-migration-service',
      version: '1.0.0',
      uptime: Math.round(uptime),
      database: {
        status: dbStatus,
        connection: mongoose.connection.name || 'unknown'
      },
      memory: {
        rss: Math.round(memoryUsage.rss / 1024 / 1024) + ' MB',
        heapTotal: Math.round(memoryUsage.heapTotal / 1024 / 1024) + ' MB',
        heapUsed: Math.round(memoryUsage.heapUsed / 1024 / 1024) + ' MB',
        external: Math.round(memoryUsage.external / 1024 / 1024) + ' MB'
      },
      environment: process.env.NODE_ENV || 'development'
    };

    // If database is not connected, mark as unhealthy
    if (dbStatus !== 'connected') {
      healthInfo.status = 'unhealthy';
      return res.status(503).json(healthInfo);
    }

    res.json(healthInfo);
  } catch (error) {
    console.error('❌ Health check error:', error);
    res.status(500).json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      service: 'data-migration-service',
      error: error.message
    });
  }
};

// Ready check endpoint (for Kubernetes readiness probes)
const checkReady = async (req, res) => {
  try {
    const mongoose = require('mongoose');
    
    // Check if the service is ready to serve requests
    const isReady = mongoose.connection.readyState === 1;
    
    if (isReady) {
      res.json({
        status: 'ready',
        timestamp: new Date().toISOString(),
        service: 'data-migration-service'
      });
    } else {
      res.status(503).json({
        status: 'not_ready',
        timestamp: new Date().toISOString(),
        service: 'data-migration-service',
        reason: 'Database not connected'
      });
    }
  } catch (error) {
    console.error('❌ Ready check error:', error);
    res.status(503).json({
      status: 'not_ready',
      timestamp: new Date().toISOString(),
      service: 'data-migration-service',
      error: error.message
    });
  }
};

// Live check endpoint (for Kubernetes liveness probes)
const checkLive = async (req, res) => {
  try {
    // Simple liveness check - just return 200 if the process is running
    res.json({
      status: 'alive',
      timestamp: new Date().toISOString(),
      service: 'data-migration-service',
      pid: process.pid
    });
  } catch (error) {
    console.error('❌ Live check error:', error);
    res.status(500).json({
      status: 'dead',
      timestamp: new Date().toISOString(),
      service: 'data-migration-service',
      error: error.message
    });
  }
};

// Get service statistics
const getStats = async (req, res) => {
  try {
    const mongoose = require('mongoose');
    
    // Get database stats
    let dbStats = null;
    try {
      if (mongoose.connection.readyState === 1) {
        const db = mongoose.connection.db;
        dbStats = await db.stats();
      }
    } catch (dbError) {
      console.warn('Could not fetch database stats:', dbError.message);
    }

    const stats = {
      service: 'data-migration-service',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      cpu: process.cpuUsage(),
      database: dbStats ? {
        collections: dbStats.collections,
        dataSize: dbStats.dataSize,
        storageSize: dbStats.storageSize,
        indexes: dbStats.indexes,
        indexSize: dbStats.indexSize
      } : null,
      environment: {
        nodeVersion: process.version,
        platform: process.platform,
        arch: process.arch,
        env: process.env.NODE_ENV || 'development'
      }
    };

    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('❌ Get stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get service statistics',
      error: error.message
    });
  }
};

// Get service information
const getServiceInfo = async (req, res) => {
  try {
    const serviceInfo = {
      name: 'Data Migration Service',
      version: '1.0.0',
      description: 'Microservice for copying and syncing data between database collections',
      endpoints: {
        health: '/health',
        collections: '/api/collections',
        migrations: '/api/migrations',
        tripSync: '/api/trip-sync'
      },
      features: [
        'Collection data copying',
        'Real-time data synchronization',
        'Trip sync between payment and driver collections',
        'Automated monitoring every 5 seconds',
        'Migration status tracking',
        'Backup and restore operations'
      ],
      status: 'operational',
      timestamp: new Date().toISOString()
    };

    res.json({
      success: true,
      data: serviceInfo
    });
  } catch (error) {
    console.error('❌ Get service info error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get service information',
      error: error.message
    });
  }
};

module.exports = {
  checkHealth,
  checkReady,
  checkLive,
  getStats,
  getServiceInfo
};