const mockTripData = require('../data/mockTripData');
const GoogleMapsService = require('./googleMapsService');

class EnhancedMockTripService {
  constructor() {
    this.mockTrip = { ...mockTripData };
    this.googleMapsService = new GoogleMapsService();
  }

  async getTripById(id) {
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
    console.log(`[ENHANCED] Getting optimized route for trip: ${id}`);
    
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
          const timeA = this.parseTime(a.estimatedArrival);
          const timeB = this.parseTime(b.estimatedArrival);
          return timeA - timeB;
        }),
        userSelected: plan.userSelected
      }));

    // Always try to get real Google Maps route
    let routeCoordinates = [];
    let totalDistance = '0 km';
    let totalDuration = '0h 0m';
    let googleMapsData = null;
    let directionsResult = null;
    
    try {
      console.log('[ENHANCED] Fetching real route from Google Maps...');
      const realRoute = await this.calculateRealRoute(optimizedDailyPlans);
      if (realRoute && realRoute.coordinates && realRoute.coordinates.length > 0) {
        routeCoordinates = realRoute.coordinates;
        totalDistance = realRoute.totalDistance;
        totalDuration = realRoute.totalDuration;
        googleMapsData = realRoute.googleMapsData;
        directionsResult = realRoute.directionsResult;
        console.log(`[ENHANCED] ✅ Real route generated with ${routeCoordinates.length} waypoints`);
      } else {
        console.log(`[ENHANCED] ❌ Google Maps returned empty route`);
        // Use simple coordinates as fallback
        routeCoordinates = this.getSimpleRoute(optimizedDailyPlans);
      }
    } catch (error) {
      console.error(`[ENHANCED] ❌ Google Maps API failed:`, error.message);
      // Use simple coordinates as fallback
      routeCoordinates = this.getSimpleRoute(optimizedDailyPlans);
      totalDistance = this.mockTrip.optimizedRoute.totalDistance;
      totalDuration = this.mockTrip.optimizedRoute.totalDuration;
    }

    return {
      tripId: id,
      currentPosition: this.mockTrip.currentLocation,
      optimizedRoute: optimizedDailyPlans,
      coordinates: routeCoordinates,
      totalDistance: totalDistance,
      totalDuration: totalDuration,
      lastOptimized: new Date(),
      routeType: routeCoordinates.length > 20 ? 'google_maps' : 'fallback',
      googleMapsData: googleMapsData,
      directionsResult: directionsResult
    };
  }

  /**
   * Get simple route coordinates as fallback
   */
  getSimpleRoute(optimizedDailyPlans) {
    const coordinates = [this.mockTrip.currentLocation];
    
    optimizedDailyPlans.forEach(plan => {
      plan.destinations.forEach(dest => {
        coordinates.push(dest.coordinates);
      });
    });
    
    return coordinates;
  }

  async calculateRealRoute() {
    console.log('[ENHANCED] Calculating real Google Maps route connecting ALL destinations');
    
    try {
      // Get all destinations from the trip in order
      const allDestinations = [];
      
      // Extract destinations from dailyPlans in chronological order
      this.mockTrip.dailyPlans.forEach(day => {
        if (day.attractions) {
          day.attractions.forEach(attraction => {
            allDestinations.push({
              name: attraction.name,
              coordinates: attraction.coordinates,
              type: 'attraction',
              day: day.day
            });
          });
        }
        if (day.restaurants) {
          day.restaurants.forEach(restaurant => {
            allDestinations.push({
              name: restaurant.name,
              coordinates: restaurant.coordinates,
              type: 'restaurant',
              day: day.day
            });
          });
        }
        if (day.hotels) {
          day.hotels.forEach(hotel => {
            allDestinations.push({
              name: hotel.name,
              coordinates: hotel.coordinates,
              type: 'hotel',
              day: day.day
            });
          });
        }
      });

      if (allDestinations.length === 0) {
        throw new Error('No destinations found for route calculation');
      }

      const origin = this.mockTrip.currentLocation;
      
      console.log(`[ENHANCED] 🗺️ Calculating complete Sri Lankan itinerary route:`);
      console.log(`  - Origin: Colombo (${origin.lat}, ${origin.lng})`);
      console.log(`  - Total destinations: ${allDestinations.length}`);
      
      allDestinations.forEach((dest, index) => {
        console.log(`  - Stop ${index + 1}: ${dest.name} (${dest.type})`);
      });

      // Use all destinations except the last one as waypoints
      const waypoints = allDestinations.slice(0, -1).map(dest => dest.coordinates);
      const finalDestination = allDestinations[allDestinations.length - 1].coordinates;
      
      console.log(`[ENHANCED] 📍 Creating multi-stop route through Sri Lanka:`);
      console.log(`  - Waypoints: ${waypoints.length} intermediate stops`);
      console.log(`  - This will connect ALL attractions in your itinerary`);
      
      const route = await this.googleMapsService.calculateMultiStopRoute(
        origin,
        waypoints,
        finalDestination
      );
      
      console.log(`[ENHANCED] ✅ Complete itinerary route calculated:`);
      console.log(`  - Distance: ${route.totalDistance}`);
      console.log(`  - Duration: ${route.totalDuration}`);
      console.log(`  - Legs: ${route.legs} route segments`);
      console.log(`  - Connects: Colombo → ${allDestinations.map(d => d.name).join(' → ')}`);
      
      return {
        ...route,
        routeType: 'google_maps_multi_stop',
        destinationCount: allDestinations.length
      };
      
    } catch (error) {
      console.error('[ENHANCED] Multi-stop route calculation failed, using fallback:', error);
      
      // Fallback to simple coordinates if Google Maps fails
      return {
        coordinates: [
          this.mockTrip.currentLocation,
          { lat: 6.9383932, lng: 79.8420285 }, // Sambodhi Pagoda
          { lat: 7.293460899999999, lng: 80.64151059999999 }, // Sri Dalada Museum
          { lat: 7.950907399999999, lng: 80.75934370000002 }, // Sigiriya
          { lat: 6.905807100000001, lng: 79.9117206 } // Waters Edge
        ],
        totalDistance: "350+ km",
        totalDuration: "8+ hours",
        routeType: 'fallback_multi_stop',
        legs: 4
      };
    }
  }

  async getRouteCoordinates(id) {
    console.log(`[ENHANCED] Getting complete Sri Lankan route coordinates for trip: ${id}`);
    
    // Get the complete hardcoded route
    const optimizedRoute = await this.getOptimizedRoute(id);
    
    return {
      coordinates: optimizedRoute.coordinates,
      totalDistance: optimizedRoute.totalDistance,
      totalDuration: optimizedRoute.totalDuration,
      routeType: optimizedRoute.routeType,
      waypointCount: optimizedRoute.coordinates.length,
      routeDescription: "Complete Sri Lankan tour: Colombo → Kandy → Sigiriya → Colombo",
      cached: false,
      generatedAt: new Date().toISOString(),
      googleMapsData: optimizedRoute.googleMapsData,
      directionsResult: optimizedRoute.directionsResult
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

  async getDirectionsRequest(id) {
    console.log(`[ENHANCED] Getting DirectionsService request parameters for trip: ${id}`);
    
    try {
      // Get all destinations from the trip in order
      const allDestinations = [];
      
      // Extract destinations from dailyPlans in chronological order
      this.mockTrip.dailyPlans.forEach(day => {
        if (day.attractions) {
          day.attractions.forEach(attraction => {
            allDestinations.push({
              name: attraction.name,
              coordinates: attraction.coordinates,
              type: 'attraction',
              day: day.day
            });
          });
        }
        if (day.restaurants) {
          day.restaurants.forEach(restaurant => {
            allDestinations.push({
              name: restaurant.name,
              coordinates: restaurant.coordinates,
              type: 'restaurant',
              day: day.day
            });
          });
        }
        if (day.hotels) {
          day.hotels.forEach(hotel => {
            allDestinations.push({
              name: hotel.name,
              coordinates: hotel.coordinates,
              type: 'hotel',
              day: day.day
            });
          });
        }
      });

      const origin = this.mockTrip.currentLocation;
      
      // Prepare waypoints for DirectionsService
      const waypoints = allDestinations.slice(0, -1).map(dest => ({
        location: { lat: dest.coordinates.lat, lng: dest.coordinates.lng },
        stopover: true
      }));
      
      const destination = allDestinations[allDestinations.length - 1].coordinates;

      console.log(`[ENHANCED] ✅ DirectionsService request prepared:`);
      console.log(`  - Origin: Colombo`);
      console.log(`  - Waypoints: ${waypoints.length} stops`);
      console.log(`  - Destination: ${allDestinations[allDestinations.length - 1].name}`);

      return {
        tripId: id,
        directionsRequest: {
          origin: { lat: origin.lat, lng: origin.lng },
          destination: { lat: destination.lat, lng: destination.lng },
          waypoints: waypoints,
          optimizeWaypoints: false,
          travelMode: 'DRIVING',
          unitSystem: 'METRIC',
          region: 'LK'
        },
        destinations: allDestinations.map(dest => ({
          name: dest.name,
          type: dest.type,
          coordinates: dest.coordinates
        })),
        usage: {
          frontend: 'Use directionsRequest with Google Maps DirectionsService',
          example: 'directionsService.route(directionsRequest, callback)'
        }
      };

    } catch (error) {
      console.error('[ENHANCED] Error preparing DirectionsService request:', error);
      throw error;
    }
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

module.exports = EnhancedMockTripService;
