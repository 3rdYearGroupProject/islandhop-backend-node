# Verification Service

This microservice handles verification-related operations for guides and drivers. It connects to a Neon PostgreSQL database and exposes RESTful APIs.

## Features

- Guide certificate management
- Driver management
- Input validation
- Error handling and logging

## Endpoints

- POST /guides/certificates
- GET /guides/certificates
- PUT /guides/certificates/:id
- POST /drivers
- GET /drivers
- PUT /drivers/:id

## Environment Variables

- DB_HOST
- DB_PORT
- DB_USER
- DB_PASSWORD
- DB_DATABASE
- DB_SSL (true/false)

## Getting Started

1. Install dependencies:
   ```sh
   npm install
   ```
2. Create a `.env` file with your database credentials.
3. Start the service:
   ```sh
   npm start
   ```

The service runs on port 8060 by default.
