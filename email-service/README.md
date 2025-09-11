# Email Service

A microservice for handling email functionality in the IslandHop application. Structured to follow the same patterns as support-agent-service and verification-service.

## 📁 File Structure

```
email-service/
├── config.js                              # Configuration management
├── email.js                               # Email service logic & logger
├── index.js                               # Main server entry point
├── package.json                           # Dependencies
├── .env.example                           # Environment template
├── .gitignore                             # Git ignore rules
├── README.md                              # This file
├── EMAIL_PATHS_GUIDE.md                   # API documentation
├── EmailService.postman_collection.json   # Postman collection
├── logs/                                  # Log files directory
│   ├── error.log                         # Error logs
│   └── combined.log                      # All logs
└── routes/
    └── email.js                          # Email API routes
```

## 🚀 Features

- ✅ Send single emails
- ✅ Send bulk emails
- ✅ Contact form handling
- ✅ Welcome emails for new users
- ✅ Account verification emails
- ✅ Pool request notifications
- ✅ Service provider requests (guide/driver/hotel)
- ✅ Lost item reports
- ✅ Email configuration testing
- ✅ Comprehensive logging
- ✅ Input validation
- ✅ Error handling

## 🛠️ Setup

### 1. Install Dependencies
```bash
npm install
```

### 2. Environment Configuration
Copy `.env.example` to `.env` and configure your settings:
```bash
cp .env.example .env
```

Configure these variables in `.env`:
```env
PORT=8084
EMAIL_SERVICE=gmail
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-app-password
EMAIL_FROM=noreply@islandhop.com
CONTACT_EMAIL=contact@islandhop.com
FRONTEND_URL=http://localhost:5173
```

### 3. Gmail Setup (Recommended)
1. Enable 2-factor authentication on your Google account
2. Go to Google Account → Security → App passwords
3. Generate an app password for "Mail"
4. Use the generated password as `EMAIL_PASSWORD`

### 4. Start the Service
```bash
npm start        # Production
npm run dev      # Development with auto-reload
```

The service will start on `http://localhost:8084`

## 📡 API Endpoints

### Health & Testing
- **GET** `/health` - Service health check
- **GET** `/test-config` - Test email configuration

### Basic Email Services
- **POST** `/api/v1/email/send` - Send single email
- **POST** `/api/v1/email/send-bulk` - Send bulk emails
- **POST** `/api/v1/email/contact` - Contact form submissions
- **POST** `/api/v1/email/welcome` - Welcome emails

### Advanced Services
- **POST** `/api/v1/email/verification` - Account verification emails
- **POST** `/api/v1/email/pool-request` - Pool join/invite requests
- **POST** `/api/v1/email/service-request` - Service provider requests
- **POST** `/api/v1/email/lost-item` - Lost item reports

## 📧 Email Types

### 1. Account Verification
Sends verification emails with secure tokens for user account activation.

### 2. Pool Requests
Handles both:
- Public pool join requests
- Private pool invitations

### 3. Service Provider Requests
Manages booking requests for:
- Tour guides
- Drivers
- Hotels

### 4. Lost Item Reports
Processes lost item reports and notifies support team.

## 🧪 Testing

### Using Postman
Import `EmailService.postman_collection.json` into Postman for easy API testing.

### Using cURL
```bash
# Health check
curl http://localhost:8084/health

# Test email config
curl http://localhost:8084/test-config

# Send welcome email
curl -X POST http://localhost:8084/api/v1/email/welcome \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "name": "John Doe",
    "userType": "tourist"
  }'
```

## 📝 Logging

- **Error logs**: `logs/error.log`
- **Combined logs**: `logs/combined.log`
- **Console output**: Real-time development logs

## 🔧 Configuration

The service uses a centralized configuration system in `config.js`:

```javascript
const config = require('./config');

// Access configuration
config.PORT          // Service port
config.EMAIL_SERVICE  // Email provider
config.EMAIL_USER     // Email credentials
config.FRONTEND_URL   // Frontend URL for CORS
```

## 🔗 Integration

### Frontend Integration
See `EMAIL_PATHS_GUIDE.md` for detailed frontend integration examples.

### Other Microservices
The email service is designed to work with:
- Support Agent Service (port 8061)
- Verification Service (port 8083)
- Main Backend Services

## 🛡️ Security

- Environment variables for sensitive data
- Input validation using Joi
- CORS configuration
- No sensitive data in logs
- Secure email authentication

## 📚 Documentation

- **API Guide**: `EMAIL_PATHS_GUIDE.md`
- **Postman Collection**: `EmailService.postman_collection.json`
- **Environment Template**: `.env.example`

## 🚀 Deployment

The service is ready for deployment and follows the same patterns as other IslandHop microservices for easy integration and maintenance.
