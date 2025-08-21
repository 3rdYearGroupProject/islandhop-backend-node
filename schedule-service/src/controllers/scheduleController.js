const Schedule = require('../models/Schedule');

// Mark days as unavailable
const markUnavailable = async (req, res, next) => {
  try {
    const { userType } = req.params;
    const { email, dates } = req.body;

    const results = await Schedule.markDaysUnavailable(email, userType, dates);
    
    const successCount = results.filter(r => r.success).length;
    const failureCount = results.filter(r => !r.success).length;

    res.status(200).json({
      success: true,
      message: `Processed ${dates.length} dates. ${successCount} successful, ${failureCount} failed.`,
      results,
      summary: {
        total: dates.length,
        successful: successCount,
        failed: failureCount
      }
    });
  } catch (error) {
    next(error);
  }
};

// Mark days as available (unmark)
const unmarkAvailable = async (req, res, next) => {
  try {
    const { userType } = req.params;
    const { email, dates } = req.body;

    const results = await Schedule.markDaysAvailable(email, userType, dates);
    
    const successCount = results.filter(r => r.success).length;
    const failureCount = results.filter(r => !r.success).length;

    res.status(200).json({
      success: true,
      message: `Processed ${dates.length} dates. ${successCount} successful, ${failureCount} failed.`,
      results,
      summary: {
        total: dates.length,
        successful: successCount,
        failed: failureCount
      }
    });
  } catch (error) {
    next(error);
  }
};

// Lock days
const lockDays = async (req, res, next) => {
  try {
    const { userType } = req.params;
    const { email, dates, tripId } = req.body;

    const results = await Schedule.lockDays(email, userType, dates, tripId);
    
    const successCount = results.filter(r => r.success).length;
    const failureCount = results.filter(r => !r.success).length;

    res.status(200).json({
      success: true,
      message: `Processed ${dates.length} dates. ${successCount} successful, ${failureCount} failed.`,
      results,
      summary: {
        total: dates.length,
        successful: successCount,
        failed: failureCount
      },
      tripId: tripId || null
    });
  } catch (error) {
    next(error);
  }
};

// Get available days for a month
const getAvailableDays = async (req, res, next) => {
  try {
    const { userType } = req.params;
    const { email, month } = req.query;

    // Parse month (YYYY-MM)
    const [year, monthNum] = month.split('-').map(Number);
    
    // Get all days in the month
    const daysInMonth = new Date(year, monthNum, 0).getDate();
    const allDays = [];
    
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, monthNum - 1, day);
      allDays.push({
        date: date.toISOString().split('T')[0],
        dayOfWeek: date.toLocaleDateString('en-US', { weekday: 'long' }),
        status: 'available'
      });
    }

    // Get unavailable/locked days from database
    const unavailableDays = await Schedule.getAvailableDaysForMonth(email, userType, year, monthNum);
    
    // Create a map of unavailable dates with their status and tripId
    const unavailableMap = {};
    unavailableDays.forEach(day => {
      const dateStr = day.date.toISOString().split('T')[0];
      unavailableMap[dateStr] = {
        status: day.status,
        tripId: day.tripId || null
      };
    });

    // Mark unavailable days
    const schedule = allDays.map(day => ({
      ...day,
      status: unavailableMap[day.date]?.status || 'available',
      tripId: unavailableMap[day.date]?.tripId || null
    }));

    const availableDays = schedule.filter(day => day.status === 'available');
    const unavailableCount = schedule.filter(day => day.status === 'unavailable').length;
    const lockedCount = schedule.filter(day => day.status === 'locked').length;

    res.status(200).json({
      success: true,
      message: `Schedule for ${month} retrieved successfully`,
      data: {
        email,
        userType,
        month,
        schedule,
        availableDays: availableDays.map(day => day.date),
        summary: {
          totalDays: daysInMonth,
          available: availableDays.length,
          unavailable: unavailableCount,
          locked: lockedCount
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

// Health check endpoint
const healthCheck = async (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Schedule service is running',
    timestamp: new Date().toISOString(),
    service: 'schedule-service',
    version: '1.0.0'
  });
};

module.exports = {
  markUnavailable,
  unmarkAvailable,
  lockDays,
  getAvailableDays,
  healthCheck
};
