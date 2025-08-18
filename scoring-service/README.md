# Scoring Service

A production-ready Node.js microservice for managing driver and guide scoring and assignment in a tourism platform.

## Features

- **Driver & Guide Management**: Complete CRUD operations for drivers and guides
- **Intelligent Scoring**: Advanced scoring algorithm considering multiple factors
- **Availability Checking**: Conflict detection to prevent double bookings
- **Trip Assignment**: Automated assignment of best available driver/guide
- **Data Validation**: Comprehensive input validation with Joi
- **Error Handling**: Robust error handling with meaningful messages
- **Security**: CORS, rate limiting, helmet security headers
- **Performance**: MongoDB indexing, connection pooling, compression

## Technology Stack

- **Backend**: Node.js with Express.js
- **Database**: MongoDB with Mongoose ODM
- **Validation**: Joi for input validation
- **Security**: Helmet, CORS, Rate Limiting
- **Logging**: Morgan for request logging
- **Environment**: dotenv for configuration

## Installation

1. Clone the repository
2. Navigate to the scoring-service directory:

   ```bash
   cd scoring-service
   ```

3. Install dependencies:

   ```bash
   npm install
   ```

4. Copy the environment file:

   ```bash
   cp .env.example .env
   ```

5. Update the `.env` file with your MongoDB connection string

6. Start the service:

   ```bash
   # Development
   npm run dev

   # Production
   npm start
   ```

## API Endpoints

### Driver Endpoints

- `GET /api/v1/top-driver?trip_start=YYYY-MM-DD&trip_end=YYYY-MM-DD` - Get top available driver
- `POST /api/v1/assign-driver` - Assign driver to trip
- `GET /api/v1/drivers` - Get all drivers
- `POST /api/v1/drivers` - Create driver score
- `GET /api/v1/drivers/:email/trips` - Get driver trips

### Guide Endpoints

- `GET /api/v1/top-guide?trip_start=YYYY-MM-DD&trip_end=YYYY-MM-DD` - Get top available guide
- `POST /api/v1/assign-guide` - Assign guide to trip
- `GET /api/v1/guides` - Get all guides
- `POST /api/v1/guides` - Create guide score
- `GET /api/v1/guides/:email/trips` - Get guide trips

### Health Check

- `GET /health` - Service health status

## Request Examples

### Get Top Driver

```bash
GET /api/v1/top-driver?trip_start=2024-01-15T10:00:00Z&trip_end=2024-01-15T18:00:00Z
```

### Assign Driver

```bash
POST /api/v1/assign-driver
Content-Type: application/json

{
  "email": "driver@example.com",
  "trip_id": "trip123",
  "start_date": "2024-01-15T10:00:00Z",
  "end_date": "2024-01-15T18:00:00Z"
}
```

### Create Driver Score

```bash
POST /api/v1/drivers
Content-Type: application/json

{
  "email": "driver@example.com",
  "rating": 4.5,
  "active": true,
  "banned": false,
  "newDriver": false,
  "first10Rides": 8,
  "penalty": 5
}
```

## Scoring Algorithm

The total score is calculated using the following formula:

```
total_score = (Rating × 20) + (Active ? 10 : 0) - (Banned ? 100 : 0) + (NewDriver ? 5 : 0) + (10 - First10Rides) × 2 - Penalty
```

### Score Components:

- **Rating Score**: Rating (0-5) × 20 = 0-100 points
- **Active Bonus**: +10 points if active
- **Banned Penalty**: -100 points if banned
- **New Driver Bonus**: +5 points if new driver
- **Experience Bonus**: (10 - First10Rides) × 2 = 0-18 points
- **Penalty Deduction**: -Penalty points (0-100)

## Database Schema

### Driver/Guide Score Collections

```javascript
{
  email: String (unique, required),
  rating: Number (0-5, required),
  active: Boolean (required),
  banned: Boolean (required),
  newDriver: Boolean (required),
  first10Rides: Number (1-10, required),
  penalty: Number (0-100, required)
}
```

### Driver/Guide Trips Collections

```javascript
{
  email: String (unique, required),
  trips: [{
    trip_id: String (required),
    start_date: Date (required),
    end_date: Date (required)
  }]
}
```

## Environment Variables

```env
# MongoDB Configuration
MONGODB_URI=mongodb://localhost:27017/tourism_platform

# Server Configuration
PORT=3000
NODE_ENV=development

# API Configuration
API_PREFIX=/api/v1

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

## Error Handling

The API returns consistent error responses:

```json
{
  "success": false,
  "message": "Error description",
  "errors": [
    {
      "field": "fieldName",
      "message": "Specific error message"
    }
  ]
}
```

## Security Features

- **CORS**: Configurable cross-origin resource sharing
- **Rate Limiting**: IP-based request limiting
- **Helmet**: Security headers
- **Input Validation**: Joi schema validation
- **Error Sanitization**: Safe error messages in production

## Performance Optimizations

- **Database Indexing**: Optimized queries with indexes
- **Connection Pooling**: Efficient MongoDB connections
- **Compression**: Gzip compression for responses
- **Request Timeouts**: Prevent hanging requests

## Development

```bash
# Start in development mode with auto-reload
npm run dev

# Run tests (when implemented)
npm test

# Check for security vulnerabilities
npm audit
```

## Production Deployment

1. Set `NODE_ENV=production` in environment
2. Configure production MongoDB URI
3. Set appropriate CORS origins
4. Configure rate limiting based on traffic
5. Set up monitoring and logging
6. Use process manager like PM2

## API Testing

Use the provided Postman collection or tools like curl:

```bash
# Health check
curl http://localhost:3000/health

# Get top driver
curl "http://localhost:3000/api/v1/top-driver?trip_start=2024-01-15T10:00:00Z&trip_end=2024-01-15T18:00:00Z"
```

## License

MIT License
