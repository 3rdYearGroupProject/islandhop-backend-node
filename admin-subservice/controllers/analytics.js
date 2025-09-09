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

module.exports = {
  getPaymentDetails,
  getPaymentStats,
  getPaymentByTripId,
  getDailyPaymentSummary,
};
