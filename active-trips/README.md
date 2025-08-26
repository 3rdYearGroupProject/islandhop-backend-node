# Active Trips Service

A production-ready Node.js microservice built with Express.js and MongoDB for managing active trip assignments.

## Features

- Set and remove drivers for trips
- Set and remove guides for trips
- Automatic trip activation with driver/guide assignment
- MongoDB integration with Mongoose
- RESTful API endpoints
- Error handling and logging
- Health check endpoint

## Prerequisites

- Node.js (v14 or higher)
- MongoDB Atlas account (connection string provided)
- Access to scoring service (port 4000) and schedule service (port 4001)

## Installation

1. Navigate to the service directory:

```bash
cd active-trips
```

2. Install dependencies:

```bash
npm install
```

3. Start the service:

```bash
# Production
npm start

# Development (with nodemon)
npm run dev
```

The service will run on port 5006 by default.

## API Endpoints

### Health Check

- **GET** `/health` - Check service status

### Trip Management

#### Set Driver

- **POST** `/api/set_driver`
- **Body**: `{ "tripId": "string", "email": "string" }`
- **Action**: Sets driver_email and driver_status=1

#### Set Guide

- **POST** `/api/set_guide`
- **Body**: `{ "tripId": "string", "email": "string" }`
- **Action**: Sets guide_email and guide_status=1

#### Remove Driver

- **POST** `/api/remove_driver`
- **Body**: `{ "tripId": "string", "email": "string" }`
- **Action**: Sets driver_status=0 (keeps email unchanged)

#### Remove Guide

- **POST** `/api/remove_guide`
- **Body**: `{ "tripId": "string", "email": "string" }`
- **Action**: Sets guide_status=0 (keeps email unchanged)

#### Activate Trip

- **POST** `/api/new_activate_trip`
- **Body**: `{ "tripId": "string" }`
- **Action**:
  - If driverNeeded=1: Calls scoring service for driver assignment
  - If guideNeeded=1: Calls scoring service for guide assignment
  - Notifies schedule service about assignments

#### Get User Trips

- **GET** `/api/trips/user/:userId`
- **Parameters**: `userId` (path parameter)
- **Action**: Returns all trips for the specified user
- **Response**:
  ```javascript
  {
    "success": true,
    "message": "Trips retrieved successfully",
    "data": {
      "userId": "string",
      "trips": [/* array of trip objects */],
      "totalTrips": number
    }
  }
  ```

#### Get Driver Trips

- **GET** `/api/trips/driver/:driverEmail`
- **Parameters**: `driverEmail` (path parameter)
- **Action**: Returns all trips assigned to the specified driver
- **Response**:
  ```javascript
  {
    "success": true,
    "message": "Trips retrieved successfully for driver",
    "data": {
      "driverEmail": "string",
      "trips": [/* array of trip objects */],
      "totalTrips": number
    }
  }
  ```

## Database Schema

```javascript
{
  "_id": "string",
  "userId": "string",
  "tripName": "string",
  "driverNeeded": 0|1,
  "guideNeeded": 0|1,
  "driver_status": 0|1|"",
  "driver_email": "string",
  "guide_status": 0|1|"",
  "guide_email": "string"
}
```

## External Service Integration

- **Scoring Service** (localhost:4000):

  - POST `/api/request-driver` - Returns driver assignment
  - POST `/api/request-guide` - Returns guide assignment

- **Schedule Service** (localhost:4001):
  - POST `/api/request-driver-email` - Notifies about driver assignment
  - POST `/api/request-guide-email` - Notifies about guide assignment

## Response Format

All endpoints return JSON responses in the following format:

```javascript
{
  "success": true|false,
  "message": "string",
  "data": {} // Optional, contains response data
}
```

## Error Handling

- Input validation for required fields
- MongoDB connection error handling
- External service call error handling
- Global error handler for unhandled exceptions

## Logging

The service logs important operations:

- Database operations
- External service calls
- Driver/guide assignments
- Error conditions
