const mockTripData = require('../data/mockTripData');

class MockTripService {
  constructor() {
    this.mockTrip = { ...mockTripData };
  }

  async getTripById(id) {
    // Return the mock trip for any ID
    console.log(`[MOCK] Getting trip by ID: ${id}`);
    return { ...this.mockTrip, _id: id };
  }

  async createTrip(tripData) {
    console.log('[MOCK] Creating new trip');
    return { ...this.mockTrip, ...tripData, _id: this.generateId() };
  }

  async updateTrip(id, tripData) {
    console.log(`[MOCK] Updating trip: ${id}`);
    return { ...this.mockTrip, ...tripData, _id: id, lastUpdated: new Date() };
  }

  async deleteTrip(id) {
    console.log(`[MOCK] Deleting trip: ${id}`);
    return { ...this.mockTrip, _id: id };
  }

  async getRoute(id) {
    console.log(`[MOCK] Getting basic route for trip: ${id}`);
    return this.mockTrip.dailyPlans
      .filter(plan => plan.attractions.length > 0 || plan.restaurants.length > 0 || plan.hotels.length > 0)
      .map(plan => ({
        day: plan.day,
        city: plan.city,
        attractions: plan.attractions.filter(a => !a.completed),
        restaurants: plan.restaurants.filter(r => !r.completed),
        hotels: plan.hotels.filter(h => !h.completed),
      }));
  }

  async getOptimizedRoute(id) {
    console.log(`[MOCK] Getting optimized route for trip: ${id}`);
    
    // Filter out completed destinations and organize by day
    const optimizedDailyPlans = this.mockTrip.dailyPlans
      .filter(plan => {
        const hasIncompleteDestinations = 
          plan.attractions.some(a => !a.completed) ||
          plan.restaurants.some(r => !r.completed) ||
          plan.hotels.some(h => !h.completed);
        return hasIncompleteDestinations;
      })
      .map(plan => ({
        day: plan.day,
        city: plan.city,
        destinations: [
          ...plan.attractions.filter(a => !a.completed).map(a => ({ ...a, category: 'attraction' })),
          ...plan.restaurants.filter(r => !r.completed).map(r => ({ ...r, category: 'restaurant' })),
          ...plan.hotels.filter(h => !h.completed).map(h => ({ ...h, category: 'hotel' }))
        ].sort((a, b) => {
          // Sort by estimated arrival time
          const timeA = this.parseTime(a.estimatedArrival);
          const timeB = this.parseTime(b.estimatedArrival);
          return timeA - timeB;
        }),
        userSelected: plan.userSelected
      }));

    return {
      tripId: id,
      currentPosition: this.mockTrip.currentLocation,
      optimizedRoute: optimizedDailyPlans,
      coordinates: this.mockTrip.optimizedRoute.coordinates,
      totalDistance: this.mockTrip.optimizedRoute.totalDistance,
      totalDuration: this.mockTrip.optimizedRoute.totalDuration,
      lastOptimized: this.mockTrip.optimizedRoute.lastOptimized
    };
  }

  async getRouteCoordinates(id) {
    console.log(`[MOCK] Getting route coordinates for trip: ${id}`);
    return {
      coordinates: this.mockTrip.optimizedRoute.coordinates,
      totalDistance: this.mockTrip.optimizedRoute.totalDistance,
      totalDuration: this.mockTrip.optimizedRoute.totalDuration,
      cached: true
    };
  }

  async updateCurrentLocation(tripId, coordinates) {
    console.log(`[MOCK] Updating current location for trip: ${tripId}`, coordinates);
    this.mockTrip.currentLocation = {
      lat: coordinates.lat,
      lng: coordinates.lng,
      lastUpdated: new Date()
    };
    return this.mockTrip.currentLocation;
  }

  async completeDestination(tripId, destinationData) {
    console.log(`[MOCK] Completing destination for trip: ${tripId}`, destinationData);
    const { day, destinationType, destinationId } = destinationData;

    // Find the daily plan
    const dailyPlan = this.mockTrip.dailyPlans.find(plan => plan.day === day);
    if (!dailyPlan) {
      throw new Error('Daily plan not found');
    }

    // Find and mark the destination as completed
    const destinationList = dailyPlan[destinationType];
    const destination = destinationList.find(dest => dest.id === destinationId);
    if (!destination) {
      throw new Error('Destination not found');
    }

    destination.completed = true;
    destination.completedAt = new Date();

    // Return updated optimized route
    return await this.getOptimizedRoute(tripId);
  }

  // Helper methods
  parseTime(timeString) {
    if (!timeString) return 0;
    const [hours, minutes] = timeString.split(':').map(Number);
    return hours * 60 + (minutes || 0);
  }

  generateId() {
    return 'mock-' + Math.random().toString(36).substr(2, 9);
  }
}

module.exports = MockTripService;
