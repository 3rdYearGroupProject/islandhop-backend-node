# Schedule Microservice

A Node.js microservice for managing driver and guide schedules in a tourism platform. This service handles availability tracking, scheduling conflicts, and date locking functionality.

## Features

- Track available/unavailable days for drivers and guides
- Lock dates to prevent further modifications
- Monthly schedule retrieval
- Email-based user identification
- Comprehensive validation and error handling
- CORS enabled for frontend integration

## Installation

1. Navigate to the schedule-service directory:

```bash
cd schedule-service
```

2. Install dependencies:

```bash
npm install
```

3. Set up environment variables:
   Copy `.env.example` to `.env` and configure:

```
MONGODB_URI=mongodb+srv://2022cs056:dH4aTFn3IOerWlVZ@cluster0.9ccambx.mongodb.net/schedule_service
PORT=5005
NODE_ENV=development
FRONTEND_URL=http://localhost:3000
```

4. Start the service:

```bash
# Development mode
npm run dev

# Production mode
npm start
```

## API Endpoints

### Base URL: `http://localhost:5005`

### 1. Health Check

**GET** `/schedule/health`

Returns service status and version information.

**Response:**

```json
{
  "success": true,
  "message": "Schedule service is running",
  "timestamp": "2025-08-21T10:30:00.000Z",
  "service": "schedule-service",
  "version": "1.0.0"
}
```

### 2. Mark Days as Unavailable

**POST** `/schedule/:userType/mark-unavailable`

Marks specified dates as unavailable for a driver or guide.

**Parameters:**

- `userType`: `driver` or `guide`

**Request Body:**

```json
{
  "email": "driver@example.com",
  "dates": ["2025-09-01", "2025-09-02", "2025-09-03"]
}
```

**Response:**

```json
{
  "success": true,
  "message": "Processed 3 dates. 3 successful, 0 failed.",
  "results": [
    {
      "date": "2025-09-01",
      "success": true,
      "message": "Date marked as unavailable"
    }
  ],
  "summary": {
    "total": 3,
    "successful": 3,
    "failed": 0
  }
}
```

### 3. Mark Days as Available (Unmark)

**POST** `/schedule/:userType/unmark-available`

Marks specified dates as available (removes unavailable status).

**Parameters:**

- `userType`: `driver` or `guide`

**Request Body:**

```json
{
  "email": "driver@example.com",
  "dates": ["2025-09-01"]
}
```

**Response:**

```json
{
  "success": true,
  "message": "Processed 1 dates. 1 successful, 0 failed.",
  "results": [
    {
      "date": "2025-09-01",
      "success": true,
      "message": "Date marked as available"
    }
  ],
  "summary": {
    "total": 1,
    "successful": 1,
    "failed": 0
  }
}
```

### 4. Lock Days

**POST** `/schedule/:userType/lock`

Locks specified dates, preventing any future modifications. Optionally associates the locked dates with a trip ID.

**Parameters:**

- `userType`: `driver` or `guide`

**Request Body:**

```json
{
  "email": "driver@example.com",
  "dates": ["2025-09-01"],
  "tripId": "TRIP_12345"
}
```

**Note:** The `tripId` field is optional. If provided, it will be stored with the locked dates for reference.

**Response:**

```json
{
  "success": true,
  "message": "Processed 1 dates. 1 successful, 0 failed.",
  "results": [
    {
      "date": "2025-09-01",
      "success": true,
      "message": "Date locked successfully",
      "tripId": "TRIP_12345"
    }
  ],
  "summary": {
    "total": 1,
    "successful": 1,
    "failed": 0
  },
  "tripId": "TRIP_12345"
}
```

### 5. Get Available Days for Month

**GET** `/schedule/:userType/available?email=driver@example.com&month=2025-09`

Retrieves the schedule for a specific month, showing available, unavailable, and locked days.

**Parameters:**

- `userType`: `driver` or `guide`

**Query Parameters:**

- `email`: User's email address
- `month`: Month in YYYY-MM format

**Response:**

```json
{
  "success": true,
  "message": "Schedule for 2025-09 retrieved successfully",
  "data": {
    "email": "driver@example.com",
    "userType": "driver",
    "month": "2025-09",
    "schedule": [
      {
        "date": "2025-09-01",
        "dayOfWeek": "Monday",
        "status": "unavailable",
        "tripId": null
      },
      {
        "date": "2025-09-02",
        "dayOfWeek": "Tuesday",
        "status": "available",
        "tripId": null
      },
      {
        "date": "2025-09-03",
        "dayOfWeek": "Wednesday",
        "status": "locked",
        "tripId": "TRIP_12345"
      }
    ],
    "availableDays": ["2025-09-02", "2025-09-03"],
    "summary": {
      "totalDays": 30,
      "available": 28,
      "unavailable": 1,
      "locked": 1
    }
  }
}
```

## Data Models

### Schedule Schema

```javascript
{
  email: String,          // User's email (required)
  date: Date,            // Date in ISO format (required)
  status: String,        // 'available', 'unavailable', or 'locked'
  userType: String,      // 'driver' or 'guide' (required)
  tripId: String,        // Trip identifier (optional, used when locking dates)
  timestamps: true       // createdAt, updatedAt
}
```

## Status Types

- **available**: Default status, user is available on this date
- **unavailable**: User has marked themselves as unavailable
- **locked**: Date is locked and cannot be modified

## Validation Rules

1. **Email**: Must be a valid email format
2. **Dates**: Must be in YYYY-MM-DD format
3. **UserType**: Must be either 'driver' or 'guide'
4. **Month**: Must be in YYYY-MM format
5. **Locked dates**: Cannot be modified once locked

## Error Handling

The service provides comprehensive error handling with descriptive messages:

- **400 Bad Request**: Validation errors, invalid formats
- **404 Not Found**: Route not found
- **500 Internal Server Error**: Database or server errors

## Database Collections

The service uses separate logical separation but a single collection with userType field:

- Collection: `schedules`
- Indexes: email + date + userType (unique), email + userType, date

## CORS Configuration

The service is configured to accept requests from:

- `http://localhost:3000`
- `http://127.0.0.1:3000`

## Development

To run in development mode with auto-restart:

```bash
npm run dev
```

## Testing

You can test the API using the provided examples or tools like Postman, curl, or any HTTP client.

Example curl command:

```bash
# Mark a day as unavailable
curl -X POST http://localhost:5005/schedule/driver/mark-unavailable \
  -H "Content-Type: application/json" \
  -d '{"email": "driver@example.com", "dates": ["2025-09-01"]}'

# Get available days for a month
curl "http://localhost:5005/schedule/driver/available?email=driver@example.com&month=2025-09"
```

## Dependencies

- **express**: Web framework
- **mongoose**: MongoDB ODM
- **cors**: CORS middleware
- **dotenv**: Environment variables
- **validator**: Input validation
- **nodemon**: Development auto-restart (dev dependency)
