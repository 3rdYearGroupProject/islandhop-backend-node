
# Location Sharing Service

This microservice allows users to share their location for individual trips and retrieve users at the same location. It integrates with a Java profile service to enrich location data with user profile details.

## Environment Setup

Create a `.env` file in this directory (see `.env.example`):

```
MONGO_URI=your_mongodb_connection_string
PORT=5008
BASE_URL=/api/v1
```

## Endpoints

All endpoints are prefixed with the base URL (default `/api/v1`).

### Health Check
**GET** `{BASE_URL}/health`

**Response:**
```
{
  "status": "ok"
}
```

### Share or Update Location
**POST** `{BASE_URL}/share-location`

**Request Body:**
```
{
  "tripId": "string",         // required
  "userId": "string",         // required
  "latitude": number,          // required
  "longitude": number,         // required
  "email": "string"           // required (used to fetch profile)
}
```

**Response:**
```
{
  "message": "Location shared and saved." | "Location updated for today.",
  "data": {
    "tripId": "string",
    "userId": "string",
    "latitude": number,
    "longitude": number,
    "email": "string",
    "firstName": "string",
    "lastName": "string",
    "dob": "string",
    "nationality": "string",
    "languages": ["string"],
    "profilePic": "string",
    "profileCompletion": number,
    ...
  }
}
```

### Get Users at Location
**GET** `{BASE_URL}/users-at-location?latitude={lat}&longitude={lng}`

**Response:**
```
{
  "users": [
    {
      "userId": "string",
      "tripId": "string",
      "timestamp": "ISODate",
      "email": "string",
      "firstName": "string",
      "lastName": "string",
      "dob": "string",
      "nationality": "string",
      "languages": ["string"],
      "profilePic": "string",
      "profileCompletion": number
    },
    ...
  ]
}
```

## Automated Testing

Import the `LocationSharingService.postman_collection.json` file into Postman. It includes:
- Health check
- Location sharing (create/update)
- Retrieval of users at a location
- Multiple user scenarios

Set the `base_url` variable in Postman to match your running service (e.g., `http://localhost:5008/api/v1`).

## Running the Service

1. Install dependencies:
   ```
   npm install
   ```
2. Start the service:
   ```
   npm run dev
   ```

The service will not start unless both `MONGO_URI` and `PORT` are set in your environment.
