# Pooling Confirm Service

A Node.js microservice for confirming pooling trips and handling payment processes in the IslandHop travel platform.

## Overview

This service handles the confirmation workflow for pooling trips:

1. **Trip Confirmation Initiation** - Group creator initiates confirmation process
2. **Member Confirmation** - All group members confirm their participation
3. **Payment Processing** - Handle payments once all members confirm
4. **Trip Activation** - Create active trip entries for confirmed trips
5. **Cancellation & Refunds** - Handle trip cancellations and refund processing

## Features

- ✅ Trip confirmation workflow management
- ✅ Member participation tracking
- ✅ Payment integration (PayHere gateway ready)
- ✅ Automated notifications (ready for email service)
- ✅ Active trip creation integration
- ✅ Comprehensive audit logging
- ✅ Deadline management
- ✅ Refund processing
- ✅ RESTful API with proper error handling
- ✅ Database optimization with indexes

## Architecture

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│ Pooling Service │───►│ Pooling Confirm  │───►│ Active Trips    │
│ (Java)          │    │ Service (Node.js)│    │ Service         │
└─────────────────┘    └──────────────────┘    └─────────────────┘
                                │
                                ▼
                       ┌──────────────────┐
                       │ Payment Service  │
                       │ (PayHere)        │
                       └──────────────────┘
```

## API Endpoints

### Trip Confirmation

#### 1. Initiate Confirmation
```http
POST /api/v1/pooling-confirm/initiate
```

**Request Body:**
```json
{
  "groupId": "string",
  "userId": "string",
  "minMembers": 2,
  "maxMembers": 12,
  "tripStartDate": "2024-12-01T00:00:00.000Z",
  "tripEndDate": "2024-12-05T00:00:00.000Z",
  "confirmationHours": 48,
  "totalAmount": 50000,
  "pricePerPerson": 12500,
  "currency": "LKR",
  "paymentDeadlineHours": 72,
  "tripDetails": {}
}
```

#### 2. Confirm Participation
```http
POST /api/v1/pooling-confirm/:confirmedTripId/confirm
```

**Request Body:**
```json
{
  "userId": "string"
}
```

#### 3. Get Confirmation Status
```http
GET /api/v1/pooling-confirm/:confirmedTripId/status?userId=string
```

#### 4. Cancel Confirmation
```http
POST /api/v1/pooling-confirm/:confirmedTripId/cancel
```

**Request Body:**
```json
{
  "userId": "string",
  "reason": "Insufficient interest"
}
```

#### 5. Get User's Confirmed Trips
```http
GET /api/v1/pooling-confirm/user/:userId/trips?status=confirmed&page=1&limit=10
```

## Database Schema

### ConfirmedTrip Collection
```javascript
{
  _id: ObjectId,
  groupId: String,           // Reference to pooling service group
  tripId: String,            // Reference to trip planning service
  tripName: String,
  groupName: String,
  creatorUserId: String,
  memberIds: [String],
  status: String,            // pending_confirmation, confirmed, payment_pending, etc.
  currentMemberCount: Number,
  minMembers: Number,
  maxMembers: Number,
  tripStartDate: Date,
  tripEndDate: Date,
  confirmationDeadline: Date,
  paymentInfo: {
    totalAmount: Number,
    pricePerPerson: Number,
    currency: String,
    paymentDeadline: Date,
    memberPayments: [...]
  },
  memberConfirmations: [{
    userId: String,
    confirmed: Boolean,
    confirmedAt: Date,
    paymentStatus: String
  }],
  actions: [...]             // Audit trail
}
```

### PaymentTransaction Collection
```javascript
{
  _id: ObjectId,
  transactionId: String,     // Unique transaction ID
  confirmedTripId: ObjectId,
  groupId: String,
  tripId: String,
  userId: String,
  amount: Number,
  currency: String,
  paymentGateway: String,    // payhere, stripe, etc.
  status: String,            // pending, completed, failed, refunded
  gatewayTransactionId: String,
  gatewayResponse: {},
  refundInfo: {}
}
```

## Status Flow

```
pending_confirmation → confirmed → payment_pending → payment_completed → trip_started → completed
                                         ↓
                                    cancelled
```

## Integration Points

### 1. Pooling Service (Java)
- **GET** `/api/v1/groups/{groupId}` - Fetch group details
- **PUT** `/api/v1/groups/{groupId}/status` - Update group status

### 2. Active Trips Service
- **POST** `/api/trips` - Create active trip entry

### 3. Payment Service (PayHere)
- **POST** `/api/payments` - Initiate payment
- **POST** `/api/payments/refund` - Process refunds

### 4. Email Service
- **POST** `/api/email/send` - Send notifications

## Installation & Setup

1. **Clone and Install**
```bash
cd pooling-confirm
npm install
```

2. **Environment Setup**
```bash
cp .env.example .env
# Edit .env with your configuration
```

3. **Database Setup**
```bash
# Ensure MongoDB is running
# Database and collections will be created automatically
```

4. **Start Development Server**
```bash
npm run dev
```

5. **Production**
```bash
npm start
```

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `PORT` | Service port | 8071 |
| `MONGODB_URI` | MongoDB connection string | mongodb://localhost:27017/islandhop_pooling_confirm |
| `POOLING_SERVICE_URL` | Java pooling service URL | http://localhost:8086 |
| `PAYMENT_SERVICE_URL` | Payment service URL | http://localhost:8068 |
| `ACTIVE_TRIP_SERVICE_URL` | Active trips service URL | http://localhost:8070 |
| `EMAIL_SERVICE_URL` | Email service URL | http://localhost:8062 |

## Business Logic

### Confirmation Flow
1. **Creator initiates confirmation** with trip details and payment info
2. **Service validates** group exists and creator has permission
3. **Members receive notifications** to confirm participation
4. **Each member confirms** within the deadline
5. **Once all confirm**, trip moves to confirmed status
6. **Payment process starts** if required
7. **Active trip created** for trip management

### Payment Flow
1. **Payment transactions created** for each member
2. **Payment gateway integration** (PayHere)
3. **Payment status tracking** per member
4. **Automatic refunds** on cancellation

### Deadline Management
- **Confirmation deadline** (default 48 hours)
- **Payment deadline** (default 72 hours after confirmation)
- **Automatic cleanup** of expired confirmations

## Error Handling

- **404** - Trip/Group not found
- **403** - Unauthorized access
- **409** - Conflict (already confirmed, etc.)
- **410** - Deadline passed
- **429** - Rate limiting
- **500** - Internal server error

## Monitoring & Health

- **GET** `/health` - Service health check
- **Comprehensive logging** with Winston
- **Error tracking** with stack traces
- **Performance monitoring** ready

## Testing

```bash
# Run tests
npm test

# Run tests in watch mode
npm run test:watch
```

## API Documentation

Visit `/api/v1/pooling-confirm/docs` for complete API documentation.

## Future Enhancements

- [ ] Real-time notifications with WebSocket
- [ ] Kafka integration for event streaming
- [ ] Redis caching for performance
- [ ] Advanced payment methods
- [ ] Automated reminder system
- [ ] Analytics and reporting
- [ ] Multi-currency support

## Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## License

MIT License - see LICENSE file for details.
