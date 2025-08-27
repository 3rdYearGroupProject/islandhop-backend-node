const express = require("express");
const router = express.Router();
const {
  registerAdmin,
  loginAdmin,
  getProfile,
  updateProfile,
  changePassword,
} = require("../controllers/authController");
const { authenticateToken, checkSuperAdmin } = require("../middlewares/auth");

// Public routes
router.post("/login", loginAdmin);

// Protected routes
router.use(authenticateToken); // Apply authentication to all routes below

router.get("/profile", getProfile);
router.put("/profile", updateProfile);
router.put("/change-password", changePassword);

// Super admin only routes
router.post("/register", checkSuperAdmin, registerAdmin);

module.exports = router;
