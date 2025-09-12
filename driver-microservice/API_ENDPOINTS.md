# Driver Microservice API Endpoints

## Base URL
```
http://localhost:5001
```

## All Available Endpoints (22 Total)

### Dashboard Routes
- `GET /:driverId` - Get dashboard overview
- `GET /:driverId/stats` - Get driver statistics
- `GET /:driverId/active` - Get active trips
- `GET /:driverId/pending` - Get pending trips

### Analytics Routes  
- `GET /:driverId/analytics` - Get analytics overview
- `GET /:driverId/analytics/routes/top` - Get top routes analytics
- `GET /:driverId/analytics/hours/busy` - Get busy hours analytics

### Trips Routes
- `GET /:driverId/trips` - Get trip history
- `GET /:driverId/trips/:tripId` - Get specific trip details
- `PUT /:driverId/trips/:tripId/status` - Update trip status
- `POST /:driverId/trips/:tripId/accept` - Accept trip request
- `POST /:driverId/trips/:tripId/decline` - Decline trip request

### Earnings Routes
- `GET /:driverId/earnings` - Get earnings overview
- `GET /:driverId/earnings/daily` - Get daily earnings
- `GET /:driverId/earnings/weekly` - Get weekly earnings  
- `GET /:driverId/earnings/monthly` - Get monthly earnings

### Reviews Routes
- `GET /:driverId/reviews` - Get driver reviews
- `POST /:driverId/reviews/:reviewId/respond` - Respond to review

### Schedule Routes
- `GET /:driverId/schedule` - Get driver schedule
- `PUT /:driverId/schedule` - Update driver schedule

### Chat Routes  
- `GET /:driverId/groups` - Get chat groups
- `GET /:driverId/groups/:groupId/messages` - Get messages from specific group

### Profile Routes
- `GET /:driverId/profile` - Get driver profile
- `PUT /:driverId/profile` - Update driver profile  
- `GET /:driverId/notifications` - Get driver notifications
- `POST /:driverId/notifications/:notificationId/read` - Mark notification as read

## Parameter Structure
- All endpoints use `:driverId` parameter instead of `:email`
- Additional parameters like `:tripId`, `:reviewId`, `:notificationId`, `:groupId` are preserved as specified
- All endpoints support proper error handling and validation

## Database Integration
- Connected to MongoDB Atlas: `For_Drivers` database
- Uses existing collection: `Driver_info`
- Supports all CRUD operations with proper error handling

## Features
- Full Joi validation for all endpoints
- Comprehensive error handling middleware
- MongoDB Atlas integration with Mongoose ODM
- CORS enabled for frontend integration
- Request logging with Morgan
- Security headers with Helmet
- Environment-based configuration

## Getting Started
1. Install dependencies: `npm install`
2. Set environment variables in `.env`
3. Start server: `npm start`
4. Server runs on port 5001

## Frontend Integration Ready
All endpoints are structured exactly as specified for seamless frontend integration with the driver dashboard and mobile application.
