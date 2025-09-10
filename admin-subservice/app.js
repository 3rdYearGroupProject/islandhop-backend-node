const express = require("express");
const cors = require("cors");
const morgan = require("morgan");

// Import middlewares
const { errorHandler } = require("./middlewares/errorHandler");

// Import routes
const authRoutes = require("./routes/authRoutes");
const userRoutes = require("./routes/userRoutes");
const roleRoutes = require("./routes/roleRoutes");
const dashboardRoutes = require("./routes/dashboardRoutes");
const analyticsRoutes = require("./routes/analyticsRoutes");

const app = express();

// CORS configuration
app.use(
  cors({
    origin: process.env.CORS_ORIGIN || "*",
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
    allowedHeaders: ["Content-Type", "Authorization", "authorization"],
    credentials: true,
  })
);

// Body parser middleware
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// Logging middleware
if (process.env.NODE_ENV === "development") {
  app.use(morgan("dev"));
} else {
  app.use(morgan("combined"));
}

// Health check endpoint
app.get("/health", (req, res) => {
  res.status(200).json({
    success: true,
    message: "Admin Subservice is running",
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
  });
});

// API routes
app.use("/api/admin/auth", authRoutes);
app.use("/api/admin/users", userRoutes);
app.use("/api/admin/roles", roleRoutes);
app.use("/api/admin/dashboard", dashboardRoutes);
app.use("/api/admin/analytics", analyticsRoutes);

// Welcome route
app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "Welcome to Island Hop Admin Subservice API",
    version: "1.0.0",
    endpoints: {
      auth: "/api/admin/auth",
      users: "/api/admin/users",
      roles: "/api/admin/roles",
      dashboard: "/api/admin/dashboard",
      analytics: "/api/admin/analytics",
      health: "/health",
    },
  });
});

// 404 handler for undefined routes
app.all("*", (req, res) => {
  res.status(404).json({
    success: false,
    message: `Route ${req.originalUrl} not found`,
  });
});

// Global error handler (must be last)
app.use(errorHandler);

module.exports = app;
