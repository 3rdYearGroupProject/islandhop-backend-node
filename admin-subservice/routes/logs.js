const express = require("express");
const router = express.Router();
const {
  getDriverLogs,
  getGuideLogs,
  getDriverLogById,
  getGuideLogById,
  getAllLogs,
  getLogsStats,
} = require("../controllers/logsController");
const { verifyAdminToken } = require("../middlewares/auth");

/**
 * @route   GET /api/logs/all
 * @desc    Get all logs from both drivers and guides with pagination and search
 * @access  Admin only
 * @query   page, limit, sortBy, sortOrder, search, type
 */
router.get("/all", verifyAdminToken, getAllLogs);

/**
 * @route   GET /api/logs/drivers
 * @desc    Get all driver logs with pagination and search
 * @access  Admin only
 * @query   page, limit, sortBy, sortOrder, search
 */
router.get("/drivers", verifyAdminToken, getDriverLogs);

/**
 * @route   GET /api/logs/guides
 * @desc    Get all guide logs with pagination and search
 * @access  Admin only
 * @query   page, limit, sortBy, sortOrder, search
 */
router.get("/guides", verifyAdminToken, getGuideLogs);

/**
 * @route   GET /api/logs/stats
 * @desc    Get logs statistics
 * @access  Admin only
 */
router.get("/stats", verifyAdminToken, getLogsStats);

/**
 * @route   GET /api/logs/drivers/:id
 * @desc    Get driver log by ID
 * @access  Admin only
 */
router.get("/drivers/:id", verifyAdminToken, getDriverLogById);

/**
 * @route   GET /api/logs/guides/:id
 * @desc    Get guide log by ID
 * @access  Admin only
 */
router.get("/guides/:id", verifyAdminToken, getGuideLogById);

module.exports = router;
