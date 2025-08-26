# Scoring Service API Documentation

## Overview

The Scoring Service is a microservice designed to find and assign the best available drivers and guides for tourism trips based on a comprehensive scoring algorithm. It integrates with PostgreSQL (Neon) for storing driver/guide scores and MongoDB Atlas for checking availability schedules.

## Architecture Flow

```
Client Request → Express Router → Controller → Service Layer → Database
                                                     ↓
                                            Scoring Algorithm
                                                     ↓
                                              Best Match Return
```

## Database Structure

### PostgreSQL Tables (Neon)

- **driver_score**: Stores driver information and scoring metrics
- **guide_score**: Stores guide information and scoring metrics

### MongoDB Collection (Atlas)

- **schedule_service-schedules**: Stores availability schedules

## API Endpoints

### 1. Request Driver - `POST /api/request-driver`

**Purpose:** Find the best available driver for a trip based on trip days and vehicle type.

#### Request Flow:

1. **Input Validation**

   - Validates `tripDays` (array of ISO date strings)
   - Validates `vehicleType` (string: "van", "car", etc.)

2. **Availability Check**

   - Queries MongoDB `schedule_service-schedules` collection
   - Filters drivers marked as "unavailable" for the requested dates
   - Creates a list of unavailable driver emails

3. **Driver Filtering**

   - Fetches all active, non-banned drivers from PostgreSQL `driver_score` table
   - Filters by vehicle type compatibility
   - Removes drivers who are unavailable on requested dates

4. **Scoring & Selection**
   - Calculates scores for remaining drivers using the scoring algorithm
   - Returns the driver with the highest score

#### Request Example:

```json
{
  "tripDays": ["2025-09-15", "2025-09-16", "2025-09-17"],
  "vehicleType": "van"
}
```

#### Response Example:

```json
{
  "email": "driver1@example.com"
}
```

#### Error Responses:

- `400`: Invalid input (missing or malformed tripDays/vehicleType)
- `404`: No available drivers found
- `500`: Internal server error

---

### 2. Request Guide - `POST /api/request-guide`

**Purpose:** Find the best available guide for a trip based on trip days.

#### Request Flow:

1. **Input Validation**

   - Validates `tripDays` (array of ISO date strings)

2. **Availability Check**

   - Queries MongoDB `schedule_service-schedules` collection
   - Filters guides marked as "unavailable" for the requested dates
   - Creates a list of unavailable guide emails

3. **Guide Filtering**

   - Fetches all active, non-banned guides from PostgreSQL `guide_score` table
   - Removes guides who are unavailable on requested dates

4. **Scoring & Selection**
   - Calculates scores for remaining guides using the scoring algorithm
   - Returns the guide with the highest score

#### Request Example:

```json
{
  "tripDays": ["2025-09-15", "2025-09-16", "2025-09-17"]
}
```

#### Response Example:

```json
{
  "email": "guide1@example.com"
}
```

#### Error Responses:

- `400`: Invalid input (missing or malformed tripDays)
- `404`: No available guides found
- `500`: Internal server error

---

## Scoring Algorithm

The scoring system uses a weighted calculation to evaluate drivers and guides:

### Scoring Formula:

```javascript
Score = (Rating_Weight × Rating_Normalized) +
        (Penalty_Weight × Penalty_Inverted) +
        (Active_Weight × Active_Status) -
        (Banned_Weight × Banned_Status) -
        (NewDriver_Weight × NewDriver_Penalty) +
        (Experience_Weight × Experience_Normalized)
```

### Weights Configuration:

- **Rating**: 50% (0-5 scale, normalized to 0-1)
- **Penalty**: 20% (0-100 scale, inverted: lower penalty = higher score)
- **Active Status**: 15% (1 if active, 0 if inactive)
- **Banned Status**: 10% (subtracted if banned)
- **New Driver**: 5% (small penalty for new drivers)
- **Experience (First10Rides)**: 5% (1-10 scale, normalized)

### Score Calculation Example:

```javascript
// Driver with: Rating=4.5, Penalty=5, Active=1, Banned=0, NewDriver=0, First10Rides=8
const score = (0.5 × 0.9) + (0.2 × 0.95) + (0.15 × 1) - (0.1 × 0) - (0.05 × 0) + (0.05 × 0.8)
            = 0.45 + 0.19 + 0.15 + 0 + 0 + 0.04
            = 0.83 × 100 = 83 points
```

---

## Service Layer Architecture

### 1. Controllers (`src/controllers/`)

- **driverController.js**: Handles driver-related API requests
- **guideController.js**: Handles guide-related API requests

### 2. Services (`src/services/`)

- **driverService.js**: Database operations for drivers
- **guideService.js**: Database operations for guides
- **scheduleService.js**: MongoDB schedule queries
- **scoringService.js**: Score calculation logic

### 3. Configuration (`src/config/`)

- **postgres.js**: PostgreSQL connection setup
- **mongo.js**: MongoDB connection setup

### 4. Routes (`src/routes/`)

- **driverRoutes.js**: Driver endpoint routing
- **guideRoutes.js**: Guide endpoint routing

---

## Error Handling

### Validation Errors (400)

- Missing required fields
- Invalid data types
- Malformed date strings

### Not Found Errors (404)

- No available drivers/guides
- No matching criteria

### Server Errors (500)

- Database connection issues
- Scoring calculation errors
- Unexpected runtime errors

---

## Usage Examples

### 1. Request a Van Driver for 3-Day Trip

```bash
curl -X POST http://localhost:4000/api/request-driver \
  -H "Content-Type: application/json" \
  -d '{
    "tripDays": ["2025-09-15", "2025-09-16", "2025-09-17"],
    "vehicleType": "van"
  }'
```

### 2. Request a Guide for Weekend Trip

```bash
curl -X POST http://localhost:4000/api/request-guide \
  -H "Content-Type: application/json" \
  -d '{
    "tripDays": ["2025-09-27", "2025-09-28"]
  }'
```

---

## Environment Configuration

Required environment variables:

- `PG_CONNECTION_STRING`: PostgreSQL connection string
- `MONGO_URI`: MongoDB Atlas connection string
- `PORT`: Service port (default: 4000)
- `LOG_LEVEL`: Logging level (default: info)

---

## Testing

Use the provided Postman collection (`ScoringService.postman_collection.json`) to test all endpoints with various scenarios including:

- Successful requests
- Validation errors
- Edge cases
- Different vehicle types
- Various trip durations
