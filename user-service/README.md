# User Service

A Node.js microservice for managing user accounts and profiles across different roles in the Island Hop travel booking system.

## Overview

This service provides endpoints to retrieve user information by role, combining account and profile data from PostgreSQL database tables.

## Features

- **Role-based user retrieval**: Get all users by role (support, driver, guide, tourist)
- **Combined data**: Joins account and profile tables for complete user information
- **PostgreSQL integration**: Uses `pg` package for database connectivity
- **Production-ready**: Includes proper error handling, logging, and graceful shutdown
- **Security**: Implements helmet, CORS, and rate limiting best practices

## Endpoints

### Health Check

```
GET /health
```

Returns service status and basic information.

### Get Users by Role

```
GET /users/:role
```

**Parameters:**

- `role` (required): User role - must be one of: `support`, `driver`, `guide`, `tourist`

**Response:**

```json
{
  "success": true,
  "role": "driver",
  "count": 15,
  "data": [
    {
      "id": 1,
      "email": "john.doe@example.com",
      "status": "active",
      "first_name": "John",
      "last_name": "Doe",
      "profile_completion": 85
      // ... other fields based on role
    }
  ]
}
```

## Database Schema

The service queries the following tables based on role:

### Support

- `support_accounts` (id, email, status)
- `support_profiles` (id, address, contact_no, email, first_name, last_name, permission, profile_completion, profile_picture)

### Driver

- `driver_accounts` (id, created_at, email, status, updated_at)
- `driver_profiles` (id, accept*partial_trips, address, auto_accept_trips, date_of_birth, driving_license*_, emergency*contact*_, first*name, last_name, maximum_trip_distance, number_of_reviews, phone_number, profile_completion, profile_picture_url, rating, sltda_license*\*, total_completed_trips)

### Guide

- `guide_accounts` (id, created_at, email, status, updated_at)
- `guide_profiles` (id, address, date*of_birth, emergency_contact*\*, first_name, last_name, phone_number, profile_completion, profile_picture)

### Tourist

- `tourist_accounts` (id, email, status)
- `tourist_profiles` (id, dob, first_name, last_name, nationality, profile_completion, profile_pic)

## Installation

1. Install dependencies:

```bash
npm install
```

2. Set up environment variables (optional - defaults are provided):

```bash
# .env file
PORT=4011
DATABASE_URL=postgresql://postgres.hgpicovzphnrhsdhggqs:[YOUR-PASSWORD]@aws-1-ap-southeast-1.pooler.supabase.com:5432/postgres
NODE_ENV=production
```

3. Start the service:

```bash
# Production
npm start

# Development (with nodemon)
npm run dev
```

## Usage Examples

### Get all drivers

```bash
curl http://localhost:4011/users/driver
```

### Get all support staff

```bash
curl http://localhost:4011/users/support
```

### Get all guides

```bash
curl http://localhost:4011/users/guide
```

### Get all tourists

```bash
curl http://localhost:4011/users/tourist
```

## Error Handling

The service includes comprehensive error handling:

- **400 Bad Request**: Invalid role parameter
- **404 Not Found**: Invalid endpoint
- **500 Internal Server Error**: Database or server errors

## Security Features

- **Helmet**: Sets various HTTP headers for security
- **CORS**: Configurable cross-origin resource sharing
- **Input validation**: Role parameter validation
- **SQL injection protection**: Parameterized queries
- **Request size limits**: JSON payload limits

## Monitoring

- **Health endpoint**: `/health` for service monitoring
- **Request logging**: Morgan middleware for HTTP request logging
- **Error logging**: Console error logging with detailed information in development

## Development

### Running tests

```bash
npm test
```

### Code structure

- `index.js`: Main application file with all routes and database logic
- `package.json`: Dependencies and scripts
- Uses async/await for database operations
- Graceful shutdown handling for SIGTERM and SIGINT

## Configuration

The service can be configured via environment variables:

- `PORT`: Server port (default: 4011)
- `DATABASE_URL`: PostgreSQL connection string
- `NODE_ENV`: Environment mode (affects error details in responses)

## Database Connection

Uses connection pooling with the `pg` package for efficient database connections. SSL is enabled for secure connections to Supabase PostgreSQL.
