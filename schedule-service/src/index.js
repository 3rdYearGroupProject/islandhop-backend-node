const express = require("express");
const cors = require("cors");
const connectDB = require("../config/database");
const scheduleRoutes = require("./routes/scheduleRoutes");
const errorHandler = require("./middleware/errorHandler");

const app = express();

// Load environment variables
require("dotenv").config();

// Connect to MongoDB
connectDB();

// Middleware
app.use(
  cors({
    origin: ["http://localhost:3000", "http://127.0.0.1:3000"],
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check endpoint
app.get("/health", (req, res) => {
  res.status(200).json({
    success: true,
    message: "Schedule Service is running",
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || "development",
  });
});

// Routes
app.use("/schedule", scheduleRoutes);

// Root endpoint
app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "Schedule Microservice API",
    version: "1.0.0",
    endpoints: {
      health: "GET /schedule/health",
      markUnavailable: "POST /schedule/:userType/mark-unavailable",
      unmarkAvailable: "POST /schedule/:userType/unmark-available",
      lockDays: "POST /schedule/:userType/lock",
      getAvailable: "GET /schedule/:userType/available?email=...&month=YYYY-MM",
    },
    userTypes: ["driver", "guide"],
    documentation: "See README.md for detailed API documentation",
  });
});

// Handle 404 routes
app.use("*", (req, res) => {
  res.status(404).json({
    success: false,
    message: "Route not found",
  });
});

// Error handling middleware
app.use(errorHandler);

const PORT = process.env.PORT || 5005;

app.listen(PORT, () => {
  console.log(`Schedule service running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || "development"}`);
});
