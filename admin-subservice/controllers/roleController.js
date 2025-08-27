const Joi = require("joi");
const { Role, Permission } = require("../models/Role");
const { logger } = require("../middlewares/errorHandler");
const { Op } = require("sequelize");

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

    // Build where clause
    const whereClause = {};
    if (isActive !== undefined) whereClause.isActive = isActive === "true";
    if (search) {
      whereClause.name = { [Op.iLike]: `%${search}%` };
    }

    // Calculate offset
    const offset = (page - 1) * limit;

    // Get roles with permissions
    const { count, rows } = await Role.findAndCountAll({
      where: whereClause,
      include: [
        {
          model: Permission,
          through: { attributes: [] }, // Exclude junction table attributes
        },
      ],
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [["createdAt", "DESC"]],
    });

    const totalPages = Math.ceil(count / limit);

    res.status(200).json({
      success: true,
      data: {
        roles: rows,
        pagination: {
          currentPage: parseInt(page),
          totalPages,
          totalRoles: count,
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

    const role = await Role.findByPk(id, {
      include: [
        {
          model: Permission,
          through: { attributes: [] },
        },
      ],
    });

    if (!role) {
      return res.status(404).json({
        success: false,
        message: "Role not found",
      });
    }

    res.status(200).json({
      success: true,
      data: {
        role,
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
    const existingRole = await Role.findOne({ where: { name } });
    if (existingRole) {
      return res.status(400).json({
        success: false,
        message: "Role with this name already exists",
      });
    }

    // Create role
    const role = await Role.create({
      name,
      description,
      permissions,
    });

    // If permissions are provided, associate them
    if (permissions.length > 0) {
      const permissionInstances = await Permission.findAll({
        where: { id: permissions },
      });
      await role.setPermissions(permissionInstances);
    }

    // Fetch the role with permissions
    const roleWithPermissions = await Role.findByPk(role.id, {
      include: [
        {
          model: Permission,
          through: { attributes: [] },
        },
      ],
    });

    logger.info(`Role created: ${name}`);

    res.status(201).json({
      success: true,
      message: "Role created successfully",
      data: {
        role: roleWithPermissions,
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

    // Find role
    const role = await Role.findByPk(id);
    if (!role) {
      return res.status(404).json({
        success: false,
        message: "Role not found",
      });
    }

    const { permissions, ...updateData } = value;

    // Update role data
    await role.update(updateData);

    // Update permissions if provided
    if (permissions) {
      const permissionInstances = await Permission.findAll({
        where: { id: permissions },
      });
      await role.setPermissions(permissionInstances);
    }

    // Fetch updated role with permissions
    const updatedRole = await Role.findByPk(id, {
      include: [
        {
          model: Permission,
          through: { attributes: [] },
        },
      ],
    });

    logger.info(`Role updated: ${role.name}`);

    res.status(200).json({
      success: true,
      message: "Role updated successfully",
      data: {
        role: updatedRole,
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

    // Find role
    const role = await Role.findByPk(id);
    if (!role) {
      return res.status(404).json({
        success: false,
        message: "Role not found",
      });
    }

    // Delete role
    await role.destroy();

    logger.info(`Role deleted: ${role.name}`);

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

    // Build where clause
    const whereClause = {};
    if (module) whereClause.module = module;
    if (search) {
      whereClause.name = { [Op.iLike]: `%${search}%` };
    }

    const permissions = await Permission.findAll({
      where: whereClause,
      order: [
        ["module", "ASC"],
        ["name", "ASC"],
      ],
    });

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
    const existingPermission = await Permission.findOne({ where: { name } });
    if (existingPermission) {
      return res.status(400).json({
        success: false,
        message: "Permission with this name already exists",
      });
    }

    // Create permission
    const permission = await Permission.create({
      name,
      description,
      module,
      action,
    });

    logger.info(`Permission created: ${name}`);

    res.status(201).json({
      success: true,
      message: "Permission created successfully",
      data: {
        permission,
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

    // Find permission
    const permission = await Permission.findByPk(id);
    if (!permission) {
      return res.status(404).json({
        success: false,
        message: "Permission not found",
      });
    }

    // Delete permission
    await permission.destroy();

    logger.info(`Permission deleted: ${permission.name}`);

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
