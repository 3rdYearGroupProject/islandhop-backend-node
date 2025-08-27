const { User } = require("../models/User");
const { Admin } = require("../models/Admin");
const { Role, Permission } = require("../models/Role");
const { logger } = require("../middlewares/errorHandler");
const { Op, sequelize } = require("sequelize");
const { sequelize: dbSequelize } = require("../config/postgresql");

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

    // User statistics
    const userStats = await Promise.all([
      // Total users
      User.count(),
      // Active users
      User.count({ where: { isActive: true } }),
      // Verified users
      User.count({ where: { isVerified: true } }),
      // New users today
      User.count({ where: { createdAt: { [Op.gte]: today } } }),
      // New users this week
      User.count({ where: { createdAt: { [Op.gte]: thisWeek } } }),
      // New users this month
      User.count({ where: { createdAt: { [Op.gte]: thisMonth } } }),
      // New users last month
      User.count({
        where: {
          createdAt: {
            [Op.gte]: lastMonth,
            [Op.lt]: thisMonth,
          },
        },
      }),
    ]);

    const [
      totalUsers,
      activeUsers,
      verifiedUsers,
      newUsersToday,
      newUsersThisWeek,
      newUsersThisMonth,
      newUsersLastMonth,
    ] = userStats;

    // User type breakdown
    const userTypeStats = await Promise.all([
      User.count({ where: { userType: "tourist" } }),
      User.count({ where: { userType: "driver" } }),
      User.count({ where: { userType: "guide" } }),
    ]);

    const [tourists, drivers, guides] = userTypeStats;

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
    const rolePermissionStats = await Promise.all([
      Role.count(),
      Permission.count(),
      Role.count({ where: { isActive: true } }),
    ]);

    const [totalRoles, totalPermissions, activeRoles] = rolePermissionStats;

    // Recent users (last 10)
    const recentUsers = await User.findAll({
      limit: 10,
      order: [["createdAt", "DESC"]],
      attributes: [
        "id",
        "firstName",
        "lastName",
        "email",
        "userType",
        "isActive",
        "createdAt",
      ],
    });

    // User growth data for the last 30 days
    const userGrowthData = [];
    for (let i = 29; i >= 0; i--) {
      const date = new Date(today.getTime() - i * 24 * 60 * 60 * 1000);
      const nextDate = new Date(date.getTime() + 24 * 60 * 60 * 1000);

      const count = await User.count({
        where: {
          createdAt: {
            [Op.gte]: date,
            [Op.lt]: nextDate,
          },
        },
      });

      userGrowthData.push({
        date: date.toISOString().split("T")[0],
        count,
      });
    }

    // Calculate growth percentages
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
          totalUsers,
          activeUsers,
          inactiveUsers: totalUsers - activeUsers,
          verifiedUsers,
          unverifiedUsers: totalUsers - verifiedUsers,
          totalAdmins,
          activeAdmins,
          totalRoles,
          activeRoles,
          totalPermissions,
        },
        userStats: {
          newUsersToday,
          newUsersThisWeek,
          newUsersThisMonth,
          newUsersLastMonth,
          userGrowthPercentage: parseFloat(userGrowthPercentage),
          userTypes: {
            tourists,
            drivers,
            guides,
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
      await User.findOne({ limit: 1 });
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
    const registrationTrends = await User.findAll({
      attributes: [
        [dbSequelize.fn("DATE", dbSequelize.col("createdAt")), "date"],
        [dbSequelize.fn("COUNT", dbSequelize.col("id")), "count"],
        "userType",
      ],
      where: {
        createdAt: {
          [Op.gte]: startDate,
        },
      },
      group: [dbSequelize.fn("DATE", dbSequelize.col("createdAt")), "userType"],
      order: [[dbSequelize.fn("DATE", dbSequelize.col("createdAt")), "ASC"]],
    });

    // User activity by country (if country data exists)
    const usersByCountry = await User.findAll({
      attributes: [
        "country",
        [dbSequelize.fn("COUNT", dbSequelize.col("id")), "count"],
      ],
      where: {
        country: {
          [Op.ne]: null,
        },
      },
      group: ["country"],
      order: [[dbSequelize.fn("COUNT", dbSequelize.col("id")), "DESC"]],
      limit: 10,
    });

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
