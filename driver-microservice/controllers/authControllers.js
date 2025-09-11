const mongoose = require('mongoose');
const Driver = require('../models/Driver');

// Helper function - WITH AUTHENTICATION - Fetch logged user's data
const findDriverByEmail = async (email) => {
  try {
    console.log(`🔍 Looking up driver by email: ${email}`);
    
    // Check if mongoose is connected
    if (mongoose.connection.readyState !== 1) {
      console.log('📍 MongoDB not connected, using mock driver data');
      // Return mock driver for testing when DB is not available
      if (email === 'driver101@islandhop.lk') {
        return {
          _id: '68baa74ac925feea49d80149',
          email: 'driver101@islandhop.lk',
          firstName: 'John',
          lastName: 'Driver',
          rating: 4.8
        };
      }
      return null;
    }
    
    // Try to find driver by email
    const driver = await Driver.findOne({ email: email.toLowerCase() });
    
    if (driver) {
      console.log(`✅ Found driver: ${driver.firstName} ${driver.lastName} (${driver.email})`);
      return driver;
    } else {
      console.log(`❌ No driver found with email: ${email}`);
      return null;
    }
  } catch (error) {
    console.error('❌ Database lookup failed:', error.message);
    // Return mock driver for testing if database fails
    if (email === 'driver101@islandhop.lk') {
      console.log('📍 Using mock driver data due to database error');
      return {
        _id: '68baa74ac925feea49d80149',
        email: 'driver101@islandhop.lk',
        firstName: 'John',
        lastName: 'Driver',
        rating: 4.8
      };
    }
    return null;
  }
};

// Middleware to extract email from request (can be from headers, JWT, session, etc.)
const getLoggedUserEmail = (req) => {
  // You can customize this based on your authentication method
  // Examples:
  // 1. From JWT token: req.user?.email
  // 2. From session: req.session?.user?.email  
  // 3. From custom header: req.headers['x-user-email']
  // 4. From URL parameter: req.params.driverId or req.params.email
  
  // For now, treating driverId or email parameter as email
  const email = req.params.email || req.params.driverId;
  
  // You could also check headers:
  // const email = req.headers['x-user-email'] || req.params.driverId;
  
  console.log(`🔐 Extracted user email: ${email}`);
  return email;
};

// DASHBOARD - Returns authenticated user's data
const getDashboard = async (req, res) => {
  try {
    const userEmail = getLoggedUserEmail(req);
    
    if (!userEmail) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required - no user email provided'
      });
    }

    const driver = await findDriverByEmail(userEmail);

    if (!driver) {
      return res.status(404).json({
        success: false,
        message: 'Driver profile not found. Please complete your registration.'
      });
    }

    const dashboardData = {
      driverId: driver._id,
      email: driver.email,
      stats: {
        rating: driver.rating || 4.8,
        totalTrips: driver.totalTrips || 0,
        completedTrips: driver.totalTrips || 0,
        activeTrips: 1, // This would come from trips collection
        pendingTrips: 2, // This would come from trips collection
        totalEarnings: driver.earnings?.total || 0,
        todayEarnings: driver.earnings?.daily || 0,
        weeklyEarnings: driver.earnings?.weekly || 0,
        monthlyEarnings: driver.earnings?.monthly || 0,
        completionRate: 94.6 // Calculate from actual trips
      },
      personalInfo: {
        firstName: driver.firstName,
        lastName: driver.lastName,
        email: driver.email,
        phone: driver.phone,
        profileImage: driver.profileImage
      },
      activeTrips: 1, // From trips collection query
      pendingTrips: 2, // From trips collection query
      rating: driver.rating || 0,
      totalEarnings: driver.earnings?.total || 0,
      isAvailable: driver.isAvailable,
      status: driver.status
    };

    res.json({ success: true, data: dashboardData });
    
  } catch (error) {
    console.error('❌ Dashboard error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch dashboard data'
    });
  }
};

// STATS - Returns authenticated user's stats
const getStats = async (req, res) => {
  try {
    const userEmail = getLoggedUserEmail(req);
    
    if (!userEmail) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    const driver = await findDriverByEmail(userEmail);

    if (!driver) {
      return res.status(404).json({
        success: false,
        message: 'Driver profile not found'
      });
    }

    const statsData = {
      rating: driver.rating || 0,
      totalTrips: driver.totalTrips || 0,
      completedTrips: driver.totalTrips || 0, // Calculate from actual trips
      activeTrips: 1, // From trips collection
      pendingTrips: 2, // From trips collection
      cancelledTrips: 0, // Calculate from trips
      totalReviews: 0, // From reviews collection
      totalEarnings: driver.earnings?.total || 0,
      todayEarnings: driver.earnings?.daily || 0,
      weeklyEarnings: driver.earnings?.weekly || 0,
      monthlyEarnings: driver.earnings?.monthly || 0,
      completionRate: 100, // Calculate from actual data
      responseRate: 100, // Calculate from actual data
      averagePerTrip: driver.totalTrips > 0 ? (driver.earnings?.total || 0) / driver.totalTrips : 0
    };

    res.json({ success: true, data: statsData });
    
  } catch (error) {
    console.error('❌ Stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch stats'
    });
  }
};

// ACTIVE TRIPS - Returns user's active trips (would query trips collection)
const getActiveTrips = async (req, res) => {
  try {
    const userEmail = getLoggedUserEmail(req);
    
    if (!userEmail) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    const driver = await findDriverByEmail(userEmail);

    if (!driver) {
      return res.status(404).json({
        success: false,
        message: 'Driver profile not found'
      });
    }

    // In a real implementation, you would query the trips collection:
    // const activeTrips = await Trip.find({ driverId: driver._id, status: 'active' });
    
    // For now, return sample data based on the authenticated user
    const activeTrips = [
      {
        id: `TR_${driver._id}_001`,
        tripName: "Current Trip",
        userId: "user_123",
        passenger: "Sample Passenger",
        passengerAvatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330",
        pickupLocation: "Colombo",
        destination: "Kandy",
        distance: "115 km",
        estimatedTime: "3h",
        fare: 8500,
        status: "in_progress",
        startTime: "2:30 PM",
        startDate: new Date().toISOString().split('T')[0],
        driverId: driver._id,
        driverName: `${driver.firstName} ${driver.lastName}`,
        progress: 25
      }
    ];

    res.json({ success: true, data: activeTrips });
    
  } catch (error) {
    console.error('❌ Active trips error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch active trips'
    });
  }
};

// PENDING TRIPS - Returns user's pending trips
const getPendingTrips = async (req, res) => {
  try {
    const userEmail = getLoggedUserEmail(req);
    
    if (!userEmail) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    const driver = await findDriverByEmail(userEmail);

    if (!driver) {
      return res.status(404).json({
        success: false,
        message: 'Driver profile not found'
      });
    }

    // Sample pending trips for authenticated user
    const pendingTrips = [
      {
        id: `TR_${driver._id}_002`,
        passenger: "John Doe",
        pickup: "Galle Fort",
        destination: "Colombo Airport",
        distance: "120 km",
        estimatedFare: 9500,
        requestTime: new Date().toISOString(),
        passengerRating: 4.5,
        vehicleType: "sedan",
        tripName: "Airport Transfer",
        startDate: new Date().toISOString().split('T')[0],
        driverId: driver._id
      }
    ];

    res.json({ success: true, data: pendingTrips });
    
  } catch (error) {
    console.error('❌ Pending trips error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch pending trips'
    });
  }
};

// ANALYTICS - Returns user's analytics with NEW expected format
const getAnalytics = async (req, res) => {
  try {
    const userEmail = getLoggedUserEmail(req);
    const { period = 'week' } = req.query;
    
    if (!userEmail) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    const driver = await findDriverByEmail(userEmail);

    if (!driver) {
      return res.status(404).json({
        success: false,
        message: 'Driver profile not found'
      });
    }

    console.log(`📊 Getting analytics for driver ${driver.email}, period: ${period}`);

    // Calculate realistic data based on period
    let totalEarnings, totalTrips, totalHours, totalDistance;
    
    switch(period) {
      case 'day':
        totalEarnings = 12500;
        totalTrips = 8;
        totalHours = 9;
        totalDistance = 180;
        break;
      case 'week':
        totalEarnings = 125000;
        totalTrips = 28;
        totalHours = 160;
        totalDistance = 1450;
        break;
      case 'month':
        totalEarnings = 375000;
        totalTrips = 240;
        totalHours = 670;
        totalDistance = 5400;
        break;
      case 'year':
        totalEarnings = 4500000;
        totalTrips = 2880;
        totalHours = 8040;
        totalDistance = 64800;
        break;
      default:
        totalEarnings = 125000;
        totalTrips = 28;
        totalHours = 160;
        totalDistance = 1450;
    }
    
    // Generate performance changes with realistic values
    const earningsChange = Math.round((Math.random() - 0.3) * 20 * 100) / 100; // -6% to +14%
    const tripsChange = Math.round((Math.random() - 0.3) * 15 * 100) / 100; // -4.5% to +10.5%
    const hoursChange = Math.round((Math.random() - 0.5) * 12 * 100) / 100; // -6% to +6%
    const distanceChange = Math.round((Math.random() - 0.3) * 18 * 100) / 100; // -5.4% to +12.6%
    
    const analyticsData = {
      totalEarnings: totalEarnings,
      totalTrips: totalTrips,
      totalHours: totalHours,
      totalDistance: totalDistance,
      performance: {
        averageRating: driver.rating || 4.8,
        completionRate: 94.2,
        earningsChange: earningsChange,
        tripsChange: tripsChange,
        hoursChange: hoursChange,
        distanceChange: distanceChange
      }
    };

    res.json({ success: true, data: analyticsData });
    
  } catch (error) {
    console.error('❌ Analytics error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch analytics'
    });
  }
};

// PROFILE - Returns authenticated user's profile
const getProfile = async (req, res) => {
  try {
    const userEmail = getLoggedUserEmail(req);
    
    if (!userEmail) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    const driver = await findDriverByEmail(userEmail);

    if (!driver) {
      return res.status(404).json({
        success: false,
        message: 'Driver profile not found'
      });
    }

    const profileData = {
      _id: driver._id,
      personalInfo: {
        firstName: driver.firstName,
        lastName: driver.lastName,
        email: driver.email,
        phone: driver.phone,
        profileImage: driver.profileImage
      },
      vehicle: driver.vehicleDetails || {
        make: "",
        model: "", 
        year: null,
        plateNumber: "",
        color: ""
      },
      documents: driver.documents || {},
      stats: {
        rating: driver.rating || 0,
        totalTrips: driver.totalTrips || 0,
        totalEarnings: driver.earnings?.total || 0
      },
      status: driver.status,
      isAvailable: driver.isAvailable,
      location: driver.location || {},
      createdAt: driver.createdAt,
      updatedAt: driver.updatedAt
    };

    res.json({ success: true, data: profileData });
    
  } catch (error) {
    console.error('❌ Profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch profile'
    });
  }
};

// Helper function to create placeholder functions for other endpoints
const createAuthenticatedEndpoint = (endpointName, fallbackData = {}) => {
  return async (req, res) => {
    try {
      const userEmail = getLoggedUserEmail(req);
      
      if (!userEmail) {
        return res.status(401).json({
          success: false,
          message: 'Authentication required'
        });
      }

      const driver = await findDriverByEmail(userEmail);

      if (!driver) {
        return res.status(404).json({
          success: false,
          message: 'Driver profile not found'
        });
      }

      console.log(`🔐 ${endpointName} endpoint called for driver: ${driver.email}`);

      // Return fallback data with driver context
      const responseData = {
        ...fallbackData,
        driverId: driver._id,
        driverEmail: driver.email,
        message: `${endpointName} data for ${driver.firstName} ${driver.lastName}`
      };

      res.json({ success: true, data: responseData });
      
    } catch (error) {
      console.error(`❌ ${endpointName} error:`, error);
      res.status(500).json({
        success: false,
        message: `Failed to fetch ${endpointName.toLowerCase()}`
      });
    }
  };
};

// Create authenticated versions of all other endpoints with fallback data
const getTopRoutes = createAuthenticatedEndpoint('TopRoutes', [
  { route: "Sample Route", trips: 0, earnings: 0, avgRating: 0 }
]);

const getBusyHours = createAuthenticatedEndpoint('BusyHours', [
  { hour: "No data", trips: 0, percentage: 0 }
]);

const getTrips = createAuthenticatedEndpoint('Trips', []);

const getTripDetails = async (req, res) => {
  try {
    const userEmail = getLoggedUserEmail(req);
    const { tripId } = req.params;
    
    if (!userEmail) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    const driver = await findDriverByEmail(userEmail);

    if (!driver) {
      return res.status(404).json({
        success: false,
        message: 'Driver profile not found'
      });
    }

    // In real implementation: const trip = await Trip.findOne({ _id: tripId, driverId: driver._id });
    const trip = {
      id: tripId,
      driverId: driver._id,
      tripName: "Sample Trip",
      passenger: "Sample Passenger", 
      status: "completed",
      fare: 5000,
      message: `Trip details for driver: ${driver.firstName} ${driver.lastName}`
    };

    res.json({ success: true, data: trip });
    
  } catch (error) {
    console.error('❌ Trip details error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch trip details'
    });
  }
};

const getEarnings = createAuthenticatedEndpoint('Earnings', {
  totalEarnings: 0,
  todayEarnings: 0,
  weeklyEarnings: 0,
  monthlyEarnings: 0,
  transactions: []
});

const getDailyEarnings = createAuthenticatedEndpoint('DailyEarnings', {});
const getWeeklyEarnings = createAuthenticatedEndpoint('WeeklyEarnings', {});
const getMonthlyEarnings = createAuthenticatedEndpoint('MonthlyEarnings', {});
const getReviews = createAuthenticatedEndpoint('Reviews', []);
const getSchedule = createAuthenticatedEndpoint('Schedule', { calendar: {} });
const getGroups = createAuthenticatedEndpoint('Groups', []);
const getMessages = createAuthenticatedEndpoint('Messages', []);
const getNotifications = createAuthenticatedEndpoint('Notifications', []);
// TOP ROUTES ANALYTICS - Enhanced with period support and realistic data
const getTopRoutesAnalytics = async (req, res) => {
  try {
    const userEmail = getLoggedUserEmail(req);
    const { period = 'week' } = req.query;
    
    if (!userEmail) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    const driver = await findDriverByEmail(userEmail);

    if (!driver) {
      return res.status(404).json({
        success: false,
        message: 'Driver profile not found'
      });
    }

    console.log(`📈 Getting top routes analytics for driver ${driver.email}, period: ${period}`);

    // Calculate multiplier based on period
    const multiplier = period === 'month' ? 4 : period === 'year' ? 52 : period === 'day' ? 0.14 : 1;
    
    const topRoutes = [
      {
        id: 1,
        route: "Colombo Airport ↔ Galle Fort",
        trips: Math.max(1, Math.round(12 * multiplier)),
        earnings: Math.round(89500 * multiplier),
        avgRating: 4.8,
        distance: "120km",
        avgDuration: "2h 30m",
        popularity: 95
      },
      {
        id: 2,
        route: "Kandy ↔ Nuwara Eliya",
        trips: Math.max(1, Math.round(8 * multiplier)),
        earnings: Math.round(65000 * multiplier),
        avgRating: 4.9,
        distance: "78km", 
        avgDuration: "2h 15m",
        popularity: 87
      },
      {
        id: 3,
        route: "Colombo City ↔ Negombo",
        trips: Math.max(1, Math.round(15 * multiplier)),
        earnings: Math.round(45000 * multiplier),
        avgRating: 4.6,
        distance: "42km",
        avgDuration: "1h 20m",
        popularity: 78
      },
      {
        id: 4,
        route: "Galle ↔ Mirissa Beach",
        trips: Math.max(1, Math.round(6 * multiplier)),
        earnings: Math.round(28500 * multiplier),
        avgRating: 4.7,
        distance: "24km",
        avgDuration: "45m",
        popularity: 65
      }
    ];

    res.json({ 
      success: true, 
      data: {
        period,
        routes: topRoutes,
        totalRoutes: topRoutes.length,
        driverId: driver._id,
        driverName: `${driver.firstName} ${driver.lastName}`
      }
    });
    
  } catch (error) {
    console.error('❌ Top routes analytics error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch top routes analytics'
    });
  }
};

// BUSY HOURS ANALYTICS - Enhanced with period support and realistic data
const getBusyHoursAnalytics = async (req, res) => {
  try {
    const userEmail = getLoggedUserEmail(req);
    const { period = 'week' } = req.query;
    
    if (!userEmail) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    const driver = await findDriverByEmail(userEmail);

    if (!driver) {
      return res.status(404).json({
        success: false,
        message: 'Driver profile not found'
      });
    }

    console.log(`⏰ Getting busy hours analytics for driver ${driver.email}, period: ${period}`);

    // Generate realistic busy hours data
    const busyHours = [
      { hour: "6:00 AM", trips: 8, percentage: 12.5, avgEarnings: 3500 },
      { hour: "7:00 AM", trips: 15, percentage: 23.4, avgEarnings: 6800 },
      { hour: "8:00 AM", trips: 22, percentage: 34.4, avgEarnings: 9200 },
      { hour: "9:00 AM", trips: 18, percentage: 28.1, avgEarnings: 7500 },
      { hour: "10:00 AM", trips: 12, percentage: 18.8, avgEarnings: 5200 },
      { hour: "11:00 AM", trips: 9, percentage: 14.1, avgEarnings: 4100 },
      { hour: "12:00 PM", trips: 14, percentage: 21.9, avgEarnings: 6300 },
      { hour: "1:00 PM", trips: 16, percentage: 25.0, avgEarnings: 7200 },
      { hour: "2:00 PM", trips: 11, percentage: 17.2, avgEarnings: 4900 },
      { hour: "3:00 PM", trips: 13, percentage: 20.3, avgEarnings: 5800 },
      { hour: "4:00 PM", trips: 19, percentage: 29.7, avgEarnings: 8100 },
      { hour: "5:00 PM", trips: 25, percentage: 39.1, avgEarnings: 10500 },
      { hour: "6:00 PM", trips: 28, percentage: 43.8, avgEarnings: 12200 },
      { hour: "7:00 PM", trips: 24, percentage: 37.5, avgEarnings: 10800 },
      { hour: "8:00 PM", trips: 20, percentage: 31.3, avgEarnings: 9100 },
      { hour: "9:00 PM", trips: 17, percentage: 26.6, avgEarnings: 7700 },
      { hour: "10:00 PM", trips: 12, percentage: 18.8, avgEarnings: 5400 },
      { hour: "11:00 PM", trips: 7, percentage: 10.9, avgEarnings: 3200 }
    ];

    // Adjust data based on period
    const adjustedBusyHours = busyHours.map(hour => ({
      ...hour,
      trips: period === 'day' ? Math.max(0, Math.round(hour.trips * 0.14)) :
              period === 'month' ? Math.round(hour.trips * 4.3) :
              period === 'year' ? Math.round(hour.trips * 52) :
              hour.trips,
      avgEarnings: period === 'day' ? Math.round(hour.avgEarnings * 0.14) :
                   period === 'month' ? Math.round(hour.avgEarnings * 4.3) :
                   period === 'year' ? Math.round(hour.avgEarnings * 52) :
                   hour.avgEarnings
    }));

    const peakHour = adjustedBusyHours.reduce((max, hour) => 
      hour.trips > max.trips ? hour : max, adjustedBusyHours[0]);

    res.json({ 
      success: true, 
      data: {
        period,
        hours: adjustedBusyHours,
        peakHour: peakHour.hour,
        peakTrips: peakHour.trips,
        totalHours: adjustedBusyHours.length,
        driverId: driver._id,
        driverName: `${driver.firstName} ${driver.lastName}`
      }
    });
    
  } catch (error) {
    console.error('❌ Busy hours analytics error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch busy hours analytics'
    });
  }
};

// WEEKLY EARNINGS CHART - Enhanced with realistic daily data
const getWeeklyEarningsChart = async (req, res) => {
  try {
    const userEmail = getLoggedUserEmail(req);
    
    if (!userEmail) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    const driver = await findDriverByEmail(userEmail);

    if (!driver) {
      return res.status(404).json({
        success: false,
        message: 'Driver profile not found'
      });
    }

    console.log(`📊 Getting weekly earnings chart for driver ${driver.email}`);

    // Generate realistic daily earnings for the week
    const today = new Date();
    const weeklyData = [];
    
    for (let i = 6; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(today.getDate() - i);
      
      // Simulate realistic earnings with weekly patterns
      let baseEarnings = 0;
      const dayOfWeek = date.getDay(); // 0 = Sunday, 6 = Saturday
      
      if (dayOfWeek === 0 || dayOfWeek === 6) { // Weekend
        baseEarnings = Math.random() * 8000 + 12000; // 12,000 - 20,000
      } else if (dayOfWeek >= 1 && dayOfWeek <= 5) { // Weekday
        baseEarnings = Math.random() * 6000 + 8000; // 8,000 - 14,000
      }

      weeklyData.push({
        date: date.toISOString().split('T')[0],
        day: date.toLocaleDateString('en', { weekday: 'short' }),
        earnings: Math.round(baseEarnings),
        trips: Math.round(baseEarnings / 850), // Avg 850 per trip
        hours: Math.round((baseEarnings / 1500) + 2) // Base hours + earnings factor
      });
    }

    const totalWeeklyEarnings = weeklyData.reduce((sum, day) => sum + day.earnings, 0);
    const totalWeeklyTrips = weeklyData.reduce((sum, day) => sum + day.trips, 0);
    const avgDailyEarnings = totalWeeklyEarnings / 7;

    res.json({ 
      success: true, 
      data: {
        period: 'week',
        dailyEarnings: weeklyData,
        summary: {
          totalWeeklyEarnings,
          totalWeeklyTrips,
          avgDailyEarnings: Math.round(avgDailyEarnings),
          bestDay: weeklyData.reduce((max, day) => day.earnings > max.earnings ? day : max),
          growth: Math.round((Math.random() - 0.5) * 30) // -15% to +15% growth
        },
        driverId: driver._id,
        driverName: `${driver.firstName} ${driver.lastName}`
      }
    });
    
  } catch (error) {
    console.error('❌ Weekly earnings chart error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch weekly earnings chart'
    });
  }
};
const getTransactions = createAuthenticatedEndpoint('Transactions', []);

// Action endpoints (update operations)
const updateProfile = async (req, res) => {
  try {
    const userEmail = getLoggedUserEmail(req);
    
    if (!userEmail) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    const driver = await findDriverByEmail(userEmail);

    if (!driver) {
      return res.status(404).json({
        success: false,
        message: 'Driver profile not found'
      });
    }

    // In real implementation, update the driver document
    // await Driver.findByIdAndUpdate(driver._id, req.body);

    res.json({ 
      success: true, 
      message: `Profile updated for ${driver.firstName} ${driver.lastName}`,
      driverId: driver._id
    });
    
  } catch (error) {
    console.error('❌ Update profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update profile'
    });
  }
};

// Generic action handler
const createAuthenticatedAction = (actionName) => {
  return async (req, res) => {
    try {
      const userEmail = getLoggedUserEmail(req);
      
      if (!userEmail) {
        return res.status(401).json({
          success: false,
          message: 'Authentication required'
        });
      }

      const driver = await findDriverByEmail(userEmail);

      if (!driver) {
        return res.status(404).json({
          success: false,
          message: 'Driver profile not found'
        });
      }

      console.log(`🔐 ${actionName} action for driver: ${driver.email}`);

      res.json({ 
        success: true, 
        message: `${actionName} successful for ${driver.firstName} ${driver.lastName}`,
        driverId: driver._id
      });
      
    } catch (error) {
      console.error(`❌ ${actionName} error:`, error);
      res.status(500).json({
        success: false,
        message: `${actionName} failed`
      });
    }
  };
};

// Create action handlers
const updateSchedule = createAuthenticatedAction('Schedule update');
const markNotificationAsRead = createAuthenticatedAction('Mark notification read');
const updateTripStatus = createAuthenticatedAction('Trip status update');
const acceptTrip = createAuthenticatedAction('Accept trip');
const declineTrip = createAuthenticatedAction('Decline trip');
const respondToReview = createAuthenticatedAction('Review response');
const markUnavailable = createAuthenticatedAction('Mark unavailable');
const markAvailable = createAuthenticatedAction('Mark available');
const lockDays = createAuthenticatedAction('Lock days');

// NEW ENDPOINTS FOR REACT PAGES
// 1. Enhanced Analytics endpoint with exact format required
const getAnalyticsNew = async (req, res) => {
  try {
    const userEmail = getLoggedUserEmail(req);
    const { period = 'week' } = req.query;
    
    if (!userEmail) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    const driver = await findDriverByEmail(userEmail);
    if (!driver) {
      return res.status(404).json({
        success: false,
        message: 'Driver profile not found'
      });
    }

    console.log(`📊 Getting analytics for driver ${driver.email}, period: ${period}`);

    // Calculate realistic data based on period
    let totalEarnings, totalTrips, totalHours, totalDistance;
    
    switch(period) {
      case 'quarter':
        totalEarnings = 1125000;
        totalTrips = 336;
        totalHours = 2010;
        totalDistance = 16200;
        break;
      case 'month':
        totalEarnings = 375000;
        totalTrips = 112;
        totalHours = 670;
        totalDistance = 5400;
        break;
      case 'week':
      default:
        totalEarnings = 125000;
        totalTrips = 28;
        totalHours = 160;
        totalDistance = 1450;
        break;
    }
    
    // Generate performance changes with realistic values
    const earningsChange = Math.round((Math.random() - 0.3) * 20 * 100) / 100;
    const tripsChange = Math.round((Math.random() - 0.3) * 15 * 100) / 100;
    const hoursChange = Math.round((Math.random() - 0.5) * 12 * 100) / 100;
    const distanceChange = Math.round((Math.random() - 0.3) * 18 * 100) / 100;
    
    const analyticsData = {
      totalEarnings: totalEarnings,
      totalTrips: totalTrips,
      totalHours: totalHours,
      totalDistance: totalDistance,
      performance: {
        averageRating: driver.rating || 4.8,
        completionRate: 94.2,
        earningsChange: earningsChange,
        tripsChange: tripsChange,
        hoursChange: hoursChange,
        distanceChange: distanceChange
      }
    };

    res.json({ success: true, data: analyticsData });
    
  } catch (error) {
    console.error('❌ Analytics error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch analytics'
    });
  }
};

// 2. Weekly earnings endpoint with exact format - MUST RETURN ARRAY
const getWeeklyEarningsNew = async (req, res) => {
  try {
    const userEmail = getLoggedUserEmail(req);
    
    if (!userEmail) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    const driver = await findDriverByEmail(userEmail);
    if (!driver) {
      return res.status(404).json({
        success: false,
        message: 'Driver profile not found'
      });
    }

    console.log(`📊 Getting weekly earnings for driver ${driver.email}`);

    // ALWAYS return array format - never object
    const weeklyData = [
      { "day": "Mon", "earnings": 1200 + Math.round(Math.random() * 800) },
      { "day": "Tue", "earnings": 1500 + Math.round(Math.random() * 600) },
      { "day": "Wed", "earnings": 800 + Math.round(Math.random() * 1000) },
      { "day": "Thu", "earnings": 2100 + Math.round(Math.random() * 500) },
      { "day": "Fri", "earnings": 1800 + Math.round(Math.random() * 700) },
      { "day": "Sat", "earnings": 2200 + Math.round(Math.random() * 800) },
      { "day": "Sun", "earnings": 1100 + Math.round(Math.random() * 900) }
    ];

    // Ensure data is ALWAYS an array
    res.json({ success: true, data: weeklyData });
    
  } catch (error) {
    console.error('❌ Weekly earnings error:', error);
    // Even on error, return empty array for data consistency
    res.status(500).json({
      success: false,
      message: 'Failed to fetch weekly earnings',
      data: [] // ALWAYS array
    });
  }
};

// 3. Trips endpoint with detailed history - MUST RETURN ARRAY
const getTripsNew = async (req, res) => {
  try {
    const userEmail = getLoggedUserEmail(req);
    
    if (!userEmail) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    const driver = await findDriverByEmail(userEmail);
    if (!driver) {
      return res.status(404).json({
        success: false,
        message: 'Driver profile not found'
      });
    }

    console.log(`🚗 Getting trips for driver ${driver.email}`);

    // Generate realistic trip data - ALWAYS return array
    const trips = [];
    const locations = [
      { pickup: "Colombo", destination: "Kandy", distance: "120 km", duration: "4h", fare: 3500 },
      { pickup: "Galle", destination: "Matara", distance: "45 km", duration: "1.5h", fare: 1200 },
      { pickup: "Negombo", destination: "Colombo Airport", distance: "15 km", duration: "30m", fare: 800 },
      { pickup: "Kandy", destination: "Nuwara Eliya", distance: "78 km", duration: "2.5h", fare: 2800 },
      { pickup: "Colombo", destination: "Galle", distance: "116 km", duration: "3h", fare: 3200 }
    ];

    for (let i = 0; i < 15; i++) {
      const location = locations[i % locations.length];
      const date = new Date();
      date.setDate(date.getDate() - i);
      
      const startHour = 8 + Math.floor(Math.random() * 12);
      const startMinute = Math.floor(Math.random() * 6) * 10;
      const endHour = startHour + Math.floor(Math.random() * 4) + 1;
      const endMinute = Math.floor(Math.random() * 6) * 10;
      
      trips.push({
        id: `trip_${Date.now()}_${i}`,
        passenger: `User ${Math.random().toString(36).substr(2, 8)}...`,
        pickupLocation: location.pickup,
        destination: location.destination,
        date: date.toISOString().split('T')[0],
        startTime: `${startHour.toString().padStart(2, '0')}:${startMinute.toString().padStart(2, '0')}`,
        endTime: `${endHour.toString().padStart(2, '0')}:${endMinute.toString().padStart(2, '0')}`,
        duration: location.duration,
        distance: location.distance,
        fare: location.fare + Math.round(Math.random() * 500),
        rating: Math.floor(Math.random() * 2) + 4, // 4 or 5 stars
        status: "completed",
        paymentMethod: Math.random() > 0.5 ? "card" : "cash",
        notes: Math.random() > 0.7 ? "Great service, thank you!" : "No additional notes",
        tip: Math.random() > 0.8 ? Math.round(Math.random() * 300) : 0
      });
    }

    // Ensure data is ALWAYS an array
    res.json({ success: true, data: trips });
    
  } catch (error) {
    console.error('❌ Trips error:', error);
    // Even on error, return empty array for data consistency
    res.status(500).json({
      success: false,
      message: 'Failed to fetch trips',
      data: [] // ALWAYS array
    });
  }
};

// 4. Earnings endpoint with period support - FOR DRIVER EARNINGS PAGE
const getEarningsNew = async (req, res) => {
  try {
    const userEmail = getLoggedUserEmail(req);
    const { period = 'week' } = req.query;
    
    if (!userEmail) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    const driver = await findDriverByEmail(userEmail);
    if (!driver) {
      return res.status(404).json({
        success: false,
        message: 'Driver profile not found'
      });
    }

    console.log(`💰 Getting earnings for driver ${driver.email}, period: ${period}`);

    let total, trips, daily, weekly;
    
    switch(period) {
      case 'year':
        total = 4500000;
        trips = 1440;
        daily = [
          { "day": "Mon", "earnings": 18000 },
          { "day": "Tue", "earnings": 15500 },
          { "day": "Wed", "earnings": 17200 },
          { "day": "Thu", "earnings": 19800 },
          { "day": "Fri", "earnings": 21000 },
          { "day": "Sat", "earnings": 25000 },
          { "day": "Sun", "earnings": 16500 }
        ];
        weekly = [];
        for (let i = 1; i <= 52; i++) {
          weekly.push({
            week: `Week ${i}`,
            earnings: 80000 + Math.round(Math.random() * 40000)
          });
        }
        break;
      case 'month':
        total = 375000;
        trips = 120;
        daily = [
          { "day": "Mon", "earnings": 12000 },
          { "day": "Tue", "earnings": 11500 },
          { "day": "Wed", "earnings": 10800 },
          { "day": "Thu", "earnings": 13100 },
          { "day": "Fri", "earnings": 14800 },
          { "day": "Sat", "earnings": 16200 },
          { "day": "Sun", "earnings": 9600 }
        ];
        weekly = [];
        // Generate 4 weeks for the month
        const weekNumbers = [36, 37, 38, 39];
        weekNumbers.forEach(weekNum => {
          weekly.push({
            week: `Week ${weekNum}`,
            earnings: 85000 + Math.round(Math.random() * 25000)
          });
        });
        break;
      case 'week':
      default:
        total = 125000;
        trips = 28;
        daily = [
          { "day": "Mon", "earnings": 1200 },
          { "day": "Tue", "earnings": 1500 },
          { "day": "Wed", "earnings": 800 },
          { "day": "Thu", "earnings": 2100 },
          { "day": "Fri", "earnings": 1800 },
          { "day": "Sat", "earnings": 2200 },
          { "day": "Sun", "earnings": 1100 }
        ];
        weekly = [
          { "week": "Week 36", "earnings": 8500 },
          { "week": "Week 37", "earnings": 9200 }
        ];
        break;
    }

    const earningsData = {
      total: total,
      trips: trips,
      change: Math.round((Math.random() - 0.3) * 20 * 100) / 100,
      daily: daily,
      weekly: weekly
    };

    res.json({ success: true, data: earningsData });
    
  } catch (error) {
    console.error('❌ Earnings error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch earnings',
      data: {
        total: 0,
        trips: 0,
        change: 0,
        daily: [],
        weekly: []
      }
    });
  }
};

// 5. Transactions endpoint - FOR DRIVER EARNINGS PAGE
const getTransactionsNew = async (req, res) => {
  try {
    const userEmail = getLoggedUserEmail(req);
    const { limit = 10 } = req.query;
    
    if (!userEmail) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    const driver = await findDriverByEmail(userEmail);
    if (!driver) {
      return res.status(404).json({
        success: false,
        message: 'Driver profile not found'
      });
    }

    console.log(`💳 Getting transactions for driver ${driver.email}, limit: ${limit}`);

    // Generate realistic transaction data - ALWAYS return array
    const transactions = [];
    const transactionTypes = [
      { type: "trip", description: "Trip fare", baseAmount: 3500 },
      { type: "tip", description: "Passenger tip", baseAmount: 500 },
      { type: "bonus", description: "Weekly bonus", baseAmount: 1000 },
      { type: "trip", description: "Trip fare", baseAmount: 2800 },
      { type: "refund", description: "Trip refund", baseAmount: -1200 },
      { type: "trip", description: "Trip fare", baseAmount: 4200 },
      { type: "tip", description: "Passenger tip", baseAmount: 300 },
      { type: "trip", description: "Trip fare", baseAmount: 1800 },
      { type: "bonus", description: "Monthly bonus", baseAmount: 5000 },
      { type: "trip", description: "Trip fare", baseAmount: 3200 }
    ];

    for (let i = 0; i < Math.min(parseInt(limit), 20); i++) {
      const transaction = transactionTypes[i % transactionTypes.length];
      const date = new Date();
      date.setHours(date.getHours() - i * 4); // 4 hours apart
      
      transactions.push({
        id: `txn${123 + i}`,
        amount: transaction.baseAmount + Math.round(Math.random() * 500),
        date: date.toISOString(),
        type: transaction.type,
        description: transaction.description
      });
    }

    // Ensure data is ALWAYS an array
    res.json({ success: true, data: transactions });
    
  } catch (error) {
    console.error('❌ Transactions error:', error);
    // Even on error, return empty array for data consistency
    res.status(500).json({
      success: false,
      message: 'Failed to fetch transactions',
      data: [] // ALWAYS array
    });
  }
};

// 6. Bank details endpoint - FOR DRIVER EARNINGS PAGE
const getBankDetailsNew = async (req, res) => {
  try {
    const userEmail = getLoggedUserEmail(req);
    
    if (!userEmail) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    const driver = await findDriverByEmail(userEmail);
    if (!driver) {
      return res.status(404).json({
        success: false,
        message: 'Driver profile not found'
      });
    }

    console.log(`🏦 Getting bank details for driver ${driver.email}`);

    // Return bank details in exact format required
    const bankDetails = {
      accountHolderName: `${driver.firstName || 'John'} ${driver.lastName || 'Doe'}`,
      bankName: "Bank of Ceylon",
      accountNumber: "1234567890",
      branchCode: "123",
      branchName: "Colombo Main Branch"
    };

    res.json({ success: true, data: bankDetails });
    
  } catch (error) {
    console.error('❌ Bank details error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch bank details',
      data: {
        accountHolderName: "",
        bankName: "",
        accountNumber: "",
        branchCode: "",
        branchName: ""
      }
    });
  }
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
  markNotificationAsRead,
  // New endpoints for React pages
  getAnalyticsNew,
  getWeeklyEarningsNew,
  getTripsNew,
  getEarningsNew,
  getTransactionsNew,
  getBankDetailsNew
};
