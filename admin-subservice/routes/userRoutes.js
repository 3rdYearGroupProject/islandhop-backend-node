const express = require("express");
const router = express.Router();
const {
  getAllUsers,
  getUserById,
  updateUser,
  deleteUser,
  toggleUserStatus,
  getUserStats,
  getTotalUserCount,
} = require("../controllers/userController");

// User management routes
router.get("/", getAllUsers);
router.get("/stats", getUserStats);
router.get("/total-count", getTotalUserCount);
router.get("/:id", getUserById);
router.put("/:id", updateUser);
router.delete("/:id", deleteUser);
router.patch("/:id/status", toggleUserStatus);

module.exports = router;
