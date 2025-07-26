# Email Service

A microservice for handling email functionality in the IslandHop application.

## Features

- ✅ Send single emails
- ✅ Send bulk emails
- ✅ Contact form handling
- ✅ Welcome emails for new users
- ✅ Email configuration testing
- ✅ Comprehensive logging
- ✅ Input validation
- ✅ Error handling

## Setup

### Backend Setup

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Environment Configuration:**
   Copy `.env.example` to `.env` and configure your email settings:
   ```bash
   cp .env.example .env
   ```

   Configure the following variables:
   ```env
   PORT=8084
   EMAIL_SERVICE=gmail
   EMAIL_USER=your-email@gmail.com
   EMAIL_PASSWORD=your-app-password
   EMAIL_FROM=noreply@islandhop.com
   CONTACT_EMAIL=contact@islandhop.com
   ```

3. **Gmail Configuration:**
   - Enable 2-factor authentication on your Google account
   - Generate an App Password: Google Account → Security → App passwords
   - Use the App Password as `EMAIL_PASSWORD`

4. **Start the service:**
   ```bash
   npm start        # Production
   npm run dev      # Development with auto-reload
   ```

### Frontend Integration

The frontend is already configured to work with the email service:

1. **Environment Variables:**
   The frontend `.env.local` includes:
   ```env
   VITE_EMAIL_SERVICE_URL=http://localhost:8084/api/v1/email
   ```

2. **Email Service API:**
   Use the `emailService` from `src/api/emailService.js`:
   ```javascript
   import emailService from '../api/emailService';
   
   // Send contact form
   await emailService.sendContactForm({
     name: 'John Doe',
     email: 'john@example.com',
     subject: 'Test Subject',
     message: 'Test message'
   });
   ```

3. **React Hook:**
   Use the `useEmailService` hook for React components:
   ```javascript
   import useEmailService from '../hooks/useEmailService';
   
   const MyComponent = () => {
     const { sendContactForm, loading, error } = useEmailService();
     
     const handleSubmit = async (formData) => {
       try {
         await sendContactForm(formData);
         // Handle success
       } catch (err) {
         // Handle error
       }
     };
   };
   ```

## API Endpoints

### POST /api/v1/email/send
Send a single email.

**Request Body:**
```json
{
  "to": "recipient@example.com",
  "subject": "Subject",
  "text": "Plain text content",
  "html": "<h1>HTML content</h1>",
  "from": "sender@example.com" // optional
}
```

### POST /api/v1/email/send-bulk
Send emails to multiple recipients.

**Request Body:**
```json
{
  "recipients": ["user1@example.com", "user2@example.com"],
  "subject": "Subject",
  "text": "Plain text content",
  "html": "<h1>HTML content</h1>"
}
```

### POST /api/v1/email/contact
Handle contact form submissions.

**Request Body:**
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "subject": "Contact Subject",
  "message": "Contact message"
}
```

### POST /api/v1/email/welcome
Send welcome emails to new users.

**Request Body:**
```json
{
  "email": "newuser@example.com",
  "name": "New User",
  "userType": "tourist" // "tourist", "guide", or "driver"
}
```

### GET /api/v1/email/test
Test email configuration.

### GET /health
Health check endpoint.

## Frontend Components

### ContactForm Component
Ready-to-use contact form component located at:
`src/components/email/ContactForm.jsx`

Usage:
```javascript
import ContactForm from '../components/email/ContactForm';

function ContactPage() {
  return (
    <div>
      <ContactForm />
    </div>
  );
}
```

## Development

### Running Both Services

1. **Start Email Service:**
   ```bash
   cd email-service
   npm run dev
   ```

2. **Start Frontend:**
   ```bash
   cd email-service/IslandHop-Frontend
   npm run dev
   ```

The email service runs on `http://localhost:8084`
The frontend runs on `http://localhost:5173`

### Testing

Test the email configuration:
```bash
curl http://localhost:8084/api/v1/email/test
```

### Logs

Logs are written to:
- `error.log` - Error level logs
- `combined.log` - All logs
- Console output

## Integration Examples

### User Registration Welcome Email
```javascript
// After successful user registration
import emailService from '../api/emailService';

const handleRegistration = async (userData) => {
  // ... registration logic ...
  
  // Send welcome email
  try {
    await emailService.sendWelcomeEmail({
      email: userData.email,
      name: userData.name,
      userType: userData.userType
    });
  } catch (error) {
    console.error('Failed to send welcome email:', error);
  }
};
```

### Contact Form Integration
```javascript
// In your contact page
import useEmailService from '../hooks/useEmailService';

const ContactPage = () => {
  const { sendContactForm, loading, error } = useEmailService();
  
  const handleSubmit = async (formData) => {
    try {
      await sendContactForm(formData);
      // Show success message
    } catch (err) {
      // Show error message
    }
  };
  
  // ... rest of component
};
```

## Error Handling

The service includes comprehensive error handling:
- Input validation using Joi
- Email service configuration validation
- Detailed error logging
- User-friendly error messages

## Security

- Environment variables for sensitive data
- Input validation and sanitization
- CORS configuration
- No sensitive data in logs
