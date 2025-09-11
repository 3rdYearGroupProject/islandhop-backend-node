# Email Service API Paths - Complete Guide

## 🚀 All Available Email Service Paths

### Basic Email Services
- **POST** `/api/v1/email/send` - Send single email
- **POST** `/api/v1/email/send-bulk` - Send bulk emails  
- **POST** `/api/v1/email/contact` - Contact form submissions
- **POST** `/api/v1/email/welcome` - Welcome emails for new users
- **GET** `/api/v1/email/test` - Test email configuration

### User Account Services
- **POST** `/api/v1/email/verification` - Account verification emails

### Pool Services  
- **POST** `/api/v1/email/pool-request` - Public/private pool join requests

### Service Provider Requests
- **POST** `/api/v1/email/service-request` - Guide/driver/hotel service requests

### Lost Item Services
- **POST** `/api/v1/email/lost-item` - Lost item reports

---

## 📝 Frontend Usage Examples

### 1. Account Verification Email
```javascript
import { useEmailService } from '../hooks/useEmailService';

const { sendVerificationEmail } = useEmailService();

await sendVerificationEmail({
  email: 'user@example.com',
  name: 'John Doe',
  userType: 'tourist', // 'tourist', 'guide', 'driver'
  verificationToken: 'abc123...',
  verificationUrl: 'https://islandhop.com/verify'
});
```

### 2. Pool Request Notifications
```javascript
import { useEmailService } from '../hooks/useEmailService';

const { sendPoolRequest } = useEmailService();

// Request to join public pool
await sendPoolRequest({
  requesterEmail: 'tourist@example.com',
  requesterName: 'Jane Smith',
  poolName: 'Beach Day Adventure',
  poolOwnerEmail: 'guide@example.com',
  poolOwnerName: 'Local Guide',
  requestType: 'public', // 'public' or 'private'
  message: 'Would love to join this adventure!'
});

// Invite to private pool
await sendPoolRequest({
  requesterEmail: 'friend@example.com',
  requesterName: 'Best Friend',
  poolName: 'Private Island Tour',
  poolOwnerEmail: 'owner@example.com',
  poolOwnerName: 'Pool Owner',
  requestType: 'private',
  message: 'Inviting you to our exclusive tour'
});
```

### 3. Service Provider Requests
```javascript
import { useEmailService } from '../hooks/useEmailService';

const { sendServiceRequest } = useEmailService();

// Guide request
await sendServiceRequest({
  requestorEmail: 'tourist@example.com',
  requestorName: 'John Tourist',
  serviceProviderEmail: 'guide@example.com',
  serviceProviderName: 'Expert Guide',
  serviceType: 'guide', // 'guide', 'driver', 'hotel'
  location: 'Santorini, Greece',
  dates: 'July 15-20, 2025',
  message: 'Looking for a cultural tour of the island',
  budget: '$500-800'
});

// Driver request
await sendServiceRequest({
  requestorEmail: 'tourist@example.com',
  requestorName: 'Jane Traveler',
  serviceProviderEmail: 'driver@example.com',
  serviceProviderName: 'Reliable Driver',
  serviceType: 'driver',
  location: 'Mykonos Airport to Hotel',
  dates: 'August 1, 2025',
  message: 'Need airport pickup and island transportation',
  budget: '$200-300'
});

// Hotel request
await sendServiceRequest({
  requestorEmail: 'tourist@example.com',
  requestorName: 'Travel Group',
  serviceProviderEmail: 'hotel@example.com',
  serviceProviderName: 'Island Resort',
  serviceType: 'hotel',
  location: 'Crete, Greece',
  dates: 'September 5-12, 2025',
  message: 'Group booking for 8 people, ocean view preferred',
  budget: '$2000-3000'
});
```

### 4. Lost Item Reports
```javascript
import { useEmailService } from '../hooks/useEmailService';

const { sendLostItemReport } = useEmailService();

await sendLostItemReport({
  reporterEmail: 'tourist@example.com',
  reporterName: 'Worried Tourist',
  itemDescription: 'Blue leather backpack with camera and passport',
  locationLost: 'Santorini Cable Car Station',
  dateLost: '2025-07-25',
  contactPhone: '+1-555-0123',
  rewardOffered: '$200',
  adminEmail: 'support@islandhop.com' // optional
});
```

---

## 🎯 Integration in Your App

### Registration Flow
```javascript
// After successful user registration
const handleRegistration = async (userData) => {
  try {
    // Create user account...
    
    // Send verification email
    await sendVerificationEmail({
      email: userData.email,
      name: userData.name,
      userType: userData.userType,
      verificationToken: generatedToken,
      verificationUrl: `${window.location.origin}/verify`
    });
    
    // Send welcome email
    await sendWelcomeEmail({
      email: userData.email,
      name: userData.name,
      userType: userData.userType
    });
    
  } catch (error) {
    console.error('Email sending failed:', error);
  }
};
```

### Pool Management
```javascript
// When user requests to join a pool
const handlePoolJoinRequest = async (poolData, requesterData) => {
  try {
    await sendPoolRequest({
      requesterEmail: requesterData.email,
      requesterName: requesterData.name,
      poolName: poolData.name,
      poolOwnerEmail: poolData.ownerEmail,
      poolOwnerName: poolData.ownerName,
      requestType: poolData.type,
      message: requesterData.message
    });
  } catch (error) {
    console.error('Failed to send pool request:', error);
  }
};
```

### Service Booking
```javascript
// When user requests a service
const handleServiceBooking = async (serviceData) => {
  try {
    await sendServiceRequest({
      requestorEmail: user.email,
      requestorName: user.name,
      serviceProviderEmail: serviceData.providerEmail,
      serviceProviderName: serviceData.providerName,
      serviceType: serviceData.type,
      location: serviceData.location,
      dates: serviceData.dates,
      message: serviceData.message,
      budget: serviceData.budget
    });
  } catch (error) {
    console.error('Failed to send service request:', error);
  }
};
```

### Lost Item Reporting
```javascript
// When user reports a lost item
const handleLostItemReport = async (itemData) => {
  try {
    const result = await sendLostItemReport({
      reporterEmail: user.email,
      reporterName: user.name,
      itemDescription: itemData.description,
      locationLost: itemData.location,
      dateLost: itemData.date,
      contactPhone: itemData.phone,
      rewardOffered: itemData.reward
    });
    
    alert(`Lost item report submitted. Report ID: ${result.reportId}`);
  } catch (error) {
    console.error('Failed to submit lost item report:', error);
  }
};
```

---

## 🛠️ Environment Configuration

Make sure your `.env.local` includes:
```env
VITE_EMAIL_SERVICE_URL=http://localhost:8084/api/v1/email
```

## ✅ Ready to Use!

All email service paths are now available in your frontend through:
- `emailService` direct API calls
- `useEmailService()` React hook
- Comprehensive error handling and loading states

The email service runs on **port 8084** and handles all your application's email needs!
