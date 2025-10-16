# Logs API - Implementation Summary

## Overview
Created a comprehensive logging API for the admin subservice that retrieves logs from the `payment-service` MongoDB database.

## What Was Implemented

### 1. Logs Controller (`controllers/logsController.js`)
Created a new controller with the following features:

#### Database Connection
- Connects to `payment-service` MongoDB database
- Manages two collections: `drivers` and `guides`
- Uses flexible schema (`strict: false`) to handle varying log structures
- Implements singleton pattern for model management

#### API Functions

1. **`getAllLogs()`** - NEW! ⭐
   - Fetches logs from BOTH drivers and guides collections
   - Combines and sorts results
   - Supports pagination, search, and sorting
   - Optional `type` filter to get only drivers or guides
   - Returns breakdown of driver vs guide logs
   - Each log includes `logType` field ("driver" or "guide")

2. **`getDriverLogs()`**
   - Fetches all driver logs with pagination
   - Search by driverId, driverEmail, driverName, or status
   - Configurable sorting

3. **`getGuideLogs()`**
   - Fetches all guide logs with pagination
   - Search by guideId, guideEmail, guideName, or status
   - Configurable sorting

4. **`getDriverLogById()`**
   - Fetch specific driver log by MongoDB ObjectId

5. **`getGuideLogById()`**
   - Fetch specific guide log by MongoDB ObjectId

6. **`getLogsStats()`**
   - Get overall statistics
   - Total counts for drivers, guides, and combined

### 2. Routes Configuration (`routes/logs.js`)
Created RESTful routes with admin authentication:

```
GET /api/admin/logs/all          - Get all logs (combined)
GET /api/admin/logs/drivers      - Get driver logs
GET /api/admin/logs/guides       - Get guide logs
GET /api/admin/logs/stats        - Get statistics
GET /api/admin/logs/drivers/:id  - Get driver log by ID
GET /api/admin/logs/guides/:id   - Get guide log by ID
```

### 3. App Integration (`app.js`)
- Added logs routes to main app
- Updated welcome endpoint to include logs API

### 4. Documentation
- Created comprehensive API documentation (`LOGS_API_DOCUMENTATION.md`)
- Includes all endpoints with examples
- JavaScript fetch examples
- Curl commands for testing
- Error response formats

## Key Features

### Authentication & Security
✅ All endpoints require Firebase JWT authentication
✅ Admin role verification via Supabase `admin_accounts` table
✅ Token validation with proper error handling

### Pagination
✅ Page-based pagination (default: page 1, limit 10)
✅ Returns pagination metadata (totalPages, hasNextPage, etc.)
✅ Customizable page size

### Search & Filtering
✅ Case-insensitive regex search
✅ Search across multiple fields (email, name, ID, status)
✅ Type filtering (driver/guide) for combined endpoint

### Sorting
✅ Configurable sort field (default: createdAt)
✅ Ascending or descending order
✅ Works across combined collections

### Response Format
All endpoints return consistent JSON structure:
```json
{
  "success": true/false,
  "message": "Descriptive message",
  "data": {
    "logs": [...],
    "pagination": {...},
    "breakdown": {...}  // For combined endpoint
  }
}
```

## Usage Examples

### Fetch All Logs (Combined)
```javascript
const response = await fetch(
  `http://localhost:8070/api/admin/logs/all?page=1&limit=20`,
  {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  }
);

const data = await response.json();
console.log("All Logs:", data.data.logs);
console.log("Driver Count:", data.data.breakdown.totalDriverLogs);
console.log("Guide Count:", data.data.breakdown.totalGuideLogs);
```

### Fetch Driver Logs Only
```javascript
const response = await fetch(
  `http://localhost:8070/api/admin/logs/all?type=driver&page=1&limit=20`,
  {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  }
);
```

### Search Across All Logs
```javascript
const response = await fetch(
  `http://localhost:8070/api/admin/logs/all?search=john&page=1&limit=20`,
  {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  }
);
```

## Database Structure

### MongoDB Database: `payment-service`

#### Collection: `drivers`
```javascript
{
  "_id": ObjectId,
  "driverId": String,
  "driverEmail": String,
  "driverName": String,
  "status": String,
  "amount": Number,
  "createdAt": Date,
  "updatedAt": Date,
  // ... other flexible fields
}
```

#### Collection: `guides`
```javascript
{
  "_id": ObjectId,
  "guideId": String,
  "guideEmail": String,
  "guideName": String,
  "status": String,
  "amount": Number,
  "createdAt": Date,
  "updatedAt": Date,
  // ... other flexible fields
}
```

## Benefits of the Combined Endpoint (`/all`)

1. **Single Request** - Get all logs in one API call instead of two
2. **Unified View** - See driver and guide logs together, sorted chronologically
3. **Better Performance** - Reduce network requests
4. **Flexible Filtering** - Can still filter by type if needed
5. **Breakdown Stats** - Know how many logs came from each collection
6. **Consistent Format** - All logs have `logType` field for easy identification

## Testing Checklist

- [ ] Test `/all` endpoint without filters
- [ ] Test `/all` endpoint with `type=driver` filter
- [ ] Test `/all` endpoint with `type=guide` filter
- [ ] Test `/all` endpoint with search parameter
- [ ] Test pagination (next/prev pages)
- [ ] Test sorting (asc/desc, different fields)
- [ ] Test authentication (with/without token)
- [ ] Test admin authorization (non-admin users)
- [ ] Test with empty collections
- [ ] Test with large datasets (performance)

## Environment Variables Required

```env
MONGODB_URI=mongodb://localhost:27017/islandhop
```

The controller automatically switches to the `payment-service` database.

## Files Modified/Created

✅ Created: `controllers/logsController.js`
✅ Created: `routes/logs.js`
✅ Created: `LOGS_API_DOCUMENTATION.md`
✅ Created: `LOGS_API_SUMMARY.md` (this file)
✅ Modified: `app.js` (added logs routes)

## Next Steps (Optional Enhancements)

1. Add date range filtering for logs
2. Add export functionality (CSV/Excel)
3. Add log aggregation/analytics endpoints
4. Add real-time log streaming via WebSockets
5. Add log archiving/cleanup endpoints
6. Add more advanced search (regex patterns, multiple filters)
7. Add caching for frequently accessed logs
8. Add rate limiting for log endpoints

## Notes

- The `/all` endpoint loads both collections into memory and sorts them
- For very large datasets (>10,000 logs), consider using MongoDB aggregation with `$unionWith`
- The flexible schema (`strict: false`) allows for varying log structures
- All timestamps are in ISO 8601 format
- The `logType` field is added programmatically and not stored in the database
