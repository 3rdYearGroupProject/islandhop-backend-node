const express = require("express");
const router = express.Router();
const { verifyAdminToken } = require("../middlewares/auth");
const {
  registerAdmin,
  getAllAdmins,
  getAdminById,
  updateAdmin,
  deleteAdmin,
} = require("../controllers/authController");

// Public route for admin registration (or you might want to protect this too)
router.post("/register", registerAdmin);

// Apply admin authentication middleware to admin management routes
router.use(verifyAdminToken);

// Admin management routes (protected)
router.get("/admins", getAllAdmins);
router.get("/admins/:id", getAdminById);
router.put("/admins/:id", updateAdmin);
router.delete("/admins/:id", deleteAdmin);

module.exports = router;
