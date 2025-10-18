const express = require("express");
const {
  getAllMicroservicesHealth,
  getSpecificMicroserviceHealth,
  getMicroservicesList,
  getMicroservicesSummary,
} = require("../controllers/microservicesHealthController");

const router = express.Router();

/**
 * @route   GET /api/admin/microservices/health
 * @desc    Get health status of all microservices
 * @access  Public
 */
router.get("/health", getAllMicroservicesHealth);

/**
 * @route   GET /api/admin/microservices/health/:identifier
 * @desc    Get health status of a specific microservice (by name or port)
 * @access  Public
 */
router.get("/health/:identifier", getSpecificMicroserviceHealth);

/**
 * @route   GET /api/admin/microservices/list
 * @desc    Get list of all registered microservices
 * @access  Public
 */
router.get("/list", getMicroservicesList);

/**
 * @route   GET /api/admin/microservices/summary
 * @desc    Get health summary statistics of all microservices
 * @access  Public
 */
router.get("/summary", getMicroservicesSummary);

module.exports = router;
