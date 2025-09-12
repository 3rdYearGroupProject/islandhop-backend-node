const Schedule = require('../models/Schedule');

// Mark days as unavailable
const markUnavailable = async (req, res, next) => {
  console.log('[MARK_UNAVAILABLE] Function called');
  console.log('[MARK_UNAVAILABLE] Request params:', req.params);
  console.log('[MARK_UNAVAILABLE] Request body:', req.body);
  try {
    const { userType } = req.params;
    const { email, dates } = req.body;

    const results = await Schedule.markDaysUnavailable(email, userType, dates);
    
    const successCount = results.filter(r => r.success).length;
    const failureCount = results.filter(r => !r.success).length;

    console.log('[MARK_UNAVAILABLE] Results:', results);
    console.log('[MARK_UNAVAILABLE] Success count:', successCount, 'Failure count:', failureCount);

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
    console.error('[MARK_UNAVAILABLE] Error occurred:', error.message);
    next(error);
  }
};

// Mark days as available (unmark)
const unmarkAvailable = async (req, res, next) => {
  console.log('[UNMARK_AVAILABLE] Function called');
  console.log('[UNMARK_AVAILABLE] Request params:', req.params);
  console.log('[UNMARK_AVAILABLE] Request body:', req.body);
  try {
    const { userType } = req.params;
    const { email, dates } = req.body;

    const results = await Schedule.markDaysAvailable(email, userType, dates);
    
    const successCount = results.filter(r => r.success).length;
    const failureCount = results.filter(r => !r.success).length;

    console.log('[UNMARK_AVAILABLE] Results:', results);
    console.log('[UNMARK_AVAILABLE] Success count:', successCount, 'Failure count:', failureCount);

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
    console.error('[UNMARK_AVAILABLE] Error occurred:', error.message);
    next(error);
  }
};

// Lock days
const lockDays = async (req, res, next) => {
  console.log('[LOCK_DAYS] Function called');
  console.log('[LOCK_DAYS] Request params:', req.params);
  console.log('[LOCK_DAYS] Request body:', req.body);
  try {
    const { userType } = req.params;
    const { email, dates, tripId } = req.body;

    const results = await Schedule.lockDays(email, userType, dates, tripId);
    
    const successCount = results.filter(r => r.success).length;
    const failureCount = results.filter(r => !r.success).length;

    console.log('[LOCK_DAYS] Results:', results);
    console.log('[LOCK_DAYS] Success count:', successCount, 'Failure count:', failureCount);

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
    console.error('[LOCK_DAYS] Error occurred:', error.message);
    next(error);
  }
};

// Get available days for a month
const getAvailableDays = async (req, res, next) => {
  console.log('[GET_AVAILABLE_DAYS] Function called');
  console.log('[GET_AVAILABLE_DAYS] Request params:', req.params);
  console.log('[GET_AVAILABLE_DAYS] Request query:', req.query);
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

    console.log('[GET_AVAILABLE_DAYS] Schedule:', schedule);
    console.log('[GET_AVAILABLE_DAYS] Summary:', {
      totalDays: daysInMonth,
      available: availableDays.length,
      unavailable: unavailableCount,
      locked: lockedCount
    });

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
    console.error('[GET_AVAILABLE_DAYS] Error occurred:', error.message);
    next(error);
  }
};

// Health check endpoint
const healthCheck = async (req, res) => {
  console.log('[HEALTH_CHECK] Function called');
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
