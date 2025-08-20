# Route Service - Travel Itinerary Management

A Node.js microservice for managing travel itineraries with Google Maps route optimization. This service provides RESTful APIs for creating, updating, retrieving, and deleting travel trips, along with intelligent route optimization and real-time destination completion tracking.

## 🚀 Features

- **Trip Management**: Create, read, update, and delete travel trips
- **Route Optimization**: Google Maps integration for optimized route calculation
- **Real-time Updates**: Mark destinations as completed and get updated routes
- **Coordinate Support**: Automatic geocoding and coordinate management
- **Map Integration**: Provides coordinates and polylines for frontend map rendering
- **Performance**: Route caching for improved response times
- **Modular Architecture**: Clean separation of concerns

## 🛠️ Technologies Used

- **Node.js** - Runtime environment
- **Express.js** - Web framework
- **MongoDB** - Database with Mongoose ODM
- **Google Maps API** - Route optimization and geocoding
- **CORS** - Cross-origin resource sharing
- **dotenv** - Environment variable management

## 📁 Project Structure

```
route-service/
├── src/
│   ├── app.js                           # Express app configuration
│   ├── controllers/
│   │   └── tripController.js            # Request handlers
│   ├── models/
│   │   └── Trip.js                      # Trip data model
│   ├── routes/
│   │   └── tripRoutes.js                # API route definitions
│   ├── services/
│   │   ├── tripService.js               # Business logic
│   │   ├── googleMapsService.js         # Google Maps integration
│   │   └── routeOptimizationService.js  # Route optimization logic
│   ├── middleware/
│   │   └── errorHandler.js              # Error handling
│   └── config/
│       └── database.js                  # Database configuration
├── .env                                 # Environment variables
├── package.json                         # Dependencies and scripts
├── server.js                           # Application entry point
└── README.md                           # Documentation
```

## ⚙️ Setup Instructions

### 1. Clone and Install
```bash
git clone <repository-url>
cd route-service
npm install
```

### 2. Environment Variables
Create a `.env` file in the root directory:
```env
MONGODB_URI=mongodb://localhost:27017/travel-itinerary
PORT=3000
NODE_ENV=development
GOOGLE_MAPS_API_KEY=your_google_maps_api_key
FRONTEND_URL=http://localhost:3000
```

### 3. Start the Service
```bash
# Development mode with auto-reload
npm run dev

# Production mode
npm start
```

The service will be running on `http://localhost:3000`

## 📚 API Endpoints

### Trip Management
- **GET** `/trips/:id` - Get trip by ID
- **POST** `/trips` - Create new trip
- **PUT** `/trips/:id` - Update trip
- **DELETE** `/trips/:id` - Delete trip

### Route Operations
- **GET** `/trips/:id/route` - Get basic route (incomplete destinations only)
- **GET** `/trips/:id/optimized-route` - Get optimized route with Google Maps
- **GET** `/trips/:id/route-coordinates` - Get route coordinates for map rendering
- **POST** `/trips/:id/recalculate-route` - Force route recalculation

### Destination Management
- **POST** `/trips/:id/completeDestination` - Mark destination as completed
- **PUT** `/trips/:id/current-location` - Update current location

### Health Check
- **GET** `/health` - Service health status

## 📖 API Usage Examples

### Create a Trip
```javascript
POST /trips
{
  "userId": "user123",
  "tripName": "Sri Lanka Adventure",
  "startDate": "2025-08-20",
  "endDate": "2025-08-25",
  "baseCity": "Colombo",
  "dailyPlans": [
    {
      "day": 1,
      "city": "Kandy",
      "attractions": [
        {
          "id": "attr_1",
          "name": "Temple of the Tooth",
          "location": "Kandy",
          "coordinates": { "lat": 7.2906, "lng": 80.6337 }
        }
      ]
    }
  ]
}
```

### Get Optimized Route
```javascript
GET /trips/trip-id/optimized-route

Response:
{
  "optimizedRoute": [
    {
      "day": 1,
      "city": "Kandy",
      "destinations": [
        {
          "id": "attr_1",
          "name": "Temple of the Tooth",
          "coordinates": { "lat": 7.2906, "lng": 80.6337 },
          "estimatedArrival": "09:00",
          "completed": false
        }
      ]
    }
  ],
  "coordinates": [...], // Polyline coordinates
  "totalDistance": "150.5 km",
  "totalDuration": "3h 45m",
  "currentPosition": { "lat": 6.9271, "lng": 79.8612 }
}
```

### Complete a Destination
```javascript
POST /trips/trip-id/completeDestination
{
  "day": 1,
  "destinationType": "attractions",
  "destinationId": "attr_1"
}
```

### Update Current Location
```javascript
PUT /trips/trip-id/current-location
{
  "lat": 7.2906,
  "lng": 80.6337
}
```

## 🗺️ Frontend Integration

### For React with Google Maps

```javascript
// Fetch optimized route for map display
const fetchRouteData = async (tripId) => {
  const response = await fetch(`/trips/${tripId}/optimized-route`);
  const data = await response.json();
  
  // Use data.coordinates for Polyline
  // Use data.optimizedRoute for markers
  return data;
};

// Mark destination as completed
const completeDestination = async (tripId, destinationData) => {
  const response = await fetch(`/trips/${tripId}/completeDestination`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(destinationData)
  });
  
  return response.json(); // Returns updated route
};
```

## 🔧 Configuration

### Google Maps API Requirements
- **Geocoding API**: For address to coordinates conversion
- **Directions API**: For route calculation and optimization
- **Distance Matrix API**: For travel time estimation

### MongoDB Schema
The service uses a flexible schema that supports:
- Nested daily plans with multiple destination types
- Coordinate storage for each destination
- Completion tracking with timestamps
- Route optimization caching

## 🚨 Error Handling

The service includes comprehensive error handling:
- **400**: Bad Request (invalid data)
- **404**: Not Found (trip/destination not found)
- **500**: Internal Server Error (service errors)

## 🔒 Security Considerations

- **API Key Protection**: Google Maps API key stored in environment variables
- **CORS Configuration**: Configurable allowed origins
- **Input Validation**: Request data validation
- **Error Sanitization**: Safe error messages

## 📊 Performance Features

- **Route Caching**: Optimized routes cached for 30 minutes
- **Selective Updates**: Only recalculate when destinations change
- **Efficient Querying**: Optimized MongoDB queries
- **Coordinate Validation**: Prevent unnecessary API calls

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch: `git checkout -b feature/amazing-feature`
3. Commit your changes: `git commit -m 'Add amazing feature'`
4. Push to the branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.