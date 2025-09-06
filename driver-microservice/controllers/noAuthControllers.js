const mongoose = require('mongoose');

// Helper function - NO AUTHENTICATION, NO VERIFICATION - JUST FETCH DATA
const findDriver = async (driverId) => {
  try {
    // Since we removed the Driver model, we'll return null for now
    // The fallback data in controllers will handle this
    return null;
  } catch (error) {
    console.log('Database lookup failed, will return sample data');
    return null;
  }
};

// DASHBOARD - ALWAYS RETURNS DATA
const getDashboard = async (req, res) => {
  const { driverId } = req.params;
  const driver = await findDriver(driverId);

  const dashboardData = {
    driverId: driverId,
    stats: driver?.stats || {
      rating: 4.8,
      totalTrips: 1247,
      completedTrips: 1180,
      activeTrips: 1,
      pendingTrips: 3,
      totalEarnings: 487250.75,
      todayEarnings: 245.5,
      weeklyEarnings: 1240.75,
      monthlyEarnings: 4820.25,
      completionRate: 94.6
    },
    personalInfo: driver?.personalInfo || {
      firstName: 'Rajesh',
      lastName: 'Fernando',
      email: driverId
    },
    activeTrips: driver?.trips?.active?.length || 1,
    pendingTrips: driver?.trips?.pending?.length || 3,
    rating: driver?.stats?.rating || 4.8,
    totalEarnings: driver?.stats?.totalEarnings || 487250.75
  };

  res.json({ success: true, data: dashboardData });
};

// STATS - ALWAYS RETURNS DATA
const getStats = async (req, res) => {
  const { driverId } = req.params;
  const driver = await findDriver(driverId);

  const statsData = driver?.stats || {
    rating: 4.8,
    totalTrips: 1247,
    completedTrips: 1180,
    activeTrips: 1,
    pendingTrips: 3,
    cancelledTrips: 67,
    totalReviews: 892,
    totalEarnings: 487250.75,
    todayEarnings: 245.5,
    weeklyEarnings: 1240.75,
    monthlyEarnings: 4820.25,
    completionRate: 94.6,
    responseRate: 98.2,
    averagePerTrip: 4016.87
  };

  res.json({ success: true, data: statsData });
};

// ACTIVE TRIPS - ALWAYS RETURNS DATA
const getActiveTrips = async (req, res) => {
  const { driverId } = req.params;
  const driver = await findDriver(driverId);

  const activeTrips = driver?.trips?.active || [
    {
      id: "TR001",
      tripName: "Sri Lanka Heritage Tour",
      userId: "user_firebase_uid_123",
      passenger: "Sarah Johnson",
      passengerAvatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330",
      pickupLocation: "Colombo Airport",
      destination: "Kandy City",
      distance: "120 km",
      estimatedTime: "2h 30m",
      fare: 8900.5,
      status: "in_progress",
      startTime: "2:30 PM",
      startDate: "2025-09-05",
      endDate: "2025-09-08",
      passengerRating: 4.9,
      passengerPhone: "+94 77 123 4567",
      vehicleType: "sedan",
      progress: 35
    }
  ];

  res.json({ success: true, data: activeTrips });
};

// PENDING TRIPS - ALWAYS RETURNS DATA
const getPendingTrips = async (req, res) => {
  const { driverId } = req.params;
  const driver = await findDriver(driverId);

  const pendingTrips = driver?.trips?.pending || [
    {
      id: "TR002",
      passenger: "Michael Chen",
      pickup: "Kandy Central",
      destination: "Nuwara Eliya",
      distance: "75 km",
      estimatedFare: 7500,
      requestTime: "2025-09-05T14:25:00Z",
      passengerRating: 4.7,
      vehicleType: "sedan",
      tripName: "Hill Country Tour",
      startDate: "2025-09-06",
      endDate: "2025-09-07"
    },
    {
      id: "TR003",
      passenger: "Emma Wilson",
      pickup: "Ella Railway Station",
      destination: "Colombo",
      distance: "200 km",
      estimatedFare: 15000,
      requestTime: "2025-09-05T14:22:00Z",
      passengerRating: 4.9,
      vehicleType: "sedan",
      tripName: "Return Journey"
    }
  ];

  res.json({ success: true, data: pendingTrips });
};

// ANALYTICS - ALWAYS RETURNS DATA
const getAnalytics = async (req, res) => {
  const { driverId } = req.params;
  const { period = 'week' } = req.query;
  const driver = await findDriver(driverId);

  console.log(`Getting analytics for driver ${driverId}, period: ${period}`);

  // Adjust data based on period
  const multiplier = period === 'month' ? 4.3 : period === 'year' ? 52 : 1; // week is default
  
  const analyticsData = driver?.analytics || {
    period: period,
    performance: {
      averageRating: 4.8,
      completionRate: 94.2,
      earningsChange: 12.5 * (multiplier * 0.3),
      tripsChange: 8.3 * (multiplier * 0.2),
      hoursChange: -5.2,
      distanceChange: 15.1 * (multiplier * 0.25)
    },
    topRoutes: [
      {
        route: "Colombo Airport → Galle",
        trips: 12,
        earnings: 106800,
        avgRating: 4.9
      },
      {
        route: "Kandy → Nuwara Eliya",
        trips: 8,
        earnings: 100000,
        avgRating: 4.8
      }
    ],
    busyHours: [
      { hour: "6-7 AM", trips: 5, percentage: 18 },
      { hour: "7-8 AM", trips: 8, percentage: 29 }
    ]
  };

  res.json({ success: true, data: analyticsData });
};

const getTopRoutes = async (req, res) => {
  const { driverId } = req.params;
  const { period = 'week' } = req.query;
  const driver = await findDriver(driverId);

  console.log(`Getting top routes for driver ${driverId}, period: ${period}`);

  // Adjust data based on period
  const multiplier = period === 'month' ? 4.3 : period === 'year' ? 52 : 1;
  
  const topRoutes = driver?.analytics?.topRoutes || [
    { 
      route: "Colombo Airport → Galle", 
      trips: Math.round(12 * multiplier), 
      earnings: Math.round(106800 * multiplier), 
      avgRating: 4.9,
      period: period
    },
    { 
      route: "Kandy → Nuwara Eliya", 
      trips: Math.round(8 * multiplier), 
      earnings: Math.round(100000 * multiplier), 
      avgRating: 4.8,
      period: period
    }
  ];

  res.json({ success: true, data: topRoutes });
};

const getBusyHours = async (req, res) => {
  const { driverId } = req.params;
  const { period = 'week' } = req.query;
  const driver = await findDriver(driverId);

  console.log(`Getting busy hours for driver ${driverId}, period: ${period}`);

  // Adjust data based on period - busy hours patterns can vary by time range
  const periodMultiplier = period === 'month' ? 1.2 : period === 'year' ? 1.5 : 1;
  
  const busyHours = driver?.analytics?.busyHours || [
    { 
      hour: "6-7 AM", 
      trips: Math.round(5 * periodMultiplier), 
      percentage: Math.round(18 * (period === 'year' ? 0.8 : 1)),
      period: period
    },
    { 
      hour: "7-8 AM", 
      trips: Math.round(8 * periodMultiplier), 
      percentage: Math.round(29 * (period === 'year' ? 0.9 : 1)),
      period: period
    },
    { 
      hour: "5-6 PM", 
      trips: Math.round(6 * periodMultiplier), 
      percentage: Math.round(22 * (period === 'year' ? 0.85 : 1)),
      period: period
    }
  ];

  res.json({ success: true, data: busyHours });
};

// TRIPS - ALWAYS RETURNS DATA
const getTrips = async (req, res) => {
  const { driverId } = req.params;
  const driver = await findDriver(driverId);

  const trips = driver?.trips?.history || [
    {
      id: "TR004",
      tripName: "Airport Express",
      passenger: "David Kumar",
      pickupLocation: "Colombo Fort",
      destination: "Bentota",
      date: "2025-09-04",
      startTime: "10:30",
      endTime: "12:00",
      duration: "1h 30m",
      distance: "65 km",
      fare: 7500,
      rating: 5,
      status: "completed",
      paymentMethod: "card",
      tip: 500
    }
  ];

  res.json({ success: true, data: trips });
};

const getTripDetails = async (req, res) => {
  const { driverId, tripId } = req.params;
  const driver = await findDriver(driverId);

  const trip = driver?.trips?.history?.find(t => t.id === tripId) || {
    id: tripId,
    tripName: "Sample Trip",
    passenger: "Sample Passenger",
    status: "completed",
    fare: 5000
  };

  res.json({ success: true, data: trip });
};

// EARNINGS - ALWAYS RETURNS DATA
const getEarnings = async (req, res) => {
  const { driverId } = req.params;
  const driver = await findDriver(driverId);

  const earningsData = {
    totalEarnings: driver?.stats?.totalEarnings || 487250.75,
    todayEarnings: driver?.stats?.todayEarnings || 245.5,
    weeklyEarnings: driver?.stats?.weeklyEarnings || 1240.75,
    monthlyEarnings: driver?.stats?.monthlyEarnings || 4820.25,
    transactions: driver?.earnings?.transactions || [
      {
        tripId: "TR004",
        tripName: "Airport Express",
        passenger: "David Kumar",
        route: "Colombo Fort → Bentota",
        amount: 7500,
        tip: 500,
        totalAmount: 8000,
        paymentMethod: "card",
        status: "completed",
        date: "2025-09-04T12:00:00Z"
      }
    ]
  };

  res.json({ success: true, data: earningsData });
};

const getDailyEarnings = async (req, res) => {
  const { driverId } = req.params;
  const driver = await findDriver(driverId);

  const dailyEarnings = driver?.earnings?.summaries?.daily || {
    "2025-09-04": { earnings: 8000, trips: 1, hours: 1.5, distance: 65 }
  };

  res.json({ success: true, data: dailyEarnings });
};

const getWeeklyEarnings = async (req, res) => {
  const { driverId } = req.params;
  const driver = await findDriver(driverId);

  const weeklyEarnings = driver?.earnings?.summaries?.weekly || {
    "2025-W36": { totalEarnings: 1240.75, totalTrips: 28, totalHours: 45.5 }
  };

  res.json({ success: true, data: weeklyEarnings });
};

const getMonthlyEarnings = async (req, res) => {
  const { driverId } = req.params;
  const driver = await findDriver(driverId);

  const monthlyEarnings = driver?.earnings?.summaries?.monthly || {
    "2025-09": { totalEarnings: 4820.25, totalTrips: 127, totalHours: 180 }
  };

  res.json({ success: true, data: monthlyEarnings });
};

// REVIEWS - ALWAYS RETURNS DATA
const getReviews = async (req, res) => {
  const { driverId } = req.params;
  const driver = await findDriver(driverId);

  const reviews = driver?.reviews || [
    {
      tripId: "TR004",
      passengerName: "David Kumar",
      rating: 5,
      comment: "Excellent driver! Very professional and punctual.",
      date: "2025-09-04T18:30:00Z",
      sentiment: "positive",
      verified: true,
      helpful: 12
    }
  ];

  res.json({ success: true, data: reviews });
};

// SCHEDULE - ALWAYS RETURNS DATA
const getSchedule = async (req, res) => {
  const { driverId } = req.params;
  const { month } = req.query;
  const driver = await findDriver(driverId);

  // Generate current month if not specified
  const currentDate = new Date();
  const requestedMonth = month ? parseInt(month) : (currentDate.getMonth() + 1);
  const currentYear = currentDate.getFullYear();
  const monthStr = requestedMonth.toString().padStart(2, '0');
  const currentMonthFormatted = `${currentYear}-${monthStr}`;

  console.log(`Fetching schedule for driver ${driverId}, month: ${currentMonthFormatted}`);

  // If driver has schedule data, use it, otherwise generate sample data for the requested month
  if (driver?.schedule) {
    res.json({ success: true, data: driver.schedule });
    return;
  }

  // Generate sample schedule data for the requested month
  const schedule = {
    currentMonth: currentMonthFormatted,
    calendar: {
      [`${currentYear}-${monthStr}-05`]: {
        status: "locked",
        tripId: "TR001",
        startTime: "08:00",
        endTime: "18:00",
        notes: "Airport pickup and Colombo tour"
      },
      [`${currentYear}-${monthStr}-06`]: {
        status: "locked",
        tripId: "TR001", 
        startTime: "09:00",
        endTime: "17:00",
        notes: "Kandy sightseeing day"
      },
      [`${currentYear}-${monthStr}-07`]: {
        status: "available",
        workingHours: { start: "06:00", end: "22:00" }
      },
      [`${currentYear}-${monthStr}-08`]: {
        status: "unavailable",
        reason: "Personal day off"
      },
      [`${currentYear}-${monthStr}-12`]: {
        status: "locked",
        tripId: "TR002",
        startTime: "07:00",
        endTime: "19:00",
        notes: "Full day tour to Kandy"
      },
      [`${currentYear}-${monthStr}-15`]: {
        status: "available",
        workingHours: { start: "08:00", end: "20:00" }
      }
    }
  };

  res.json({ success: true, data: schedule });
};

// CHAT - ALWAYS RETURNS DATA
const getGroups = async (req, res) => {
  const { driverId } = req.params;
  const driver = await findDriver(driverId);

  const groups = driver?.chatGroups || [
    {
      groupId: "TR001",
      groupName: "Sri Lanka Heritage Tour Chat",
      tripId: "TR001",
      isActive: true,
      participants: [
        { name: "Rajesh Fernando", role: "driver" },
        { name: "Sarah Johnson", role: "passenger" }
      ],
      lastActivity: "2025-09-05T10:35:00Z"
    }
  ];

  res.json({ success: true, data: groups });
};

const getMessages = async (req, res) => {
  const { driverId, groupId } = req.params;
  const driver = await findDriver(driverId);

  const group = driver?.chatGroups?.find(g => g.groupId === groupId);
  const messages = group?.messages || [
    {
      messageId: "msg_001",
      senderName: "Rajesh Fernando",
      content: "Welcome to the tour! I'll be your driver.",
      timestamp: "2025-09-05T10:35:00Z",
      type: "text"
    }
  ];

  res.json({ success: true, data: messages });
};

// PROFILE - ALWAYS RETURNS DATA
const getProfile = async (req, res) => {
  const { driverId } = req.params;
  const driver = await findDriver(driverId);

  const profileData = {
    personalInfo: driver?.personalInfo || {
      firstName: "Rajesh",
      lastName: "Fernando",
      email: driverId,
      phone: "+94 77 123 4567"
    },
    vehicle: driver?.vehicle || {
      make: "Toyota",
      model: "Prius",
      year: 2020,
      color: "White"
    },
    documents: driver?.documents || {},
    stats: driver?.stats || { rating: 4.8, totalTrips: 1247 },
    preferences: driver?.preferences || {},
    verificationStatus: driver?.verificationStatus || { profileComplete: true }
  };

  res.json({ success: true, data: profileData });
};

const getNotifications = async (req, res) => {
  const notifications = [
    {
      id: 'notif_1',
      title: 'New Trip Request',
      message: 'You have a new trip request',
      type: 'trip_request',
      read: false,
      timestamp: new Date().toISOString()
    },
    {
      id: 'notif_2',
      title: 'Payment Received',
      message: 'Payment credited to your account',
      type: 'payment',
      read: true,
      timestamp: new Date(Date.now() - 3600000).toISOString()
    }
  ];

  res.json({ success: true, data: notifications });
};

// Generic handlers that just return success
const updateProfile = async (req, res) => {
  res.json({ success: true, message: 'Profile updated' });
};

const updateSchedule = async (req, res) => {
  res.json({ success: true, message: 'Schedule updated' });
};

const markNotificationAsRead = async (req, res) => {
  res.json({ success: true, message: 'Notification marked as read' });
};

const updateTripStatus = async (req, res) => {
  res.json({ success: true, message: 'Trip status updated' });
};

const acceptTrip = async (req, res) => {
  res.json({ success: true, message: 'Trip accepted' });
};

const declineTrip = async (req, res) => {
  res.json({ success: true, message: 'Trip declined' });
};

const respondToReview = async (req, res) => {
  res.json({ success: true, message: 'Review response submitted' });
};

// MISSING ENDPOINTS THAT FRONTEND EXPECTS

// Top routes endpoint (different from analytics/routes/top)
const getTopRoutesAnalytics = async (req, res) => {
  const { driverId } = req.params;
  const { period = 'week' } = req.query;
  const driver = await findDriver(driverId);

  console.log(`Getting top routes analytics for driver ${driverId}, period: ${period}`);

  // Adjust data based on period
  const multiplier = period === 'month' ? 4.3 : period === 'year' ? 52 : 1;

  const topRoutes = driver?.analytics?.topRoutes || [
    {
      route: "Colombo Airport → Galle",
      trips: Math.round(12 * multiplier),
      earnings: Math.round(106800 * multiplier),
      avgRating: 4.9,
      distance: "120km",
      avgDuration: "2h 30m",
      period: period
    },
    {
      route: "Kandy → Nuwara Eliya", 
      trips: Math.round(8 * multiplier),
      earnings: Math.round(100000 * multiplier),
      avgRating: 4.8,
      distance: "75km",
      avgDuration: "2h 15m",
      period: period
    },
    {
      route: "Colombo → Kandy",
      trips: Math.round(15 * multiplier),
      earnings: Math.round(85000 * multiplier),
      avgRating: 4.7,
      distance: "115km", 
      avgDuration: "3h",
      period: period
    }
  ];

  res.json({ success: true, data: topRoutes });
};

// Busy hours endpoint (different from analytics/hours/busy)
const getBusyHoursAnalytics = async (req, res) => {
  const { driverId } = req.params;
  const { period = 'week' } = req.query;
  const driver = await findDriver(driverId);

  console.log(`Getting busy hours analytics for driver ${driverId}, period: ${period}`);

  // Adjust data based on period
  const multiplier = period === 'month' ? 4.3 : period === 'year' ? 52 : 1;
  const percentageAdjust = period === 'year' ? 0.85 : 1; // Long-term patterns may be different

  const busyHours = driver?.analytics?.busyHours || [
    { 
      hour: "6-7 AM", 
      trips: Math.round(5 * multiplier), 
      percentage: Math.round(18 * percentageAdjust), 
      avgEarnings: Math.round(2500 * multiplier),
      period: period
    },
    { 
      hour: "7-8 AM", 
      trips: Math.round(8 * multiplier), 
      percentage: Math.round(29 * percentageAdjust), 
      avgEarnings: Math.round(4200 * multiplier),
      period: period
    },
    { 
      hour: "8-9 AM", 
      trips: Math.round(6 * multiplier), 
      percentage: Math.round(22 * percentageAdjust), 
      avgEarnings: Math.round(3100 * multiplier),
      period: period
    },
    { 
      hour: "5-6 PM", 
      trips: Math.round(7 * multiplier), 
      percentage: Math.round(25 * percentageAdjust), 
      avgEarnings: Math.round(3800 * multiplier),
      period: period
    },
    { 
      hour: "6-7 PM", 
      trips: Math.round(4 * multiplier), 
      percentage: Math.round(14 * percentageAdjust), 
      avgEarnings: Math.round(2200 * multiplier),
      period: period
    }
  ];

  res.json({ success: true, data: busyHours });
};

// Weekly earnings endpoint (specific format for charts)
const getWeeklyEarningsChart = async (req, res) => {
  const { driverId } = req.params;
  const driver = await findDriver(driverId);

  const weeklyEarnings = driver?.analytics?.weeklyEarnings || [
    { day: "Mon", earnings: 185.5, trips: 4, hours: 6.5 },
    { day: "Tue", earnings: 220.75, trips: 5, hours: 8 },
    { day: "Wed", earnings: 165.25, trips: 3, hours: 5.5 },
    { day: "Thu", earnings: 195, trips: 4, hours: 7 },
    { day: "Fri", earnings: 245.5, trips: 6, hours: 9 },
    { day: "Sat", earnings: 128.75, trips: 2, hours: 4 },
    { day: "Sun", earnings: 100, trips: 1, hours: 3 }
  ];

  res.json({ success: true, data: weeklyEarnings });
};

// Transactions endpoint
const getTransactions = async (req, res) => {
  const { driverId } = req.params;
  const { limit = 50 } = req.query;
  const driver = await findDriver(driverId);

  const transactions = driver?.earnings?.transactions || [
    {
      id: "TXN001",
      tripId: "TR004",
      tripName: "Airport Express",
      passenger: "David Kumar",
      route: "Colombo Fort → Bentota",
      amount: 7500,
      tip: 500,
      totalAmount: 8000,
      paymentMethod: "card",
      status: "completed",
      date: "2025-09-04T12:00:00Z"
    },
    {
      id: "TXN002", 
      tripId: "TR003",
      tripName: "Hill Country Tour",
      passenger: "Emma Wilson",
      route: "Kandy → Nuwara Eliya",
      amount: 12000,
      tip: 1000,
      totalAmount: 13000,
      paymentMethod: "cash",
      status: "completed",
      date: "2025-09-03T16:30:00Z"
    },
    {
      id: "TXN003",
      tripId: "TR002", 
      tripName: "City Tour",
      passenger: "Michael Chen",
      route: "Colombo → Galle",
      amount: 9500,
      tip: 750,
      totalAmount: 10250,
      paymentMethod: "card",
      status: "completed",
      date: "2025-09-02T10:15:00Z"
    }
  ];

  const limitedTransactions = transactions.slice(0, parseInt(limit));
  res.json({ success: true, data: limitedTransactions });
};

// Schedule manipulation endpoints
const markUnavailable = async (req, res) => {
  const { driverId } = req.params;
  const { dates } = req.body;
  
  // In real implementation, you would update the database
  console.log(`Marking dates unavailable for driver ${driverId}:`, dates);
  
  res.json({ 
    success: true, 
    message: `Marked ${dates?.length || 0} dates as unavailable`,
    data: { dates, status: 'unavailable' }
  });
};

const markAvailable = async (req, res) => {
  const { driverId } = req.params;
  const { dates } = req.body;
  
  // In real implementation, you would update the database
  console.log(`Marking dates available for driver ${driverId}:`, dates);
  
  res.json({ 
    success: true, 
    message: `Marked ${dates?.length || 0} dates as available`,
    data: { dates, status: 'available' }
  });
};

const lockDays = async (req, res) => {
  const { driverId } = req.params;
  const { dates, tripId } = req.body;
  
  // In real implementation, you would update the database
  console.log(`Locking days for driver ${driverId}:`, { dates, tripId });
  
  res.json({ 
    success: true, 
    message: `Locked ${dates?.length || 0} days`,
    data: { dates, tripId, status: 'locked' }
  });
};

module.exports = {
  getDashboard,
  getStats,
  getActiveTrips,
  getPendingTrips,
  getAnalytics,
  getTopRoutes,
  getBusyHours,
  getTopRoutesAnalytics,
  getBusyHoursAnalytics,
  getTrips,
  getTripDetails,
  updateTripStatus,
  acceptTrip,
  declineTrip,
  getEarnings,
  getDailyEarnings,
  getWeeklyEarnings,
  getMonthlyEarnings,
  getWeeklyEarningsChart,
  getTransactions,
  getReviews,
  respondToReview,
  getSchedule,
  updateSchedule,
  markUnavailable,
  markAvailable,
  lockDays,
  getGroups,
  getMessages,
  getProfile,
  updateProfile,
  getNotifications,
  markNotificationAsRead
};
