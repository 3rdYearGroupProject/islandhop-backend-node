# Scoring Service

Production-ready Node.js microservice for driver and guide scoring and assignment for a tourism platform.

## Features

- Connects to Neon PostgreSQL and MongoDB Atlas
- Calculates scores for drivers and guides
- Provides endpoints to request the best available driver or guide
- Clean, modular code with error handling and logging

## Setup

1. Copy `.env.example` to `.env` and fill in credentials if needed.
2. Run `npm install`.
3. Start with `npm start` or `npm run dev`.

## Endpoints

- `POST /api/request-driver`
- `POST /api/request-guide`
