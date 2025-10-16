const express = require("express");
const router = express.Router();
const { verifyAdminToken } = require("../middlewares/auth");
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

// Apply admin authentication middleware to all routes
router.use(verifyAdminToken);

// Role management routes
router.get("/", getAllRoles);
router.get("/:id", getRoleById);
router.post("/", createRole);
router.put("/:id", updateRole);
router.delete("/:id", deleteRole);

// Permission management routes
router.get("/permissions/all", getAllPermissions);
router.post("/permissions", createPermission);
router.delete("/permissions/:id", deletePermission);

module.exports = router;
