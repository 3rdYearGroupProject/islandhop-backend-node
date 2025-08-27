const Joi = require("joi");
const { executeQuery, executeNonQuery } = require("../config/postgresql");
const { logger } = require("../middlewares/errorHandler");

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
      sortBy = "created_at",
      sortOrder = "DESC",
    } = req.query;

    // Build WHERE conditions
    const conditions = [];
    const replacements = {};

    if (userType) {
      conditions.push(`"user_type" = :userType`);
      replacements.userType = userType;
    }

    if (isActive !== undefined) {
      conditions.push(`"is_active" = :isActive`);
      replacements.isActive = isActive === "true";
    }

    if (isVerified !== undefined) {
      conditions.push(`"is_verified" = :isVerified`);
      replacements.isVerified = isVerified === "true";
    }

    if (search) {
      conditions.push(`(
        "first_name" ILIKE :search OR 
        "last_name" ILIKE :search OR 
        "email" ILIKE :search
      )`);
      replacements.search = `%${search}%`;
    }

    // Add soft delete condition
    conditions.push(`"deleted_at" IS NULL`);

    const whereClause =
      conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

    // Calculate offset
    const offset = (page - 1) * limit;
    replacements.limit = parseInt(limit);
    replacements.offset = parseInt(offset);

    // Validate sort column to prevent SQL injection
    const allowedSortColumns = [
      "created_at",
      "updated_at",
      "first_name",
      "last_name",
      "email",
      "user_type",
      "is_active",
      "is_verified",
    ];
    const sortColumn = allowedSortColumns.includes(sortBy)
      ? sortBy
      : "created_at";
    const sortDirection = sortOrder.toUpperCase() === "ASC" ? "ASC" : "DESC";

    // Get total count
    const countQuery = `
      SELECT COUNT(*) as total
      FROM users
      ${whereClause}
    `;

    const countResult = await executeQuery(countQuery, replacements);
    const totalCount = parseInt(countResult[0].total);

    // Get users with pagination
    const usersQuery = `
      SELECT 
        id, email, first_name, last_name, phone_number, date_of_birth,
        profile_picture, is_active, is_verified, user_type, registration_date,
        last_login_date, address, city, country, created_at, updated_at
      FROM users
      ${whereClause}
      ORDER BY "${sortColumn}" ${sortDirection}
      LIMIT :limit OFFSET :offset
    `;

    const users = await executeQuery(usersQuery, replacements);

    const totalPages = Math.ceil(totalCount / limit);

    res.status(200).json({
      success: true,
      data: {
        users,
        pagination: {
          currentPage: parseInt(page),
          totalPages,
          totalUsers: totalCount,
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

    const query = `
      SELECT 
        id, email, first_name, last_name, phone_number, date_of_birth,
        profile_picture, is_active, is_verified, user_type, registration_date,
        last_login_date, address, city, country, created_at, updated_at
      FROM users 
      WHERE id = :id AND deleted_at IS NULL
    `;

    const users = await executeQuery(query, { id });

    if (users.length === 0) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    res.status(200).json({
      success: true,
      data: {
        user: users[0],
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

    // Check if user exists
    const checkQuery = `
      SELECT id, email FROM users 
      WHERE id = :id AND deleted_at IS NULL
    `;
    const existingUsers = await executeQuery(checkQuery, { id });

    if (existingUsers.length === 0) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // Build update query dynamically
    const updateFields = [];
    const replacements = { id };

    Object.keys(value).forEach((key) => {
      // Convert camelCase to snake_case for database columns
      const dbColumn = key.replace(/([A-Z])/g, "_$1").toLowerCase();
      updateFields.push(`"${dbColumn}" = :${key}`);
      replacements[key] = value[key];
    });

    if (updateFields.length === 0) {
      return res.status(400).json({
        success: false,
        message: "No valid fields to update",
      });
    }

    // Add updated_at timestamp
    updateFields.push(`"updated_at" = NOW()`);

    const updateQuery = `
      UPDATE users 
      SET ${updateFields.join(", ")}
      WHERE id = :id AND deleted_at IS NULL
      RETURNING 
        id, email, first_name, last_name, phone_number, date_of_birth,
        profile_picture, is_active, is_verified, user_type, registration_date,
        last_login_date, address, city, country, created_at, updated_at
    `;

    const updatedUsers = await executeQuery(updateQuery, replacements);

    logger.info(`User updated: ${existingUsers[0].email}`);

    res.status(200).json({
      success: true,
      message: "User updated successfully",
      data: {
        user: updatedUsers[0],
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

    // Check if user exists
    const checkQuery = `
      SELECT id, email FROM users 
      WHERE id = :id AND deleted_at IS NULL
    `;
    const existingUsers = await executeQuery(checkQuery, { id });

    if (existingUsers.length === 0) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // Soft delete user
    const deleteQuery = `
      UPDATE users 
      SET deleted_at = NOW(), updated_at = NOW()
      WHERE id = :id AND deleted_at IS NULL
    `;

    await executeNonQuery(deleteQuery, { id });

    logger.info(`User deleted: ${existingUsers[0].email}`);

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

    // Check if user exists
    const checkQuery = `
      SELECT id, email FROM users 
      WHERE id = :id AND deleted_at IS NULL
    `;
    const existingUsers = await executeQuery(checkQuery, { id });

    if (existingUsers.length === 0) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // Update status
    const updateQuery = `
      UPDATE users 
      SET is_active = :isActive, updated_at = NOW()
      WHERE id = :id AND deleted_at IS NULL
      RETURNING 
        id, email, first_name, last_name, phone_number, date_of_birth,
        profile_picture, is_active, is_verified, user_type, registration_date,
        last_login_date, address, city, country, created_at, updated_at
    `;

    const updatedUsers = await executeQuery(updateQuery, { id, isActive });

    logger.info(
      `User ${isActive ? "activated" : "deactivated"}: ${
        existingUsers[0].email
      }`
    );

    res.status(200).json({
      success: true,
      message: `User ${isActive ? "activated" : "deactivated"} successfully`,
      data: {
        user: updatedUsers[0],
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
    const statsQuery = `
      SELECT 
        COUNT(*) as total_users,
        COUNT(CASE WHEN is_active = true THEN 1 END) as active_users,
        COUNT(CASE WHEN is_verified = true THEN 1 END) as verified_users,
        COUNT(CASE WHEN user_type = 'tourist' THEN 1 END) as tourists,
        COUNT(CASE WHEN user_type = 'driver' THEN 1 END) as drivers,
        COUNT(CASE WHEN user_type = 'guide' THEN 1 END) as guides
      FROM users 
      WHERE deleted_at IS NULL
    `;

    const stats = await executeQuery(statsQuery);
    const result = stats[0];

    res.status(200).json({
      success: true,
      data: {
        totalUsers: parseInt(result.total_users),
        activeUsers: parseInt(result.active_users),
        inactiveUsers:
          parseInt(result.total_users) - parseInt(result.active_users),
        verifiedUsers: parseInt(result.verified_users),
        unverifiedUsers:
          parseInt(result.total_users) - parseInt(result.verified_users),
        userTypes: {
          tourists: parseInt(result.tourists),
          drivers: parseInt(result.drivers),
          guides: parseInt(result.guides),
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get total user count from all user account tables
// @route   GET /api/admin/users/total-count
// @access  Private
const getTotalUserCount = async (req, res, next) => {
  try {
    // Query to get count from all user account tables
    const totalCountQuery = `
      SELECT 
        (SELECT COUNT(*) FROM admin_accounts) as admin_count,
        (SELECT COUNT(*) FROM driver_accounts) as driver_count,
        (SELECT COUNT(*) FROM guide_accounts) as guide_count,
        (SELECT COUNT(*) FROM support_accounts) as support_count,
        (SELECT COUNT(*) FROM tourist_accounts) as tourist_count,
        (
          (SELECT COUNT(*) FROM admin_accounts) +
          (SELECT COUNT(*) FROM driver_accounts) +
          (SELECT COUNT(*) FROM guide_accounts) +
          (SELECT COUNT(*) FROM support_accounts) +
          (SELECT COUNT(*) FROM tourist_accounts)
        ) as total_count
    `;

    const result = await executeQuery(totalCountQuery);
    const counts = result[0];

    logger.info("Total user count retrieved from all account tables");
    console.log(counts);

    res.status(200).json({
      success: true,
      data: {
        totalUsers: parseInt(counts.total_count),
        breakdown: {
          adminAccounts: parseInt(counts.admin_count),
          driverAccounts: parseInt(counts.driver_count),
          guideAccounts: parseInt(counts.guide_count),
          supportAccounts: parseInt(counts.support_count),
          touristAccounts: parseInt(counts.tourist_count),
        },
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    logger.error("Error getting total user count:", error);
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
  getTotalUserCount,
};
