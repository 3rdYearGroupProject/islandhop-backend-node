const express = require("express");
const router = express.Router();
const {
  registerAdmin,
  getAllAdmins,
  getAdminById,
  updateAdmin,
  deleteAdmin,
} = require("../controllers/authController");

// Admin management routes
router.post("/register", registerAdmin);
router.get("/admins", getAllAdmins);
router.get("/admins/:id", getAdminById);
router.put("/admins/:id", updateAdmin);
router.delete("/admins/:id", deleteAdmin);

module.exports = router;
