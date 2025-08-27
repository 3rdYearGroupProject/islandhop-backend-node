const express = require("express");
const router = express.Router();
const {
  getDashboardStats,
  getSystemHealth,
  getAnalytics,
} = require("../controllers/dashboardController");

// Dashboard routes
router.get("/", getDashboardStats);
router.get("/health", getSystemHealth);
router.get("/analytics", getAnalytics);

module.exports = router;
