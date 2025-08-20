const GoogleMapsService = require('./googleMapsService');

class RouteOptimizationService {
  constructor() {
    this.googleMapsService = new GoogleMapsService();
  }

  /**
   * Optimize route for a trip, respecting user's itinerary order
   */
  async optimizeRoute(trip) {
    try {
      const destinations = this.extractAllDestinations(trip);
      const incompleteDestinations = destinations.filter(dest => !dest.completed);
      
      if (incompleteDestinations.length === 0) {
        return {
          optimizedRoute: [],
          coordinates: [],
          totalDistance: '0 km',
          totalDuration: '0h 0m',
          message: 'All destinations completed'
        };
      }

      // Get current location or use base city as starting point
      const startLocation = trip.currentLocation || await this.getBaseCityCoordinates(trip.baseCity);
      
      // Calculate optimized route maintaining day order but optimizing within each day
      const optimizedDailyPlans = await this.optimizeByDay(trip.dailyPlans, startLocation);
      
      // Calculate overall route coordinates
      const routeCoordinates = await this.calculateOverallRoute(optimizedDailyPlans, startLocation);
      
      return {
        optimizedRoute: optimizedDailyPlans,
        coordinates: routeCoordinates.coordinates,
        totalDistance: routeCoordinates.totalDistance,
        totalDuration: routeCoordinates.totalDuration,
        currentPosition: startLocation
      };
    } catch (error) {
      console.error('Route optimization error:', error);
      throw error;
    }
  }

  /**
   * Extract all destinations from daily plans
   */
  extractAllDestinations(trip) {
    const destinations = [];
    
    trip.dailyPlans.forEach(plan => {
      // Add attractions
      plan.attractions.forEach(attraction => {
        destinations.push({
          ...attraction,
          day: plan.day,
          city: plan.city,
          category: 'attraction'
        });
      });
      
      // Add restaurants
      plan.restaurants.forEach(restaurant => {
        destinations.push({
          ...restaurant,
          day: plan.day,
          city: plan.city,
          category: 'restaurant'
        });
      });
      
      // Add hotels
      plan.hotels.forEach(hotel => {
        destinations.push({
          ...hotel,
          day: plan.day,
          city: plan.city,
          category: 'hotel'
        });
      });
    });
    
    return destinations;
  }

  /**
   * Get coordinates for base city
   */
  async getBaseCityCoordinates(baseCity) {
    try {
      return await this.googleMapsService.getCoordinates(baseCity);
    } catch (error) {
      console.error('Error getting base city coordinates:', error);
      // Fallback to Colombo coordinates
      return { lat: 6.9271, lng: 79.8612 };
    }
  }

  /**
   * Optimize routes within each day while maintaining day order
   */
  async optimizeByDay(dailyPlans, startLocation) {
    const optimizedPlans = [];
    let currentLocation = startLocation;

    for (const plan of dailyPlans) {
      const dayDestinations = [];
      
      // Collect all incomplete destinations for this day
      const incompleteAttractions = plan.attractions.filter(a => !a.completed);
      const incompleteRestaurants = plan.restaurants.filter(r => !r.completed);
      const incompleteHotels = plan.hotels.filter(h => !h.completed);
      
      // Combine all destinations for the day
      const allDayDestinations = [
        ...incompleteAttractions.map(d => ({ ...d, category: 'attraction' })),
        ...incompleteRestaurants.map(d => ({ ...d, category: 'restaurant' })),
        ...incompleteHotels.map(d => ({ ...d, category: 'hotel' }))
      ];

      if (allDayDestinations.length > 0) {
        // Ensure all destinations have coordinates
        const destinationsWithCoords = await this.ensureCoordinates(allDayDestinations, plan.city);
        
        // Calculate optimal order for this day's destinations
        const optimizedOrder = await this.optimizeDestinationsForDay(
          currentLocation,
          destinationsWithCoords
        );

        // Update current location to last destination of the day
        if (optimizedOrder.length > 0) {
          currentLocation = optimizedOrder[optimizedOrder.length - 1].coordinates;
        }

        optimizedPlans.push({
          day: plan.day,
          city: plan.city,
          destinations: optimizedOrder,
          userSelected: plan.userSelected
        });
      }
    }

    return optimizedPlans;
  }

  /**
   * Ensure all destinations have coordinates
   */
  async ensureCoordinates(destinations, city) {
    const destinationsWithCoords = [];
    
    for (const dest of destinations) {
      if (!dest.coordinates || !dest.coordinates.lat || !dest.coordinates.lng) {
        try {
          const coordinates = await this.googleMapsService.getCoordinates(
            `${dest.name}, ${dest.location || city}, Sri Lanka`
          );
          dest.coordinates = coordinates;
        } catch (error) {
          console.error(`Could not get coordinates for ${dest.name}:`, error);
          // Skip destinations without coordinates
          continue;
        }
      }
      destinationsWithCoords.push(dest);
    }
    
    return destinationsWithCoords;
  }

  /**
   * Optimize destinations order for a single day
   */
  async optimizeDestinationsForDay(startLocation, destinations) {
    if (destinations.length <= 1) {
      return destinations;
    }

    try {
      // For simplicity, we'll use a nearest neighbor approach
      // In production, you might want to use Google's route optimization API
      const optimizedOrder = [];
      let currentPos = startLocation;
      let remainingDestinations = [...destinations];

      while (remainingDestinations.length > 0) {
        let nearestIndex = 0;
        let shortestDistance = Infinity;

        // Find nearest destination
        for (let i = 0; i < remainingDestinations.length; i++) {
          const distance = this.calculateDistance(
            currentPos,
            remainingDestinations[i].coordinates
          );
          if (distance < shortestDistance) {
            shortestDistance = distance;
            nearestIndex = i;
          }
        }

        // Add nearest destination to optimized order
        const nearestDest = remainingDestinations.splice(nearestIndex, 1)[0];
        
        // Add estimated arrival time
        if (optimizedOrder.length === 0) {
          nearestDest.estimatedArrival = '09:00'; // Start of day
        } else {
          // Calculate arrival time based on previous destination
          const travelTime = await this.estimateTravelTime(currentPos, nearestDest.coordinates);
          nearestDest.estimatedArrival = this.calculateArrivalTime(
            optimizedOrder[optimizedOrder.length - 1].estimatedArrival,
            optimizedOrder[optimizedOrder.length - 1].estimatedDuration || '1 hour',
            travelTime
          );
        }

        optimizedOrder.push(nearestDest);
        currentPos = nearestDest.coordinates;
      }

      return optimizedOrder;
    } catch (error) {
      console.error('Error optimizing day destinations:', error);
      return destinations; // Return original order if optimization fails
    }
  }

  /**
   * Calculate overall route coordinates
   */
  async calculateOverallRoute(optimizedPlans, startLocation) {
    try {
      const allDestinations = [];
      optimizedPlans.forEach(plan => {
        allDestinations.push(...plan.destinations);
      });

      if (allDestinations.length === 0) {
        return {
          coordinates: [],
          totalDistance: '0 km',
          totalDuration: '0h 0m'
        };
      }

      const waypoints = allDestinations.map(dest => dest.coordinates);
      const route = await this.googleMapsService.calculateOptimizedRoute(
        startLocation,
        waypoints.slice(0, -1), // All except last as waypoints
        waypoints[waypoints.length - 1] // Last as destination
      );

      return route;
    } catch (error) {
      console.error('Error calculating overall route:', error);
      return {
        coordinates: [],
        totalDistance: 'Unknown',
        totalDuration: 'Unknown'
      };
    }
  }

  /**
   * Calculate distance between two coordinates (Haversine formula)
   */
  calculateDistance(pos1, pos2) {
    const R = 6371; // Earth's radius in kilometers
    const dLat = this.toRad(pos2.lat - pos1.lat);
    const dLon = this.toRad(pos2.lng - pos1.lng);
    
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRad(pos1.lat)) * Math.cos(this.toRad(pos2.lat)) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  /**
   * Convert degrees to radians
   */
  toRad(degrees) {
    return degrees * (Math.PI / 180);
  }

  /**
   * Estimate travel time between two points
   */
  async estimateTravelTime(origin, destination) {
    try {
      const result = await this.googleMapsService.getEstimatedTravelTime(origin, destination);
      return result.duration;
    } catch (error) {
      console.error('Error estimating travel time:', error);
      return '30 minutes'; // Default fallback
    }
  }

  /**
   * Calculate arrival time based on previous destination
   */
  calculateArrivalTime(previousArrival, previousDuration, travelTime) {
    // This is a simplified calculation - in production you'd want more sophisticated time handling
    const [prevHour, prevMin] = previousArrival.split(':').map(Number);
    const prevDurationHours = this.parseDuration(previousDuration);
    const travelHours = this.parseDuration(travelTime);
    
    const totalMinutes = (prevHour * 60 + prevMin) + (prevDurationHours * 60) + (travelHours * 60);
    const newHour = Math.floor(totalMinutes / 60) % 24;
    const newMin = totalMinutes % 60;
    
    return `${String(newHour).padStart(2, '0')}:${String(newMin).padStart(2, '0')}`;
  }

  /**
   * Parse duration string to hours
   */
  parseDuration(duration) {
    if (typeof duration !== 'string') return 1;
    
    const hourMatch = duration.match(/(\d+)h/);
    const minMatch = duration.match(/(\d+)m/);
    
    let hours = hourMatch ? parseInt(hourMatch[1]) : 0;
    let minutes = minMatch ? parseInt(minMatch[1]) : 0;
    
    return hours + (minutes / 60);
  }
}

module.exports = RouteOptimizationService;
