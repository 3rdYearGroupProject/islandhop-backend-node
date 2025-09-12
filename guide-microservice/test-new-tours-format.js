// Test the updated getTours endpoint structure
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
        groupSize: 4,
        startLocation: "Kandy Central",
        endLocation: "Temple of the Tooth",
        date: "2024-07-03T00:00:00Z",
        startTime: "09:00",
        endTime: "15:00",
        duration: "6h 00m",
        fee: 15000,
        status: "confirmed",
        rating: 5,
        paymentMethod: "card",
        notes: "Family group, children interested in history"
      }
    ],
    pending: [],
    history: [
      {
        id: "TG002",
        tourPackage: "Galle Fort Walking Tour",
        tourist: "David Kumar",
        groupSize: 2,
        startLocation: "Galle Railway Station",
        endLocation: "Galle Lighthouse",
        date: "2024-06-28T00:00:00Z",
        startTime: "14:00",
        endTime: "18:00",
        duration: "4h 00m",
        fee: 12000,
        status: "completed",
        rating: 4,
        paymentMethod: "cash",
        notes: "Sunset photography tour"
      }
    ]
  }
};

function simulateNewGetTours(guide, queryParams = {}) {
  const { status = 'all', limit = 20, page = 1 } = queryParams;
  const parsedLimit = Math.min(parseInt(limit) || 20, 100);
  const parsedPage = Math.max(parseInt(page) || 1, 1);
  const skip = (parsedPage - 1) * parsedLimit;

  // Get tours based on status filter
  let tours = [];

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

  return { success: true, data: formattedTours };
}

// Test the new format
console.log('🎯 NEW TOURS ENDPOINT RESPONSE (Frontend Format)');
console.log('================================================\n');

const result = simulateNewGetTours(mockGuide);
console.log(JSON.stringify(result, null, 2));
