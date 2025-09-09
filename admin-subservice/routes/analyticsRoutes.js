const express = require("express");
const router = express.Router();
const {
  getPaymentDetails,
  getPaymentStats,
  getPaymentByTripId,
  getDailyPaymentSummary,
  getMonthlyRevenue,
  getAllUserCounts,
  getUserStatistics,
} = require("../controllers/analytics");

// Get payment details with filtering and pagination
router.get("/payments", getPaymentDetails);

// Get payment statistics
router.get("/payments/stats", getPaymentStats);

// Get payment details by trip ID
router.get("/payments/trip/:tripId", getPaymentByTripId);

// Get daily payment summary
router.get("/payments/daily-summary", getDailyPaymentSummary);

// Get monthly revenue summary
router.get("/revenue/monthly", getMonthlyRevenue);

// Get all user counts from Supabase tables
router.get("/users/count", getAllUserCounts);

// Get detailed user statistics
router.get("/users/statistics", getUserStatistics);

module.exports = router;
