const RouteOptimizationService = require('./routeOptimizationService');

class TripService {
    constructor(TripModel) {
        this.TripModel = TripModel;
        this.routeOptimizationService = new RouteOptimizationService();
    }

    async getTripById(id) {
        try {
            const trip = await this.TripModel.findById(id);
            if (!trip) {
                throw new Error('Trip not found');
            }
            return trip;
        } catch (error) {
            throw error;
        }
    }

    async createTrip(tripData) {
        try {
            const newTrip = new this.TripModel(tripData);
            return await newTrip.save();
        } catch (error) {
            throw error;
        }
    }

    async updateTrip(id, tripData) {
        try {
            const updatedTrip = await this.TripModel.findByIdAndUpdate(id, tripData, { new: true });
            if (!updatedTrip) {
                throw new Error('Trip not found');
            }
            return updatedTrip;
        } catch (error) {
            throw error;
        }
    }

    async deleteTrip(id) {
        try {
            const deletedTrip = await this.TripModel.findByIdAndDelete(id);
            if (!deletedTrip) {
                throw new Error('Trip not found');
            }
            return deletedTrip;
        } catch (error) {
            throw error;
        }
    }

    async getRoute(id) {
        try {
            const trip = await this.getTripById(id);
            return trip.dailyPlans.map(plan => ({
                day: plan.day,
                city: plan.city,
                attractions: plan.attractions.filter(a => !a.completed),
                restaurants: plan.restaurants.filter(r => !r.completed),
                hotels: plan.hotels.filter(h => !h.completed),
            }));
        } catch (error) {
            throw error;
        }
    }

    async getOptimizedRoute(id) {
        try {
            const trip = await this.getTripById(id);
            const optimizedRoute = await this.routeOptimizationService.optimizeRoute(trip);
            
            // Update trip with optimized route data
            trip.optimizedRoute = {
                coordinates: optimizedRoute.coordinates,
                totalDistance: optimizedRoute.totalDistance,
                totalDuration: optimizedRoute.totalDuration,
                lastOptimized: new Date()
            };
            await trip.save();
            
            return optimizedRoute;
        } catch (error) {
            throw error;
        }
    }

    async getRouteCoordinates(id) {
        try {
            const trip = await this.getTripById(id);
            
            // Return cached optimized route if available and recent
            if (trip.optimizedRoute && trip.optimizedRoute.coordinates && 
                trip.optimizedRoute.lastOptimized > new Date(Date.now() - 30 * 60 * 1000)) {
                return {
                    coordinates: trip.optimizedRoute.coordinates,
                    totalDistance: trip.optimizedRoute.totalDistance,
                    totalDuration: trip.optimizedRoute.totalDuration,
                    cached: true
                };
            }
            
            // Calculate fresh optimized route
            const optimizedRoute = await this.getOptimizedRoute(id);
            return {
                coordinates: optimizedRoute.coordinates,
                totalDistance: optimizedRoute.totalDistance,
                totalDuration: optimizedRoute.totalDuration,
                cached: false
            };
        } catch (error) {
            throw error;
        }
    }

    async updateCurrentLocation(tripId, coordinates) {
        try {
            const trip = await this.getTripById(tripId);
            trip.currentLocation = {
                lat: coordinates.lat,
                lng: coordinates.lng,
                lastUpdated: new Date()
            };
            await trip.save();
            return trip.currentLocation;
        } catch (error) {
            throw error;
        }
    }

    async completeDestination(tripId, destinationData) {
        try {
            const { day, destinationType, destinationId } = destinationData;
            const trip = await this.getTripById(tripId);
            
            const dailyPlan = trip.dailyPlans.find(plan => plan.day === day);
            if (!dailyPlan) {
                throw new Error('Daily plan not found');
            }

            const destinationList = dailyPlan[destinationType];
            const destination = destinationList.find(dest => dest.id === destinationId);
            if (!destination) {
                throw new Error('Destination not found');
            }

            // Mark destination as completed
            destination.completed = true;
            destination.completedAt = new Date();
            
            // Update trip's last updated time
            trip.lastUpdated = new Date();
            await trip.save();

            // Return updated optimized route
            return await this.getOptimizedRoute(tripId);
        } catch (error) {
            throw error;
        }
    }
}

module.exports = TripService;