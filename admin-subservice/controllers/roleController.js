const Joi = require("joi");
const { executeQuery, executeNonQuery } = require("../config/postgresql");
const { logger } = require("../middlewares/errorHandler");

// Validation schemas
const createRoleSchema = Joi.object({
  name: Joi.string().min(1).max(50).required(),
  description: Joi.string().optional(),
  permissions: Joi.array().items(Joi.string()).optional(),
});

const updateRoleSchema = Joi.object({
  name: Joi.string().min(1).max(50).optional(),
  description: Joi.string().optional(),
  permissions: Joi.array().items(Joi.string()).optional(),
  isActive: Joi.boolean().optional(),
});

const createPermissionSchema = Joi.object({
  name: Joi.string().required(),
  description: Joi.string().optional(),
  module: Joi.string().required(),
  action: Joi.string().required(),
});

// ROLE MANAGEMENT

// @desc    Get all roles
// @route   GET /api/admin/roles
// @access  Private
const getAllRoles = async (req, res, next) => {
  try {
    const { page = 1, limit = 10, isActive, search } = req.query;

    // Build WHERE conditions
    const conditions = [];
    const replacements = {};

    if (isActive !== undefined) {
      conditions.push(`r.is_active = :isActive`);
      replacements.isActive = isActive === "true";
    }

    if (search) {
      conditions.push(`r.name ILIKE :search`);
      replacements.search = `%${search}%`;
    }

    const whereClause =
      conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

    // Calculate offset
    const offset = (page - 1) * limit;
    replacements.limit = parseInt(limit);
    replacements.offset = parseInt(offset);

    // Get total count
    const countQuery = `
      SELECT COUNT(*) as total
      FROM roles r
      ${whereClause}
    `;

    const countResult = await executeQuery(countQuery, replacements);
    const totalCount = parseInt(countResult[0].total);

    // Get roles with permissions
    const rolesQuery = `
      SELECT 
        r.id, r.name, r.description, r.permissions, r.is_active,
        r.created_at, r.updated_at,
        COALESCE(
          json_agg(
            CASE WHEN p.id IS NOT NULL THEN
              json_build_object(
                'id', p.id,
                'name', p.name,
                'description', p.description,
                'module', p.module,
                'action', p.action
              )
            END
          ) FILTER (WHERE p.id IS NOT NULL), 
          '[]'::json
        ) as role_permissions
      FROM roles r
      LEFT JOIN "RolePermissions" rp ON r.id = rp."roleId"
      LEFT JOIN permissions p ON rp."permissionId" = p.id
      ${whereClause}
      GROUP BY r.id, r.name, r.description, r.permissions, r.is_active, r.created_at, r.updated_at
      ORDER BY r.created_at DESC
      LIMIT :limit OFFSET :offset
    `;

    const roles = await executeQuery(rolesQuery, replacements);

    const totalPages = Math.ceil(totalCount / limit);

    res.status(200).json({
      success: true,
      data: {
        roles,
        pagination: {
          currentPage: parseInt(page),
          totalPages,
          totalRoles: totalCount,
          limit: parseInt(limit),
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get role by ID
// @route   GET /api/admin/roles/:id
// @access  Private
const getRoleById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const query = `
      SELECT 
        r.id, r.name, r.description, r.permissions, r.is_active,
        r.created_at, r.updated_at,
        COALESCE(
          json_agg(
            CASE WHEN p.id IS NOT NULL THEN
              json_build_object(
                'id', p.id,
                'name', p.name,
                'description', p.description,
                'module', p.module,
                'action', p.action
              )
            END
          ) FILTER (WHERE p.id IS NOT NULL), 
          '[]'::json
        ) as role_permissions
      FROM roles r
      LEFT JOIN "RolePermissions" rp ON r.id = rp."roleId"
      LEFT JOIN permissions p ON rp."permissionId" = p.id
      WHERE r.id = :id
      GROUP BY r.id, r.name, r.description, r.permissions, r.is_active, r.created_at, r.updated_at
    `;

    const roles = await executeQuery(query, { id });

    if (roles.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Role not found",
      });
    }

    res.status(200).json({
      success: true,
      data: {
        role: roles[0],
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create new role
// @route   POST /api/admin/roles
// @access  Private
const createRole = async (req, res, next) => {
  try {
    // Validate input
    const { error, value } = createRoleSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        message: "Validation error",
        details: error.details[0].message,
      });
    }

    const { name, description, permissions = [] } = value;

    // Check if role already exists
    const existingRoleQuery = `
      SELECT id FROM roles WHERE name = :name
    `;
    const existingRoles = await executeQuery(existingRoleQuery, { name });

    if (existingRoles.length > 0) {
      return res.status(400).json({
        success: false,
        message: "Role with this name already exists",
      });
    }

    // Create role
    const createRoleQuery = `
      INSERT INTO roles (id, name, description, permissions, is_active, created_at, updated_at)
      VALUES (gen_random_uuid(), :name, :description, :permissions, true, NOW(), NOW())
      RETURNING id, name, description, permissions, is_active, created_at, updated_at
    `;

    const newRoles = await executeQuery(createRoleQuery, {
      name,
      description: description || null,
      permissions: JSON.stringify(permissions),
    });

    const newRole = newRoles[0];

    // If permissions are provided, associate them
    if (permissions.length > 0) {
      // Verify permissions exist
      const permissionsQuery = `
        SELECT id FROM permissions WHERE id = ANY(:permissionIds)
      `;
      const validPermissions = await executeQuery(permissionsQuery, {
        permissionIds: permissions,
      });

      // Insert role-permission associations
      for (const permission of validPermissions) {
        const associationQuery = `
          INSERT INTO "RolePermissions" ("roleId", "permissionId", "createdAt", "updatedAt")
          VALUES (:roleId, :permissionId, NOW(), NOW())
        `;
        await executeNonQuery(associationQuery, {
          roleId: newRole.id,
          permissionId: permission.id,
        });
      }
    }

    // Fetch the role with permissions
    const roleWithPermissionsQuery = `
      SELECT 
        r.id, r.name, r.description, r.permissions, r.is_active,
        r.created_at, r.updated_at,
        COALESCE(
          json_agg(
            CASE WHEN p.id IS NOT NULL THEN
              json_build_object(
                'id', p.id,
                'name', p.name,
                'description', p.description,
                'module', p.module,
                'action', p.action
              )
            END
          ) FILTER (WHERE p.id IS NOT NULL), 
          '[]'::json
        ) as role_permissions
      FROM roles r
      LEFT JOIN "RolePermissions" rp ON r.id = rp."roleId"
      LEFT JOIN permissions p ON rp."permissionId" = p.id
      WHERE r.id = :roleId
      GROUP BY r.id, r.name, r.description, r.permissions, r.is_active, r.created_at, r.updated_at
    `;

    const rolesWithPermissions = await executeQuery(roleWithPermissionsQuery, {
      roleId: newRole.id,
    });

    logger.info(`Role created: ${name}`);

    res.status(201).json({
      success: true,
      message: "Role created successfully",
      data: {
        role: rolesWithPermissions[0],
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update role
// @route   PUT /api/admin/roles/:id
// @access  Private
const updateRole = async (req, res, next) => {
  try {
    const { id } = req.params;

    // Validate input
    const { error, value } = updateRoleSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        message: "Validation error",
        details: error.details[0].message,
      });
    }

    // Check if role exists
    const checkQuery = `
      SELECT id, name FROM roles WHERE id = :id
    `;
    const existingRoles = await executeQuery(checkQuery, { id });

    if (existingRoles.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Role not found",
      });
    }

    const { permissions, ...updateData } = value;

    // Build update query dynamically
    const updateFields = [];
    const replacements = { id };

    Object.keys(updateData).forEach((key) => {
      // Convert camelCase to snake_case for database columns
      const dbColumn = key.replace(/([A-Z])/g, "_$1").toLowerCase();
      updateFields.push(`"${dbColumn}" = :${key}`);
      replacements[key] = updateData[key];
    });

    if (updateFields.length > 0) {
      // Add updated_at timestamp
      updateFields.push(`"updated_at" = NOW()`);

      const updateQuery = `
        UPDATE roles 
        SET ${updateFields.join(", ")}
        WHERE id = :id
      `;

      await executeNonQuery(updateQuery, replacements);
    }

    // Update permissions if provided
    if (permissions) {
      // Delete existing role-permission associations
      const deleteAssociationsQuery = `
        DELETE FROM "RolePermissions" WHERE "roleId" = :roleId
      `;
      await executeNonQuery(deleteAssociationsQuery, { roleId: id });

      // Insert new associations
      if (permissions.length > 0) {
        // Verify permissions exist
        const permissionsQuery = `
          SELECT id FROM permissions WHERE id = ANY(:permissionIds)
        `;
        const validPermissions = await executeQuery(permissionsQuery, {
          permissionIds: permissions,
        });

        // Insert role-permission associations
        for (const permission of validPermissions) {
          const associationQuery = `
            INSERT INTO "RolePermissions" ("roleId", "permissionId", "createdAt", "updatedAt")
            VALUES (:roleId, :permissionId, NOW(), NOW())
          `;
          await executeNonQuery(associationQuery, {
            roleId: id,
            permissionId: permission.id,
          });
        }
      }
    }

    // Fetch updated role with permissions
    const roleQuery = `
      SELECT 
        r.id, r.name, r.description, r.permissions, r.is_active,
        r.created_at, r.updated_at,
        COALESCE(
          json_agg(
            CASE WHEN p.id IS NOT NULL THEN
              json_build_object(
                'id', p.id,
                'name', p.name,
                'description', p.description,
                'module', p.module,
                'action', p.action
              )
            END
          ) FILTER (WHERE p.id IS NOT NULL), 
          '[]'::json
        ) as role_permissions
      FROM roles r
      LEFT JOIN "RolePermissions" rp ON r.id = rp."roleId"
      LEFT JOIN permissions p ON rp."permissionId" = p.id
      WHERE r.id = :id
      GROUP BY r.id, r.name, r.description, r.permissions, r.is_active, r.created_at, r.updated_at
    `;

    const updatedRoles = await executeQuery(roleQuery, { id });

    logger.info(`Role updated: ${existingRoles[0].name}`);

    res.status(200).json({
      success: true,
      message: "Role updated successfully",
      data: {
        role: updatedRoles[0],
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete role
// @route   DELETE /api/admin/roles/:id
// @access  Private
const deleteRole = async (req, res, next) => {
  try {
    const { id } = req.params;

    // Check if role exists
    const checkQuery = `
      SELECT id, name FROM roles WHERE id = :id
    `;
    const existingRoles = await executeQuery(checkQuery, { id });

    if (existingRoles.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Role not found",
      });
    }

    // Delete role-permission associations first
    const deleteAssociationsQuery = `
      DELETE FROM "RolePermissions" WHERE "roleId" = :roleId
    `;
    await executeNonQuery(deleteAssociationsQuery, { roleId: id });

    // Delete role
    const deleteRoleQuery = `
      DELETE FROM roles WHERE id = :id
    `;
    await executeNonQuery(deleteRoleQuery, { id });

    logger.info(`Role deleted: ${existingRoles[0].name}`);

    res.status(200).json({
      success: true,
      message: "Role deleted successfully",
    });
  } catch (error) {
    next(error);
  }
};

// PERMISSION MANAGEMENT

// @desc    Get all permissions
// @route   GET /api/admin/permissions
// @access  Private
const getAllPermissions = async (req, res, next) => {
  try {
    const { module, search } = req.query;

    // Build WHERE conditions
    const conditions = [];
    const replacements = {};

    if (module) {
      conditions.push(`module = :module`);
      replacements.module = module;
    }

    if (search) {
      conditions.push(`name ILIKE :search`);
      replacements.search = `%${search}%`;
    }

    const whereClause =
      conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

    const query = `
      SELECT id, name, description, module, action, created_at, updated_at
      FROM permissions
      ${whereClause}
      ORDER BY module ASC, name ASC
    `;

    const permissions = await executeQuery(query, replacements);

    res.status(200).json({
      success: true,
      data: {
        permissions,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create new permission
// @route   POST /api/admin/permissions
// @access  Private
const createPermission = async (req, res, next) => {
  try {
    // Validate input
    const { error, value } = createPermissionSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        message: "Validation error",
        details: error.details[0].message,
      });
    }

    const { name, description, module, action } = value;

    // Check if permission already exists
    const existingPermissionQuery = `
      SELECT id FROM permissions WHERE name = :name
    `;
    const existingPermissions = await executeQuery(existingPermissionQuery, {
      name,
    });

    if (existingPermissions.length > 0) {
      return res.status(400).json({
        success: false,
        message: "Permission with this name already exists",
      });
    }

    // Create permission
    const createPermissionQuery = `
      INSERT INTO permissions (id, name, description, module, action, created_at, updated_at)
      VALUES (gen_random_uuid(), :name, :description, :module, :action, NOW(), NOW())
      RETURNING id, name, description, module, action, created_at, updated_at
    `;

    const newPermissions = await executeQuery(createPermissionQuery, {
      name,
      description: description || null,
      module,
      action,
    });

    logger.info(`Permission created: ${name}`);

    res.status(201).json({
      success: true,
      message: "Permission created successfully",
      data: {
        permission: newPermissions[0],
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete permission
// @route   DELETE /api/admin/permissions/:id
// @access  Private
const deletePermission = async (req, res, next) => {
  try {
    const { id } = req.params;

    // Check if permission exists
    const checkQuery = `
      SELECT id, name FROM permissions WHERE id = :id
    `;
    const existingPermissions = await executeQuery(checkQuery, { id });

    if (existingPermissions.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Permission not found",
      });
    }

    // Delete permission-role associations first
    const deleteAssociationsQuery = `
      DELETE FROM "RolePermissions" WHERE "permissionId" = :permissionId
    `;
    await executeNonQuery(deleteAssociationsQuery, { permissionId: id });

    // Delete permission
    const deletePermissionQuery = `
      DELETE FROM permissions WHERE id = :id
    `;
    await executeNonQuery(deletePermissionQuery, { id });

    logger.info(`Permission deleted: ${existingPermissions[0].name}`);

    res.status(200).json({
      success: true,
      message: "Permission deleted successfully",
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAllRoles,
  getRoleById,
  createRole,
  updateRole,
  deleteRole,
  getAllPermissions,
  createPermission,
  deletePermission,
};
