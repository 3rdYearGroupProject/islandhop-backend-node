const mongoose = require("mongoose");
const { supabaseAdmin } = require("../config/postgresql");
const { logger } = require("../middlewares/errorHandler");

/**
 * @desc    Get the status of all databases
 * @route   GET /api/admin/database/status
 * @access  Public
 */
const getDatabaseStatus = async (req, res, next) => {
  try {
    const status = {
      timestamp: new Date().toISOString(),
      overall: "healthy",
      databases: {},
    };

    // Check MongoDB Status
    const mongoStatus = await checkMongoDBStatus();
    status.databases.mongodb = mongoStatus;

    // Check Supabase/PostgreSQL Status
    const supabaseStatus = await checkSupabaseStatus();
    status.databases.supabase = supabaseStatus;

    // Determine overall health
    const allHealthy = Object.values(status.databases).every(
      (db) => db.status === "healthy"
    );
    status.overall = allHealthy ? "healthy" : "degraded";

    const responseCode = allHealthy ? 200 : 503;

    res.status(responseCode).json({
      success: allHealthy,
      data: status,
    });
  } catch (error) {
    logger.error("Error checking database status:", error);
    next(error);
  }
};

/**
 * @desc    Get MongoDB specific status and metrics
 * @route   GET /api/admin/database/mongodb/status
 * @access  Public
 */
const getMongoDBStatus = async (req, res, next) => {
  try {
    const mongoStatus = await checkMongoDBStatus();

    res.status(mongoStatus.status === "healthy" ? 200 : 503).json({
      success: mongoStatus.status === "healthy",
      data: mongoStatus,
    });
  } catch (error) {
    logger.error("Error checking MongoDB status:", error);
    next(error);
  }
};

/**
 * @desc    Get Supabase/PostgreSQL specific status and metrics
 * @route   GET /api/admin/database/supabase/status
 * @access  Public
 */
const getSupabaseStatus = async (req, res, next) => {
  try {
    const supabaseStatus = await checkSupabaseStatus();

    res.status(supabaseStatus.status === "healthy" ? 200 : 503).json({
      success: supabaseStatus.status === "healthy",
      data: supabaseStatus,
    });
  } catch (error) {
    logger.error("Error checking Supabase status:", error);
    next(error);
  }
};

/**
 * @desc    Get detailed database statistics
 * @route   GET /api/admin/database/stats
 * @access  Public
 */
const getDatabaseStats = async (req, res, next) => {
  try {
    const stats = {
      timestamp: new Date().toISOString(),
      mongodb: {},
      supabase: {},
    };

    // MongoDB Statistics
    try {
      const mongoStats = await getMongoDBStats();
      stats.mongodb = mongoStats;
    } catch (error) {
      logger.error("Error getting MongoDB stats:", error);
      stats.mongodb = {
        status: "error",
        error: error.message,
      };
    }

    // Supabase Statistics
    try {
      const supabaseStats = await getSupabaseStats();
      stats.supabase = supabaseStats;
    } catch (error) {
      logger.error("Error getting Supabase stats:", error);
      stats.supabase = {
        status: "error",
        error: error.message,
      };
    }

    res.status(200).json({
      success: true,
      data: stats,
    });
  } catch (error) {
    logger.error("Error getting database statistics:", error);
    next(error);
  }
};

/**
 * Helper function to check MongoDB status
 */
const checkMongoDBStatus = async () => {
  const mongoStatus = {
    type: "MongoDB",
    status: "unknown",
    message: "",
    details: {},
  };

  try {
    // Check connection state
    const connectionState = mongoose.connection.readyState;
    const stateMap = {
      0: "disconnected",
      1: "connected",
      2: "connecting",
      3: "disconnecting",
    };

    mongoStatus.details.connectionState =
      stateMap[connectionState] || "unknown";
    mongoStatus.details.host = mongoose.connection.host || "N/A";
    mongoStatus.details.port = mongoose.connection.port || "N/A";
    mongoStatus.details.name = mongoose.connection.name || "N/A";

    if (connectionState === 1) {
      // Try a simple query to verify connection
      const startTime = Date.now();
      await mongoose.connection.db.admin().ping();
      const responseTime = Date.now() - startTime;

      mongoStatus.status = "healthy";
      mongoStatus.message = "Connected and responsive";
      mongoStatus.details.responseTime = `${responseTime}ms`;
      mongoStatus.details.serverVersion =
        mongoose.connection.db.serverConfig?.s?.serverDescription?.version ||
        "N/A";
    } else {
      mongoStatus.status = "unhealthy";
      mongoStatus.message = `Connection state: ${stateMap[connectionState]}`;
    }
  } catch (error) {
    mongoStatus.status = "unhealthy";
    mongoStatus.message = error.message;
    mongoStatus.details.error = error.toString();
  }

  return mongoStatus;
};

/**
 * Helper function to check Supabase status
 */
const checkSupabaseStatus = async () => {
  const supabaseStatus = {
    type: "Supabase/PostgreSQL",
    status: "unknown",
    message: "",
    details: {},
  };

  try {
    // Check if Supabase client is configured
    if (!supabaseAdmin) {
      throw new Error("Supabase client not configured");
    }

    supabaseStatus.details.url = process.env.SUPABASE_URL || "Not configured";
    supabaseStatus.details.hasServiceKey =
      !!process.env.SUPABASE_SERVICE_ROLE_KEY;

    // Try to query version or a simple test
    const startTime = Date.now();

    // Attempt to query a table to verify connection
    const { data, error } = await supabaseAdmin
      .from("admin_accounts")
      .select("id")
      .limit(1);

    const responseTime = Date.now() - startTime;

    if (error && error.code !== "PGRST116") {
      // PGRST116 is "no rows returned" which means connection is fine
      throw error;
    }

    supabaseStatus.status = "healthy";
    supabaseStatus.message = "Connected and responsive";
    supabaseStatus.details.responseTime = `${responseTime}ms`;
    supabaseStatus.details.testQuery = "SELECT id FROM users LIMIT 1";
  } catch (error) {
    supabaseStatus.status = "unhealthy";
    supabaseStatus.message = error.message;
    supabaseStatus.details.error = error.toString();
  }

  return supabaseStatus;
};

/**
 * Helper function to get MongoDB statistics
 */
const getMongoDBStats = async () => {
  const stats = {
    status: "connected",
    collections: [],
    metrics: {},
  };

  try {
    // Get database statistics
    const dbStats = await mongoose.connection.db.stats();

    stats.metrics = {
      collections: dbStats.collections,
      dataSize: formatBytes(dbStats.dataSize),
      storageSize: formatBytes(dbStats.storageSize),
      indexes: dbStats.indexes,
      indexSize: formatBytes(dbStats.indexSize),
      objects: dbStats.objects,
    };

    // Get collection names and document counts
    const collections = await mongoose.connection.db
      .listCollections()
      .toArray();

    for (const collection of collections) {
      const count = await mongoose.connection.db
        .collection(collection.name)
        .countDocuments();

      stats.collections.push({
        name: collection.name,
        documentCount: count,
      });
    }
  } catch (error) {
    stats.status = "error";
    stats.error = error.message;
  }

  return stats;
};

/**
 * Helper function to get Supabase statistics
 */
const getSupabaseStats = async () => {
  const stats = {
    status: "connected",
    tables: [],
    metrics: {},
  };

  try {
    // Get table statistics for known tables
    const tables = ["users", "roles", "permissions", "role_permissions"];

    for (const tableName of tables) {
      try {
        const { count, error } = await supabaseAdmin
          .from(tableName)
          .select("*", { count: "exact", head: true });

        if (error && error.code !== "42P01") {
          // 42P01 is "table does not exist"
          throw error;
        }

        stats.tables.push({
          name: tableName,
          rowCount: count || 0,
          exists: !error,
        });
      } catch (tableError) {
        stats.tables.push({
          name: tableName,
          error: tableError.message,
          exists: false,
        });
      }
    }

    // Calculate total rows
    stats.metrics.totalRows = stats.tables.reduce(
      (sum, table) => sum + (table.rowCount || 0),
      0
    );
    stats.metrics.tablesQueried = stats.tables.length;
    stats.metrics.tablesAvailable = stats.tables.filter((t) => t.exists).length;
  } catch (error) {
    stats.status = "error";
    stats.error = error.message;
  }

  return stats;
};

/**
 * Helper function to format bytes to human readable format
 */
const formatBytes = (bytes) => {
  if (bytes === 0) return "0 Bytes";

  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
};

module.exports = {
  getDatabaseStatus,
  getMongoDBStatus,
  getSupabaseStatus,
  getDatabaseStats,
};
