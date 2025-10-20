const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
require("dotenv").config();

const connectDB = require("./config/database");
const logger = require("./config/logger");
const errorHandler = require("./middleware/errorHandler");
const rateLimiter = require("./middleware/rateLimiter");

// Import routes
const poolingConfirmRoutes = require("./routes/poolingConfirmRoutes");

const app = express();

// Connect to database
connectDB();

// Security middleware
app.use(
  helmet({
    contentSecurityPolicy: false,
    crossOriginEmbedderPolicy: false,
  })
);

// CORS configuration - Enhanced for frontend compatibility
const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);

    // Define allowed origins
    const allowedOrigins = [
      "http://localhost:3000", // React default
      "http://localhost:3001", // React alternative
      "http://localhost:8080", // Vue.js default
      "http://localhost:8081", // Vue.js alternative
      "http://localhost:4200", // Angular default
      "http://localhost:5173", // Vite default
      "http://localhost:5174", // Vite alternative
      "http://127.0.0.1:3000", // Localhost variations
      "http://127.0.0.1:3001",
      "http://127.0.0.1:8080",
      "http://127.0.0.1:5173",
      process.env.FRONTEND_URL, // Production frontend URL
      process.env.CORS_ORIGIN, // Custom origin from env
    ].filter(Boolean); // Remove undefined values

    // For development, allow all origins
    if (process.env.NODE_ENV === "development") {
      return callback(null, true);
    }

    // Check if origin is allowed
    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error("Not allowed by CORS"));
    }
  },
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS", "HEAD"],
  allowedHeaders: [
    "Content-Type",
    "Authorization",
    "X-Requested-With",
    "X-User-ID",
    "Accept",
    "Origin",
    "Cache-Control",
    "X-Forwarded-For",
  ],
  exposedHeaders: [
    "X-Total-Count",
    "X-Rate-Limit-Limit",
    "X-Rate-Limit-Remaining",
    "X-Rate-Limit-Reset",
  ],
  credentials: true,
  maxAge: 86400, // 24 hours
  preflightContinue: false,
  optionsSuccessStatus: 200,
};

app.use(cors(corsOptions));

// Handle preflight requests explicitly
app.options("*", (req, res) => {
  res.header("Access-Control-Allow-Origin", req.headers.origin || "*");
  res.header(
    "Access-Control-Allow-Methods",
    "GET, POST, PUT, DELETE, PATCH, OPTIONS, HEAD"
  );
  res.header(
    "Access-Control-Allow-Headers",
    "Content-Type, Authorization, X-Requested-With, X-User-ID, Accept, Origin, Cache-Control, X-Forwarded-For"
  );
  res.header("Access-Control-Allow-Credentials", "true");
  res.header("Access-Control-Max-Age", "86400");
  res.status(200).end();
});

// Body parsing middleware
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// Request logging
app.use(
  morgan("combined", {
    stream: {
      write: (message) => logger.info(message.trim()),
    },
  })
);

// Rate limiting
app.use(rateLimiter.middleware());

// Health check endpoint
app.get("/health", (req, res) => {
  res.status(200).json({
    success: true,
    message: "pooling Service is running",
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || "development",
  });
});

// CORS test endpoint
app.get("/api/v1/pooling-confirm/cors-test", (req, res) => {
  res.json({
    success: true,
    message: "CORS is working correctly",
    origin: req.headers.origin || "No origin header",
    timestamp: new Date().toISOString(),
    headers: {
      "access-control-allow-origin": res.getHeader(
        "access-control-allow-origin"
      ),
      "access-control-allow-credentials": res.getHeader(
        "access-control-allow-credentials"
      ),
    },
  });
});

// Debug endpoint to check available groups
app.get("/api/v1/pooling-confirm/debug/groups", async (req, res) => {
  try {
    const mongoose = require("mongoose");

    // Check both databases
    const poolingDB = mongoose.connection.client.db("islandhop_pooling");
    const confirmDB = mongoose.connection.client.db(
      "islandhop_pooling_confirm"
    );

    const poolingGroups = poolingDB.collection("groups");
    const confirmedTrips = confirmDB.collection("confirmed_trips");

    const groups = await poolingGroups.find({}).limit(5).toArray();
    const confirmed = await confirmedTrips.find({}).limit(5).toArray();

    res.json({
      success: true,
      message: "Database status check",
      databases: {
        pooling: {
          database: "islandhop_pooling",
          collection: "groups",
          count: await poolingGroups.countDocuments(),
          sample: groups.map((group) => ({
            _id: group._id,
            tripId: group.tripId,
            groupName: group.groupName,
            userIds: group.userIds,
            userCount: group.userIds?.length || 0,
          })),
        },
        confirmation: {
          database: "islandhop_pooling_confirm",
          collection: "confirmed_trips",
          count: await confirmedTrips.countDocuments(),
          sample: confirmed.map((trip) => ({
            _id: trip._id,
            tripId: trip.tripId,
            status: trip.status,
          })),
        },
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error fetching database info",
      error: error.message,
    });
  }
});

// API routes
app.use("/api/v1/pooling-confirm", poolingConfirmRoutes);

// Root endpoint
app.get("/", (req, res) => {
  res.json({
    message: "IslandHop Pooling Confirmation Service",
    version: "1.0.0",
    status: "running",
    endpoints: {
      health: "/health",
      api: "/api/v1/pooling-confirm",
      documentation: "/api/v1/pooling-confirm/docs",
    },
  });
});

// API documentation endpoint
app.get("/api/v1/pooling-confirm/docs", (req, res) => {
  res.json({
    service: "Pooling Confirmation Service",
    version: "1.0.0",
    description:
      "Microservice for confirming pooling trips and handling payments",
    endpoints: {
      "POST /api/v1/pooling-confirm/initiate": {
        description: "Initiate trip confirmation process",
        body: {
          tripId: "string (required) - the actual trip ID",
          groupId: "string (required) - the group's _id from MongoDB",
          userId: "string (required)",
          minMembers: "number (optional, default: 2)",
          maxMembers: "number (optional, default: 12)",
          tripStartDate: "string ISO date (optional)",
          tripEndDate: "string ISO date (optional)",
          confirmationHours: "number (optional, default: 48)",
          totalAmount: "number (optional, default: 0)",
          pricePerPerson: "number (optional, default: 0)",
          currency: "string (optional, default: LKR)",
          paymentDeadlineHours: "number (optional, default: 72)",
          tripDetails: "object (optional)",
        },
      },
      "GET /api/v1/pooling-confirm/trip/:tripId/status": {
        description: "Get confirmation status by tripId (helper endpoint)",
        params: { tripId: "string (UUID from pooling service)" },
        query: { userId: "string (required)" },
      },
      "POST /api/v1/pooling-confirm/:confirmedTripId/confirm": {
        description: "Member confirms participation",
        params: { confirmedTripId: "string (MongoDB ObjectId)" },
        body: { userId: "string (required)" },
      },
      "GET /api/v1/pooling-confirm/:confirmedTripId/status": {
        description: "Get confirmation status",
        params: { confirmedTripId: "string (MongoDB ObjectId)" },
        query: { userId: "string (required)" },
      },
      "POST /api/v1/pooling-confirm/:confirmedTripId/cancel": {
        description: "Cancel trip confirmation",
        params: { confirmedTripId: "string (MongoDB ObjectId)" },
        body: { userId: "string (required)", reason: "string (optional)" },
      },
      "GET /api/v1/pooling-confirm/user/:userId/trips": {
        description: "Get user confirmed trips",
        params: { userId: "string" },
        query: {
          status: "string (optional)",
          page: "number (optional)",
          limit: "number (optional)",
        },
      },
    },
    statusCodes: {
      200: "Success",
      201: "Created",
      400: "Bad Request",
      403: "Forbidden",
      404: "Not Found",
      409: "Conflict",
      410: "Gone (deadline passed)",
      429: "Too Many Requests",
      500: "Internal Server Error",
      503: "Service Unavailable",
    },
  });
});

// Handle 404 for unknown routes
app.use("*", (req, res) => {
  logger.warn(`Route not found: ${req.method} ${req.originalUrl}`);
  res.status(404).json({
    success: false,
    message: `Route ${req.method} ${req.originalUrl} not found`,
    availableRoutes: [
      "GET /",
      "GET /health",
      "GET /api/v1/pooling-confirm/docs",
      "POST /api/v1/pooling-confirm/initiate",
      "POST /api/v1/pooling-confirm/:id/confirm",
      "GET /api/v1/pooling-confirm/:id/status",
      "POST /api/v1/pooling-confirm/:id/cancel",
      "GET /api/v1/pooling-confirm/user/:userId/trips",
    ],
  });
});

// Global error handler (must be last middleware)
app.use(errorHandler);

const PORT = process.env.PORT || 8074;
const HOST = process.env.HOST || "0.0.0.0";

const server = app.listen(PORT, HOST, () => {
  logger.info(`🚀 Pooling Confirm Service running on http://${HOST}:${PORT}`);
  logger.info(`📊 Environment: ${process.env.NODE_ENV || "development"}`);
  logger.info(
    `📋 API Documentation: http://${HOST}:${PORT}/api/v1/pooling-confirm/docs`
  );
  logger.info(`💚 Health Check: http://${HOST}:${PORT}/health`);
});

// Graceful shutdown
const gracefulShutdown = (signal) => {
  logger.info(`${signal} received, shutting down gracefully...`);
  server.close(() => {
    logger.info("Server closed");
    process.exit(0);
  });
};

process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));
process.on("SIGINT", () => gracefulShutdown("SIGINT"));

// Handle unhandled promise rejections
process.on("unhandledRejection", (err, promise) => {
  logger.error("Unhandled Promise Rejection:", err);
  server.close(() => {
    process.exit(1);
  });
});

module.exports = app;
