const express = require("express");
const router = express.Router();
const {
  getAllRoles,
  getRoleById,
  createRole,
  updateRole,
  deleteRole,
  getAllPermissions,
  createPermission,
  deletePermission,
} = require("../controllers/roleController");
const { authenticateToken, checkPermission } = require("../middlewares/auth");

// Apply authentication to all routes
router.use(authenticateToken);

// Role management routes (require role_management permission)
router.get("/", checkPermission("role_management"), getAllRoles);
router.get("/:id", checkPermission("role_management"), getRoleById);
router.post("/", checkPermission("role_management"), createRole);
router.put("/:id", checkPermission("role_management"), updateRole);
router.delete("/:id", checkPermission("role_management"), deleteRole);

// Permission management routes (require role_management permission)
router.get(
  "/permissions/all",
  checkPermission("role_management"),
  getAllPermissions
);
router.post(
  "/permissions",
  checkPermission("role_management"),
  createPermission
);
router.delete(
  "/permissions/:id",
  checkPermission("role_management"),
  deletePermission
);

module.exports = router;
