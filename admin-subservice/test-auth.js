const express = require("express");
const app = express();
const { verifyAdminToken } = require("./middlewares/auth");

// Test middleware
app.use(express.json());

// Test endpoint with admin protection
app.get("/test/protected", verifyAdminToken, (req, res) => {
  res.json({
    success: true,
    message: "Access granted to admin endpoint",
    user: req.user,
  });
});

// Test endpoint without protection
app.get("/test/public", (req, res) => {
  res.json({
    success: true,
    message: "Public endpoint accessed successfully",
  });
});

// Test invalid token endpoint
app.get("/test/invalid-token", (req, res) => {
  // Simulate testing with invalid token
  const testToken = "invalid.test.token";
  req.headers.authorization = `Bearer ${testToken}`;

  verifyAdminToken(req, res, () => {
    res.json({
      success: true,
      message: "Should not reach here with invalid token",
    });
  });
});

const PORT = process.env.PORT || 3001;

if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`Test server running on port ${PORT}`);
    console.log("\nTest endpoints:");
    console.log("GET /test/public - Public endpoint");
    console.log("GET /test/protected - Requires valid admin JWT token");
    console.log("\nTo test with curl:");
    console.log(`curl http://localhost:${PORT}/test/public`);
    console.log(
      `curl -H "Authorization: Bearer YOUR_JWT_TOKEN" http://localhost:${PORT}/test/protected`
    );
  });
}

module.exports = app;
