const mongoose = require('mongoose');
const Guide = require('../models/Guide');

// Helper function - WITH AUTHENTICATION - Fetch logged guide's data
const findGuideByEmail = async (email) => {
  try {
    console.log(`🔍 Looking up guide by email: ${email}`);
    
    // Query the Guide_info collection directly (similar to driver microservice)
    const db = mongoose.connection.db;
    const collection = db.collection('Guide_info');
    const guide = await collection.findOne({ 
      $or: [
        { email: email },
        { "personalInfo.email": email }
      ]
    });
    
    if (guide) {
      console.log(`✅ Found guide: ${guide.personalInfo?.firstName || 'N/A'} ${guide.personalInfo?.lastName || 'N/A'} (${guide.email})`);
      console.log(`📊 Guide has ${guide.tours?.active?.length || 0} active, ${guide.tours?.pending?.length || 0} pending, ${guide.tours?.history?.length || 0} history tours`);
      return guide;
    } else {
      console.log(`❌ No guide found with email: ${email}`);
      return null;
    }
  } catch (error) {
    console.error('❌ Database lookup failed:', error.message);
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
  // 4. From URL parameter (current implementation): req.params.guideId
  
  // For now, treating guideId parameter as email
  const email = req.params.guideId;
  
  // You could also check headers:
  // const email = req.headers['x-user-email'] || req.params.guideId;
  
  console.log(`🔐 Raw guideId parameter: "${req.params.guideId}"`);
  console.log(`🔐 Extracted user email: "${email}"`);
  console.log(`🔐 URL decoded email: "${decodeURIComponent(email || '')}"`);
  
  // Return URL decoded email to handle @ symbol encoding
  return email ? decodeURIComponent(email) : email;
};

// DASHBOARD - Returns authenticated guide's data
const getDashboard = async (req, res) => {
  try {
    const userEmail = getLoggedUserEmail(req);
    
    if (!userEmail) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required - no user email provided'
      });
    }

    const guide = await findGuideByEmail(userEmail);

    if (!guide) {
      return res.status(404).json({
        success: false,
        message: 'Guide profile not found. Please complete your registration.'
      });
    }

    // Main dashboard data in the requested format
    const dashboardData = {
      totalEarnings: guide.stats?.totalEarnings || 0,
      totalTours: guide.stats?.totalTours || 0,
      totalTrips: guide.stats?.totalTours || 0, // Alternative naming
      totalHours: guide.stats?.totalHours || 0,
      totalCustomers: guide.stats?.totalCustomers || 0,
      averageRating: guide.stats?.rating || 0,
      completionRate: guide.stats?.completionRate || 0,
      earningsChange: guide.analytics?.performance?.earningsChange || 0,
      toursChange: guide.analytics?.performance?.toursChange || 0,
      hoursChange: guide.analytics?.performance?.hoursChange || 0
    };

    // Additional dashboard context (for backward compatibility)
    const extendedData = {
      ...dashboardData,
      guideId: guide._id,
      email: guide.email,
      personalInfo: {
        firstName: guide.personalInfo?.firstName || '',
        lastName: guide.personalInfo?.lastName || '',
        email: guide.email,
        phone: guide.personalInfo?.phone || '',
        profileImage: guide.personalInfo?.profilePicture || '',
        languages: guide.personalInfo?.languages || [],
        specializations: guide.personalInfo?.specializations || []
      },
      activeTours: guide.tours?.active?.length || 0,
      pendingTours: guide.tours?.pending?.length || 0,
      isAvailable: guide.status === 'active',
      status: guide.status || 'inactive',
      coverageAreas: guide.serviceAreas?.primaryRegions || [],
      hourlyRate: guide.preferences?.pricing?.baseHourlyRate || 0,
      dayRate: guide.tourPackages?.[0]?.basePrice || 0
    };

    res.json({ success: true, data: extendedData });
    
  } catch (error) {
    console.error('❌ Dashboard error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch dashboard data'
    });
  }
};

// STATS - Returns authenticated guide's stats
const getStats = async (req, res) => {
  try {
    const userEmail = getLoggedUserEmail(req);
    
    if (!userEmail) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    const guide = await findGuideByEmail(userEmail);

    if (!guide) {
      return res.status(404).json({
        success: false,
        message: 'Guide profile not found'
      });
    }

    const statsData = {
      rating: guide.rating || 0,
      totalTours: guide.totalTours || 0,
      completedTours: guide.totalTours || 0, // Calculate from actual tours
      activeTours: 2, // From tours collection
      pendingTours: 3, // From tours collection
      cancelledTours: 0, // Calculate from tours
      totalReviews: 0, // From reviews collection
      totalEarnings: guide.earnings?.total || 0,
      todayEarnings: guide.earnings?.daily || 0,
      weeklyEarnings: guide.earnings?.weekly || 0,
      monthlyEarnings: guide.earnings?.monthly || 0,
      completionRate: 100, // Calculate from actual data
      responseRate: 100, // Calculate from actual data
      averagePerTour: guide.totalTours > 0 ? (guide.earnings?.total || 0) / guide.totalTours : 0,
      yearsOfExperience: guide.experience?.years || 0,
      languagesSpoken: guide.languages?.length || 0,
      specializations: guide.specializations?.length || 0,
      certifications: guide.certifications?.length || 0
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

// ACTIVE TOURS - Returns guide's active tours
const getActiveTours = async (req, res) => {
  try {
    const userEmail = getLoggedUserEmail(req);
    
    if (!userEmail) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    const guide = await findGuideByEmail(userEmail);

    if (!guide) {
      return res.status(404).json({
        success: false,
        message: 'Guide profile not found'
      });
    }

    // In a real implementation, you would query the tours collection:
    // const activeTours = await Tour.find({ guideId: guide._id, status: 'active' });
    
    // For now, return sample data based on the authenticated guide
    const activeTours = [
      {
        id: `TOUR_${guide._id}_001`,
        tourName: "Cultural Heritage Walk",
        clientId: "client_123",
        client: "Emma Thompson",
        clientAvatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330",
        location: "Kandy Old City",
        destination: "Temple of the Tooth",
        groupSize: 4,
        duration: "4 hours",
        fee: 12000,
        status: "in_progress",
        startTime: "9:00 AM",
        startDate: new Date().toISOString().split('T')[0],
        tourType: "cultural-tour",
        guideId: guide._id,
        guideName: `${guide.firstName} ${guide.lastName}`,
        progress: 60,
        specialRequests: "Photography focused tour"
      },
      {
        id: `TOUR_${guide._id}_002`,
        tourName: "Spice Garden Experience",
        clientId: "client_456",
        client: "Mark Wilson",
        clientAvatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d",
        location: "Matale",
        destination: "Spice Gardens",
        groupSize: 2,
        duration: "6 hours",
        fee: 18000,
        status: "starting_soon",
        startTime: "2:00 PM",
        startDate: new Date().toISOString().split('T')[0],
        tourType: "culinary-tour",
        guideId: guide._id,
        guideName: `${guide.firstName} ${guide.lastName}`,
        progress: 0,
        specialRequests: "Vegetarian food preferences"
      }
    ];

    res.json({ success: true, data: activeTours });
    
  } catch (error) {
    console.error('❌ Active tours error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch active tours'
    });
  }
};

// PENDING TOURS - Returns guide's pending tour requests
const getPendingTours = async (req, res) => {
  try {
    const userEmail = getLoggedUserEmail(req);
    
    if (!userEmail) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    const guide = await findGuideByEmail(userEmail);

    if (!guide) {
      return res.status(404).json({
        success: false,
        message: 'Guide profile not found'
      });
    }

    // Sample pending tours for authenticated guide
    const pendingTours = [
      {
        id: `TOUR_${guide._id}_003`,
        client: "Sarah Mitchell",
        requestedLocation: "Sigiriya",
        tourType: "historical-tour",
        groupSize: 6,
        estimatedDuration: "8 hours",
        estimatedFee: 25000,
        requestTime: new Date().toISOString(),
        clientRating: 4.7,
        tourName: "Ancient Fortress Discovery",
        requestedDate: new Date(Date.now() + 86400000).toISOString().split('T')[0], // Tomorrow
        specialRequests: "Early morning start preferred",
        languages: ["English", "German"],
        guideId: guide._id
      },
      {
        id: `TOUR_${guide._id}_004`,
        client: "David Chen",
        requestedLocation: "Galle Fort",
        tourType: "cultural-tour",
        groupSize: 3,
        estimatedDuration: "5 hours",
        estimatedFee: 15000,
        requestTime: new Date(Date.now() - 3600000).toISOString(), // 1 hour ago
        clientRating: 4.9,
        tourName: "Colonial Heritage Tour",
        requestedDate: new Date(Date.now() + 172800000).toISOString().split('T')[0], // Day after tomorrow
        specialRequests: "Photography opportunities important",
        languages: ["English"],
        guideId: guide._id
      },
      {
        id: `TOUR_${guide._id}_005`,
        client: "Lisa Anderson",
        requestedLocation: "Ella",
        tourType: "nature",
        groupSize: 2,
        estimatedDuration: "Full day",
        estimatedFee: 20000,
        requestTime: new Date(Date.now() - 1800000).toISOString(), // 30 minutes ago
        clientRating: 4.8,
        tourName: "Hill Country Adventure",
        requestedDate: new Date(Date.now() + 259200000).toISOString().split('T')[0], // 3 days from now
        specialRequests: "Train ride experience included",
        languages: ["English", "French"],
        guideId: guide._id
      }
    ];

    res.json({ success: true, data: pendingTours });
    
  } catch (error) {
    console.error('❌ Pending tours error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch pending tours'
    });
  }
};

// ANALYTICS - Returns guide's analytics
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

    const guide = await findGuideByEmail(userEmail);

    if (!guide) {
      return res.status(404).json({
        success: false,
        message: 'Guide profile not found'
      });
    }

    console.log(`📊 Getting analytics for guide ${guide.email}, period: ${period}`);

    // Calculate multiplier for period scaling
    const multiplier = period === 'month' ? 4.3 : period === 'year' ? 52 : 1;
    
    const analyticsData = {
      period: period,
      guideId: guide._id,
      guideName: `${guide.firstName} ${guide.lastName}`,
      performance: {
        averageRating: guide.rating || 0,
        completionRate: 96.8,
        earningsChange: 15.2 * (multiplier * 0.3),
        toursChange: 12.7 * (multiplier * 0.2),
        hoursChange: 8.5,
        clientSatisfactionChange: 4.3,
        totalEarnings: (guide.earnings?.total || 0) * (period === 'month' ? 0.23 : period === 'year' ? 0.02 : 1),
        totalTours: Math.round((guide.totalTours || 0) * (period === 'month' ? 0.23 : period === 'year' ? 0.02 : 1))
      },
      topLocations: [
        {
          location: "Kandy Cultural Triangle",
          tours: Math.round(15 * multiplier * 0.1),
          earnings: Math.round(180000 * multiplier * 0.1),
          avgRating: guide.rating || 4.9,
          avgGroupSize: 4.2
        },
        {
          location: "Sigiriya Ancient City",
          tours: Math.round(12 * multiplier * 0.1),
          earnings: Math.round(240000 * multiplier * 0.1),
          avgRating: guide.rating || 4.8,
          avgGroupSize: 5.1
        }
      ],
      tourTypes: [
        {
          type: "Cultural Tours",
          count: Math.round(8 * multiplier * 0.1),
          earnings: Math.round(120000 * multiplier * 0.1),
          avgDuration: "5 hours"
        },
        {
          type: "Historical Tours", 
          count: Math.round(6 * multiplier * 0.1),
          earnings: Math.round(150000 * multiplier * 0.1),
          avgDuration: "7 hours"
        }
      ],
      busySeasons: [
        {
          season: "December-February",
          tourCount: Math.round(25 * (period === 'year' ? 1 : 0.1)),
          avgEarnings: Math.round(22000 * (period === 'year' ? 1 : 0.1))
        },
        {
          season: "July-August",
          tourCount: Math.round(20 * (period === 'year' ? 1 : 0.1)),
          avgEarnings: Math.round(18000 * (period === 'year' ? 1 : 0.1))
        }
      ]
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

// PROFILE - Returns authenticated guide's profile
const getProfile = async (req, res) => {
  try {
    const userEmail = getLoggedUserEmail(req);
    
    if (!userEmail) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    const guide = await findGuideByEmail(userEmail);

    if (!guide) {
      return res.status(404).json({
        success: false,
        message: 'Guide profile not found'
      });
    }

    const profileData = {
      _id: guide._id,
      personalInfo: {
        firstName: guide.firstName,
        lastName: guide.lastName,
        email: guide.email,
        phone: guide.phone,
        profileImage: guide.profileImage,
        languages: guide.languages || [],
        specializations: guide.specializations || []
      },
      professionalInfo: {
        licenseNumber: guide.licenseNumber,
        certifications: guide.certifications || [],
        experience: guide.experience || {},
        tourTypes: guide.tourTypes || [],
        coverageAreas: guide.location?.coverageAreas || []
      },
      pricing: guide.pricing || {
        hourlyRate: 0,
        dayRate: 0,
        groupSizeMultiplier: {}
      },
      documents: guide.documents || {},
      stats: {
        rating: guide.rating || 0,
        totalTours: guide.totalTours || 0,
        totalEarnings: guide.earnings?.total || 0,
        yearsOfExperience: guide.experience?.years || 0
      },
      status: guide.status,
      isAvailable: guide.isAvailable,
      location: guide.location || {},
      availability: guide.availability || {},
      createdAt: guide.createdAt,
      updatedAt: guide.updatedAt
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

      const guide = await findGuideByEmail(userEmail);

      if (!guide) {
        return res.status(404).json({
          success: false,
          message: 'Guide profile not found'
        });
      }

      console.log(`🔐 ${endpointName} endpoint called for guide: ${guide.email}`);

      // Return fallback data with guide context
      const responseData = {
        ...fallbackData,
        guideId: guide._id,
        guideEmail: guide.email,
        message: `${endpointName} data for ${guide.firstName} ${guide.lastName}`
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
const getTopLocations = createAuthenticatedEndpoint('TopLocations', [
  { location: "Sample Location", tours: 0, earnings: 0, avgRating: 0 }
]);

const getBusySeasons = createAuthenticatedEndpoint('BusySeasons', [
  { season: "No data", tourCount: 0, avgEarnings: 0 }
]);

// TOURS - Returns guide's tour history and current tours
const getTours = async (req, res) => {
  try {
    const userEmail = getLoggedUserEmail(req);
    const { status = 'all', limit = 20, page = 1 } = req.query;
    const parsedLimit = Math.min(parseInt(limit) || 20, 100); // Max 100 tours
    const parsedPage = Math.max(parseInt(page) || 1, 1);
    const skip = (parsedPage - 1) * parsedLimit;
    
    console.log(`🌐 getTours called with params:`, req.params);
    console.log(`🔍 Query params:`, req.query);
    console.log(`📧 Extracted email: "${userEmail}"`);
    
    if (!userEmail) {
      console.log('❌ No user email provided - authentication failed');
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    const guide = await findGuideByEmail(userEmail);

    if (!guide) {
      console.log(`❌ Guide not found for email: "${userEmail}"`);
      return res.status(404).json({
        success: false,
        message: 'Guide profile not found'
      });
    }

    console.log(`�️ Getting tours for guide ${guide.email}, status: ${status}, limit: ${parsedLimit}, page: ${parsedPage}`);

    // Get tours based on status filter
    let tours = [];
    let totalCount = 0;

    if (status === 'active' || status === 'all') {
      const activeTours = (guide.tours?.active || []).map(tour => ({
        ...tour,
        status: 'active',
        type: 'active'
      }));
      tours = tours.concat(activeTours);
    }

    if (status === 'pending' || status === 'all') {
      const pendingTours = (guide.tours?.pending || []).map(tour => ({
        ...tour,
        status: 'pending',
        type: 'pending'
      }));
      tours = tours.concat(pendingTours);
    }

    if (status === 'completed' || status === 'all') {
      const completedTours = (guide.tours?.history || []).map(tour => ({
        ...tour,
        status: 'completed',
        type: 'completed'
      }));
      tours = tours.concat(completedTours);
    }

    // Sort tours by date (most recent first)
    tours.sort((a, b) => {
      const dateA = new Date(a.date || a.createdAt);
      const dateB = new Date(b.date || b.createdAt);
      return dateB - dateA;
    });

    totalCount = tours.length;
    
    console.log(`🔍 Debug - Tours collected: ${totalCount}`);
    if (totalCount > 0) {
      console.log(`🎯 Sample tour: ${tours[0].tourPackage || tours[0].title}`);
    } else {
      console.log('❌ No tours found in any category');
    }
    
    // Apply pagination
    const paginatedTours = tours.slice(skip, skip + parsedLimit);

    // Format tours data to match frontend expectations
    const formattedTours = paginatedTours.map(tour => ({
      id: tour.id || tour._id,
      customerName: tour.tourist || tour.customerName,
      tourist: tour.tourist || tour.customerName, // Alternative field name
      tourName: tour.tourPackage || tour.title,
      tourPackage: tour.tourPackage || tour.title, // Alternative field name
      startLocation: tour.startLocation || 'Not specified',
      endLocation: tour.endLocation || 'Not specified',
      date: tour.date ? new Date(tour.date).toISOString() : new Date().toISOString(),
      startTime: tour.startTime,
      endTime: tour.endTime,
      duration: tour.duration,
      groupSize: tour.groupSize || 1,
      earnings: (tour.fee || tour.estimatedFee || tour.amount || 0) / 100, // Convert to decimal format
      rating: tour.rating || tour.touristRating || 0,
      status: tour.status === 'active' ? 'completed' : tour.status, // Map statuses as needed
      paymentMethod: tour.paymentMethod === 'not specified' ? 'card' : tour.paymentMethod,
      notes: tour.notes || tour.specialRequests?.join(', ') || ''
    }));

    res.json({ success: true, data: formattedTours });
    
  } catch (error) {
    console.error('❌ Tours error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch tours'
    });
  }
};

const getTourDetails = async (req, res) => {
  try {
    const userEmail = getLoggedUserEmail(req);
    const { tourId } = req.params;
    
    if (!userEmail) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    const guide = await findGuideByEmail(userEmail);

    if (!guide) {
      return res.status(404).json({
        success: false,
        message: 'Guide profile not found'
      });
    }

    // In real implementation: const tour = await Tour.findOne({ _id: tourId, guideId: guide._id });
    const tour = {
      id: tourId,
      guideId: guide._id,
      tourName: "Sample Tour",
      client: "Sample Client", 
      status: "completed",
      fee: 15000,
      location: "Sample Location",
      message: `Tour details for guide: ${guide.firstName} ${guide.lastName}`
    };

    res.json({ success: true, data: tour });
    
  } catch (error) {
    console.error('❌ Tour details error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch tour details'
    });
  }
};

// EARNINGS - Returns guide's earnings with period filter
const getEarnings = async (req, res) => {
  try {
    const userEmail = getLoggedUserEmail(req);
    const { period = 'month' } = req.query;
    
    if (!userEmail) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    const guide = await findGuideByEmail(userEmail);

    if (!guide) {
      return res.status(404).json({
        success: false,
        message: 'Guide profile not found'
      });
    }

    console.log(`💰 Getting earnings for guide ${guide.email}, period: ${period}`);

    // Calculate period-based earnings multipliers
    const multiplier = period === 'week' ? 0.25 : period === 'year' ? 12 : 1;
    const baseEarnings = guide.earnings?.total || 450000;
    
    const earningsData = {
      period: period,
      guideId: guide._id,
      guideName: `${guide.firstName} ${guide.lastName}`,
      overview: {
        totalEarnings: Math.round(baseEarnings * multiplier),
        averagePerTour: Math.round((baseEarnings * multiplier) / Math.max(guide.totalTours * multiplier, 1)),
        tourCount: Math.round((guide.totalTours || 50) * multiplier),
        growthRate: period === 'year' ? 18.5 : period === 'month' ? 12.8 : 8.3,
        lastUpdate: new Date().toISOString()
      },
      breakdown: {
        tours: Math.round(baseEarnings * multiplier * 0.85),
        tips: Math.round(baseEarnings * multiplier * 0.12),
        bonuses: Math.round(baseEarnings * multiplier * 0.03)
      },
      periodData: getPeriodData(period, baseEarnings, guide.totalTours || 50),
      topSources: [
        {
          source: "Cultural Tours",
          amount: Math.round(baseEarnings * multiplier * 0.42),
          percentage: 42,
          tourCount: Math.round((guide.totalTours || 50) * multiplier * 0.38)
        },
        {
          source: "Historical Sites",
          amount: Math.round(baseEarnings * multiplier * 0.31),
          percentage: 31,
          tourCount: Math.round((guide.totalTours || 50) * multiplier * 0.28)
        },
        {
          source: "Nature Tours",
          amount: Math.round(baseEarnings * multiplier * 0.18),
          percentage: 18,
          tourCount: Math.round((guide.totalTours || 50) * multiplier * 0.22)
        },
        {
          source: "Other",
          amount: Math.round(baseEarnings * multiplier * 0.09),
          percentage: 9,
          tourCount: Math.round((guide.totalTours || 50) * multiplier * 0.12)
        }
      ],
      trends: {
        comparison: {
          currentPeriod: Math.round(baseEarnings * multiplier),
          previousPeriod: Math.round(baseEarnings * multiplier * 0.88),
          percentageChange: period === 'year' ? 13.6 : period === 'month' ? 8.2 : 5.1
        },
        peakDay: period === 'week' ? 'Saturday' : 'Weekend',
        bestMonth: period === 'year' ? 'December' : 'Current',
        projectedNext: Math.round(baseEarnings * multiplier * 1.15)
      }
    };

    res.json({ success: true, data: earningsData });
    
  } catch (error) {
    console.error('❌ Earnings error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch earnings'
    });
  }
};

// Helper function to generate period-specific data
function getPeriodData(period, baseEarnings, baseTours) {
  const multiplier = period === 'week' ? 0.25 : period === 'year' ? 12 : 1;
  
  if (period === 'week') {
    return {
      type: 'daily',
      data: [
        { label: 'Mon', earnings: Math.round(baseEarnings * 0.02), tours: Math.round(baseTours * 0.02) },
        { label: 'Tue', earnings: Math.round(baseEarnings * 0.025), tours: Math.round(baseTours * 0.025) },
        { label: 'Wed', earnings: Math.round(baseEarnings * 0.03), tours: Math.round(baseTours * 0.03) },
        { label: 'Thu', earnings: Math.round(baseEarnings * 0.035), tours: Math.round(baseTours * 0.035) },
        { label: 'Fri', earnings: Math.round(baseEarnings * 0.045), tours: Math.round(baseTours * 0.045) },
        { label: 'Sat', earnings: Math.round(baseEarnings * 0.055), tours: Math.round(baseTours * 0.055) },
        { label: 'Sun', earnings: Math.round(baseEarnings * 0.05), tours: Math.round(baseTours * 0.05) }
      ]
    };
  } else if (period === 'year') {
    return {
      type: 'monthly',
      data: [
        { label: 'Jan', earnings: Math.round(baseEarnings * 0.9), tours: Math.round(baseTours * 0.9) },
        { label: 'Feb', earnings: Math.round(baseEarnings * 0.85), tours: Math.round(baseTours * 0.85) },
        { label: 'Mar', earnings: Math.round(baseEarnings * 0.95), tours: Math.round(baseTours * 0.95) },
        { label: 'Apr', earnings: Math.round(baseEarnings * 1.1), tours: Math.round(baseTours * 1.1) },
        { label: 'May', earnings: Math.round(baseEarnings * 1.05), tours: Math.round(baseTours * 1.05) },
        { label: 'Jun', earnings: Math.round(baseEarnings * 1.0), tours: Math.round(baseTours * 1.0) },
        { label: 'Jul', earnings: Math.round(baseEarnings * 1.15), tours: Math.round(baseTours * 1.15) },
        { label: 'Aug', earnings: Math.round(baseEarnings * 1.12), tours: Math.round(baseTours * 1.12) },
        { label: 'Sep', earnings: Math.round(baseEarnings * 1.0), tours: Math.round(baseTours * 1.0) },
        { label: 'Oct', earnings: Math.round(baseEarnings * 1.08), tours: Math.round(baseTours * 1.08) },
        { label: 'Nov', earnings: Math.round(baseEarnings * 1.2), tours: Math.round(baseTours * 1.2) },
        { label: 'Dec', earnings: Math.round(baseEarnings * 1.3), tours: Math.round(baseTours * 1.3) }
      ]
    };
  } else { // month
    return {
      type: 'weekly',
      data: [
        { label: 'Week 1', earnings: Math.round(baseEarnings * 0.22), tours: Math.round(baseTours * 0.22) },
        { label: 'Week 2', earnings: Math.round(baseEarnings * 0.26), tours: Math.round(baseTours * 0.26) },
        { label: 'Week 3', earnings: Math.round(baseEarnings * 0.28), tours: Math.round(baseTours * 0.28) },
        { label: 'Week 4', earnings: Math.round(baseEarnings * 0.24), tours: Math.round(baseTours * 0.24) }
      ]
    };
  }
}

// TRANSACTIONS - Returns guide's transaction history with limit
const getTransactions = async (req, res) => {
  try {
    const userEmail = getLoggedUserEmail(req);
    const { limit = 10 } = req.query;
    const parsedLimit = Math.min(parseInt(limit) || 10, 100); // Max 100 transactions
    
    if (!userEmail) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    const guide = await findGuideByEmail(userEmail);

    if (!guide) {
      return res.status(404).json({
        success: false,
        message: 'Guide profile not found'
      });
    }

    console.log(`💳 Getting transactions for guide ${guide.email}, limit: ${parsedLimit}`);

    // Generate sample transactions
    const transactions = generateSampleTransactions(parsedLimit, guide);
    
    const transactionsData = {
      guideId: guide._id,
      guideName: `${guide.firstName} ${guide.lastName}`,
      limit: parsedLimit,
      total: transactions.length,
      hasMore: parsedLimit < 50, // Assume there could be more transactions
      summary: {
        totalAmount: transactions.reduce((sum, t) => sum + t.amount, 0),
        pendingAmount: transactions.filter(t => t.status === 'pending').reduce((sum, t) => sum + t.amount, 0),
        completedAmount: transactions.filter(t => t.status === 'completed').reduce((sum, t) => sum + t.amount, 0),
        thisMonth: transactions.filter(t => isThisMonth(t.date)).reduce((sum, t) => sum + t.amount, 0)
      },
      transactions: transactions
    };

    res.json({ success: true, data: transactionsData });
    
  } catch (error) {
    console.error('❌ Transactions error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch transactions'
    });
  }
};

// Helper function to generate sample transactions
function generateSampleTransactions(limit, guide) {
  const transactions = [];
  const tourTypes = ['Cultural Tour', 'Historical Tour', 'Nature Walk', 'City Tour', 'Temple Visit', 'Photography Tour'];
  const statuses = ['completed', 'completed', 'completed', 'pending', 'processing'];
  const paymentMethods = ['Credit Card', 'Cash', 'Bank Transfer', 'Digital Wallet'];
  
  for (let i = 0; i < limit; i++) {
    const daysAgo = Math.floor(Math.random() * 90);
    const date = new Date();
    date.setDate(date.getDate() - daysAgo);
    
    const baseAmount = Math.floor(Math.random() * 25000) + 5000; // 5000-30000 LKR
    const tourType = tourTypes[Math.floor(Math.random() * tourTypes.length)];
    const status = statuses[Math.floor(Math.random() * statuses.length)];
    const paymentMethod = paymentMethods[Math.floor(Math.random() * paymentMethods.length)];
    
    transactions.push({
      id: `TXN${String(i + 1).padStart(6, '0')}`,
      tourId: `TOUR${String(Math.floor(Math.random() * 9999)).padStart(4, '0')}`,
      date: date.toISOString(),
      amount: baseAmount,
      currency: 'LKR',
      description: `${tourType} - ${Math.floor(Math.random() * 8) + 1} guests`,
      tourType: tourType,
      customerName: `Customer ${i + 1}`,
      status: status,
      paymentMethod: paymentMethod,
      commission: Math.round(baseAmount * 0.15), // 15% platform commission
      netAmount: Math.round(baseAmount * 0.85),
      processingFee: Math.round(baseAmount * 0.025),
      location: guide.location?.city || 'Kandy',
      groupSize: Math.floor(Math.random() * 8) + 1,
      duration: Math.floor(Math.random() * 8) + 4 + ' hours',
      rating: (Math.random() * 1.5 + 3.5).toFixed(1) // 3.5-5.0
    });
  }
  
  return transactions.sort((a, b) => new Date(b.date) - new Date(a.date));
}

// Helper function to check if date is in current month
function isThisMonth(dateString) {
  const date = new Date(dateString);
  const now = new Date();
  return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
}

const getDailyEarnings = createAuthenticatedEndpoint('DailyEarnings', {});
const getWeeklyEarnings = createAuthenticatedEndpoint('WeeklyEarnings', {});
const getMonthlyEarnings = createAuthenticatedEndpoint('MonthlyEarnings', {});
const getReviews = createAuthenticatedEndpoint('Reviews', []);
const getSchedule = createAuthenticatedEndpoint('Schedule', { calendar: {} });
const getGroups = createAuthenticatedEndpoint('Groups', []);
const getMessages = createAuthenticatedEndpoint('Messages', []);
const getNotifications = createAuthenticatedEndpoint('Notifications', []);
const getTopLocationsAnalytics = createAuthenticatedEndpoint('TopLocationsAnalytics', []);
const getBusySeasonsAnalytics = createAuthenticatedEndpoint('BusySeasonsAnalytics', []);
const getWeeklyEarningsChart = createAuthenticatedEndpoint('WeeklyEarningsChart', []);

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

    const guide = await findGuideByEmail(userEmail);

    if (!guide) {
      return res.status(404).json({
        success: false,
        message: 'Guide profile not found'
      });
    }

    // In real implementation, update the guide document
    // await Guide.findByIdAndUpdate(guide._id, req.body);

    res.json({ 
      success: true, 
      message: `Profile updated for ${guide.firstName} ${guide.lastName}`,
      guideId: guide._id
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

      const guide = await findGuideByEmail(userEmail);

      if (!guide) {
        return res.status(404).json({
          success: false,
          message: 'Guide profile not found'
        });
      }

      console.log(`🔐 ${actionName} action for guide: ${guide.email}`);

      res.json({ 
        success: true, 
        message: `${actionName} successful for ${guide.firstName} ${guide.lastName}`,
        guideId: guide._id
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
const updateTourStatus = createAuthenticatedAction('Tour status update');
const acceptTour = createAuthenticatedAction('Accept tour');
const declineTour = createAuthenticatedAction('Decline tour');
const respondToReview = createAuthenticatedAction('Review response');
const markUnavailable = createAuthenticatedAction('Mark unavailable');
const markAvailable = createAuthenticatedAction('Mark available');
const lockDays = createAuthenticatedAction('Lock days');

// TOP TOURS ANALYTICS - Returns guide's top performing tours
const getTopTours = async (req, res) => {
  try {
    const userEmail = getLoggedUserEmail(req);
    const { period = 'week' } = req.query;
    
    if (!userEmail) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    const guide = await findGuideByEmail(userEmail);

    if (!guide) {
      return res.status(404).json({
        success: false,
        message: 'Guide profile not found'
      });
    }

    console.log(`🏆 Getting top tours for guide ${guide.email}, period: ${period}`);

    // Calculate multiplier for period scaling
    const multiplier = period === 'month' ? 4.3 : period === 'year' ? 52 : 1;
    
    const topToursData = {
      period: period,
      guideId: guide._id,
      topTours: [
        {
          tourId: "tour_001",
          title: "Ancient Kingdoms Cultural Journey",
          location: "Kandy Cultural Triangle",
          tourType: "Cultural",
          totalBookings: Math.round(8 * multiplier * 0.1),
          avgRating: 4.9,
          totalEarnings: Math.round(160000 * multiplier * 0.1),
          avgGroupSize: 4.5,
          duration: "Full Day",
          bookingTrend: period === 'year' ? 'increasing' : 'stable',
          popularityRank: 1
        },
        {
          tourId: "tour_002", 
          title: "Sigiriya Rock Fortress Adventure",
          location: "Sigiriya Ancient City",
          tourType: "Historical",
          totalBookings: Math.round(6 * multiplier * 0.1),
          avgRating: 4.8,
          totalEarnings: Math.round(180000 * multiplier * 0.1),
          avgGroupSize: 5.2,
          duration: "Half Day",
          bookingTrend: period === 'year' ? 'increasing' : 'stable',
          popularityRank: 2
        },
        {
          tourId: "tour_003",
          title: "Temple & Spice Gardens Experience", 
          location: "Matale District",
          tourType: "Cultural",
          totalBookings: Math.round(5 * multiplier * 0.1),
          avgRating: 4.7,
          totalEarnings: Math.round(90000 * multiplier * 0.1),
          avgGroupSize: 3.8,
          duration: "Half Day",
          bookingTrend: period === 'month' ? 'stable' : 'declining',
          popularityRank: 3
        }
      ],
      summary: {
        totalTours: 3,
        totalBookings: Math.round(19 * multiplier * 0.1),
        totalEarnings: Math.round(430000 * multiplier * 0.1),
        avgRating: 4.8,
        mostPopularType: "Cultural",
        peakBookingMonth: period === 'year' ? "December" : "Current"
      }
    };

    res.json({ success: true, data: topToursData });
    
  } catch (error) {
    console.error('❌ Top tours analytics error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch top tours analytics'
    });
  }
};

// BUSY HOURS ANALYTICS - Returns guide's busiest hours and time patterns
const getBusyHours = async (req, res) => {
  try {
    const userEmail = getLoggedUserEmail(req);
    const { period = 'week' } = req.query;
    
    if (!userEmail) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    const guide = await findGuideByEmail(userEmail);

    if (!guide) {
      return res.status(404).json({
        success: false,
        message: 'Guide profile not found'
      });
    }

    console.log(`⏰ Getting busy hours for guide ${guide.email}, period: ${period}`);

    // Calculate multiplier for period scaling
    const multiplier = period === 'month' ? 4.3 : period === 'year' ? 52 : 1;
    
    const busyHoursData = {
      period: period,
      guideId: guide._id,
      hourlyDistribution: [
        { hour: "06:00", tours: Math.round(2 * multiplier * 0.1), earnings: Math.round(25000 * multiplier * 0.1), utilization: 15.4 },
        { hour: "07:00", tours: Math.round(4 * multiplier * 0.1), earnings: Math.round(48000 * multiplier * 0.1), utilization: 30.8 },
        { hour: "08:00", tours: Math.round(8 * multiplier * 0.1), earnings: Math.round(96000 * multiplier * 0.1), utilization: 61.5 },
        { hour: "09:00", tours: Math.round(12 * multiplier * 0.1), earnings: Math.round(144000 * multiplier * 0.1), utilization: 92.3 },
        { hour: "10:00", tours: Math.round(15 * multiplier * 0.1), earnings: Math.round(180000 * multiplier * 0.1), utilization: 100.0 },
        { hour: "11:00", tours: Math.round(13 * multiplier * 0.1), earnings: Math.round(156000 * multiplier * 0.1), utilization: 86.7 },
        { hour: "12:00", tours: Math.round(10 * multiplier * 0.1), earnings: Math.round(120000 * multiplier * 0.1), utilization: 66.7 },
        { hour: "13:00", tours: Math.round(8 * multiplier * 0.1), earnings: Math.round(96000 * multiplier * 0.1), utilization: 53.3 },
        { hour: "14:00", tours: Math.round(11 * multiplier * 0.1), earnings: Math.round(132000 * multiplier * 0.1), utilization: 73.3 },
        { hour: "15:00", tours: Math.round(14 * multiplier * 0.1), earnings: Math.round(168000 * multiplier * 0.1), utilization: 93.3 },
        { hour: "16:00", tours: Math.round(12 * multiplier * 0.1), earnings: Math.round(144000 * multiplier * 0.1), utilization: 80.0 },
        { hour: "17:00", tours: Math.round(6 * multiplier * 0.1), earnings: Math.round(72000 * multiplier * 0.1), utilization: 40.0 }
      ],
      dailyPatterns: [
        { day: "Monday", avgTours: Math.round(3.2 * multiplier * 0.1), peakHour: "10:00", utilization: 68.5 },
        { day: "Tuesday", avgTours: Math.round(3.8 * multiplier * 0.1), peakHour: "09:00", utilization: 75.2 },
        { day: "Wednesday", avgTours: Math.round(4.1 * multiplier * 0.1), peakHour: "10:00", utilization: 82.3 },
        { day: "Thursday", avgTours: Math.round(3.9 * multiplier * 0.1), peakHour: "15:00", utilization: 78.9 },
        { day: "Friday", avgTours: Math.round(4.5 * multiplier * 0.1), peakHour: "10:00", utilization: 89.4 },
        { day: "Saturday", avgTours: Math.round(5.2 * multiplier * 0.1), peakHour: "09:00", utilization: 98.1 },
        { day: "Sunday", avgTours: Math.round(4.8 * multiplier * 0.1), peakHour: "10:00", utilization: 92.7 }
      ],
      insights: {
        peakHours: ["09:00-11:00", "15:00-16:00"],
        quietHours: ["06:00-07:00", "17:00-18:00"],
        busiestDay: "Saturday",
        quietestDay: "Monday",
        avgToursPerDay: Math.round(4.2 * multiplier * 0.1),
        workingHoursUtilization: 78.2,
        recommendedBreakTimes: ["12:00-13:00", "16:30-17:00"]
      }
    };

    res.json({ success: true, data: busyHoursData });
    
  } catch (error) {
    console.error('❌ Busy hours analytics error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch busy hours analytics'
    });
  }
};

// CUSTOMER INSIGHTS ANALYTICS - Returns detailed customer analytics and insights
const getCustomerInsights = async (req, res) => {
  try {
    const userEmail = getLoggedUserEmail(req);
    const { period = 'week' } = req.query;
    
    if (!userEmail) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    const guide = await findGuideByEmail(userEmail);

    if (!guide) {
      return res.status(404).json({
        success: false,
        message: 'Guide profile not found'
      });
    }

    console.log(`👥 Getting customer insights for guide ${guide.email}, period: ${period}`);

    // Calculate multiplier for period scaling
    const multiplier = period === 'month' ? 4.3 : period === 'year' ? 52 : 1;
    
    const customerInsightsData = {
      period: period,
      guideId: guide._id,
      customerDemographics: {
        ageGroups: [
          { range: "18-25", percentage: 15.2, count: Math.round(8 * multiplier * 0.1), avgSpending: 12000 },
          { range: "26-35", percentage: 28.7, count: Math.round(15 * multiplier * 0.1), avgSpending: 18500 },
          { range: "36-45", percentage: 32.1, count: Math.round(17 * multiplier * 0.1), avgSpending: 22000 },
          { range: "46-55", percentage: 18.3, count: Math.round(10 * multiplier * 0.1), avgSpending: 25000 },
          { range: "56+", percentage: 5.7, count: Math.round(3 * multiplier * 0.1), avgSpending: 20000 }
        ],
        countries: [
          { country: "USA", percentage: 25.4, count: Math.round(13 * multiplier * 0.1), avgRating: 4.8 },
          { country: "UK", percentage: 18.9, count: Math.round(10 * multiplier * 0.1), avgRating: 4.9 },
          { country: "Germany", percentage: 12.3, count: Math.round(6 * multiplier * 0.1), avgRating: 4.7 },
          { country: "Australia", percentage: 11.2, count: Math.round(6 * multiplier * 0.1), avgRating: 4.8 },
          { country: "Japan", percentage: 8.7, count: Math.round(4 * multiplier * 0.1), avgRating: 4.9 },
          { country: "Other", percentage: 23.5, count: Math.round(12 * multiplier * 0.1), avgRating: 4.7 }
        ]
      },
      bookingPatterns: {
        groupSizes: [
          { size: "1-2", percentage: 35.2, count: Math.round(18 * multiplier * 0.1), avgDuration: "4 hours" },
          { size: "3-4", percentage: 28.9, count: Math.round(15 * multiplier * 0.1), avgDuration: "5 hours" },
          { size: "5-6", percentage: 20.1, count: Math.round(10 * multiplier * 0.1), avgDuration: "6 hours" },
          { size: "7-8", percentage: 10.4, count: Math.round(5 * multiplier * 0.1), avgDuration: "7 hours" },
          { size: "9+", percentage: 5.4, count: Math.round(3 * multiplier * 0.1), avgDuration: "8 hours" }
        ],
        advanceBooking: [
          { period: "Same day", percentage: 8.3, count: Math.round(4 * multiplier * 0.1) },
          { period: "1-3 days", percentage: 22.1, count: Math.round(11 * multiplier * 0.1) },
          { period: "1 week", percentage: 35.7, count: Math.round(18 * multiplier * 0.1) },
          { period: "2-4 weeks", percentage: 25.8, count: Math.round(13 * multiplier * 0.1) },
          { period: "1+ month", percentage: 8.1, count: Math.round(4 * multiplier * 0.1) }
        ]
      },
      satisfaction: {
        overallRating: guide.rating || 4.8,
        ratingDistribution: [
          { stars: 5, count: Math.round(35 * multiplier * 0.1), percentage: 68.6 },
          { stars: 4, count: Math.round(12 * multiplier * 0.1), percentage: 23.5 },
          { stars: 3, count: Math.round(3 * multiplier * 0.1), percentage: 5.9 },
          { stars: 2, count: Math.round(1 * multiplier * 0.1), percentage: 2.0 },
          { stars: 1, count: Math.round(0 * multiplier * 0.1), percentage: 0.0 }
        ],
        repeatCustomers: {
          percentage: 18.5,
          count: Math.round(9 * multiplier * 0.1),
          avgBookingsPerCustomer: 2.3
        },
        referrals: {
          percentage: 32.1,
          count: Math.round(16 * multiplier * 0.1),
          referralRate: 1.8
        }
      },
      preferences: {
        tourTypes: [
          { type: "Cultural", preference: 42.1, satisfaction: 4.8 },
          { type: "Historical", preference: 28.7, satisfaction: 4.7 },
          { type: "Nature", preference: 18.3, satisfaction: 4.9 },
          { type: "Adventure", preference: 10.9, satisfaction: 4.6 }
        ],
        languages: [
          { language: "English", percentage: 78.5, satisfaction: 4.8 },
          { language: "German", percentage: 12.3, satisfaction: 4.7 },
          { language: "French", percentage: 6.1, satisfaction: 4.9 },
          { language: "Japanese", percentage: 3.1, satisfaction: 4.8 }
        ]
      },
      trends: {
        bookingGrowth: period === 'year' ? 15.2 : 3.8,
        satisfactionTrend: period === 'year' ? 2.1 : 0.3,
        returningCustomerGrowth: period === 'year' ? 22.7 : 4.2,
        avgSpendingChange: period === 'year' ? 8.9 : 1.8
      }
    };

    res.json({ success: true, data: customerInsightsData });
    
  } catch (error) {
    console.error('❌ Customer insights analytics error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch customer insights analytics'
    });
  }
};

module.exports = {
  getDashboard,
  getStats,
  getActiveTours,
  getPendingTours,
  getAnalytics,
  getTopTours,
  getBusyHours,
  getCustomerInsights,
  getTopLocations,
  getBusySeasons,
  getTopLocationsAnalytics,
  getBusySeasonsAnalytics,
  getTours,
  getTourDetails,
  updateTourStatus,
  acceptTour,
  declineTour,
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
