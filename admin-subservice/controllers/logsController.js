const mongoose = require("mongoose");
const logger = require("../config/logger");

// Create a connection to the 'payment-service' database
const paymentServiceDb = mongoose.createConnection(
  process.env.MONGODB_URI.replace(/\/[^\/]*$/, "/payment-service")
);

// Monitor connection status
paymentServiceDb.on("connected", () => {
  logger.info("Connected to payment-service database");
});

paymentServiceDb.on("error", (err) => {
  logger.error("Payment-service database connection error:", err);
});

// Define schema for drivers collection
const DriverLogSchema = new mongoose.Schema(
  {},
  { strict: false, collection: "drivers" }
);

// Define schema for guides collection
const GuideLogSchema = new mongoose.Schema(
  {},
  { strict: false, collection: "guides" }
);

// Function to get or create DriverLog model safely
const getDriverLogModel = () => {
  try {
    return paymentServiceDb.model("DriverLog");
  } catch (error) {
    return paymentServiceDb.model("DriverLog", DriverLogSchema);
  }
};

// Function to get or create GuideLog model safely
const getGuideLogModel = () => {
  try {
    return paymentServiceDb.model("GuideLog");
  } catch (error) {
    return paymentServiceDb.model("GuideLog", GuideLogSchema);
  }
};

/**
 * Get all driver logs from payment-service database
 * GET /api/logs/drivers
 */
const getDriverLogs = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      sortBy = "createdAt",
      sortOrder = "desc",
      search,
    } = req.query;

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const DriverLog = getDriverLogModel();

    // Build query filter
    const filter = {};

    // Add search filter if provided
    if (search) {
      filter.$or = [
        { driverId: { $regex: search, $options: "i" } },
        { driverEmail: { $regex: search, $options: "i" } },
        { driverName: { $regex: search, $options: "i" } },
        { status: { $regex: search, $options: "i" } },
      ];
    }

    // Build sort object
    const sort = {};
    sort[sortBy] = sortOrder === "asc" ? 1 : -1;

    // Get driver logs with pagination
    const logs = await DriverLog.find(filter)
      .sort(sort)
      .skip(skip)
      .limit(parseInt(limit))
      .lean();

    // Get total count for pagination
    const totalCount = await DriverLog.countDocuments(filter);

    // Calculate pagination info
    const totalPages = Math.ceil(totalCount / parseInt(limit));
    const hasNextPage = parseInt(page) < totalPages;
    const hasPrevPage = parseInt(page) > 1;

    logger.info(
      `Retrieved ${logs.length} driver logs from payment-service database`
    );

    res.status(200).json({
      success: true,
      message: "Driver logs retrieved successfully",
      data: {
        logs,
        pagination: {
          currentPage: parseInt(page),
          totalPages,
          totalCount,
          limit: parseInt(limit),
          hasNextPage,
          hasPrevPage,
        },
      },
    });
  } catch (error) {
    logger.error("Error fetching driver logs:", error);
    res.status(500).json({
      success: false,
      message: "Failed to retrieve driver logs",
      error: error.message,
    });
  }
};

/**
 * Get all guide logs from payment-service database
 * GET /api/logs/guides
 */
const getGuideLogs = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      sortBy = "createdAt",
      sortOrder = "desc",
      search,
    } = req.query;

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const GuideLog = getGuideLogModel();

    // Build query filter
    const filter = {};

    // Add search filter if provided
    if (search) {
      filter.$or = [
        { guideId: { $regex: search, $options: "i" } },
        { guideEmail: { $regex: search, $options: "i" } },
        { guideName: { $regex: search, $options: "i" } },
        { status: { $regex: search, $options: "i" } },
      ];
    }

    // Build sort object
    const sort = {};
    sort[sortBy] = sortOrder === "asc" ? 1 : -1;

    // Get guide logs with pagination
    const logs = await GuideLog.find(filter)
      .sort(sort)
      .skip(skip)
      .limit(parseInt(limit))
      .lean();

    // Get total count for pagination
    const totalCount = await GuideLog.countDocuments(filter);

    // Calculate pagination info
    const totalPages = Math.ceil(totalCount / parseInt(limit));
    const hasNextPage = parseInt(page) < totalPages;
    const hasPrevPage = parseInt(page) > 1;

    logger.info(
      `Retrieved ${logs.length} guide logs from payment-service database`
    );

    res.status(200).json({
      success: true,
      message: "Guide logs retrieved successfully",
      data: {
        logs,
        pagination: {
          currentPage: parseInt(page),
          totalPages,
          totalCount,
          limit: parseInt(limit),
          hasNextPage,
          hasPrevPage,
        },
      },
    });
  } catch (error) {
    logger.error("Error fetching guide logs:", error);
    res.status(500).json({
      success: false,
      message: "Failed to retrieve guide logs",
      error: error.message,
    });
  }
};

/**
 * Get driver log by ID
 * GET /api/logs/drivers/:id
 */
const getDriverLogById = async (req, res) => {
  try {
    const { id } = req.params;
    const DriverLog = getDriverLogModel();

    const log = await DriverLog.findById(id).lean();

    if (!log) {
      return res.status(404).json({
        success: false,
        message: "Driver log not found",
      });
    }

    logger.info(`Driver log retrieved: ${id}`);

    res.status(200).json({
      success: true,
      message: "Driver log retrieved successfully",
      data: log,
    });
  } catch (error) {
    logger.error(`Error fetching driver log ${req.params.id}:`, error);
    res.status(500).json({
      success: false,
      message: "Failed to retrieve driver log",
      error: error.message,
    });
  }
};

/**
 * Get guide log by ID
 * GET /api/logs/guides/:id
 */
const getGuideLogById = async (req, res) => {
  try {
    const { id } = req.params;
    const GuideLog = getGuideLogModel();

    const log = await GuideLog.findById(id).lean();

    if (!log) {
      return res.status(404).json({
        success: false,
        message: "Guide log not found",
      });
    }

    logger.info(`Guide log retrieved: ${id}`);

    res.status(200).json({
      success: true,
      message: "Guide log retrieved successfully",
      data: log,
    });
  } catch (error) {
    logger.error(`Error fetching guide log ${req.params.id}:`, error);
    res.status(500).json({
      success: false,
      message: "Failed to retrieve guide log",
      error: error.message,
    });
  }
};

/**
 * Get logs statistics
 * GET /api/logs/stats
 */
const getLogsStats = async (req, res) => {
  try {
    const DriverLog = getDriverLogModel();
    const GuideLog = getGuideLogModel();

    // Get counts
    const [driverCount, guideCount] = await Promise.all([
      DriverLog.countDocuments(),
      GuideLog.countDocuments(),
    ]);

    logger.info("Logs statistics retrieved successfully");

    res.status(200).json({
      success: true,
      message: "Logs statistics retrieved successfully",
      data: {
        totalDriverLogs: driverCount,
        totalGuideLogs: guideCount,
        totalLogs: driverCount + guideCount,
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    logger.error("Error fetching logs statistics:", error);
    res.status(500).json({
      success: false,
      message: "Failed to retrieve logs statistics",
      error: error.message,
    });
  }
};

module.exports = {
  getDriverLogs,
  getGuideLogs,
  getDriverLogById,
  getGuideLogById,
  getLogsStats,
};
