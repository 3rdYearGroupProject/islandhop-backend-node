class TripController {
    constructor(tripService) {
        this.tripService = tripService;
    }

    async getTrip(req, res) {
        try {
            const trip = await this.tripService.getTripById(req.params.id);
            if (!trip) {
                return res.status(404).json({ message: 'Trip not found' });
            }
            res.status(200).json(trip);
        } catch (error) {
            res.status(500).json({ message: 'Error fetching trip', error: error.message });
        }
    }

    async createTrip(req, res) {
        try {
            const newTrip = await this.tripService.createTrip(req.body);
            res.status(201).json(newTrip);
        } catch (error) {
            res.status(400).json({ message: 'Error creating trip', error: error.message });
        }
    }

    async updateTrip(req, res) {
        try {
            const updatedTrip = await this.tripService.updateTrip(req.params.id, req.body);
            if (!updatedTrip) {
                return res.status(404).json({ message: 'Trip not found' });
            }
            res.status(200).json(updatedTrip);
        } catch (error) {
            res.status(400).json({ message: 'Error updating trip', error: error.message });
        }
    }

    async deleteTrip(req, res) {
        try {
            const deletedTrip = await this.tripService.deleteTrip(req.params.id);
            if (!deletedTrip) {
                return res.status(404).json({ message: 'Trip not found' });
            }
            res.status(204).send();
        } catch (error) {
            res.status(500).json({ message: 'Error deleting trip', error: error.message });
        }
    }

    async getRoute(req, res) {
        try {
            const route = await this.tripService.getRoute(req.params.id);
            if (!route) {
                return res.status(404).json({ message: 'Trip not found' });
            }
            res.status(200).json(route);
        } catch (error) {
            res.status(500).json({ message: 'Error fetching route', error: error.message });
        }
    }

    async completeDestination(req, res) {
        try {
            const updatedRoute = await this.tripService.completeDestination(req.params.id, req.body);
            if (!updatedRoute) {
                return res.status(404).json({ message: 'Trip not found' });
            }
            res.status(200).json(updatedRoute);
        } catch (error) {
            res.status(400).json({ message: 'Error completing destination', error: error.message });
        }
    }

    async getOptimizedRoute(req, res) {
        try {
            const optimizedRoute = await this.tripService.getOptimizedRoute(req.params.id);
            if (!optimizedRoute) {
                return res.status(404).json({ message: 'Trip not found' });
            }
            res.status(200).json(optimizedRoute);
        } catch (error) {
            res.status(500).json({ message: 'Error fetching optimized route', error: error.message });
        }
    }

    async getRouteCoordinates(req, res) {
        try {
            const coordinates = await this.tripService.getRouteCoordinates(req.params.id);
            if (!coordinates) {
                return res.status(404).json({ message: 'Trip not found' });
            }
            res.status(200).json(coordinates);
        } catch (error) {
            res.status(500).json({ message: 'Error fetching route coordinates', error: error.message });
        }
    }

    async updateCurrentLocation(req, res) {
        try {
            const { lat, lng } = req.body;
            if (!lat || !lng) {
                return res.status(400).json({ message: 'Latitude and longitude are required' });
            }
            
            const location = await this.tripService.updateCurrentLocation(req.params.id, { lat, lng });
            res.status(200).json({ message: 'Location updated successfully', location });
        } catch (error) {
            res.status(400).json({ message: 'Error updating current location', error: error.message });
        }
    }

    async recalculateRoute(req, res) {
        try {
            const optimizedRoute = await this.tripService.getOptimizedRoute(req.params.id);
            res.status(200).json({ 
                message: 'Route recalculated successfully', 
                route: optimizedRoute 
            });
        } catch (error) {
            res.status(500).json({ message: 'Error recalculating route', error: error.message });
        }
    }

    async getDirectionsRequest(req, res) {
        try {
            const directionsRequest = await this.tripService.getDirectionsRequest(req.params.id);
            if (!directionsRequest) {
                return res.status(404).json({ message: 'Trip not found' });
            }
            res.status(200).json(directionsRequest);
        } catch (error) {
            res.status(500).json({ message: 'Error fetching directions request', error: error.message });
        }
    }
}

module.exports = TripController;