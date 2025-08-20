import React, { useState, useEffect, useCallback } from 'react';
import { GoogleMap, DirectionsRenderer, useJsApiLoader } from '@react-google-maps/api';

// PROPER Google Maps DirectionsService Integration
function SriLankanRouteModal() {
  const [directionsResponse, setDirectionsResponse] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const { isLoaded } = useJsApiLoader({
    googleMapsApiKey: process.env.REACT_APP_GOOGLE_MAPS_API_KEY,
    libraries: ['places']
  });

  const calculateRoute = useCallback(async () => {
    if (!isLoaded) return;

    try {
      setLoading(true);
      
      // 1. Get DirectionsService request from your backend
      const response = await fetch('/api/trips/test-trip/directions-request');
      const { directionsRequest } = await response.json();
      
      console.log('🗺️ Using DirectionsService with request:', directionsRequest);

      // 2. Use Google Maps DirectionsService (THE PROPER WAY)
      const directionsService = new window.google.maps.DirectionsService();
      
      const result = await new Promise((resolve, reject) => {
        directionsService.route(directionsRequest, (result, status) => {
          if (status === 'OK') {
            resolve(result);
          } else {
            reject(new Error(`Directions request failed: ${status}`));
          }
        });
      });

      console.log('✅ DirectionsService result:', result);
      
      // 3. Set the result for DirectionsRenderer
      setDirectionsResponse(result);
      
    } catch (err) {
      console.error('❌ Route calculation failed:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [isLoaded]);

  useEffect(() => {
    calculateRoute();
  }, [calculateRoute]);

  if (!isLoaded) return <div>Loading Google Maps...</div>;
  if (loading) return <div>Calculating Sri Lankan route...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div style={{ height: '500px', width: '100%' }}>
      <h3>🇱🇰 Complete Sri Lankan Itinerary Route</h3>
      
      <GoogleMap
        center={{ lat: 7.8731, lng: 80.7718 }} // Sri Lanka center
        zoom={8}
        mapContainerStyle={{ height: '100%', width: '100%' }}
        options={{
          zoomControl: true,
          streetViewControl: false,
          mapTypeControl: false,
          fullscreenControl: true,
        }}
      >
        {directionsResponse && (
          <DirectionsRenderer
            directions={directionsResponse}
            options={{
              suppressMarkers: false, // Show markers at each destination
              polylineOptions: {
                strokeColor: '#4285F4',
                strokeWeight: 6,
                strokeOpacity: 0.8
              },
              markerOptions: {
                icon: {
                  url: 'https://maps.google.com/mapfiles/ms/icons/red-dot.png',
                  scaledSize: new window.google.maps.Size(30, 30)
                }
              }
            }}
          />
        )}
      </GoogleMap>
      
      {/* Route Information */}
      {directionsResponse && (
        <div style={{ marginTop: '10px', padding: '10px', background: '#f5f5f5' }}>
          <h4>📊 Route Details:</h4>
          <p><strong>Total Distance:</strong> {directionsResponse.routes[0].legs.reduce((total, leg) => total + leg.distance.value, 0) / 1000} km</p>
          <p><strong>Total Duration:</strong> {Math.round(directionsResponse.routes[0].legs.reduce((total, leg) => total + leg.duration.value, 0) / 3600)} hours</p>
          <p><strong>Route Summary:</strong> {directionsResponse.routes[0].summary}</p>
          <p><strong>Destinations:</strong> Colombo → Sambodhi Pagoda → Sigiriya → Sri Dalada Museum → Kandy → Waters Edge → Hotel</p>
        </div>
      )}
    </div>
  );
}

export default SriLankanRouteModal;

/*
🎯 KEY DIFFERENCES FROM BEFORE:

❌ WRONG (What we were doing):
- Backend calculates route
- Frontend displays pre-calculated coordinates
- Not using DirectionsService/DirectionsRenderer properly

✅ CORRECT (What this does):
- Backend provides DirectionsService request parameters
- Frontend calls Google Maps DirectionsService directly
- DirectionsRenderer displays the exact Google Maps route
- Same result as google.com/maps

🗺️ BACKEND ENDPOINTS:
- GET /trips/{id}/directions-request → DirectionsService parameters
- GET /trips/{id}/route-coordinates → Fallback coordinates (if needed)

🔧 GOOGLE MAPS APIs USED:
- DirectionsService: Calculates routes (like Google Maps)
- DirectionsRenderer: Displays routes (like Google Maps)
- This is the EXACT same approach Google Maps uses
*/
