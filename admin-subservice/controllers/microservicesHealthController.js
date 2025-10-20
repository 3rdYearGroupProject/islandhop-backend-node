const { logger } = require("../middlewares/errorHandler");

/**
 * Microservices configuration
 * Each service includes name, port, and health endpoint
 */
const MICROSERVICES = [
  {
    name: "Admin Subservice",
    port: process.env.PORT || 8070,
    healthEndpoint: "/health",
    baseUrl: process.env.ADMIN_SERVICE_URL,
  },
  {
    name: "User Service",
    port: 4011,
    healthEndpoint: "/health",
    baseUrl: process.env.USER_SERVICE_URL,
  },
  {
    name: "Route Service",
    port: 3001,
    healthEndpoint: "/health",
    baseUrl: process.env.ROUTE_SERVICE_URL,
  },
  {
    name: "Scoring Service",
    port: 4000,
    healthEndpoint: "/health",
    baseUrl: process.env.SCORING_SERVICE_URL,
  },
  {
    name: "Payment Service",
    port: 4013,
    healthEndpoint: "/health",
    baseUrl: process.env.PAYMENT_SERVICE_URL,
  },
  {
    name: "Finished Trips Service",
    port: 4015,
    healthEndpoint: "/health",
    baseUrl: process.env.FINISHED_TRIPS_SERVICE_URL,
  },
  {
    name: "Bank Transfer Service",
    port: 4021,
    healthEndpoint: "/health",
    baseUrl: process.env.BANK_TRANSFER_SERVICE_URL,
  },
  {
    name: "Driver Microservice",
    port: 5001,
    healthEndpoint: "/health",
    baseUrl: process.env.DRIVER_SERVICE_URL,
  },
  {
    name: "Guide Microservice",
    port: 5002,
    healthEndpoint: "/health",
    baseUrl: process.env.GUIDE_SERVICE_URL,
  },
  {
    name: "Data Migration Service",
    port: 5003,
    healthEndpoint: "/health",
    baseUrl: process.env.DATA_MIGRATION_SERVICE_URL,
  },
  {
    name: "Schedule Service",
    port: 5005,
    healthEndpoint: "/health",
    baseUrl: process.env.SCHEDULE_SERVICE_URL,
  },
  {
    name: "Active Trips Service",
    port: 5006,
    healthEndpoint: "/health",
    baseUrl: process.env.ACTIVE_TRIPS_SERVICE_URL,
  },
  {
    name: "Complete Trip Service",
    port: 5007,
    healthEndpoint: "/health",
    baseUrl: process.env.COMPLETE_TRIP_SERVICE_URL,
  },
  {
    name: "Support Agent Service",
    port: 8061,
    healthEndpoint: "/health",
    baseUrl: process.env.SUPPORT_AGENT_SERVICE_URL,
  },
  {
    name: "Panic Alerts Service",
    port: 8062,
    healthEndpoint: "/health",
    baseUrl: process.env.PANIC_ALERTS_SERVICE_URL,
  },
];

/**
 * @desc    Check health status of a single microservice
 * @param   {Object} service - Service configuration object
 * @returns {Promise<Object>} Service health status
 */
const checkServiceHealth = async (service) => {
  const url = service.baseUrl || `http://localhost:${service.port}`;
  const fullUrl = `${url}${service.healthEndpoint}`;

  const startTime = Date.now();

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout

    const response = await fetch(fullUrl, {
      method: "GET",
      signal: controller.signal,
      headers: {
        "Content-Type": "application/json",
      },
    });

    clearTimeout(timeoutId);

    const responseTime = Date.now() - startTime;
    const isHealthy = response.ok;

    let data = null;
    try {
      data = await response.json();
    } catch (e) {
      // If response is not JSON, ignore
      data = { message: "Non-JSON response" };
    }

    return {
      name: service.name,
      port: service.port,
      url: fullUrl,
      status: isHealthy ? "healthy" : "unhealthy",
      statusCode: response.status,
      responseTime: `${responseTime}ms`,
      timestamp: new Date().toISOString(),
      details: data,
    };
  } catch (error) {
    const responseTime = Date.now() - startTime;

    return {
      name: service.name,
      port: service.port,
      url: fullUrl,
      status: "unreachable",
      statusCode: null,
      responseTime: `${responseTime}ms`,
      timestamp: new Date().toISOString(),
      error: error.name === "AbortError" ? "Request timeout" : error.message,
    };
  }
};

/**
 * @desc    Get health status of all microservices
 * @route   GET /api/admin/microservices/health
 * @access  Public
 */
const getAllMicroservicesHealth = async (req, res, next) => {
  try {
    logger.info("Checking health status of all microservices...");

    // Check all services in parallel
    const healthChecks = await Promise.all(
      MICROSERVICES.map((service) => checkServiceHealth(service))
    );

    // Calculate statistics
    const totalServices = healthChecks.length;
    const healthyServices = healthChecks.filter(
      (s) => s.status === "healthy"
    ).length;
    const unhealthyServices = healthChecks.filter(
      (s) => s.status === "unhealthy"
    ).length;
    const unreachableServices = healthChecks.filter(
      (s) => s.status === "unreachable"
    ).length;

    const overallStatus =
      healthyServices === totalServices
        ? "all_healthy"
        : unhealthyServices + unreachableServices === totalServices
        ? "all_down"
        : "degraded";

    const response = {
      success: true,
      data: {
        timestamp: new Date().toISOString(),
        overall: overallStatus,
        summary: {
          total: totalServices,
          healthy: healthyServices,
          unhealthy: unhealthyServices,
          unreachable: unreachableServices,
          healthPercentage: ((healthyServices / totalServices) * 100).toFixed(
            1
          ),
        },
        services: healthChecks,
      },
    };

    const statusCode = overallStatus === "all_healthy" ? 200 : 200;

    res.status(statusCode).json(response);
  } catch (error) {
    logger.error("Error checking microservices health:", error);
    next(error);
  }
};

/**
 * @desc    Get health status of a specific microservice by name or port
 * @route   GET /api/admin/microservices/health/:identifier
 * @access  Public
 */
const getSpecificMicroserviceHealth = async (req, res, next) => {
  try {
    const { identifier } = req.params;

    // Find service by name or port
    const service = MICROSERVICES.find(
      (s) =>
        s.name.toLowerCase().includes(identifier.toLowerCase()) ||
        s.port.toString() === identifier
    );

    if (!service) {
      return res.status(404).json({
        success: false,
        message: `Microservice not found with identifier: ${identifier}`,
        availableServices: MICROSERVICES.map((s) => ({
          name: s.name,
          port: s.port,
        })),
      });
    }

    logger.info(`Checking health status of ${service.name}...`);

    const healthCheck = await checkServiceHealth(service);

    const statusCode = healthCheck.status === "healthy" ? 200 : 503;

    res.status(statusCode).json({
      success: healthCheck.status === "healthy",
      data: healthCheck,
    });
  } catch (error) {
    logger.error("Error checking specific microservice health:", error);
    next(error);
  }
};

/**
 * @desc    Get list of all registered microservices
 * @route   GET /api/admin/microservices/list
 * @access  Public
 */
const getMicroservicesList = async (req, res, next) => {
  try {
    const servicesList = MICROSERVICES.map((service) => ({
      name: service.name,
      port: service.port,
      healthEndpoint: service.healthEndpoint,
      baseUrl: service.baseUrl || `http://localhost:${service.port}`,
    }));

    res.status(200).json({
      success: true,
      data: {
        total: servicesList.length,
        services: servicesList,
      },
    });
  } catch (error) {
    logger.error("Error getting microservices list:", error);
    next(error);
  }
};

/**
 * @desc    Get health summary statistics
 * @route   GET /api/admin/microservices/summary
 * @access  Public
 */
const getMicroservicesSummary = async (req, res, next) => {
  try {
    logger.info("Getting microservices health summary...");

    // Check all services in parallel
    const healthChecks = await Promise.all(
      MICROSERVICES.map((service) => checkServiceHealth(service))
    );

    // Group by status
    const healthyServices = healthChecks.filter((s) => s.status === "healthy");
    const unhealthyServices = healthChecks.filter(
      (s) => s.status === "unhealthy"
    );
    const unreachableServices = healthChecks.filter(
      (s) => s.status === "unreachable"
    );

    // Calculate average response time for healthy services
    const avgResponseTime =
      healthyServices.length > 0
        ? (
            healthyServices.reduce(
              (sum, s) => sum + parseInt(s.responseTime),
              0
            ) / healthyServices.length
          ).toFixed(0)
        : 0;

    const response = {
      success: true,
      data: {
        timestamp: new Date().toISOString(),
        summary: {
          total: MICROSERVICES.length,
          healthy: healthyServices.length,
          unhealthy: unhealthyServices.length,
          unreachable: unreachableServices.length,
          healthPercentage: (
            (healthyServices.length / MICROSERVICES.length) *
            100
          ).toFixed(1),
          avgResponseTime: `${avgResponseTime}ms`,
        },
        healthyServices: healthyServices.map((s) => ({
          name: s.name,
          port: s.port,
          responseTime: s.responseTime,
        })),
        unhealthyServices: unhealthyServices.map((s) => ({
          name: s.name,
          port: s.port,
          statusCode: s.statusCode,
        })),
        unreachableServices: unreachableServices.map((s) => ({
          name: s.name,
          port: s.port,
          error: s.error,
        })),
      },
    };

    res.status(200).json(response);
  } catch (error) {
    logger.error("Error getting microservices summary:", error);
    next(error);
  }
};

module.exports = {
  getAllMicroservicesHealth,
  getSpecificMicroserviceHealth,
  getMicroservicesList,
  getMicroservicesSummary,
  MICROSERVICES,
};
