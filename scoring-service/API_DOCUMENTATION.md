# Tourism Platform Scoring Service API Documentation

## Overview

The Tourism Platform Scoring Service is a RESTful API that manages driver and guide scoring, availability checking, and trip assignments for a tourism platform.

## Base URL

```
http://localhost:3000/api/v1
```

## Authentication

Currently, the API does not require authentication. In production, consider implementing JWT tokens or API keys.

## Rate Limiting

- **Rate Limit**: 100 requests per 15 minutes per IP
- **Headers**: Rate limit information is returned in response headers

## Common Response Format

### Success Response

```json
{
  "success": true,
  "message": "Operation completed successfully",
  "data": { ... },
  "count": 10 // Optional, for list endpoints
}
```

### Error Response

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

## Endpoints

### Health Check

#### GET /health

Check service health status.

**Response:**

```json
{
  "success": true,
  "message": "Scoring service is healthy",
  "timestamp": "2024-01-15T10:00:00.000Z",
  "uptime": 3600,
  "environment": "development",
  "version": "1.0.0"
}
```

### Driver Management

#### GET /top-driver

Get the top available driver for a specific time period.

**Query Parameters:**

- `trip_start` (required): ISO date string for trip start
- `trip_end` (required): ISO date string for trip end

**Example:**

```
GET /api/v1/top-driver?trip_start=2024-01-15T10:00:00Z&trip_end=2024-01-15T18:00:00Z
```

**Response:**

```json
{
  "success": true,
  "message": "Top driver found successfully",
  "data": {
    "email": "driver1@example.com",
    "score": 105,
    "details": {
      "rating": 4.5,
      "active": true,
      "banned": false,
      "newDriver": false,
      "first10Rides": 8,
      "penalty": 5
    }
  }
}
```

#### POST /assign-driver

Assign a driver to a specific trip.

**Request Body:**

```json
{
  "email": "driver1@example.com",
  "trip_id": "trip123",
  "start_date": "2024-01-15T10:00:00Z",
  "end_date": "2024-01-15T18:00:00Z"
}
```

**Response:**

```json
{
  "success": true,
  "message": "Driver assigned successfully",
  "data": {
    "email": "driver1@example.com",
    "trip_id": "trip123",
    "start_date": "2024-01-15T10:00:00.000Z",
    "end_date": "2024-01-15T18:00:00.000Z",
    "driver_score": 105
  }
}
```

#### GET /drivers

Get all drivers with their calculated scores.

**Response:**

```json
{
  "success": true,
  "message": "Drivers retrieved successfully",
  "data": [
    {
      "_id": "...",
      "email": "driver1@example.com",
      "rating": 4.5,
      "active": true,
      "banned": false,
      "newDriver": false,
      "first10Rides": 8,
      "penalty": 5,
      "totalScore": 105,
      "createdAt": "2024-01-15T10:00:00.000Z",
      "updatedAt": "2024-01-15T10:00:00.000Z"
    }
  ],
  "count": 1
}
```

#### POST /drivers

Create a new driver score record.

**Request Body:**

```json
{
  "email": "driver1@example.com",
  "rating": 4.5,
  "active": true,
  "banned": false,
  "newDriver": false,
  "first10Rides": 8,
  "penalty": 5
}
```

**Validation Rules:**

- `email`: Valid email address (required)
- `rating`: Number between 0-5 (required)
- `active`: Boolean (required)
- `banned`: Boolean (required)
- `newDriver`: Boolean (required)
- `first10Rides`: Integer between 1-10 (required)
- `penalty`: Integer between 0-100 (required)

**Response:**

```json
{
  "success": true,
  "message": "Driver created successfully",
  "data": {
    "_id": "...",
    "email": "driver1@example.com",
    "rating": 4.5,
    "active": true,
    "banned": false,
    "newDriver": false,
    "first10Rides": 8,
    "penalty": 5,
    "createdAt": "2024-01-15T10:00:00.000Z",
    "updatedAt": "2024-01-15T10:00:00.000Z"
  }
}
```

#### GET /drivers/:email/trips

Get all trips for a specific driver.

**Parameters:**

- `email`: Driver's email address

**Response:**

```json
{
  "success": true,
  "message": "Driver trips retrieved successfully",
  "data": {
    "email": "driver1@example.com",
    "trips": [
      {
        "trip_id": "trip123",
        "start_date": "2024-01-15T10:00:00.000Z",
        "end_date": "2024-01-15T18:00:00.000Z"
      }
    ]
  }
}
```

### Guide Management

#### GET /top-guide

Get the top available guide for a specific time period.

**Query Parameters:**

- `trip_start` (required): ISO date string for trip start
- `trip_end` (required): ISO date string for trip end

**Example:**

```
GET /api/v1/top-guide?trip_start=2024-01-15T10:00:00Z&trip_end=2024-01-15T18:00:00Z
```

**Response:**

```json
{
  "success": true,
  "message": "Top guide found successfully",
  "data": {
    "email": "guide1@example.com",
    "score": 115,
    "details": {
      "rating": 4.8,
      "active": true,
      "banned": false,
      "newDriver": true,
      "first10Rides": 3,
      "penalty": 0
    }
  }
}
```

#### POST /assign-guide

Assign a guide to a specific trip.

**Request Body:**

```json
{
  "email": "guide1@example.com",
  "trip_id": "trip456",
  "start_date": "2024-01-16T09:00:00Z",
  "end_date": "2024-01-16T17:00:00Z"
}
```

**Response:**

```json
{
  "success": true,
  "message": "Guide assigned successfully",
  "data": {
    "email": "guide1@example.com",
    "trip_id": "trip456",
    "start_date": "2024-01-16T09:00:00.000Z",
    "end_date": "2024-01-16T17:00:00.000Z",
    "guide_score": 115
  }
}
```

#### GET /guides

Get all guides with their calculated scores.

**Response:**

```json
{
  "success": true,
  "message": "Guides retrieved successfully",
  "data": [
    {
      "_id": "...",
      "email": "guide1@example.com",
      "rating": 4.8,
      "active": true,
      "banned": false,
      "newDriver": true,
      "first10Rides": 3,
      "penalty": 0,
      "totalScore": 115,
      "createdAt": "2024-01-15T10:00:00.000Z",
      "updatedAt": "2024-01-15T10:00:00.000Z"
    }
  ],
  "count": 1
}
```

#### POST /guides

Create a new guide score record.

**Request Body:**

```json
{
  "email": "guide1@example.com",
  "rating": 4.8,
  "active": true,
  "banned": false,
  "newDriver": true,
  "first10Rides": 3,
  "penalty": 0
}
```

**Response:**

```json
{
  "success": true,
  "message": "Guide created successfully",
  "data": {
    "_id": "...",
    "email": "guide1@example.com",
    "rating": 4.8,
    "active": true,
    "banned": false,
    "newDriver": true,
    "first10Rides": 3,
    "penalty": 0,
    "createdAt": "2024-01-15T10:00:00.000Z",
    "updatedAt": "2024-01-15T10:00:00.000Z"
  }
}
```

#### GET /guides/:email/trips

Get all trips for a specific guide.

**Parameters:**

- `email`: Guide's email address

**Response:**

```json
{
  "success": true,
  "message": "Guide trips retrieved successfully",
  "data": {
    "email": "guide1@example.com",
    "trips": [
      {
        "trip_id": "trip456",
        "start_date": "2024-01-16T09:00:00.000Z",
        "end_date": "2024-01-16T17:00:00.000Z"
      }
    ]
  }
}
```

## Scoring Algorithm

The total score is calculated using this formula:

```
total_score = (Rating × 20) + (Active ? 10 : 0) - (Banned ? 100 : 0) + (NewDriver ? 5 : 0) + (10 - First10Rides) × 2 - Penalty
```

### Score Components:

1. **Rating Score**: Rating (0-5) × 20 = 0-100 points
2. **Active Bonus**: +10 points if active
3. **Banned Penalty**: -100 points if banned
4. **New Driver Bonus**: +5 points if new driver
5. **Experience Bonus**: (10 - First10Rides) × 2 = 0-18 points
6. **Penalty Deduction**: -Penalty points (0-100)

### Example Calculation:

For a driver with:

- Rating: 4.5
- Active: true
- Banned: false
- NewDriver: false
- First10Rides: 8
- Penalty: 5

**Calculation:**

- Rating Score: 4.5 × 20 = 90
- Active Bonus: 10
- Banned Penalty: 0
- New Driver Bonus: 0
- Experience Bonus: (10 - 8) × 2 = 4
- Penalty Deduction: 5

**Total Score: 90 + 10 + 0 + 0 + 4 - 5 = 99**

## Error Codes

### HTTP Status Codes

- `200` - Success
- `201` - Created
- `400` - Bad Request (validation errors)
- `404` - Not Found
- `409` - Conflict (e.g., driver not available)
- `429` - Too Many Requests (rate limit exceeded)
- `500` - Internal Server Error

### Common Error Messages

- **Validation Failed**: Input validation errors
- **No available driver/guide found**: No qualified personnel available for the time period
- **Driver/Guide not found**: The specified email doesn't exist or person is not eligible
- **Driver/Guide is not available**: Time conflict with existing trip assignments

## Testing

### Using cURL

```bash
# Health check
curl http://localhost:3000/health

# Get top driver
curl "http://localhost:3000/api/v1/top-driver?trip_start=2024-01-15T10:00:00Z&trip_end=2024-01-15T18:00:00Z"

# Create driver
curl -X POST http://localhost:3000/api/v1/drivers \
  -H "Content-Type: application/json" \
  -d '{
    "email": "driver1@example.com",
    "rating": 4.5,
    "active": true,
    "banned": false,
    "newDriver": false,
    "first10Rides": 8,
    "penalty": 5
  }'

# Assign driver
curl -X POST http://localhost:3000/api/v1/assign-driver \
  -H "Content-Type: application/json" \
  -d '{
    "email": "driver1@example.com",
    "trip_id": "trip123",
    "start_date": "2024-01-15T10:00:00Z",
    "end_date": "2024-01-15T18:00:00Z"
  }'
```

### Using Postman

Import the provided `ScoringService.postman_collection.json` file into Postman for easy testing.

## Production Considerations

1. **Database**: Use MongoDB Atlas or a production MongoDB cluster
2. **Environment Variables**: Set appropriate production values
3. **Authentication**: Implement JWT or API key authentication
4. **Logging**: Use structured logging with tools like Winston
5. **Monitoring**: Add health checks and metrics collection
6. **Caching**: Implement Redis for frequently accessed data
7. **Load Balancing**: Use multiple instances behind a load balancer
8. **SSL/TLS**: Enable HTTPS in production
9. **Database Backups**: Implement regular backup strategies
10. **Error Tracking**: Use services like Sentry for error monitoring
