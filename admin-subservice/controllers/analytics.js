const mongoose = require("mongoose");
const logger = require("../config/logger");

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
 * Get monthly revenue summary
 */
const getMonthlyRevenue = async (req, res) => {
  try {
    const { year, startMonth, endMonth } = req.query;

    // Default to current year if not provided
    const targetYear = year ? parseInt(year) : new Date().getFullYear();

    // Build date filter for the year
    const startDate = new Date(targetYear, 0, 1); // January 1st
    const endDate = new Date(targetYear + 1, 0, 1); // January 1st of next year

    // Aggregation pipeline for monthly revenue
    const pipeline = [
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
          totalTransactions: { $sum: 1 },
          averageAmount: { $avg: "$payedAmount" },
          maxAmount: { $max: "$payedAmount" },
          minAmount: { $min: "$payedAmount" },
        },
      },
      {
        $addFields: {
          monthName: {
            $switch: {
              branches: [
                { case: { $eq: ["$_id.month", 1] }, then: "January" },
                { case: { $eq: ["$_id.month", 2] }, then: "February" },
                { case: { $eq: ["$_id.month", 3] }, then: "March" },
                { case: { $eq: ["$_id.month", 4] }, then: "April" },
                { case: { $eq: ["$_id.month", 5] }, then: "May" },
                { case: { $eq: ["$_id.month", 6] }, then: "June" },
                { case: { $eq: ["$_id.month", 7] }, then: "July" },
                { case: { $eq: ["$_id.month", 8] }, then: "August" },
                { case: { $eq: ["$_id.month", 9] }, then: "September" },
                { case: { $eq: ["$_id.month", 10] }, then: "October" },
                { case: { $eq: ["$_id.month", 11] }, then: "November" },
                { case: { $eq: ["$_id.month", 12] }, then: "December" },
              ],
              default: "Unknown",
            },
          },
        },
      },
      {
        $sort: {
          "_id.year": 1,
          "_id.month": 1,
        },
      },
      {
        $project: {
          _id: 0,
          year: "$_id.year",
          month: "$_id.month",
          monthName: 1,
          totalRevenue: { $round: ["$totalRevenue", 2] },
          totalTransactions: 1,
          averageAmount: { $round: ["$averageAmount", 2] },
          maxAmount: { $round: ["$maxAmount", 2] },
          minAmount: { $round: ["$minAmount", 2] },
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

      // Add month filter to the pipeline
      pipeline.splice(1, 0, {
        $addFields: {
          month: { $month: "$createdAt" },
        },
      });
      pipeline.splice(2, 0, {
        $match: {
          month: monthFilter,
        },
      });
    }

    const monthlyRevenue = await PayedFinishedTrip.aggregate(pipeline);

    // Calculate yearly totals
    const yearlyTotal = monthlyRevenue.reduce(
      (acc, month) => ({
        totalRevenue: acc.totalRevenue + month.totalRevenue,
        totalTransactions: acc.totalTransactions + month.totalTransactions,
        averageAmount: 0, // Will be calculated after
      }),
      { totalRevenue: 0, totalTransactions: 0, averageAmount: 0 }
    );

    // Calculate yearly average
    yearlyTotal.averageAmount =
      yearlyTotal.totalTransactions > 0
        ? Math.round(
            (yearlyTotal.totalRevenue / yearlyTotal.totalTransactions) * 100
          ) / 100
        : 0;

    logger.info(`Monthly revenue retrieved for year ${targetYear}`);

    res.status(200).json({
      success: true,
      message: "Monthly revenue retrieved successfully",
      data: {
        year: targetYear,
        monthlyBreakdown: monthlyRevenue,
        yearlyTotal: {
          totalRevenue: Math.round(yearlyTotal.totalRevenue * 100) / 100,
          totalTransactions: yearlyTotal.totalTransactions,
          averageAmount: yearlyTotal.averageAmount,
          monthsWithData: monthlyRevenue.length,
        },
      },
    });
  } catch (error) {
    logger.error("Error fetching monthly revenue:", error);
    res.status(500).json({
      success: false,
      message: "Failed to retrieve monthly revenue",
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
};
