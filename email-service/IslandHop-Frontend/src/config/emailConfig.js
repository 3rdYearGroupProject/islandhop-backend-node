// Email service configuration for frontend

export const emailConfig = {
  // API URLs
  EMAIL_SERVICE_URL: import.meta.env.VITE_EMAIL_SERVICE_URL || 'http://localhost:8084/api/v1/email',
  
  // Service types
  SERVICE_TYPES: [
    { value: 'guide', label: 'Tour Guide', description: 'Professional tour guide services' },
    { value: 'driver', label: 'Driver', description: 'Transportation and driving services' },
    { value: 'hotel', label: 'Hotel', description: 'Accommodation and lodging services' }
  ],

  // User types for verification emails
  USER_TYPES: [
    { value: 'tourist', label: 'Tourist', description: 'Travel and explore' },
    { value: 'guide', label: 'Guide', description: 'Provide tour guide services' },
    { value: 'driver', label: 'Driver', description: 'Provide transportation services' }
  ],

  // Pool types
  POOL_TYPES: [
    { value: 'public', label: 'Public Pool', description: 'Open for everyone to join' },
    { value: 'private', label: 'Private Pool', description: 'Invitation only' }
  ],

  // Email templates metadata
  EMAIL_TEMPLATES: {
    welcome: {
      subject: 'Welcome to IslandHop',
      description: 'Welcome email for new users'
    },
    verification: {
      subject: 'Verify Your Account',
      description: 'Account verification email'
    },
    contact: {
      subject: 'Contact Form Submission',
      description: 'Contact form email'
    },
    poolRequest: {
      subject: 'Pool Join Request',
      description: 'Pool request notification'
    },
    serviceRequest: {
      subject: 'Service Request',
      description: 'Service provider request'
    },
    lostItem: {
      subject: 'Lost Item Report',
      description: 'Lost item report submission'
    }
  },

  // Validation rules
  VALIDATION: {
    message: {
      minLength: 10,
      maxLength: 1000
    },
    subject: {
      minLength: 3,
      maxLength: 200
    },
    name: {
      minLength: 2,
      maxLength: 100
    },
    itemDescription: {
      minLength: 10,
      maxLength: 500
    }
  },

  // Error messages
  ERROR_MESSAGES: {
    network: 'Network error. Please check your connection and try again.',
    validation: 'Please check your input and try again.',
    server: 'Server error. Please try again later.',
    email: 'Failed to send email. Please try again.',
    generic: 'Something went wrong. Please try again.'
  },

  // Success messages
  SUCCESS_MESSAGES: {
    contact: 'Thank you for your message! We\'ll get back to you soon.',
    welcome: 'Welcome email sent successfully!',
    verification: 'Verification email sent successfully!',
    poolRequest: 'Pool request sent successfully!',
    serviceRequest: 'Service request sent successfully!',
    lostItem: 'Lost item report submitted successfully!'
  }
};

export default emailConfig;
