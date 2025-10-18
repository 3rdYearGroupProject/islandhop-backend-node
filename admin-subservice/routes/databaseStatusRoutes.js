const express = require("express");
const {
  getDatabaseStatus,
  getMongoDBStatus,
  getSupabaseStatus,
  getDatabaseStats,
} = require("../controllers/databaseStatusController");

const router = express.Router();

/**
 * @route   GET /api/admin/database/status
 * @desc    Get status of all databases
 * @access  Public
 */
router.get("/status", getDatabaseStatus);

/**
 * @route   GET /api/admin/database/mongodb/status
 * @desc    Get MongoDB specific status
 * @access  Public
 */
router.get("/mongodb/status", getMongoDBStatus);

/**
 * @route   GET /api/admin/database/supabase/status
 * @desc    Get Supabase/PostgreSQL specific status
 * @access  Public
 */
router.get("/supabase/status", getSupabaseStatus);

/**
 * @route   GET /api/admin/database/stats
 * @desc    Get detailed database statistics
 * @access  Public
 */
router.get("/stats", getDatabaseStats);

module.exports = router;
