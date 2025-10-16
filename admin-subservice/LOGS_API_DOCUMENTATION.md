# Payment Service Logs API Documentation

This API provides endpoints to retrieve logs from the `payment-service` MongoDB database, specifically from the `drivers` and `guides` collections.

## Base URL

```
http://localhost:8070/api/admin/logs
```

## Authentication

All endpoints require admin authentication. Include the Firebase JWT token in the Authorization header:

```
Authorization: Bearer YOUR_FIREBASE_JWT_TOKEN
```

## Endpoints

### 1. Get All Driver Logs

Retrieve all driver logs with pagination, sorting, and search capabilities.

**Endpoint:** `GET /drivers`

**Query Parameters:**

- `page` (optional, default: 1) - Page number for pagination
- `limit` (optional, default: 10) - Number of records per page
- `sortBy` (optional, default: "createdAt") - Field to sort by
- `sortOrder` (optional, default: "desc") - Sort order ("asc" or "desc")
- `search` (optional) - Search term to filter by driverId, driverEmail, driverName, or status

**Example Request:**

```javascript
const response = await fetch(
  `http://localhost:8070/api/admin/logs/drivers?page=1&limit=20&sortBy=createdAt&sortOrder=desc&search=john`,
  {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  }
);

const data = await response.json();
```

**Response:**

```json
{
  "success": true,
  "message": "Driver logs retrieved successfully",
  "data": {
    "logs": [
      {
        "_id": "507f1f77bcf86cd799439011",
        "driverId": "driver123",
        "driverEmail": "driver@example.com",
        "driverName": "John Doe",
        "status": "completed",
        "amount": 150.0,
        "createdAt": "2025-10-15T10:30:00.000Z",
        "updatedAt": "2025-10-15T11:00:00.000Z"
      }
    ],
    "pagination": {
      "currentPage": 1,
      "totalPages": 5,
      "totalCount": 50,
      "limit": 20,
      "hasNextPage": true,
      "hasPrevPage": false
    }
  }
}
```

---

### 2. Get All Guide Logs

Retrieve all guide logs with pagination, sorting, and search capabilities.

**Endpoint:** `GET /guides`

**Query Parameters:**

- `page` (optional, default: 1) - Page number for pagination
- `limit` (optional, default: 10) - Number of records per page
- `sortBy` (optional, default: "createdAt") - Field to sort by
- `sortOrder` (optional, default: "desc") - Sort order ("asc" or "desc")
- `search` (optional) - Search term to filter by guideId, guideEmail, guideName, or status

**Example Request:**

```javascript
const response = await fetch(
  `http://localhost:8070/api/admin/logs/guides?page=1&limit=20`,
  {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  }
);

const data = await response.json();
```

**Response:**

```json
{
  "success": true,
  "message": "Guide logs retrieved successfully",
  "data": {
    "logs": [
      {
        "_id": "507f1f77bcf86cd799439012",
        "guideId": "guide456",
        "guideEmail": "guide@example.com",
        "guideName": "Jane Smith",
        "status": "completed",
        "amount": 200.0,
        "createdAt": "2025-10-15T10:30:00.000Z",
        "updatedAt": "2025-10-15T11:00:00.000Z"
      }
    ],
    "pagination": {
      "currentPage": 1,
      "totalPages": 3,
      "totalCount": 30,
      "limit": 20,
      "hasNextPage": true,
      "hasPrevPage": false
    }
  }
}
```

---

### 3. Get Driver Log by ID

Retrieve a specific driver log by its MongoDB ObjectId.

**Endpoint:** `GET /drivers/:id`

**Path Parameters:**

- `id` (required) - MongoDB ObjectId of the driver log

**Example Request:**

```javascript
const logId = "507f1f77bcf86cd799439011";
const response = await fetch(
  `http://localhost:8070/api/admin/logs/drivers/${logId}`,
  {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  }
);

const data = await response.json();
```

**Response:**

```json
{
  "success": true,
  "message": "Driver log retrieved successfully",
  "data": {
    "_id": "507f1f77bcf86cd799439011",
    "driverId": "driver123",
    "driverEmail": "driver@example.com",
    "driverName": "John Doe",
    "status": "completed",
    "amount": 150.0,
    "createdAt": "2025-10-15T10:30:00.000Z",
    "updatedAt": "2025-10-15T11:00:00.000Z"
  }
}
```

---

### 4. Get Guide Log by ID

Retrieve a specific guide log by its MongoDB ObjectId.

**Endpoint:** `GET /guides/:id`

**Path Parameters:**

- `id` (required) - MongoDB ObjectId of the guide log

**Example Request:**

```javascript
const logId = "507f1f77bcf86cd799439012";
const response = await fetch(
  `http://localhost:8070/api/admin/logs/guides/${logId}`,
  {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  }
);

const data = await response.json();
```

**Response:**

```json
{
  "success": true,
  "message": "Guide log retrieved successfully",
  "data": {
    "_id": "507f1f77bcf86cd799439012",
    "guideId": "guide456",
    "guideEmail": "guide@example.com",
    "guideName": "Jane Smith",
    "status": "completed",
    "amount": 200.0,
    "createdAt": "2025-10-15T10:30:00.000Z",
    "updatedAt": "2025-10-15T11:00:00.000Z"
  }
}
```

---

### 5. Get Logs Statistics

Retrieve overall statistics about driver and guide logs.

**Endpoint:** `GET /stats`

**Example Request:**

```javascript
const response = await fetch(`http://localhost:8070/api/admin/logs/stats`, {
  method: "GET",
  headers: {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
  },
});

const data = await response.json();
```

**Response:**

```json
{
  "success": true,
  "message": "Logs statistics retrieved successfully",
  "data": {
    "totalDriverLogs": 150,
    "totalGuideLogs": 75,
    "totalLogs": 225,
    "timestamp": "2025-10-16T10:30:00.000Z"
  }
}
```

---

## Error Responses

### 401 Unauthorized

```json
{
  "success": false,
  "message": "Access denied. No token provided or invalid format."
}
```

### 403 Forbidden

```json
{
  "success": false,
  "message": "Access denied. Admin privileges required."
}
```

### 404 Not Found

```json
{
  "success": false,
  "message": "Driver log not found"
}
```

### 500 Internal Server Error

```json
{
  "success": false,
  "message": "Failed to retrieve driver logs",
  "error": "Error details here"
}
```

---

## Usage Examples

### Fetch Paginated Driver Logs with Search

```javascript
async function fetchDriverLogs(page = 1, searchTerm = "") {
  const token = localStorage.getItem("adminToken");

  const queryParams = new URLSearchParams({
    page: page,
    limit: 25,
    sortBy: "createdAt",
    sortOrder: "desc",
  });

  if (searchTerm) {
    queryParams.append("search", searchTerm);
  }

  try {
    const response = await fetch(
      `http://localhost:8070/api/admin/logs/drivers?${queryParams}`,
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      }
    );

    const data = await response.json();

    if (data.success) {
      console.log("Driver Logs:", data.data.logs);
      console.log("Pagination:", data.data.pagination);
      return data.data;
    } else {
      console.error("Error:", data.message);
      return null;
    }
  } catch (error) {
    console.error("Fetch error:", error);
    return null;
  }
}

// Usage
fetchDriverLogs(1, "john");
```

### Fetch All Guide Logs

```javascript
async function fetchAllGuideLogs() {
  const token = localStorage.getItem("adminToken");

  try {
    const response = await fetch(
      `http://localhost:8070/api/admin/logs/guides?page=1&limit=100`,
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      }
    );

    const data = await response.json();

    if (data.success) {
      return data.data.logs;
    }
    return [];
  } catch (error) {
    console.error("Error fetching guide logs:", error);
    return [];
  }
}
```

### Get Statistics Dashboard

```javascript
async function getLogsDashboard() {
  const token = localStorage.getItem("adminToken");

  try {
    const response = await fetch(`http://localhost:8070/api/admin/logs/stats`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });

    const data = await response.json();

    if (data.success) {
      console.log("Total Driver Logs:", data.data.totalDriverLogs);
      console.log("Total Guide Logs:", data.data.totalGuideLogs);
      console.log("Total Logs:", data.data.totalLogs);
      return data.data;
    }
    return null;
  } catch (error) {
    console.error("Error fetching logs statistics:", error);
    return null;
  }
}
```

---

## Database Connection

The logs controller connects to the `payment-service` MongoDB database using the connection string from your `.env` file:

```
MONGODB_URI=mongodb://localhost:27017/islandhop
```

The controller automatically switches to the `payment-service` database and accesses the `drivers` and `guides` collections.

---

## Notes

1. All endpoints require valid Firebase JWT authentication token
2. Only users with admin privileges (present in `admin_accounts` Supabase table) can access these endpoints
3. The pagination uses skip/limit strategy for efficient data retrieval
4. Search functionality uses case-insensitive regex matching
5. The schema is flexible (`strict: false`) to accommodate varying log structures
6. All timestamps are returned in ISO 8601 format

---

## Testing with Postman

Import the following curl commands into Postman:

### Get Driver Logs

```bash
curl -X GET "http://localhost:8070/api/admin/logs/drivers?page=1&limit=10" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json"
```

### Get Guide Logs

```bash
curl -X GET "http://localhost:8070/api/admin/logs/guides?page=1&limit=10" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json"
```

### Get Statistics

```bash
curl -X GET "http://localhost:8070/api/admin/logs/stats" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json"
```
