// Mock the database response for testing
const mockGuide = {
  _id: "68bc892d63edcd9c24166c69",
  email: "guide@islandhop.lk",
  personalInfo: {
    firstName: "Priyantha",
    lastName: "Silva",
    phone: "+94 77 234 5678",
    profilePicture: "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQ...",
    languages: ["English", "Sinhala", "Tamil", "German"],
    specializations: ["Cultural Heritage", "Temple Tours", "Wildlife", "Adventure", "Food Tours"]
  },
  stats: {
    rating: 4.8,
    totalTours: 856,
    completedTours: 823,
    totalEarnings: 1287650.5,
    totalHours: 3456,
    totalCustomers: 2847,
    completionRate: 96.1
  },
  analytics: {
    performance: {
      earningsChange: 15.8,
      toursChange: 12.3,
      hoursChange: -2.1
    }
  },
  tours: {
    active: [
      { id: "TG001", tourPackage: "Kandy Cultural Heritage Tour" },
      { id: "TG002", tourPackage: "Ella Adventure Trek" }
    ],
    pending: [
      { id: "TG003", tourPackage: "Colombo Food Discovery" },
      { id: "TG004", tourPackage: "Sigiriya Historical Tour" }
    ]
  },
  status: "active",
  serviceAreas: {
    primaryRegions: ["Kandy", "Colombo", "Galle", "Nuwara Eliya"]
  },
  preferences: {
    pricing: {
      baseHourlyRate: 2500
    }
  },
  tourPackages: [
    { basePrice: 15000 }
  ]
};

// Simulate the dashboard endpoint logic
function simulateDashboardResponse(guide) {
  // Main dashboard data in the exact format requested
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

  return { success: true, data: extendedData };
}

// Test the function
const result = simulateDashboardResponse(mockGuide);

console.log('🎯 EXACT JSON FORMAT YOU REQUESTED:');
console.log('=====================================');
console.log(JSON.stringify({
  totalEarnings: result.data.totalEarnings,
  totalTours: result.data.totalTours,
  totalTrips: result.data.totalTrips,
  totalHours: result.data.totalHours,
  totalCustomers: result.data.totalCustomers,
  averageRating: result.data.averageRating,
  completionRate: result.data.completionRate,
  earningsChange: result.data.earningsChange,
  toursChange: result.data.toursChange,
  hoursChange: result.data.hoursChange
}, null, 2));

console.log('\n📋 FULL DASHBOARD RESPONSE:');
console.log('============================');
console.log(JSON.stringify(result, null, 2));
