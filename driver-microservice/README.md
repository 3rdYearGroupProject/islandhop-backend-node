# Driver Microservice

A comprehensive Node.js Express microservice for managing driver operations in the IslandHop travel booking system. This service handles all driver-related functionality including analytics, dashboard, trips, earnings, reviews, schedules, chat, and profile management.

## Features

### 📊 Analytics
- Performance metrics by period (week/month/quarter)
- Top routes analysis
- Busy hours tracking
- Weekly earnings breakdown
- Trip completion rates and response times

### 🚗 Dashboard
- Real-time driver statistics
- Active trips management
- Pending trip requests handling
- Trip acceptance/decline functionality
- Trip status updates (en_route, arrived, picked_up, completed, cancelled)

### 🛣️ Trips Management
- Complete trip history with filtering and pagination
- Trip statistics and analytics
- Trip details and customer information
- Rating and review management
- Trip status tracking

### 💰 Earnings
- Comprehensive earnings summary by period
- Detailed transaction history
- Earnings analytics with period comparisons
- Payout history and management
- Platform fee calculations

### ⭐ Reviews & Ratings
- Customer review management
- Rating trends analysis
- Low-rated trip identification
- Review statistics and summaries
- Improvement insights

### 📅 Schedule Management
- Flexible schedule configuration
- Default weekly schedule templates
- Time-off request system
- Schedule statistics and analytics
- Working hours tracking

### 💬 Communication
- Chat system with customers and support
- Message history and search
- Conversation management
- Unread message tracking
- File attachment support

### 👤 Profile Management
- Complete driver profile management
- Personal and vehicle information
- Account settings and preferences
- Profile completion tracking
- Availability status management

## Technology Stack

- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: MongoDB with Mongoose ODM
- **Validation**: Joi
- **Security**: Helmet, CORS, Rate Limiting
- **Logging**: Morgan
- **Date/Time**: Moment.js
- **Compression**: Express compression

## Project Structure

```
driver-microservice/
├── config/
│   └── database.js          # MongoDB connection configuration
├── controllers/
│   ├── analyticsController.js    # Analytics endpoints
│   ├── dashboardController.js    # Dashboard functionality
│   ├── tripsController.js        # Trip management
│   ├── earningsController.js     # Earnings and payouts
│   ├── reviewsController.js      # Reviews and ratings
│   ├── scheduleController.js     # Schedule management
│   ├── chatController.js         # Communication features
│   └── profileController.js      # Profile management
├── middleware/
│   └── errorHandler.js       # Error handling and validation
├── models/
│   └── Driver.js            # Comprehensive driver data model
├── routes/
│   ├── analyticsRoutes.js    # Analytics API routes
│   ├── dashboardRoutes.js    # Dashboard API routes
│   ├── tripsRoutes.js        # Trips API routes
│   ├── earningsRoutes.js     # Earnings API routes
│   ├── reviewsRoutes.js      # Reviews API routes
│   ├── scheduleRoutes.js     # Schedule API routes
│   ├── chatRoutes.js         # Chat API routes
│   └── profileRoutes.js      # Profile API routes
├── index.js                  # Main server file
├── package.json             # Dependencies and scripts
├── .env.example             # Environment variables template
└── README.md               # This file
```

## Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd driver-microservice
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

4. **Start MongoDB**
   ```bash
   # Make sure MongoDB is running locally or configure remote connection
   mongod
   ```

5. **Run the service**
   ```bash
   # Development mode
   npm run dev

   # Production mode
   npm start
   ```

## API Endpoints

### Analytics
- `GET /api/analytics/:email` - Get driver analytics
- `GET /api/analytics/:email/routes` - Get top routes
- `GET /api/analytics/:email/busy-hours` - Get busy hours
- `GET /api/analytics/:email/weekly-earnings` - Get weekly earnings

### Dashboard
- `GET /api/dashboard/:email/stats` - Get dashboard stats
- `GET /api/dashboard/:email/active-trips` - Get active trips
- `GET /api/dashboard/:email/pending-requests` - Get pending requests
- `POST /api/dashboard/:email/requests/:requestId/accept` - Accept trip
- `POST /api/dashboard/:email/requests/:requestId/decline` - Decline trip
- `PUT /api/dashboard/:email/trips/:tripId/status` - Update trip status

### Trips
- `GET /api/trips/:email` - Get all trips with filters
- `GET /api/trips/:email/stats` - Get trip statistics
- `GET /api/trips/:email/:tripId` - Get specific trip
- `PUT /api/trips/:email/:tripId/rating` - Update trip rating

### Earnings
- `GET /api/earnings/:email/summary` - Get earnings summary
- `GET /api/earnings/:email/detailed` - Get detailed earnings
- `GET /api/earnings/:email/by-date` - Get earnings by date range
- `GET /api/earnings/:email/payouts` - Get payout history
- `GET /api/earnings/:email/analytics` - Get earnings analytics

### Reviews
- `GET /api/reviews/:email` - Get all reviews
- `GET /api/reviews/:email/summary` - Get reviews summary
- `GET /api/reviews/:email/trends` - Get rating trends
- `GET /api/reviews/:email/low-rated` - Get low-rated trips
- `GET /api/reviews/:email/trip/:tripId` - Get trip review

### Schedule
- `GET /api/schedule/:email` - Get schedule
- `PUT /api/schedule/:email` - Update schedule
- `GET /api/schedule/:email/default` - Get default schedule
- `PUT /api/schedule/:email/default` - Update default schedule
- `POST /api/schedule/:email/time-off` - Request time off
- `GET /api/schedule/:email/time-off` - Get time off requests
- `GET /api/schedule/:email/stats` - Get schedule statistics

### Chat
- `GET /api/chat/:email/conversations` - Get conversations
- `GET /api/chat/:email/conversations/:conversationId` - Get conversation
- `POST /api/chat/:email/conversations/:conversationId/messages` - Send message
- `POST /api/chat/:email/conversations` - Start conversation
- `GET /api/chat/:email/unread-count` - Get unread count
- `PUT /api/chat/:email/conversations/:conversationId/read` - Mark as read
- `PUT /api/chat/:email/conversations/:conversationId/archive` - Archive conversation
- `GET /api/chat/:email/search` - Search messages

### Profile
- `GET /api/profile/:email` - Get profile
- `PUT /api/profile/:email/personal` - Update personal info
- `PUT /api/profile/:email/driver` - Update driver info
- `PUT /api/profile/:email/vehicle` - Update vehicle info
- `PUT /api/profile/:email/availability` - Update availability
- `GET /api/profile/:email/completion` - Get profile completion
- `GET /api/profile/:email/settings` - Get account settings
- `PUT /api/profile/:email/settings` - Update settings
- `POST /api/profile/:email/change-password` - Change password
- `POST /api/profile/:email/deactivate` - Deactivate account

## Data Model

The service uses a comprehensive MongoDB document structure for drivers containing:

- **Personal Information**: Name, contact details, address, emergency contacts
- **Driver Information**: License details, experience, certifications
- **Vehicle Information**: Vehicle details, registration, insurance
- **Availability**: Current status and location
- **Trip Management**: Active, pending, completed, and cancelled trips
- **Earnings**: Transaction history, payouts, balances
- **Schedule**: Working hours, time off, default schedules
- **Communication**: Chat history, support tickets
- **Statistics**: Performance metrics, ratings, completion rates
- **Account Status**: Verification, activity, preferences

## Environment Variables

Key environment variables (see .env.example for complete list):

- `PORT`: Server port (default: 5003)
- `MONGODB_URI`: MongoDB connection string
- `NODE_ENV`: Environment (development/production)
- `JWT_SECRET`: JWT secret key
- `ALLOWED_ORIGINS`: CORS allowed origins

## Development

### Running Tests
```bash
npm test
```

### Linting
```bash
npm run lint
```

### Development Mode
```bash
npm run dev
```

## Security Features

- **Helmet**: Security headers
- **CORS**: Cross-origin resource sharing protection
- **Rate Limiting**: Request rate limiting
- **Input Validation**: Joi schema validation
- **Error Handling**: Comprehensive error management
- **Data Sanitization**: Input sanitization

## Performance Features

- **Compression**: Response compression
- **Database Indexing**: Optimized MongoDB queries
- **Pagination**: Efficient data pagination
- **Caching**: Response caching strategies

## Frontend Integration

This microservice is designed to work seamlessly with React frontends, providing:

- **Consistent Response Format**: Standardized JSON responses
- **Pagination Support**: Frontend-friendly pagination
- **Error Handling**: Clear error messages and status codes
- **Real-time Updates**: WebSocket support ready
- **File Upload Support**: Image and document handling

## Deployment

### Production Deployment
1. Set `NODE_ENV=production`
2. Configure production MongoDB URI
3. Set up proper CORS origins
4. Configure rate limiting for production loads
5. Set up logging and monitoring
6. Enable compression and security headers

### Docker Support
```dockerfile
FROM node:16-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
EXPOSE 5003
CMD ["npm", "start"]
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Run linting and tests
6. Submit a pull request

## License

This project is part of the IslandHop travel booking system.

## Support

For support and questions, please contact the development team or create an issue in the repository.
