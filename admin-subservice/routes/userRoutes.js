const express = require("express");
const router = express.Router();
const {
  getAllUsers,
  getUserById,
  updateUser,
  deleteUser,
  toggleUserStatus,
  getUserStats,
} = require("../controllers/userController");
const { authenticateToken, checkPermission } = require("../middlewares/auth");

// Apply authentication to all routes
router.use(authenticateToken);

// User management routes (require user_management permission)
router.get("/", checkPermission("user_management"), getAllUsers);
router.get("/stats", checkPermission("user_management"), getUserStats);
router.get("/:id", checkPermission("user_management"), getUserById);
router.put("/:id", checkPermission("user_management"), updateUser);
router.delete("/:id", checkPermission("user_management"), deleteUser);
router.patch(
  "/:id/status",
  checkPermission("user_management"),
  toggleUserStatus
);

module.exports = router;
