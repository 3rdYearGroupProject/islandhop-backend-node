# Guide Microservice API Endpoints

A comprehensive list of all available API endpoints for the Guide Microservice.

## Base URL
- **Development**: `http://localhost:5002`
- **Health Check**: `GET /health`

## Authentication
All endpoints require guide authentication. The `guideId` parameter should be the guide's email address.

---

## 🏠 Dashboard Endpoints

### Get Dashboard Overview
- **Endpoint**: `GET /:guideId`
- **Alternative**: `GET /api/guides/:guideId`
- **Description**: Retrieve guide dashboard with key metrics and active tour information
- **Response**: Guide stats, personal info, active/pending tour counts, earnings summary

### Get Detailed Statistics
- **Endpoint**: `GET /:guideId/stats`
- **Alternative**: `GET /api/guides/:guideId/stats`
- **Description**: Comprehensive guide statistics and performance metrics
- **Response**: Rating, total tours, earnings, completion rates, experience details

---

## 🚐 Tour Management Endpoints

### Get Active Tours
- **Endpoint**: `GET /:guideId/active`
- **Alternative**: `GET /api/guides/:guideId/active-tours`
- **Description**: Retrieve all currently active tours for the guide
- **Response**: Array of active tour objects with client details, locations, progress

### Get Pending Tour Requests
- **Endpoint**: `GET /:guideId/pending`
- **Alternative**: `GET /api/guides/:guideId/pending-requests`
- **Description**: Retrieve pending tour requests awaiting guide response
- **Response**: Array of pending tour requests with client info, requested locations, dates

### Get Tour History
- **Endpoint**: `GET /:guideId/tours`
- **Alternative**: `GET /api/guides/:guideId/tours`
- **Description**: Retrieve complete tour history for the guide
- **Response**: Paginated list of completed tours

### Get Tour Details
- **Endpoint**: `GET /:guideId/tours/:tourId`
- **Alternative**: `GET /api/guides/:guideId/tours/:tourId`
- **Description**: Detailed information about a specific tour
- **Response**: Complete tour details including client info, itinerary, payments

### Update Tour Status
- **Endpoint**: `PUT /:guideId/tours/:tourId/status`
- **Alternative**: `PUT /api/guides/:guideId/tours/:tourId/status`
- **Body**: `{ "status": "in_progress|completed|cancelled" }`
- **Description**: Update the status of an ongoing tour

### Accept Tour Request
- **Endpoint**: `POST /:guideId/tours/:tourId/accept`
- **Alternative**: `POST /api/guides/:guideId/tours/:tourId/accept`
- **Description**: Accept a pending tour request
- **Response**: Confirmation and updated tour status

### Decline Tour Request
- **Endpoint**: `POST /:guideId/tours/:tourId/decline`
- **Alternative**: `POST /api/guides/:guideId/tours/:tourId/decline`
- **Body**: `{ "reason": "scheduling_conflict|other" }` (optional)
- **Description**: Decline a pending tour request

---

## 📊 Analytics Endpoints

### Get Analytics Overview
- **Endpoint**: `GET /:guideId/analytics`
- **Alternative**: `GET /api/guides/:guideId/analytics`
- **Query Parameters**: 
  - `period`: `week|month|year` (default: week)
- **Description**: Comprehensive analytics data for specified period
- **Response**: Performance metrics, earnings changes, tour statistics

### Get Top Locations
- **Endpoint**: `GET /:guideId/analytics/locations/top`
- **Alternative**: `GET /api/guides/:guideId/top-locations`
- **Query Parameters**: 
  - `period`: `week|month|year` (default: week)
- **Description**: Most popular tour locations with performance metrics
- **Response**: Array of locations with tour counts, earnings, ratings

### Get Busy Seasons
- **Endpoint**: `GET /:guideId/analytics/seasons/busy`
- **Alternative**: `GET /api/guides/:guideId/busy-seasons`
- **Query Parameters**: 
  - `period`: `week|month|year` (default: year for seasons)
- **Description**: Seasonal tour patterns and busy periods
- **Response**: Array of seasons with tour counts, average earnings

---

## 💰 Earnings Endpoints

### Get Earnings Overview
- **Endpoint**: `GET /:guideId/earnings`
- **Alternative**: `GET /api/guides/:guideId/earnings`
- **Description**: Complete earnings overview with totals and recent transactions
- **Response**: Total, daily, weekly, monthly earnings + transaction list

### Get Daily Earnings
- **Endpoint**: `GET /:guideId/earnings/daily`
- **Alternative**: `GET /api/guides/:guideId/earnings/daily`
- **Description**: Day-by-day earnings breakdown
- **Response**: Object with daily earnings, tour counts, hours worked

### Get Weekly Earnings
- **Endpoint**: `GET /:guideId/earnings/weekly`
- **Alternative**: `GET /api/guides/:guideId/earnings/weekly`
- **Description**: Weekly earnings summary
- **Response**: Object with weekly totals, tour counts, performance metrics

### Get Monthly Earnings
- **Endpoint**: `GET /:guideId/earnings/monthly`
- **Alternative**: `GET /api/guides/:guideId/earnings/monthly`
- **Description**: Monthly earnings breakdown
- **Response**: Object with monthly totals and trends

### Get Weekly Earnings Chart Data
- **Endpoint**: `GET /api/guides/:guideId/weekly-earnings`
- **Description**: Chart-ready weekly earnings data
- **Response**: Array of daily earnings suitable for chart visualization

### Get Transaction History
- **Endpoint**: `GET /api/guides/:guideId/transactions`
- **Query Parameters**: 
  - `limit`: Number of transactions to return (default: 50)
- **Description**: Detailed transaction history
- **Response**: Array of transaction objects with tour details, amounts, dates

---

## 👤 Profile & Settings Endpoints

### Get Guide Profile
- **Endpoint**: `GET /:guideId/profile`
- **Alternative**: `GET /api/guides/:guideId/profile`
- **Description**: Complete guide profile information
- **Response**: Personal info, professional details, certifications, pricing

### Update Guide Profile
- **Endpoint**: `PUT /:guideId/profile`
- **Alternative**: `PUT /api/guides/:guideId/profile`
- **Body**: Profile update data (JSON)
- **Description**: Update guide profile information
- **Response**: Confirmation of profile update

### Get Notifications
- **Endpoint**: `GET /:guideId/notifications`
- **Alternative**: `GET /api/guides/:guideId/notifications`
- **Description**: Retrieve guide notifications
- **Response**: Array of notification objects with types, messages, timestamps

### Mark Notification as Read
- **Endpoint**: `POST /:guideId/notifications/:notificationId/read`
- **Alternative**: `POST /api/guides/:guideId/notifications/:notificationId/read`
- **Description**: Mark specific notification as read
- **Response**: Confirmation of action

---

## 📅 Schedule Management Endpoints

### Get Schedule
- **Endpoint**: `GET /:guideId/schedule`
- **Alternative**: `GET /api/guides/:guideId/schedule`
- **Query Parameters**: 
  - `month`: Month number (1-12)
- **Description**: Guide availability calendar
- **Response**: Calendar object with availability, locked days, working hours

### Update Schedule
- **Endpoint**: `PUT /:guideId/schedule`
- **Alternative**: `PUT /api/guides/:guideId/schedule`
- **Body**: Schedule update data
- **Description**: Update guide availability schedule
- **Response**: Confirmation of schedule update

### Mark Days Unavailable
- **Endpoint**: `POST /api/guides/:guideId/schedule/mark-unavailable`
- **Body**: `{ "dates": ["2025-09-15", "2025-09-16"] }`
- **Description**: Mark specific dates as unavailable
- **Response**: Confirmation with updated dates

### Mark Days Available
- **Endpoint**: `POST /api/guides/:guideId/schedule/mark-available`
- **Body**: `{ "dates": ["2025-09-15", "2025-09-16"] }`
- **Description**: Mark specific dates as available
- **Response**: Confirmation with updated dates

### Lock Days for Tours
- **Endpoint**: `POST /api/guides/:guideId/schedule/lock-days`
- **Body**: `{ "dates": ["2025-09-15"], "tourId": "TOUR_123" }`
- **Description**: Lock specific days for confirmed tours
- **Response**: Confirmation with locked dates

---

## 💬 Communication Endpoints

### Get Chat Groups
- **Endpoint**: `GET /:guideId/groups`
- **Alternative**: `GET /api/guides/:guideId/groups`
- **Description**: Retrieve all chat groups for ongoing tours
- **Response**: Array of chat group objects with participant info

### Get Group Messages
- **Endpoint**: `GET /:guideId/groups/:groupId/messages`
- **Alternative**: `GET /api/guides/:guideId/groups/:groupId/messages`
- **Description**: Retrieve messages from specific chat group
- **Response**: Array of message objects with sender info, timestamps

---

## ⭐ Review Management Endpoints

### Get Reviews
- **Endpoint**: `GET /:guideId/reviews`
- **Alternative**: `GET /api/guides/:guideId/reviews`
- **Description**: Retrieve all reviews for the guide
- **Response**: Array of review objects with ratings, comments, client info

### Respond to Review
- **Endpoint**: `POST /:guideId/reviews/:reviewId/respond`
- **Alternative**: `POST /api/guides/:guideId/reviews/:reviewId/respond`
- **Body**: `{ "response": "Thank you for the feedback!" }`
- **Description**: Respond to a client review
- **Response**: Confirmation of response submission

---

## 🏥 System Endpoints

### Health Check
- **Endpoint**: `GET /health`
- **Description**: Service health status
- **Response**: 
  ```json
  {
    "status": "OK",
    "service": "Guide Microservice", 
    "timestamp": "2025-09-07T00:00:00.000Z",
    "port": 5002
  }
  ```

---

## 📝 Response Format

All endpoints follow a consistent response format:

### Success Response
```json
{
  "success": true,
  "data": { ... }
}
```

### Error Response
```json
{
  "success": false,
  "message": "Error description"
}
```

## 🔒 Authentication Responses

### 401 Unauthorized
```json
{
  "success": false,
  "message": "Authentication required"
}
```

### 404 Not Found
```json
{
  "success": false,
  "message": "Guide profile not found"
}
```

---

## 🌐 URL Patterns

The API supports dual URL patterns for maximum compatibility:

1. **Direct Pattern**: `/:guideId/endpoint`
   - Shorter URLs for direct access
   - Example: `/guide@email.com/dashboard`

2. **API Pattern**: `/api/guides/:guideId/endpoint`  
   - RESTful API structure
   - Example: `/api/guides/guide@email.com/dashboard`

Both patterns provide identical functionality and responses.

---

**Guide Microservice API Documentation v1.0.0**  
*Complete endpoint reference for guide management operations*
