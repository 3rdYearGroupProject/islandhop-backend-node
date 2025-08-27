const Joi = require("joi");
const { User } = require("../models/User");
const { logger } = require("../middlewares/errorHandler");
const { Op } = require("sequelize");

// Validation schemas
const updateUserSchema = Joi.object({
  firstName: Joi.string().min(1).max(50).optional(),
  lastName: Joi.string().min(1).max(50).optional(),
  phoneNumber: Joi.string().min(10).max(15).optional(),
  dateOfBirth: Joi.date().optional(),
  profilePicture: Joi.string().optional(),
  isActive: Joi.boolean().optional(),
  isVerified: Joi.boolean().optional(),
  address: Joi.string().optional(),
  city: Joi.string().optional(),
  country: Joi.string().optional(),
});

// @desc    Get all users with pagination and filtering
// @route   GET /api/admin/users
// @access  Private
const getAllUsers = async (req, res, next) => {
  try {
    const {
      page = 1,
      limit = 10,
      userType,
      isActive,
      isVerified,
      search,
      sortBy = "createdAt",
      sortOrder = "DESC",
    } = req.query;

    // Build where clause
    const whereClause = {};

    if (userType) whereClause.userType = userType;
    if (isActive !== undefined) whereClause.isActive = isActive === "true";
    if (isVerified !== undefined)
      whereClause.isVerified = isVerified === "true";

    if (search) {
      whereClause[Op.or] = [
        { firstName: { [Op.iLike]: `%${search}%` } },
        { lastName: { [Op.iLike]: `%${search}%` } },
        { email: { [Op.iLike]: `%${search}%` } },
      ];
    }

    // Calculate offset
    const offset = (page - 1) * limit;

    // Get users with pagination
    const { count, rows } = await User.findAndCountAll({
      where: whereClause,
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [[sortBy, sortOrder.toUpperCase()]],
      attributes: { exclude: ["deletedAt"] },
    });

    const totalPages = Math.ceil(count / limit);

    res.status(200).json({
      success: true,
      data: {
        users: rows,
        pagination: {
          currentPage: parseInt(page),
          totalPages,
          totalUsers: count,
          limit: parseInt(limit),
          hasNext: page < totalPages,
          hasPrev: page > 1,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get user by ID
// @route   GET /api/admin/users/:id
// @access  Private
const getUserById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const user = await User.findByPk(id, {
      attributes: { exclude: ["deletedAt"] },
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    res.status(200).json({
      success: true,
      data: {
        user,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update user
// @route   PUT /api/admin/users/:id
// @access  Private
const updateUser = async (req, res, next) => {
  try {
    const { id } = req.params;

    // Validate input
    const { error, value } = updateUserSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        message: "Validation error",
        details: error.details[0].message,
      });
    }

    // Find user
    const user = await User.findByPk(id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // Update user
    await user.update(value);

    logger.info(`User updated: ${user.email}`);

    res.status(200).json({
      success: true,
      message: "User updated successfully",
      data: {
        user,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete user (soft delete)
// @route   DELETE /api/admin/users/:id
// @access  Private
const deleteUser = async (req, res, next) => {
  try {
    const { id } = req.params;

    // Find user
    const user = await User.findByPk(id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // Soft delete user
    await user.destroy();

    logger.info(`User deleted: ${user.email}`);

    res.status(200).json({
      success: true,
      message: "User deleted successfully",
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Activate/Deactivate user
// @route   PATCH /api/admin/users/:id/status
// @access  Private
const toggleUserStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { isActive } = req.body;

    if (typeof isActive !== "boolean") {
      return res.status(400).json({
        success: false,
        message: "isActive must be a boolean value",
      });
    }

    // Find user
    const user = await User.findByPk(id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // Update status
    await user.update({ isActive });

    logger.info(
      `User ${isActive ? "activated" : "deactivated"}: ${user.email}`
    );

    res.status(200).json({
      success: true,
      message: `User ${isActive ? "activated" : "deactivated"} successfully`,
      data: {
        user,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get user statistics
// @route   GET /api/admin/users/stats
// @access  Private
const getUserStats = async (req, res, next) => {
  try {
    const stats = await Promise.all([
      User.count(),
      User.count({ where: { isActive: true } }),
      User.count({ where: { isVerified: true } }),
      User.count({ where: { userType: "tourist" } }),
      User.count({ where: { userType: "driver" } }),
      User.count({ where: { userType: "guide" } }),
    ]);

    const [totalUsers, activeUsers, verifiedUsers, tourists, drivers, guides] =
      stats;

    res.status(200).json({
      success: true,
      data: {
        totalUsers,
        activeUsers,
        inactiveUsers: totalUsers - activeUsers,
        verifiedUsers,
        unverifiedUsers: totalUsers - verifiedUsers,
        userTypes: {
          tourists,
          drivers,
          guides,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAllUsers,
  getUserById,
  updateUser,
  deleteUser,
  toggleUserStatus,
  getUserStats,
};
