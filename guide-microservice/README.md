# Guide Microservice

A comprehensive microservice for managing tour guides in the Island Hop travel booking system.

## 🌟 Overview

The Guide Microservice handles all guide-related operations including profile management, tour scheduling, earnings tracking, analytics, and client communications. It's designed to provide guides with a complete platform to manage their tour business.

## 🚀 Features

### Core Features
- **Guide Authentication** - Secure email-based authentication
- **Profile Management** - Complete guide profiles with certifications, languages, specializations
- **Tour Management** - Active tours, pending requests, tour history
- **Earnings Tracking** - Daily, weekly, monthly earnings with detailed analytics
- **Schedule Management** - Availability calendar and booking management
- **Review System** - Client reviews and response management
- **Analytics Dashboard** - Performance metrics, top locations, busy seasons
- **Chat Integration** - Client communication during tours
- **Notification System** - Real-time updates and alerts

### Guide-Specific Features
- **Multi-language Support** - Guides can specify languages spoken
- **Specialization Areas** - Cultural, historical, nature, adventure tours etc.
- **Certification Management** - Professional certifications and licenses
- **Coverage Areas** - Geographic regions the guide covers
- **Flexible Pricing** - Hourly/daily rates with group size multipliers
- **Experience Portfolio** - Years of experience and professional background

## 📋 Prerequisites

- Node.js >= 14.0.0
- MongoDB Atlas account
- npm or yarn package manager

## 🛠️ Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd guide-microservice
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment Setup**
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

4. **Start the service**
   ```bash
   # Development
   npm run dev
   
   # Production
   npm start
   ```

## 🔧 Configuration

### Environment Variables (.env)

```bash
# MongoDB Connection
MONGODB_URI=mongodb+srv://user:password@cluster.mongodb.net/For_Guides

# Server Configuration
PORT=5002
NODE_ENV=development

# JWT Configuration
JWT_SECRET=your_jwt_secret_key
JWT_EXPIRES_IN=7d

# API Configuration
API_VERSION=v1
API_PREFIX=/api/guides
```

## 📡 API Endpoints

### Authentication
All endpoints require guide authentication via email identification.

### Dashboard Routes
- `GET /:guideId` - Guide dashboard overview
- `GET /:guideId/stats` - Detailed guide statistics
- `GET /api/guides/:guideId` - Dashboard (API prefix)
- `GET /api/guides/:guideId/stats` - Stats (API prefix)

### Tour Management
- `GET /:guideId/active` - Active tours
- `GET /:guideId/pending` - Pending tour requests
- `GET /:guideId/tours` - Tour history
- `GET /:guideId/tours/:tourId` - Specific tour details
- `PUT /:guideId/tours/:tourId/status` - Update tour status
- `POST /:guideId/tours/:tourId/accept` - Accept tour request
- `POST /:guideId/tours/:tourId/decline` - Decline tour request

### Analytics
- `GET /:guideId/analytics` - Overall analytics
- `GET /:guideId/analytics/locations/top` - Top tour locations
- `GET /:guideId/analytics/seasons/busy` - Busy seasons analysis
- `GET /api/guides/:guideId/top-locations` - Top locations (detailed)
- `GET /api/guides/:guideId/busy-seasons` - Seasonal analytics

### Earnings
- `GET /:guideId/earnings` - Earnings overview
- `GET /:guideId/earnings/daily` - Daily earnings breakdown
- `GET /:guideId/earnings/weekly` - Weekly earnings
- `GET /:guideId/earnings/monthly` - Monthly earnings
- `GET /api/guides/:guideId/transactions` - Transaction history

### Profile & Settings
- `GET /:guideId/profile` - Guide profile
- `PUT /:guideId/profile` - Update profile
- `GET /:guideId/notifications` - Notifications
- `POST /:guideId/notifications/:notificationId/read` - Mark notification read

### Schedule Management
- `GET /:guideId/schedule` - Guide schedule/calendar
- `PUT /:guideId/schedule` - Update schedule
- `POST /api/guides/:guideId/schedule/mark-unavailable` - Mark days unavailable
- `POST /api/guides/:guideId/schedule/mark-available` - Mark days available
- `POST /api/guides/:guideId/schedule/lock-days` - Lock days for tours

### Communication
- `GET /:guideId/groups` - Chat groups
- `GET /:guideId/groups/:groupId/messages` - Group messages

### Reviews
- `GET /:guideId/reviews` - Guide reviews
- `POST /:guideId/reviews/:reviewId/respond` - Respond to review

## 🗃️ Database Schema

### Guide Model
```javascript
{
  email: String (required, unique),
  firstName: String (required),
  lastName: String (required),
  phone: String (required),
  licenseNumber: String (required),
  languages: [String],
  specializations: [String], // cultural, historical, nature, etc.
  certifications: [{
    name: String,
    issuedBy: String,
    issuedDate: Date,
    expiryDate: Date
  }],
  status: String, // active, inactive, suspended
  rating: Number,
  totalTours: Number,
  earnings: {
    total: Number,
    daily: Number,
    weekly: Number,
    monthly: Number
  },
  location: {
    latitude: Number,
    longitude: Number,
    address: String,
    coverageAreas: [String]
  },
  pricing: {
    hourlyRate: Number,
    dayRate: Number,
    groupSizeMultiplier: {
      small: Number,  // 1-4 people
      medium: Number, // 5-10 people
      large: Number   // 11+ people
    }
  },
  experience: {
    years: Number,
    description: String,
    previousWork: [Object]
  },
  tourTypes: [String], // day-trip, multi-day, cultural-tour, etc.
  availability: {
    schedule: Map,
    workingHours: Object,
    daysOff: [String]
  }
}
```

## 🔒 Authentication

The service uses email-based authentication where the `guideId` parameter in routes represents the guide's email address. This can be easily adapted to work with:

- **JWT Tokens**: Extract from `req.user.email`
- **Session-based**: Extract from `req.session.user.email`  
- **Header-based**: Extract from custom headers
- **Parameter-based**: Current implementation using URL parameters

## 📊 Analytics Features

### Performance Metrics
- Average rating and trends
- Completion rates
- Earnings growth analysis
- Tour count and growth
- Client satisfaction metrics

### Location Analytics
- Top tour locations by popularity
- Earnings by location
- Seasonal location trends
- Coverage area performance

### Business Intelligence
- Busy seasons identification
- Tour type performance
- Group size optimization
- Pricing effectiveness analysis

## 🌐 Integration

### Frontend Integration
The service provides dual URL patterns for maximum compatibility:
- **Direct routes**: `/:guideId/endpoint`
- **API routes**: `/api/guides/:guideId/endpoint`

### Database Integration
- **MongoDB Atlas** connection
- **Mongoose ODM** for data modeling
- **Geospatial indexing** for location-based queries
- **Text indexing** for search functionality

## 🚀 Deployment

### Development
```bash
npm run dev
```

### Production
```bash
npm start
```

### Docker (Optional)
```dockerfile
FROM node:14-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
EXPOSE 5002
CMD ["npm", "start"]
```

## 📋 Health Check

- **Endpoint**: `GET /health`
- **Response**: Service status, timestamp, port information

## 🧪 Testing

```bash
# Run tests
npm test

# Test with coverage
npm run test:coverage
```

## 📝 Logging

The service uses Morgan for HTTP request logging and includes comprehensive error logging for debugging and monitoring.

## 🔧 Customization

### Adding New Endpoints
1. Add function to `controllers/authControllers.js`
2. Add route to `server.js`
3. Update documentation

### Modifying Authentication
Update the `getLoggedUserEmail()` function in the controller to match your authentication method.

### Database Schema Changes
Modify `models/Guide.js` and ensure proper migration for existing data.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Submit a pull request

## 📄 License

MIT License - see LICENSE file for details

## 🆘 Support

For support and questions:
- Check the API documentation
- Review the health check endpoint
- Contact the development team

---

**Island Hop Guide Microservice v1.0.0**  
*Empowering tour guides with comprehensive business management tools*
