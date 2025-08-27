const express = require("express");
const router = express.Router();
const {
  getDashboardStats,
  getSystemHealth,
  getAnalytics,
} = require("../controllers/dashboardController");
const { authenticateToken, checkPermission } = require("../middlewares/auth");

// Apply authentication to all routes
router.use(authenticateToken);

// Dashboard routes (require dashboard_view permission)
router.get("/", checkPermission("dashboard_view"), getDashboardStats);
router.get("/health", checkPermission("dashboard_view"), getSystemHealth);
router.get("/analytics", checkPermission("dashboard_view"), getAnalytics);

module.exports = router;
