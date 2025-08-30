# Complete Trip Service

A Node.js microservice for managing trip completion, day-by-day tracking, and reviews in the IslandHop travel platform.

## Overview

The Complete Trip Service handles the transition of trips from the planning stage to active execution, tracking daily progress, meter readings, and collecting reviews.

## Features

- **Trip Management**: Start and end trips with confirmation
- **Daily Tracking**: Track each day of the trip with start/end times and meter readings
- **Distance Calculation**: Calculate total trip distance with deductions
- **Review System**: Collect driver and guide reviews
- **Real-time Updates**: Update trip status in real-time

## Technology Stack

- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: MongoDB with Mongoose ODM
- **Port**: 5007

## Installation

1. Clone the repository
2. Navigate to the complete-trip-service directory
3. Install dependencies:

```bash
npm install
```

4. Set up environment variables in `.env`:

```env
PORT=5007
MONGODB_URI=mongodb+srv://2022cs056:dH4aTFn3IOerWlVZ@cluster0.9ccambx.mongodb.net/
DATABASE_NAME=islandhop_trips
NODE_ENV=development
```

5. Start the service:

```bash
# Development mode
npm run dev

# Production mode
npm start
```

## API Endpoints

### Trip Management

- `POST /api/trips/start-trip` - Start a trip
- `POST /api/trips/confirm-start` - Confirm trip start
- `POST /api/trips/end-trip` - End a trip
- `POST /api/trips/confirm-end` - Confirm trip end

### Daily Management

- `POST /api/trips/start-day-{number}` - Start a specific day
- `POST /api/trips/confirm-day-{number}-start` - Confirm day start
- `POST /api/trips/end-day-{number}` - End a specific day
- `POST /api/trips/confirm-day-{number}-end` - Confirm day end

### Information

- `GET /api/trips/day-{number}-info` - Get day information
- `GET /api/trips/total-distance` - Calculate total trip distance

### Reviews

- `POST /api/trips/guide-review` - Submit guide review
- `POST /api/trips/driver-review` - Submit driver review

### Health Check

- `GET /health` - Service health status

## Database Collections

### Input Collection: `payed_trips_advance`

Contains trips that have been paid for and are ready to start.

### Output Collection: `completed_trips`

Contains active and completed trips with detailed tracking information.

## Sample Usage

### Starting a Trip

```javascript
fetch("http://localhost:5007/api/trips/start-trip", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    tripId: "68adfeac01e20ecea620ef27",
  }),
});
```

### Starting a Day

```javascript
fetch("http://localhost:5007/api/trips/start-day-1", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    tripId: "68adfeac01e20ecea620ef27",
    metervalue: 12500,
  }),
});
```

## Error Handling

The service includes comprehensive error handling for:

- Invalid trip IDs
- Missing required fields
- Database connection issues
- Validation errors

## Development

For development with auto-reload:

```bash
npm run dev
```

## Testing

Import the Postman collection (`CompleteTrip.postman_collection.json`) to test all endpoints.

## License

MIT License
