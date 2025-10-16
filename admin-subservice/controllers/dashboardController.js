const { Admin } = require("../models/Admin");
const { executeQuery } = require("../config/postgresql");
const { logger } = require("../middlewares/errorHandler");

// @desc    Get dashboard statistics
// @route   GET /api/admin/dashboard
// @access  Private
const getDashboardStats = async (req, res, next) => {
  try {
    // Get current date and date ranges
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const thisWeek = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
    const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);

    // User statistics using raw SQL
    const userStatsQuery = `
      SELECT 
        COUNT(*) as total_users,
        COUNT(CASE WHEN is_active = true THEN 1 END) as active_users,
        COUNT(CASE WHEN is_verified = true THEN 1 END) as verified_users,
        COUNT(CASE WHEN created_at >= $1 THEN 1 END) as new_users_today,
        COUNT(CASE WHEN created_at >= $2 THEN 1 END) as new_users_this_week,
        COUNT(CASE WHEN created_at >= $3 THEN 1 END) as new_users_this_month,
        COUNT(CASE WHEN created_at >= $4 AND created_at < $3 THEN 1 END) as new_users_last_month,
        COUNT(CASE WHEN user_type = 'tourist' THEN 1 END) as tourists,
        COUNT(CASE WHEN user_type = 'driver' THEN 1 END) as drivers,
        COUNT(CASE WHEN user_type = 'guide' THEN 1 END) as guides
      FROM users 
      WHERE deleted_at IS NULL
    `;

    const userStatsResult = await executeQuery(userStatsQuery, [
      today.toISOString(),
      thisWeek.toISOString(),
      thisMonth.toISOString(),
      lastMonth.toISOString(),
    ]);

    const userStats = userStatsResult[0];

    // Admin statistics
    const adminStats = await Promise.all([
      Admin.countDocuments(),
      Admin.countDocuments({ isActive: true }),
      Admin.countDocuments({ role: "super_admin" }),
      Admin.countDocuments({ role: "admin" }),
      Admin.countDocuments({ role: "moderator" }),
    ]);

    const [totalAdmins, activeAdmins, superAdmins, admins, moderators] =
      adminStats;

    // Role and Permission statistics
    const rolePermissionQuery = `
      SELECT 
        COUNT(*) as total_roles,
        COUNT(CASE WHEN is_active = true THEN 1 END) as active_roles
      FROM roles
    `;

    const permissionQuery = `
      SELECT COUNT(*) as total_permissions FROM permissions
    `;

    const [roleStats, permissionStats] = await Promise.all([
      executeQuery(rolePermissionQuery),
      executeQuery(permissionQuery),
    ]);

    // Recent users (last 10)
    const recentUsersQuery = `
      SELECT 
        id, first_name, last_name, email, user_type, is_active, created_at
      FROM users 
      WHERE deleted_at IS NULL
      ORDER BY created_at DESC 
      LIMIT 10
    `;

    const recentUsers = await executeQuery(recentUsersQuery);

    // User growth data for the last 30 days
    const userGrowthQuery = `
      SELECT 
        DATE(created_at) as date,
        COUNT(*) as count
      FROM users 
      WHERE created_at >= $1 AND deleted_at IS NULL
      GROUP BY DATE(created_at)
      ORDER BY DATE(created_at) ASC
    `;

    const thirtyDaysAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);
    const userGrowthData = await executeQuery(userGrowthQuery, [
      thirtyDaysAgo.toISOString(),
    ]);

    // Calculate growth percentages
    const newUsersThisMonth = parseInt(userStats.new_users_this_month);
    const newUsersLastMonth = parseInt(userStats.new_users_last_month);
    const userGrowthPercentage =
      newUsersLastMonth > 0
        ? (
            ((newUsersThisMonth - newUsersLastMonth) / newUsersLastMonth) *
            100
          ).toFixed(1)
        : newUsersThisMonth > 0
        ? 100
        : 0;

    const response = {
      success: true,
      data: {
        overview: {
          totalUsers: parseInt(userStats.total_users),
          activeUsers: parseInt(userStats.active_users),
          inactiveUsers:
            parseInt(userStats.total_users) - parseInt(userStats.active_users),
          verifiedUsers: parseInt(userStats.verified_users),
          unverifiedUsers:
            parseInt(userStats.total_users) -
            parseInt(userStats.verified_users),
          totalAdmins,
          activeAdmins,
          totalRoles: parseInt(roleStats[0].total_roles),
          activeRoles: parseInt(roleStats[0].active_roles),
          totalPermissions: parseInt(permissionStats[0].total_permissions),
        },
        userStats: {
          newUsersToday: parseInt(userStats.new_users_today),
          newUsersThisWeek: parseInt(userStats.new_users_this_week),
          newUsersThisMonth,
          newUsersLastMonth,
          userGrowthPercentage: parseFloat(userGrowthPercentage),
          userTypes: {
            tourists: parseInt(userStats.tourists),
            drivers: parseInt(userStats.drivers),
            guides: parseInt(userStats.guides),
          },
        },
        adminStats: {
          breakdown: {
            superAdmins,
            admins,
            moderators,
          },
        },
        recentUsers,
        userGrowthData,
        lastUpdated: new Date().toISOString(),
      },
    };

    res.status(200).json(response);
  } catch (error) {
    next(error);
  }
};

// @desc    Get system health status
// @route   GET /api/admin/dashboard/health
// @access  Private
const getSystemHealth = async (req, res, next) => {
  try {
    const health = {
      status: "healthy",
      timestamp: new Date().toISOString(),
      services: {},
    };

    // Check MongoDB connection
    try {
      await Admin.findOne().limit(1);
      health.services.mongodb = {
        status: "healthy",
        message: "Connected",
      };
    } catch (error) {
      health.services.mongodb = {
        status: "unhealthy",
        message: error.message,
      };
      health.status = "degraded";
    }

    // Check PostgreSQL connection
    try {
      await executeQuery("SELECT 1 as test");
      health.services.postgresql = {
        status: "healthy",
        message: "Connected",
      };
    } catch (error) {
      health.services.postgresql = {
        status: "unhealthy",
        message: error.message,
      };
      health.status = "degraded";
    }

    res.status(200).json({
      success: true,
      data: health,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get detailed analytics
// @route   GET /api/admin/dashboard/analytics
// @access  Private
const getAnalytics = async (req, res, next) => {
  try {
    const { period = "30d" } = req.query;

    let days;
    switch (period) {
      case "7d":
        days = 7;
        break;
      case "30d":
        days = 30;
        break;
      case "90d":
        days = 90;
        break;
      default:
        days = 30;
    }

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    // User registration trends
    const registrationTrendsQuery = `
      SELECT 
        DATE(created_at) as date,
        COUNT(*) as count,
        user_type
      FROM users 
      WHERE created_at >= $1 AND deleted_at IS NULL
      GROUP BY DATE(created_at), user_type
      ORDER BY DATE(created_at) ASC
    `;

    const registrationTrends = await executeQuery(registrationTrendsQuery, [
      startDate.toISOString(),
    ]);

    // User activity by country (if country data exists)
    const usersByCountryQuery = `
      SELECT 
        country,
        COUNT(*) as count
      FROM users 
      WHERE country IS NOT NULL AND deleted_at IS NULL
      GROUP BY country
      ORDER BY COUNT(*) DESC
      LIMIT 10
    `;

    const usersByCountry = await executeQuery(usersByCountryQuery);

    res.status(200).json({
      success: true,
      data: {
        period,
        registrationTrends,
        usersByCountry,
      },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getDashboardStats,
  getSystemHealth,
  getAnalytics,
};
