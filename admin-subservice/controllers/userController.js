const Joi = require("joi");
const { supabase } = require("../config/postgresql");
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
      sortOrder = "desc",
    } = req.query;

    const offset = (page - 1) * limit;
    let allUsers = [];

    // Helper function to fetch users from a specific table
    const fetchUsersFromTable = async (
      tableName,
      profileTable,
      userTypeValue
    ) => {
      try {
        let query = supabase.from(tableName).select("*");

        // Apply filters
        if (isActive !== undefined) {
          query = query.eq("is_active", isActive === "true");
        }
        if (isVerified !== undefined) {
          query = query.eq("is_verified", isVerified === "true");
        }

        const { data: users, error } = await query;
        if (error) throw error;

        // If there's a profile table, fetch profile data using email
        let usersWithProfiles = users;
        if (profileTable && users.length > 0) {
          const userEmails = users
            .map((user) => user.email)
            .filter((email) => email);
          const { data: profiles, error: profileError } = await supabase
            .from(profileTable)
            .select(
              "email, first_name, last_name, phone_number, profile_picture"
            )
            .in("email", userEmails);

          if (!profileError && profiles) {
            // Merge users with their profiles using email
            usersWithProfiles = users.map((user) => {
              const profile = profiles.find((p) => p.email === user.email);
              return {
                ...user,
                first_name: profile?.first_name || null,
                last_name: profile?.last_name || null,
                phone_number:
                  profile?.phone_number || user.phone_number || null,
                // profile_picture: profile?.profile_picture || null,
                user_type: userTypeValue,
              };
            });
          }
        } else {
          // For tables without profiles (admin, tourist)
          usersWithProfiles = users.map((user) => ({
            ...user,
            first_name: user.first_name || null,
            last_name: user.last_name || null,
            user_type: userTypeValue,
          }));
        }

        return usersWithProfiles;
      } catch (error) {
        console.error(`Error fetching from ${tableName}:`, error);
        return [];
      }
    };

    // Fetch users from all tables based on userType filter
    if (!userType || userType === "admin") {
      const adminUsers = await fetchUsersFromTable(
        "admin_accounts",
        null,
        "admin"
      );
      allUsers = [...allUsers, ...adminUsers];
    }

    if (!userType || userType === "driver") {
      const driverUsers = await fetchUsersFromTable(
        "driver_accounts",
        "driver_profiles",
        "driver"
      );
      allUsers = [...allUsers, ...driverUsers];
    }

    if (!userType || userType === "guide") {
      const guideUsers = await fetchUsersFromTable(
        "guide_accounts",
        "guide_profiles",
        "guide"
      );
      allUsers = [...allUsers, ...guideUsers];
    }

    if (!userType || userType === "support") {
      const supportUsers = await fetchUsersFromTable(
        "support_accounts",
        "support_profiles",
        "support"
      );
      allUsers = [...allUsers, ...supportUsers];
    }

    if (!userType || userType === "tourist") {
      const touristUsers = await fetchUsersFromTable(
        "tourist_accounts",
        "tourist_profiles",
        "tourist"
      );
      allUsers = [...allUsers, ...touristUsers];
    }

    // Apply search filter
    if (search) {
      const searchLower = search.toLowerCase();
      allUsers = allUsers.filter(
        (user) =>
          (user.first_name &&
            user.first_name.toLowerCase().includes(searchLower)) ||
          (user.last_name &&
            user.last_name.toLowerCase().includes(searchLower)) ||
          (user.email && user.email.toLowerCase().includes(searchLower))
      );
    }

    // Sort users
    const validSortFields = [
      "created_at",
      "updated_at",
      "first_name",
      "last_name",
      "email",
      "user_type",
      "is_active",
      "is_verified",
    ];
    const sortField = validSortFields.includes(sortBy) ? sortBy : "created_at";
    const sortDirection = sortOrder.toLowerCase() === "asc" ? 1 : -1;

    allUsers.sort((a, b) => {
      let aVal = a[sortField] || "";
      let bVal = b[sortField] || "";

      if (sortField === "created_at" || sortField === "updated_at") {
        aVal = new Date(aVal);
        bVal = new Date(bVal);
      } else if (typeof aVal === "string") {
        aVal = aVal.toLowerCase();
        bVal = bVal.toLowerCase();
      }

      if (aVal < bVal) return -1 * sortDirection;
      if (aVal > bVal) return 1 * sortDirection;
      return 0;
    });

    // Calculate pagination
    const totalCount = allUsers.length;
    const totalPages = Math.ceil(totalCount / limit);
    const paginatedUsers = allUsers.slice(offset, offset + parseInt(limit));

    // Format response data
    const formattedUsers = paginatedUsers.map((user) => ({
      id: user.id || user.user_id,
      email: user.email,
      first_name: user.first_name,
      last_name: user.last_name,
      phone_number: user.phone_number,
      profile_picture: user.profile_picture,
      is_active: user.is_active,
      is_verified: user.is_verified,
      user_type: user.user_type,
      created_at: user.created_at,
      updated_at: user.updated_at,
    }));

    res.status(200).json({
      success: true,
      data: {
        users: formattedUsers,
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
    console.error("Error in getAllUsers:", error);
    next(error);
  }
};

// @desc    Get user by ID
// @route   GET /api/admin/users/:id
// @access  Private
const getUserById = async (req, res, next) => {
  try {
    const { id } = req.params;
    let user = null;
    let userType = null;

    // Helper function to search for user in a specific table
    const findUserInTable = async (tableName, profileTable = null, type) => {
      try {
        const { data: userData, error } = await supabase
          .from(tableName)
          .select("*")
          .eq("id", id)
          .single();

        if (error && error.code !== "PGRST116") {
          // PGRST116 is "not found" error
          throw error;
        }

        if (userData) {
          let userWithProfile = { ...userData, user_type: type };

          // If there's a profile table, fetch profile data
          if (profileTable) {
            const { data: profile, error: profileError } = await supabase
              .from(profileTable)
              .select("first_name, last_name, phone_number, profile_picture")
              .eq("user_id", id)
              .single();

            if (!profileError && profile) {
              userWithProfile = {
                ...userWithProfile,
                first_name: profile.first_name,
                last_name: profile.last_name,
                phone_number:
                  profile.phone_number || userWithProfile.phone_number,
                profile_picture: profile.profile_picture,
              };
            }
          }

          return userWithProfile;
        }
        return null;
      } catch (error) {
        console.error(`Error searching in ${tableName}:`, error);
        return null;
      }
    };

    // Search in all user tables
    const searchPromises = [
      findUserInTable("admin_accounts", null, "admin"),
      findUserInTable("driver_accounts", "driver_profiles", "driver"),
      findUserInTable("guide_accounts", "guide_profiles", "guide"),
      findUserInTable("support_accounts", "support_profiles", "support"),
      findUserInTable("tourist_accounts", null, "tourist"),
    ];

    const results = await Promise.all(searchPromises);
    user = results.find((result) => result !== null);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // Format response data
    const formattedUser = {
      id: user.id || user.user_id,
      email: user.email,
      first_name: user.first_name,
      last_name: user.last_name,
      phone_number: user.phone_number,
      profile_picture: user.profile_picture,
      is_active: user.is_active,
      is_verified: user.is_verified,
      user_type: user.user_type,
      created_at: user.created_at,
      updated_at: user.updated_at,
    };

    res.status(200).json({
      success: true,
      data: {
        user: formattedUser,
      },
    });
  } catch (error) {
    console.error("Error in getUserById:", error);
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

    // Helper function to find user in tables and get table info
    const findUserTable = async (userId) => {
      const tables = [
        { name: "admin_accounts", profile: null, type: "admin" },
        { name: "driver_accounts", profile: "driver_profiles", type: "driver" },
        { name: "guide_accounts", profile: "guide_profiles", type: "guide" },
        {
          name: "support_accounts",
          profile: "support_profiles",
          type: "support",
        },
        { name: "tourist_accounts", profile: null, type: "tourist" },
      ];

      for (const table of tables) {
        const { data, error } = await supabase
          .from(table.name)
          .select("id, email")
          .eq("id", userId)
          .single();

        if (!error && data) {
          return { ...table, userData: data };
        }
      }
      return null;
    };

    // Find which table the user belongs to
    const userTableInfo = await findUserTable(id);
    if (!userTableInfo) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // Prepare update data for account table
    const accountUpdates = {};
    const profileUpdates = {};

    // Separate fields between account and profile tables
    const accountFields = ["email", "is_active", "is_verified", "phone_number"];
    const profileFields = [
      "first_name",
      "last_name",
      "phone_number",
      "profile_picture",
    ];

    Object.keys(value).forEach((key) => {
      if (accountFields.includes(key)) {
        accountUpdates[key] = value[key];
      }
      if (profileFields.includes(key) && userTableInfo.profile) {
        profileUpdates[key] = value[key];
      }
      // For tables without profiles (admin, tourist), handle name fields in main table
      if (
        !userTableInfo.profile &&
        (key === "first_name" || key === "last_name")
      ) {
        accountUpdates[key] = value[key];
      }
    });

    // Add updated_at timestamp
    accountUpdates.updated_at = new Date().toISOString();

    let updatedUser = null;

    // Update account table
    if (Object.keys(accountUpdates).length > 0) {
      const { data: accountData, error: accountError } = await supabase
        .from(userTableInfo.name)
        .update(accountUpdates)
        .eq("id", id)
        .select("*")
        .single();

      if (accountError) {
        throw accountError;
      }
      updatedUser = accountData;
    }

    // Update profile table if exists and has profile updates
    if (userTableInfo.profile && Object.keys(profileUpdates).length > 0) {
      const { data: profileData, error: profileError } = await supabase
        .from(userTableInfo.profile)
        .update(profileUpdates)
        .eq("user_id", id)
        .select("*")
        .single();

      if (profileError) {
        // If profile doesn't exist, create it
        if (profileError.code === "PGRST116") {
          const { data: newProfileData, error: createError } = await supabase
            .from(userTableInfo.profile)
            .insert({ user_id: id, ...profileUpdates })
            .select("*")
            .single();

          if (createError) {
            throw createError;
          }
        } else {
          throw profileError;
        }
      }
    }

    // Fetch complete updated user data
    let completeUser = updatedUser || userTableInfo.userData;

    if (userTableInfo.profile) {
      const { data: profileData } = await supabase
        .from(userTableInfo.profile)
        .select("first_name, last_name, phone_number, profile_picture")
        .eq("user_id", id)
        .single();

      if (profileData) {
        completeUser = {
          ...completeUser,
          first_name: profileData.first_name,
          last_name: profileData.last_name,
          phone_number: profileData.phone_number || completeUser.phone_number,
          profile_picture: profileData.profile_picture,
        };
      }
    }

    // Format response
    const formattedUser = {
      id: completeUser.id,
      email: completeUser.email,
      first_name: completeUser.first_name,
      last_name: completeUser.last_name,
      phone_number: completeUser.phone_number,
      profile_picture: completeUser.profile_picture,
      is_active: completeUser.is_active,
      is_verified: completeUser.is_verified,
      user_type: userTableInfo.type,
      created_at: completeUser.created_at,
      updated_at: completeUser.updated_at,
    };

    logger.info(`User updated: ${userTableInfo.userData.email}`);

    res.status(200).json({
      success: true,
      message: "User updated successfully",
      data: {
        user: formattedUser,
      },
    });
  } catch (error) {
    console.error("Error in updateUser:", error);
    next(error);
  }
};

// @desc    Delete user (soft delete)
// @route   DELETE /api/admin/users/:id
// @access  Private
const deleteUser = async (req, res, next) => {
  try {
    const { id } = req.params;

    // Helper function to find user in tables
    const findUserTable = async (userId) => {
      const tables = [
        { name: "admin_accounts", type: "admin" },
        { name: "driver_accounts", type: "driver" },
        { name: "guide_accounts", type: "guide" },
        { name: "support_accounts", type: "support" },
        { name: "tourist_accounts", type: "tourist" },
      ];

      for (const table of tables) {
        const { data, error } = await supabase
          .from(table.name)
          .select("id, email")
          .eq("id", userId)
          .single();

        if (!error && data) {
          return { ...table, userData: data };
        }
      }
      return null;
    };

    // Find which table the user belongs to
    const userTableInfo = await findUserTable(id);
    if (!userTableInfo) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // Soft delete user by setting is_active to false
    // Note: In the new schema, we use is_active instead of deleted_at
    const { error } = await supabase
      .from(userTableInfo.name)
      .update({
        is_active: false,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id);

    if (error) {
      throw error;
    }

    logger.info(`User deleted: ${userTableInfo.userData.email}`);

    res.status(200).json({
      success: true,
      message: "User deleted successfully",
    });
  } catch (error) {
    console.error("Error in deleteUser:", error);
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

    // Helper function to find user in tables
    const findUserTable = async (userId) => {
      const tables = [
        { name: "admin_accounts", type: "admin" },
        { name: "driver_accounts", type: "driver" },
        { name: "guide_accounts", type: "guide" },
        { name: "support_accounts", type: "support" },
        { name: "tourist_accounts", type: "tourist" },
      ];

      for (const table of tables) {
        const { data, error } = await supabase
          .from(table.name)
          .select("id, email")
          .eq("id", userId)
          .single();

        if (!error && data) {
          return { ...table, userData: data };
        }
      }
      return null;
    };

    // Find which table the user belongs to
    const userTableInfo = await findUserTable(id);
    if (!userTableInfo) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // Update status
    const { data: updatedUser, error } = await supabase
      .from(userTableInfo.name)
      .update({
        is_active: isActive,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .select("*")
      .single();

    if (error) {
      throw error;
    }

    // Format response
    const formattedUser = {
      id: updatedUser.id,
      email: updatedUser.email,
      first_name: updatedUser.first_name,
      last_name: updatedUser.last_name,
      phone_number: updatedUser.phone_number,
      profile_picture: updatedUser.profile_picture,
      is_active: updatedUser.is_active,
      is_verified: updatedUser.is_verified,
      user_type: userTableInfo.type,
      created_at: updatedUser.created_at,
      updated_at: updatedUser.updated_at,
    };

    logger.info(
      `User ${isActive ? "activated" : "deactivated"}: ${
        userTableInfo.userData.email
      }`
    );

    res.status(200).json({
      success: true,
      message: `User ${isActive ? "activated" : "deactivated"} successfully`,
      data: {
        user: formattedUser,
      },
    });
  } catch (error) {
    console.error("Error in toggleUserStatus:", error);
    next(error);
  }
};

// @desc    Get user statistics
// @route   GET /api/admin/users/stats
// @access  Private
const getUserStats = async (req, res, next) => {
  try {
    // Get counts from all user tables
    const tableQueries = [
      { name: "admin_accounts", type: "admin" },
      { name: "driver_accounts", type: "driver" },
      { name: "guide_accounts", type: "guide" },
      { name: "support_accounts", type: "support" },
      { name: "tourist_accounts", type: "tourist" },
    ];

    const statsPromises = tableQueries.map(async (table) => {
      const { data, error, count } = await supabase
        .from(table.name)
        .select("id, is_active, is_verified", { count: "exact", head: true });

      if (error) {
        console.error(`Error getting stats from ${table.name}:`, error);
        return {
          type: table.type,
          total: 0,
          active: 0,
          verified: 0,
        };
      }

      // Get detailed counts
      const { data: allUsers, error: allError } = await supabase
        .from(table.name)
        .select("is_active, is_verified");

      if (allError) {
        console.error(
          `Error getting detailed stats from ${table.name}:`,
          allError
        );
        return {
          type: table.type,
          total: count || 0,
          active: 0,
          verified: 0,
        };
      }

      const active = allUsers.filter((user) => user.is_active).length;
      const verified = allUsers.filter((user) => user.is_verified).length;

      return {
        type: table.type,
        total: count || 0,
        active,
        verified,
      };
    });

    const statsResults = await Promise.all(statsPromises);

    // Aggregate results
    const totalUsers = statsResults.reduce((sum, stat) => sum + stat.total, 0);
    const activeUsers = statsResults.reduce(
      (sum, stat) => sum + stat.active,
      0
    );
    const verifiedUsers = statsResults.reduce(
      (sum, stat) => sum + stat.verified,
      0
    );

    const userTypes = {};
    statsResults.forEach((stat) => {
      userTypes[stat.type] = stat.total;
    });

    res.status(200).json({
      success: true,
      data: {
        totalUsers,
        activeUsers,
        inactiveUsers: totalUsers - activeUsers,
        verifiedUsers,
        unverifiedUsers: totalUsers - verifiedUsers,
        userTypes,
      },
    });
  } catch (error) {
    console.error("Error in getUserStats:", error);
    next(error);
  }
};

// @desc    Get total user count from all user account tables
// @route   GET /api/admin/users/total-count
// @access  Private
const getTotalUserCount = async (req, res, next) => {
  try {
    // Get count from all user account tables using Supabase
    const tableQueries = [
      { name: "admin_accounts", type: "admin" },
      { name: "driver_accounts", type: "driver" },
      { name: "guide_accounts", type: "guide" },
      { name: "support_accounts", type: "support" },
      { name: "tourist_accounts", type: "tourist" },
    ];

    const countPromises = tableQueries.map(async (table) => {
      const { count, error } = await supabase
        .from(table.name)
        .select("id", { count: "exact", head: true });

      if (error) {
        console.error(`Error counting ${table.name}:`, error);
        return { type: table.type, count: 0 };
      }

      return { type: table.type, count: count || 0 };
    });

    const results = await Promise.all(countPromises);

    // Calculate totals
    const breakdown = {};
    let totalUsers = 0;

    results.forEach((result) => {
      const key = `${result.type}Accounts`;
      breakdown[key] = result.count;
      totalUsers += result.count;
    });

    logger.info("Total user count retrieved from all account tables");
    console.log("User count breakdown:", breakdown);

    res.status(200).json({
      success: true,
      data: {
        totalUsers,
        breakdown,
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    logger.error("Error getting total user count:", error);
    console.error("Error in getTotalUserCount:", error);
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
