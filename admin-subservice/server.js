require("dotenv").config();
const app = require("./app");
const connectMongoDB = require("./config/mongodb");
const { connectPostgreSQL } = require("./config/postgresql");
const { logger } = require("./middlewares/errorHandler");

// Handle uncaught exceptions
process.on("uncaughtException", (err) => {
  logger.error("UNCAUGHT EXCEPTION! 💥 Shutting down...", err);
  process.exit(1);
});

const PORT = process.env.PORT || 8070;

// Start server
const startServer = async () => {
  try {
    // Connect to databases
    logger.info("Connecting to databases...");

    await Promise.all([connectMongoDB(), connectPostgreSQL()]);

    logger.info("All databases connected successfully");

    // Start the server
    const server = app.listen(PORT, () => {
      logger.info(
        `🚀 Admin Subservice running on port ${PORT} in ${process.env.NODE_ENV} mode`
      );
      logger.info(`📍 Health check: http://localhost:${PORT}/health`);
      logger.info(`📖 API Base URL: http://localhost:${PORT}/api/admin`);
    });

    // Handle unhandled promise rejections
    process.on("unhandledRejection", (err) => {
      logger.error("UNHANDLED REJECTION! 💥 Shutting down...", err);
      server.close(() => {
        process.exit(1);
      });
    });

    // Graceful shutdown
    process.on("SIGTERM", () => {
      logger.info("👋 SIGTERM RECEIVED. Shutting down gracefully");
      server.close(() => {
        logger.info("💥 Process terminated!");
      });
    });

    process.on("SIGINT", () => {
      logger.info("👋 SIGINT RECEIVED. Shutting down gracefully");
      server.close(() => {
        logger.info("💥 Process terminated!");
      });
    });
  } catch (error) {
    logger.error("Failed to start server:", error);
    process.exit(1);
  }
};

// Start the application
startServer();
