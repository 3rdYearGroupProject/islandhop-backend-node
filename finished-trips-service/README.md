# Finished Trips Service

A Node.js microservice for managing finished trips, payments, and reviews in the IslandHop application.

## Description

This microservice handles the transition of trips from completed status to payed/finished status, and manages driver and guide reviews. It runs on port 4015 and connects to MongoDB.

## Features

- Process payments and move trips from `completed_trips` to `payed_finished_trips`
- Add driver reviews to finished trips
- Add guide reviews to finished trips
- Retrieve payed finished trips

## Installation

1. Navigate to the service directory:

```bash
cd finished-trips-service
```

2. Install dependencies:

```bash
npm install
```

3. Start the service:

```bash
npm start
```

For development with auto-restart:

```bash
npm run dev
```

## API Endpoints

### 1. Process Payment

**POST** `/api/process-payment`

Moves a trip from `completed_trips` to `payed_finished_trips` and updates the payed amount.

**Request Body:**

```json
{
  "_id": "trip_id_here",
  "payedAmount": 150.5
}
```

**Response:**

```json
{
  "message": "Payment processed successfully",
  "data": {
    "newTripId": "new_trip_id",
    "originalTripId": "original_trip_id",
    "totalPayedAmount": 150.5
  }
}
```

### 2. Add Driver Review

**POST** `/api/driver-review`

Adds a review for the driver on a finished trip.

**Request Body:**

```json
{
  "tripId": "trip_id_here",
  "review": "Great driver, very professional!"
}
```

**Response:**

```json
{
  "message": "Driver review added successfully",
  "data": {
    "tripId": "trip_id_here",
    "driver_reviewed": 1,
    "driver_review": "Great driver, very professional!"
  }
}
```

### 3. Add Guide Review

**POST** `/api/guide-review`

Adds a review for the guide on a finished trip.

**Request Body:**

```json
{
  "tripId": "trip_id_here",
  "review": "Excellent guide, very knowledgeable!"
}
```

**Response:**

```json
{
  "message": "Guide review added successfully",
  "data": {
    "tripId": "trip_id_here",
    "guide_reviewed": 1,
    "guide_review": "Excellent guide, very knowledgeable!"
  }
}
```

### 4. Get User Trips

**GET** `/api/user-trips/:userId`

Retrieves all payed finished trips for a specific user.

**Example:**

```
GET /api/user-trips/J0INIUkpCDNpUHCUkY0xmyPwoEe2
```

**Response:**

```json
{
  "message": "User trips retrieved successfully",
  "userId": "J0INIUkpCDNpUHCUkY0xmyPwoEe2",
  "count": 2,
  "data": [
    {
      "_id": "trip_id_1",
      "userId": "J0INIUkpCDNpUHCUkY0xmyPwoEe2",
      "tripName": "Beach Trip",
      "payedAmount": 500.0,
      "driver_reviewed": 1,
      "guide_reviewed": 0
    }
  ]
}
```

### 5. Get All Payed Trips

**GET** `/api/payed-trips`

Retrieves all payed finished trips.

### 6. Get Specific Payed Trip

**GET** `/api/payed-trips/:id`

Retrieves a specific payed finished trip by ID.

### 7. Health Check

**GET** `/health`

Returns the service health status.

## Environment Variables

- `PORT`: Service port (default: 4015)
- `MONGODB_URI`: MongoDB connection string
- `NODE_ENV`: Environment (development/production)
- `FRONTEND_URL`: Frontend application URL for CORS (default: http://localhost:3000)

## CORS Configuration

The service is configured to handle CORS requests with credentials support. It allows requests from:

- The frontend URL specified in `FRONTEND_URL` environment variable
- Default localhost:3000 and 127.0.0.1:3000
- Additional frontend ports (3001) if needed

This configuration prevents CORS issues when the frontend makes requests with credentials included.

## Database Collections

- `completed_trips`: Contains trips that are completed but not yet payed
- `payed_finished_trips`: Contains trips that have been payed and finished

## Error Handling

The service includes comprehensive error handling with appropriate HTTP status codes and error messages.

## Dependencies

- Express.js: Web framework
- Mongoose: MongoDB ODM
- CORS: Cross-origin resource sharing
- dotenv: Environment variable management
