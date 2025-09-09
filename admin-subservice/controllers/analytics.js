const mongoose = require("mongoose");
const logger = require("../config/logger");
const { supabase } = require("../config/postgresql");

// Create a connection to the 'islandhop_trips' database
const tripsDb = mongoose.createConnection(
  process.env.MONGODB_URI.replace(/\/[^\/]*$/, "/islandhop_trips")
);

// Define schema for payed_finished_trips collection
const PayedFinishedTripSchema = new mongoose.Schema(
  {},
  { strict: false, collection: "payed_finished_trips" }
);
const PayedFinishedTrip = tripsDb.model(
  "PayedFinishedTrip",
  PayedFinishedTripSchema
);

// Define schema for initiated_trips collection (moved outside function to prevent recompilation)
const InitiatedTripSchema = new mongoose.Schema(
  {},
  { strict: false, collection: "initiated_trips" }
);

// Function to get or create InitiatedTrip model safely
const getInitiatedTripModel = () => {
  try {
    // Try to get existing model first
    return tripsDb.model("InitiatedTrip");
  } catch (error) {
    // If model doesn't exist, create it
    return tripsDb.model("InitiatedTrip", InitiatedTripSchema);
  }
};

/**
 * Get payment details from payed_finished_trips collection
 */
const getPaymentDetails = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      startDate,
      endDate,
      paymentStatus,
      tripType,
      minAmount,
      maxAmount,
    } = req.query;

    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Build query filter
    const filter = {};

    // Date range filter
    if (startDate || endDate) {
      filter.createdAt = {};
      if (startDate) {
        filter.createdAt.$gte = new Date(startDate);
      }
      if (endDate) {
        filter.createdAt.$lte = new Date(endDate);
      }
    }

    // Payment status filter
    if (paymentStatus) {
      filter.paymentStatus = paymentStatus;
    }

    // Trip type filter
    if (tripType) {
      filter.tripType = tripType;
    }

    // Amount range filter
    if (minAmount || maxAmount) {
      filter.totalAmount = {};
      if (minAmount) {
        filter.totalAmount.$gte = parseFloat(minAmount);
      }
      if (maxAmount) {
        filter.totalAmount.$lte = parseFloat(maxAmount);
      }
    }

    // Get payment details with pagination
    const payments = await PayedFinishedTrip.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .lean();

    // Get total count for pagination
    const totalCount = await PayedFinishedTrip.countDocuments(filter);

    // Calculate pagination info
    const totalPages = Math.ceil(totalCount / parseInt(limit));
    const hasNextPage = parseInt(page) < totalPages;
    const hasPrevPage = parseInt(page) > 1;

    logger.info(
      `Retrieved ${payments.length} payment records from payed_finished_trips`
    );

    res.status(200).json({
      success: true,
      message: "Payment details retrieved successfully",
      data: {
        payments,
        pagination: {
          currentPage: parseInt(page),
          totalPages,
          totalCount,
          limit: parseInt(limit),
          hasNextPage,
          hasPrevPage,
        },
      },
    });
  } catch (error) {
    logger.error("Error fetching payment details:", error);
    res.status(500).json({
      success: false,
      message: "Failed to retrieve payment details",
      error: error.message,
    });
  }
};

/**
 * Get payment statistics from payed_finished_trips collection
 */
const getPaymentStats = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    // Build match stage for date filtering
    const matchStage = {};
    if (startDate || endDate) {
      matchStage.createdAt = {};
      if (startDate) {
        matchStage.createdAt.$gte = new Date(startDate);
      }
      if (endDate) {
        matchStage.createdAt.$lte = new Date(endDate);
      }
    }

    // Aggregation pipeline for payment statistics
    const pipeline = [
      ...(Object.keys(matchStage).length > 0 ? [{ $match: matchStage }] : []),
      {
        $group: {
          _id: null,
          totalPayments: { $sum: 1 },
          totalRevenue: { $sum: "$totalAmount" },
          avgPaymentAmount: { $avg: "$totalAmount" },
          maxPayment: { $max: "$totalAmount" },
          minPayment: { $min: "$totalAmount" },
        },
      },
    ];

    const stats = await PayedFinishedTrip.aggregate(pipeline);

    // Get payment status breakdown
    const statusPipeline = [
      ...(Object.keys(matchStage).length > 0 ? [{ $match: matchStage }] : []),
      {
        $group: {
          _id: "$paymentStatus",
          count: { $sum: 1 },
          totalAmount: { $sum: "$totalAmount" },
        },
      },
    ];

    const statusBreakdown = await PayedFinishedTrip.aggregate(statusPipeline);

    // Get trip type breakdown
    const tripTypePipeline = [
      ...(Object.keys(matchStage).length > 0 ? [{ $match: matchStage }] : []),
      {
        $group: {
          _id: "$tripType",
          count: { $sum: 1 },
          totalAmount: { $sum: "$totalAmount" },
        },
      },
    ];

    const tripTypeBreakdown = await PayedFinishedTrip.aggregate(
      tripTypePipeline
    );

    logger.info("Payment statistics retrieved successfully");

    res.status(200).json({
      success: true,
      message: "Payment statistics retrieved successfully",
      data: {
        overview: stats[0] || {
          totalPayments: 0,
          totalRevenue: 0,
          avgPaymentAmount: 0,
          maxPayment: 0,
          minPayment: 0,
        },
        paymentStatusBreakdown: statusBreakdown,
        tripTypeBreakdown: tripTypeBreakdown,
      },
    });
  } catch (error) {
    logger.error("Error fetching payment statistics:", error);
    res.status(500).json({
      success: false,
      message: "Failed to retrieve payment statistics",
      error: error.message,
    });
  }
};

/**
 * Get payment details by trip ID
 */
const getPaymentByTripId = async (req, res) => {
  try {
    const { tripId } = req.params;

    if (!tripId) {
      return res.status(400).json({
        success: false,
        message: "Trip ID is required",
      });
    }

    const payment = await PayedFinishedTrip.findOne({ tripId }).lean();

    if (!payment) {
      return res.status(404).json({
        success: false,
        message: "Payment details not found for the specified trip",
      });
    }

    logger.info(`Payment details retrieved for trip ID: ${tripId}`);

    res.status(200).json({
      success: true,
      message: "Payment details retrieved successfully",
      data: payment,
    });
  } catch (error) {
    logger.error(
      `Error fetching payment details for trip ID ${req.params.tripId}:`,
      error
    );
    res.status(500).json({
      success: false,
      message: "Failed to retrieve payment details",
      error: error.message,
    });
  }
};

/**
 * Get daily payment summary for a date range
 */
const getDailyPaymentSummary = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    if (!startDate || !endDate) {
      return res.status(400).json({
        success: false,
        message: "Start date and end date are required",
      });
    }

    const pipeline = [
      {
        $match: {
          createdAt: {
            $gte: new Date(startDate),
            $lte: new Date(endDate),
          },
        },
      },
      {
        $group: {
          _id: {
            $dateToString: {
              format: "%Y-%m-%d",
              date: "$createdAt",
            },
          },
          totalPayments: { $sum: 1 },
          totalRevenue: { $sum: "$totalAmount" },
          avgPayment: { $avg: "$totalAmount" },
        },
      },
      {
        $sort: { _id: 1 },
      },
    ];

    const dailySummary = await PayedFinishedTrip.aggregate(pipeline);

    logger.info(
      `Daily payment summary retrieved for ${startDate} to ${endDate}`
    );

    res.status(200).json({
      success: true,
      message: "Daily payment summary retrieved successfully",
      data: dailySummary,
    });
  } catch (error) {
    logger.error("Error fetching daily payment summary:", error);
    res.status(500).json({
      success: false,
      message: "Failed to retrieve daily payment summary",
      error: error.message,
    });
  }
};

/**
 * Get monthly revenue summary with trips count from initiated_trips collection
 */
const getMonthlyRevenue = async (req, res) => {
  try {
    const { year, startMonth, endMonth } = req.query;

    // Default to current year if not provided
    const targetYear = year ? parseInt(year) : new Date().getFullYear();

    // Build date filter for the year
    const startDate = new Date(targetYear, 0, 1); // January 1st
    const endDate = new Date(targetYear + 1, 0, 1); // January 1st of next year

    // Get the InitiatedTrip model safely
    const InitiatedTrip = getInitiatedTripModel();

    // Aggregation pipeline for monthly revenue from payed_finished_trips
    const revenuePipeline = [
      {
        $match: {
          createdAt: {
            $gte: startDate,
            $lt: endDate,
          },
        },
      },
      {
        $group: {
          _id: {
            year: { $year: "$createdAt" },
            month: { $month: "$createdAt" },
          },
          totalRevenue: { $sum: "$payedAmount" },
          totalPaidTrips: { $sum: 1 },
          averageAmount: { $avg: "$payedAmount" },
          maxAmount: { $max: "$payedAmount" },
          minAmount: { $min: "$payedAmount" },
        },
      },
      {
        $sort: {
          "_id.year": 1,
          "_id.month": 1,
        },
      },
    ];

    // Aggregation pipeline for monthly trips count from initiated_trips
    const tripsPipeline = [
      {
        $match: {
          createdAt: {
            $gte: startDate,
            $lt: endDate,
          },
        },
      },
      {
        $group: {
          _id: {
            year: { $year: "$createdAt" },
            month: { $month: "$createdAt" },
          },
          totalTrips: { $sum: 1 },
        },
      },
      {
        $sort: {
          "_id.year": 1,
          "_id.month": 1,
        },
      },
    ];

    // Apply month range filter if provided
    if (startMonth || endMonth) {
      const monthFilter = {};
      if (startMonth) {
        monthFilter.$gte = parseInt(startMonth);
      }
      if (endMonth) {
        monthFilter.$lte = parseInt(endMonth);
      }

      // Add month filter to revenue pipeline
      revenuePipeline.splice(1, 0, {
        $addFields: {
          month: { $month: "$createdAt" },
        },
      });
      revenuePipeline.splice(2, 0, {
        $match: {
          month: monthFilter,
        },
      });

      // Add month filter to trips pipeline
      tripsPipeline.splice(1, 0, {
        $addFields: {
          month: { $month: "$createdAt" },
        },
      });
      tripsPipeline.splice(2, 0, {
        $match: {
          month: monthFilter,
        },
      });
    }

    // Execute both pipelines
    const [monthlyRevenue, monthlyTrips] = await Promise.all([
      PayedFinishedTrip.aggregate(revenuePipeline),
      InitiatedTrip.aggregate(tripsPipeline),
    ]);

    // Create a map for trips data
    const tripsMap = new Map();
    monthlyTrips.forEach((trip) => {
      const key = `${trip._id.year}-${trip._id.month}`;
      tripsMap.set(key, trip.totalTrips);
    });

    // Merge revenue and trips data
    const combinedData = monthlyRevenue.map((revenue) => {
      const key = `${revenue._id.year}-${revenue._id.month}`;
      const totalTrips = tripsMap.get(key) || 0;

      return {
        year: revenue._id.year,
        month: revenue._id.month,
        monthName: getMonthName(revenue._id.month),
        totalRevenue: Math.round(revenue.totalRevenue * 100) / 100,
        totalPaidTrips: revenue.totalPaidTrips,
        totalTrips: totalTrips,
        conversionRate:
          totalTrips > 0
            ? Math.round((revenue.totalPaidTrips / totalTrips) * 10000) / 100
            : 0, // Percentage with 2 decimals
        averageAmount: Math.round(revenue.averageAmount * 100) / 100,
        maxAmount: Math.round(revenue.maxAmount * 100) / 100,
        minAmount: Math.round(revenue.minAmount * 100) / 100,
      };
    });

    // Add months with trips but no revenue
    monthlyTrips.forEach((trip) => {
      const key = `${trip._id.year}-${trip._id.month}`;
      const existsInRevenue = monthlyRevenue.some(
        (rev) =>
          rev._id.year === trip._id.year && rev._id.month === trip._id.month
      );

      if (!existsInRevenue) {
        combinedData.push({
          year: trip._id.year,
          month: trip._id.month,
          monthName: getMonthName(trip._id.month),
          totalRevenue: 0,
          totalPaidTrips: 0,
          totalTrips: trip.totalTrips,
          conversionRate: 0,
          averageAmount: 0,
          maxAmount: 0,
          minAmount: 0,
        });
      }
    });

    // Sort combined data
    combinedData.sort((a, b) => {
      if (a.year !== b.year) return a.year - b.year;
      return a.month - b.month;
    });

    // Calculate yearly totals
    const yearlyTotal = combinedData.reduce(
      (acc, month) => ({
        totalRevenue: acc.totalRevenue + month.totalRevenue,
        totalPaidTrips: acc.totalPaidTrips + month.totalPaidTrips,
        totalTrips: acc.totalTrips + month.totalTrips,
        averageAmount: 0, // Will be calculated after
      }),
      { totalRevenue: 0, totalPaidTrips: 0, totalTrips: 0, averageAmount: 0 }
    );

    // Calculate yearly averages and conversion rate
    yearlyTotal.averageAmount =
      yearlyTotal.totalPaidTrips > 0
        ? Math.round(
            (yearlyTotal.totalRevenue / yearlyTotal.totalPaidTrips) * 100
          ) / 100
        : 0;

    yearlyTotal.conversionRate =
      yearlyTotal.totalTrips > 0
        ? Math.round(
            (yearlyTotal.totalPaidTrips / yearlyTotal.totalTrips) * 10000
          ) / 100
        : 0;

    logger.info(
      `Monthly revenue and trips data retrieved for year ${targetYear}`
    );

    res.status(200).json({
      success: true,
      message: "Monthly revenue and trips data retrieved successfully",
      data: {
        year: targetYear,
        monthlyBreakdown: combinedData,
        yearlyTotal: {
          totalRevenue: Math.round(yearlyTotal.totalRevenue * 100) / 100,
          totalPaidTrips: yearlyTotal.totalPaidTrips,
          totalTrips: yearlyTotal.totalTrips,
          conversionRate: yearlyTotal.conversionRate,
          averageAmount: yearlyTotal.averageAmount,
          monthsWithData: combinedData.length,
        },
      },
    });
  } catch (error) {
    logger.error("Error fetching monthly revenue and trips data:", error);
    res.status(500).json({
      success: false,
      message: "Failed to retrieve monthly revenue and trips data",
      error: error.message,
    });
  }
};

// Helper function to get month name
const getMonthName = (monthNumber) => {
  const months = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];
  return months[monthNumber - 1] || "Unknown";
};

/**
 * Get total user counts from all Supabase account tables
 */
const getAllUserCounts = async (req, res) => {
  try {
    // Define all user account tables
    const userTables = [
      "admin_accounts",
      "driver_accounts",
      "guide_accounts",
      "support_accounts",
      "tourist_accounts",
    ];

    // Get counts from all tables in parallel
    const countPromises = userTables.map(async (tableName) => {
      try {
        const { count, error } = await supabase
          .from(tableName)
          .select("*", { count: "exact", head: true });

        if (error) {
          logger.error(`Error counting ${tableName}:`, error);
          return { tableName, count: 0, error: error.message };
        }

        return { tableName, count: count || 0, error: null };
      } catch (err) {
        logger.error(`Exception counting ${tableName}:`, err);
        return { tableName, count: 0, error: err.message };
      }
    });

    // Wait for all count queries to complete
    const results = await Promise.all(countPromises);

    // Process results and calculate totals
    let totalUsers = 0;
    const breakdown = {};
    const errors = [];

    results.forEach((result) => {
      if (result.error) {
        errors.push({
          table: result.tableName,
          error: result.error,
        });
      } else {
        totalUsers += result.count;
      }

      // Clean table name for response (remove _accounts suffix)
      const cleanName = result.tableName.replace("_accounts", "");
      breakdown[cleanName] = {
        count: result.count,
        percentage: 0, // Will be calculated after total is known
      };
    });

    // Calculate percentages
    if (totalUsers > 0) {
      Object.keys(breakdown).forEach((key) => {
        breakdown[key].percentage =
          Math.round((breakdown[key].count / totalUsers) * 10000) / 100;
      });
    }

    // Prepare response data
    const responseData = {
      totalUsers,
      breakdown,
      summary: {
        admins: breakdown.admin?.count || 0,
        drivers: breakdown.driver?.count || 0,
        guides: breakdown.guide?.count || 0,
        support: breakdown.support?.count || 0,
        tourists: breakdown.tourist?.count || 0,
      },
      timestamp: new Date().toISOString(),
    };

    // Add errors to response if any
    if (errors.length > 0) {
      responseData.errors = errors;
      logger.warn(`Some tables had errors while counting users:`, errors);
    }

    logger.info(
      `Retrieved user counts from ${userTables.length} tables. Total users: ${totalUsers}`
    );

    res.status(200).json({
      success: true,
      message: "User counts retrieved successfully",
      data: responseData,
    });
  } catch (error) {
    logger.error("Error fetching user counts:", error);
    res.status(500).json({
      success: false,
      message: "Failed to retrieve user counts",
      error: error.message,
    });
  }
};

/**
 * Get detailed user statistics from all Supabase account tables
 */
const getUserStatistics = async (req, res) => {
  try {
    const { includeInactive = false } = req.query;

    // Define all user account tables with their specific fields
    const userTables = [
      { name: "admin_accounts", userType: "admin" },
      { name: "driver_accounts", userType: "driver" },
      { name: "guide_accounts", userType: "guide" },
      { name: "support_accounts", userType: "support" },
      { name: "tourist_accounts", userType: "tourist" },
    ];

    // Get detailed statistics from all tables
    const statsPromises = userTables.map(async (table) => {
      try {
        let query = supabase.from(table.name).select("*");

        // Filter active users if requested
        if (!includeInactive) {
          query = query.or("is_active.eq.true,is_active.is.null"); // Include null as active
        }

        const { data, error, count } = await query;

        if (error) {
          logger.error(`Error getting stats for ${table.name}:`, error);
          return {
            userType: table.userType,
            tableName: table.name,
            total: 0,
            active: 0,
            inactive: 0,
            error: error.message,
          };
        }

        // Calculate active/inactive counts
        const users = data || [];
        const activeCount = users.filter(
          (user) => user.is_active === true || user.is_active === null
        ).length;
        const inactiveCount = users.length - activeCount;

        return {
          userType: table.userType,
          tableName: table.name,
          total: users.length,
          active: activeCount,
          inactive: inactiveCount,
          error: null,
        };
      } catch (err) {
        logger.error(`Exception getting stats for ${table.name}:`, err);
        return {
          userType: table.userType,
          tableName: table.name,
          total: 0,
          active: 0,
          inactive: 0,
          error: err.message,
        };
      }
    });

    // Wait for all statistics queries to complete
    const results = await Promise.all(statsPromises);

    // Process results
    const statistics = {
      totalUsers: 0,
      totalActive: 0,
      totalInactive: 0,
      byUserType: {},
      errors: [],
    };

    results.forEach((result) => {
      if (result.error) {
        statistics.errors.push({
          table: result.tableName,
          error: result.error,
        });
      } else {
        statistics.totalUsers += result.total;
        statistics.totalActive += result.active;
        statistics.totalInactive += result.inactive;
      }

      statistics.byUserType[result.userType] = {
        total: result.total,
        active: result.active,
        inactive: result.inactive,
        activePercentage:
          result.total > 0
            ? Math.round((result.active / result.total) * 10000) / 100
            : 0,
      };
    });

    // Calculate overall active percentage
    statistics.overallActivePercentage =
      statistics.totalUsers > 0
        ? Math.round((statistics.totalActive / statistics.totalUsers) * 10000) /
          100
        : 0;

    logger.info(
      `Retrieved detailed user statistics. Total: ${statistics.totalUsers}, Active: ${statistics.totalActive}`
    );

    res.status(200).json({
      success: true,
      message: "User statistics retrieved successfully",
      data: {
        ...statistics,
        includeInactive: includeInactive,
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    logger.error("Error fetching user statistics:", error);
    res.status(500).json({
      success: false,
      message: "Failed to retrieve user statistics",
      error: error.message,
    });
  }
};

module.exports = {
  getPaymentDetails,
  getPaymentStats,
  getPaymentByTripId,
  getDailyPaymentSummary,
  getMonthlyRevenue,
  getAllUserCounts,
  getUserStatistics,
};
