const express = require("express");
const router = express.Router();
const { verifyAdminToken } = require("../middlewares/auth");
const {
  getDashboardStats,
  getSystemHealth,
  getAnalytics,
} = require("../controllers/dashboardController");

// Apply admin authentication middleware to all routes
router.use(verifyAdminToken);

// Dashboard routes
router.get("/", getDashboardStats);
router.get("/health", getSystemHealth);
router.get("/analytics", getAnalytics);

module.exports = router;
