const { Client } = require('@googlemaps/google-maps-services-js');

class GoogleMapsService {
  constructor() {
    this.client = new Client({});
    this.apiKey = process.env.GOOGLE_MAPS_API_KEY;
    console.log('[GoogleMaps] API Key configured:', this.apiKey ? `${this.apiKey.substring(0, 10)}...` : 'NOT SET');
  }

  /**
   * Calculate route between origin and destination (simplified)
   */
  async calculateRoute(origin, destination) {
    try {
      const originStr = typeof origin === 'string' ? origin : `${origin.lat},${origin.lng}`;
      const destinationStr = typeof destination === 'string' ? destination : `${destination.lat},${destination.lng}`;

      console.log(`[GOOGLE_MAPS] 🗺️ Calculating real Sri Lankan road route:`);
      console.log(`  Origin: ${originStr}`);
      console.log(`  Destination: ${destinationStr}`);

      const response = await this.client.directions({
        params: {
          origin: originStr,
          destination: destinationStr,
          mode: 'driving',
          units: 'metric',
          region: 'LK', // Sri Lanka region code for better local routing
          key: this.apiKey,
        },
      });

      if (response.data.routes.length > 0) {
        const route = response.data.routes[0];
        const leg = route.legs[0];
        
        console.log(`[GOOGLE_MAPS] ✅ Real road route calculated successfully:`);
        console.log(`  - Distance: ${leg.distance.text}`);
        console.log(`  - Duration: ${leg.duration.text}`);
        
        const coordinates = this.extractRouteCoordinates(route);
        console.log(`  - Waypoints: ${coordinates.length} points following actual Sri Lankan roads`);
        console.log(`  - Route type: Following highways and local roads ✅`);
        
        return {
          coordinates: coordinates,
          distance: leg.distance.text,
          duration: leg.duration.text,
          totalDistance: leg.distance.text,
          totalDuration: leg.duration.text,
          // Complete Google Maps DirectionsResult for exact route rendering
          directionsResult: {
            routes: [route],
            status: response.data.status,
            request: {
              origin: originStr,
              destination: destinationStr,
              travelMode: 'DRIVING'
            }
          },
          // Raw Google Maps data for frontend integration
          googleMapsData: {
            encodedPolyline: route.overview_polyline?.points,
            bounds: route.bounds,
            legs: route.legs,
            summary: route.summary,
            copyrights: route.copyrights,
            warnings: route.warnings
          }
        };
      } else {
        throw new Error('No routes found');
      }
    } catch (error) {
      console.error('[GOOGLE_MAPS] Route calculation error:', error.response?.data || error.message);
      throw error;
    }
  }

  /**
   * Calculate route with multiple waypoints/destinations
   */
  async calculateMultiStopRoute(origin, waypoints, destination) {
    try {
      const originStr = typeof origin === 'string' ? origin : `${origin.lat},${origin.lng}`;
      const destinationStr = typeof destination === 'string' ? destination : `${destination.lat},${destination.lng}`;
      
      // Format waypoints for Google Maps API
      const waypointStrings = waypoints.map(wp => 
        typeof wp === 'string' ? wp : `${wp.lat},${wp.lng}`
      );

      console.log(`[GOOGLE_MAPS] 🗺️ Calculating multi-stop Sri Lankan route:`);
      console.log(`  Origin: ${originStr}`);
      console.log(`  Waypoints: ${waypointStrings.length} stops`);
      console.log(`  Destination: ${destinationStr}`);
      console.log(`  Route: ${waypointStrings.join(' → ')}`);

      const response = await this.client.directions({
        params: {
          origin: originStr,
          destination: destinationStr,
          waypoints: waypointStrings,
          optimizeWaypoints: false, // Keep the order as specified
          mode: 'driving',
          units: 'metric',
          region: 'LK', // Sri Lanka region code
          key: this.apiKey,
        },
      });

      if (response.data.routes.length > 0) {
        const route = response.data.routes[0];
        
        // Calculate total distance and duration across all legs
        let totalDistanceValue = 0;
        let totalDurationValue = 0;
        
        route.legs.forEach(leg => {
          totalDistanceValue += leg.distance.value;
          totalDurationValue += leg.duration.value;
        });
        
        const totalDistanceText = `${Math.round(totalDistanceValue / 1000)} km`;
        const totalDurationText = `${Math.floor(totalDurationValue / 3600)}h ${Math.round((totalDurationValue % 3600) / 60)}m`;
        
        console.log(`[GOOGLE_MAPS] ✅ Multi-stop route calculated successfully:`);
        console.log(`  - Total Distance: ${totalDistanceText}`);
        console.log(`  - Total Duration: ${totalDurationText}`);
        console.log(`  - Legs: ${route.legs.length} segments`);
        
        const coordinates = this.extractRouteCoordinates(route);
        console.log(`  - Waypoints: ${coordinates.length} points following actual Sri Lankan roads`);
        
        return {
          coordinates: coordinates,
          distance: totalDistanceText,
          duration: totalDurationText,
          totalDistance: totalDistanceText,
          totalDuration: totalDurationText,
          legs: route.legs.length,
          // Complete Google Maps DirectionsResult for exact route rendering
          directionsResult: {
            routes: [route],
            status: response.data.status,
            request: {
              origin: originStr,
              destination: destinationStr,
              waypoints: waypointStrings,
              travelMode: 'DRIVING'
            }
          },
          // Raw Google Maps data for frontend integration
          googleMapsData: {
            encodedPolyline: route.overview_polyline?.points,
            bounds: route.bounds,
            legs: route.legs,
            summary: route.summary,
            copyrights: route.copyrights,
            warnings: route.warnings
          }
        };
      } else {
        throw new Error('No multi-stop routes found');
      }
    } catch (error) {
      console.error('[GOOGLE_MAPS] Multi-stop route calculation error:', error.response?.data || error.message);
      throw error;
    }
  }

  /**
   * Extract coordinates from Google Maps route
   */
  extractRouteCoordinates(route) {
    if (route.overview_polyline && route.overview_polyline.points) {
      return this.decodePolyline(route.overview_polyline.points);
    }
    return [];
  }

  /**
   * Decode polyline string to coordinates
   */
  decodePolyline(encoded) {
    const coordinates = [];
    let index = 0;
    let lat = 0;
    let lng = 0;

    while (index < encoded.length) {
      let shift = 0;
      let result = 0;
      let byte;

      do {
        byte = encoded.charCodeAt(index++) - 63;
        result |= (byte & 0x1f) << shift;
        shift += 5;
      } while (byte >= 0x20);

      const deltaLat = ((result & 1) !== 0 ? ~(result >> 1) : (result >> 1));
      lat += deltaLat;

      shift = 0;
      result = 0;

      do {
        byte = encoded.charCodeAt(index++) - 63;
        result |= (byte & 0x1f) << shift;
        shift += 5;
      } while (byte >= 0x20);

      const deltaLng = ((result & 1) !== 0 ? ~(result >> 1) : (result >> 1));
      lng += deltaLng;

      coordinates.push({
        lat: lat / 1e5,
        lng: lng / 1e5
      });
    }

    return coordinates;
  }
}

module.exports = GoogleMapsService;
