// Test the getTours endpoint structure
const mockGuide = {
  _id: "68bc892d63edcd9c24166c69",
  email: "guide@islandhop.lk",
  personalInfo: {
    firstName: "Priyantha",
    lastName: "Silva"
  },
  tours: {
    active: [
      {
        id: "TG001",
        tourPackage: "Kandy Cultural Heritage Tour",
        tourist: "Emily Johnson",
        touristAvatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?q=80&w=687&auto=format&fit=crop",
        groupSize: 4,
        startLocation: "Kandy Central",
        endLocation: "Temple of the Tooth",
        date: "2025-09-07",
        startTime: "09:00",
        endTime: "15:00",
        duration: "6h 00m",
        fee: 15000,
        status: "confirmed",
        touristRating: 4.9,
        touristPhone: "+1 555 123 4567",
        specialRequests: ["Vegetarian lunch", "Photography focus"],
        paymentStatus: "paid",
        createdAt: "2025-09-05T14:20:00Z"
      },
      {
        id: "TG002",
        tourPackage: "Ella Adventure Trek", 
        tourist: "Marco Rodriguez",
        touristAvatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?q=80&w=687&auto=format&fit=crop",
        groupSize: 2,
        startLocation: "Ella Town",
        endLocation: "Little Adams Peak",
        date: "2025-09-08",
        startTime: "06:00",
        endTime: "14:00",
        duration: "8h 00m",
        fee: 18000,
        status: "confirmed",
        touristRating: 4.7,
        touristPhone: "+34 666 123 456",
        specialRequests: ["Early morning start", "Photography equipment"],
        paymentStatus: "paid",
        createdAt: "2025-09-04T16:45:00Z"
      }
    ],
    pending: [
      {
        id: "TG003",
        tourPackage: "Colombo Food Discovery",
        tourist: "Sarah Chen",
        groupSize: 3,
        date: "2025-09-09",
        startTime: "10:00",
        estimatedFee: 9500,
        requestTime: "2025-09-06T11:30:00Z",
        touristRating: 4.8,
        specialRequests: ["Vegetarian options", "Allergy considerations"],
        paymentStatus: "pending"
      }
    ],
    history: [
      {
        id: "TG005",
        tourPackage: "Galle Fort Walking Tour",
        tourist: "David Kumar",
        groupSize: 5,
        startLocation: "Galle Railway Station",
        endLocation: "Galle Lighthouse",
        date: "2025-09-04",
        startTime: "14:00",
        endTime: "18:00",
        duration: "4h 00m",
        fee: 12000,
        rating: 5,
        status: "completed",
        paymentMethod: "card",
        tip: 1200,
        notes: "Sunset tour, excellent photography"
      }
    ]
  }
};

function simulateGetTours(guide, queryParams = {}) {
  const { status = 'all', limit = 20, page = 1 } = queryParams;
  const parsedLimit = Math.min(parseInt(limit) || 20, 100);
  const parsedPage = Math.max(parseInt(page) || 1, 1);
  const skip = (parsedPage - 1) * parsedLimit;

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
  
  // Apply pagination
  const paginatedTours = tours.slice(skip, skip + parsedLimit);

  const toursData = {
    guideId: guide._id,
    guideName: `${guide.personalInfo?.firstName || ''} ${guide.personalInfo?.lastName || ''}`,
    filter: status,
    page: parsedPage,
    limit: parsedLimit,
    total: totalCount,
    hasMore: totalCount > (skip + parsedLimit),
    summary: {
      active: guide.tours?.active?.length || 0,
      pending: guide.tours?.pending?.length || 0,
      completed: guide.tours?.history?.length || 0,
      totalTours: (guide.tours?.active?.length || 0) + (guide.tours?.pending?.length || 0) + (guide.tours?.history?.length || 0)
    },
    tours: paginatedTours.map(tour => ({
      id: tour.id || tour._id,
      tourPackage: tour.tourPackage || tour.title,
      tourist: tour.tourist || tour.customerName,
      touristAvatar: tour.touristAvatar || null,
      groupSize: tour.groupSize || 1,
      startLocation: tour.startLocation || 'Not specified',
      endLocation: tour.endLocation || 'Not specified',
      date: tour.date,
      startTime: tour.startTime,
      endTime: tour.endTime,
      duration: tour.duration,
      fee: tour.fee || tour.estimatedFee || tour.amount,
      status: tour.status,
      type: tour.type,
      rating: tour.rating || tour.touristRating,
      paymentStatus: tour.paymentStatus || 'unknown',
      paymentMethod: tour.paymentMethod || 'not specified',
      specialRequests: tour.specialRequests || [],
      notes: tour.notes || '',
      tip: tour.tip || 0,
      createdAt: tour.createdAt || tour.requestTime,
      phone: tour.touristPhone || ''
    }))
  };

  return { success: true, data: toursData };
}

// Test different scenarios
console.log('🎯 TOURS ENDPOINT TESTING');
console.log('=========================\n');

console.log('📋 1. ALL TOURS (default):');
console.log('GET /api/guides/guide@islandhop.lk/tours');
const allTours = simulateGetTours(mockGuide);
console.log(JSON.stringify(allTours, null, 2));

console.log('\n📋 2. ACTIVE TOURS ONLY:');
console.log('GET /api/guides/guide@islandhop.lk/tours?status=active');
const activeTours = simulateGetTours(mockGuide, { status: 'active' });
console.log(JSON.stringify(activeTours, null, 2));

console.log('\n📋 3. PENDING TOURS ONLY:');  
console.log('GET /api/guides/guide@islandhop.lk/tours?status=pending');
const pendingTours = simulateGetTours(mockGuide, { status: 'pending' });
console.log(JSON.stringify(pendingTours, null, 2));

console.log('\n📋 4. COMPLETED TOURS ONLY:');
console.log('GET /api/guides/guide@islandhop.lk/tours?status=completed');
const completedTours = simulateGetTours(mockGuide, { status: 'completed' });
console.log(JSON.stringify(completedTours, null, 2));

console.log('\n📋 5. PAGINATED (limit=1, page=1):');
console.log('GET /api/guides/guide@islandhop.lk/tours?limit=1&page=1');
const paginatedTours = simulateGetTours(mockGuide, { limit: 1, page: 1 });
console.log(JSON.stringify(paginatedTours, null, 2));
