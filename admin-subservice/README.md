# Admin Subservice

A comprehensive Node.js microservice for admin functionality in the Island Hop application, built with Express.js and following MVC architecture.

## Features

- **Authentication & Authorization**: JWT-based authentication with role-based permissions
- **User Management**: Complete CRUD operations for managing users
- **Role & Permission Management**: Dynamic role and permission system
- **Dashboard Analytics**: Comprehensive dashboard with statistics and analytics
- **Multi-Database Support**: MongoDB for document storage, PostgreSQL for relational data
- **Security**: Helmet, rate limiting, CORS, input validation
- **Logging**: Winston-based structured logging
- **Error Handling**: Global error handling middleware

## Tech Stack

- **Runtime**: Node.js
- **Framework**: Express.js
- **Databases**:
  - MongoDB (via Mongoose)
  - PostgreSQL (via Sequelize)
- **Authentication**: JWT (jsonwebtoken)
- **Password Hashing**: bcrypt
- **Validation**: Joi
- **Logging**: Winston
- **Security**: Helmet, express-rate-limit, CORS

## Project Structure

```
admin-subservice/
├── controllers/           # Request handlers
│   ├── authController.js
│   ├── userController.js
│   ├── roleController.js
│   └── dashboardController.js
├── models/               # Data models
│   ├── Admin.js         # MongoDB model
│   ├── User.js          # PostgreSQL model
│   └── Role.js          # PostgreSQL model
├── routes/              # Route definitions
│   ├── authRoutes.js
│   ├── userRoutes.js
│   ├── roleRoutes.js
│   └── dashboardRoutes.js
├── middlewares/         # Custom middlewares
│   ├── auth.js
│   └── errorHandler.js
├── config/              # Database configurations
│   ├── mongodb.js
│   └── postgresql.js
├── services/            # Business logic
│   └── authService.js
├── app.js              # Express app setup
├── server.js           # Server entry point
├── package.json
├── .env
└── README.md
```

## Environment Variables

Create a `.env` file in the root directory:

```env
# Server Configuration
PORT=8070
NODE_ENV=development

# MongoDB Configuration
MONGODB_URI=mongodb://localhost:27017/islandhop_admin

# PostgreSQL (Neon) Configuration
PG_HOST=localhost
PG_PORT=5432
PG_DATABASE=islandhop_admin
PG_USERNAME=your_username
PG_PASSWORD=your_password
PG_SSL=false

# JWT Configuration
JWT_SECRET=your_super_secret_jwt_key_here_change_in_production
JWT_EXPIRES_IN=24h

# CORS Configuration
CORS_ORIGIN=http://localhost:3000

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

## Installation

1. **Clone the repository**

   ```bash
   git clone <repository-url>
   cd admin-subservice
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

4. **Start the application**

   ```bash
   # Development mode
   npm run dev

   # Production mode
   npm start
   ```

## API Endpoints

### Authentication

- `POST /api/admin/auth/login` - Admin login
- `POST /api/admin/auth/register` - Register new admin (Super Admin only)
- `GET /api/admin/auth/profile` - Get current admin profile
- `PUT /api/admin/auth/profile` - Update admin profile
- `PUT /api/admin/auth/change-password` - Change password

### User Management

- `GET /api/admin/users` - Get all users (with pagination & filters)
- `GET /api/admin/users/stats` - Get user statistics
- `GET /api/admin/users/:id` - Get user by ID
- `PUT /api/admin/users/:id` - Update user
- `DELETE /api/admin/users/:id` - Delete user (soft delete)
- `PATCH /api/admin/users/:id/status` - Toggle user status

### Role & Permission Management

- `GET /api/admin/roles` - Get all roles
- `GET /api/admin/roles/:id` - Get role by ID
- `POST /api/admin/roles` - Create new role
- `PUT /api/admin/roles/:id` - Update role
- `DELETE /api/admin/roles/:id` - Delete role
- `GET /api/admin/roles/permissions/all` - Get all permissions
- `POST /api/admin/roles/permissions` - Create permission
- `DELETE /api/admin/roles/permissions/:id` - Delete permission

### Dashboard

- `GET /api/admin/dashboard` - Get dashboard statistics
- `GET /api/admin/dashboard/health` - Get system health status
- `GET /api/admin/dashboard/analytics` - Get detailed analytics

### Health Check

- `GET /health` - Service health check

## Authentication

The service uses JWT (JSON Web Tokens) for authentication. Include the token in the Authorization header:

```
Authorization: Bearer <your-jwt-token>
```

## Permissions System

The service implements a role-based permission system with the following permissions:

- `user_management` - Manage users
- `role_management` - Manage roles and permissions
- `dashboard_view` - View dashboard and analytics
- `system_settings` - Modify system settings
- `reports_view` - View reports
- `content_management` - Manage content

### Default Roles

- **Super Admin**: All permissions
- **Admin**: user_management, dashboard_view, reports_view
- **Moderator**: dashboard_view

## Error Handling

The service includes comprehensive error handling:

- Global error handler middleware
- Structured error responses
- Detailed logging
- Validation error handling
- Database error handling

## Security Features

- **Helmet**: Security headers
- **Rate Limiting**: API rate limiting
- **CORS**: Cross-origin resource sharing
- **Input Validation**: Joi validation
- **Password Hashing**: bcrypt with salt rounds
- **JWT**: Secure token-based authentication

## Logging

Winston-based logging with:

- Console output for development
- File output for production
- Structured JSON logging
- Error tracking
- Request logging

## Database Schemas

### MongoDB (Admin)

```javascript
{
  email: String (unique),
  password: String (hashed),
  firstName: String,
  lastName: String,
  role: String (enum),
  permissions: [String],
  isActive: Boolean,
  lastLogin: Date,
  profilePicture: String,
  phoneNumber: String
}
```

### PostgreSQL (User)

```sql
{
  id: UUID (primary key),
  email: String (unique),
  firstName: String,
  lastName: String,
  phoneNumber: String,
  dateOfBirth: Date,
  profilePicture: Text,
  isActive: Boolean,
  isVerified: Boolean,
  userType: Enum,
  registrationDate: Date,
  lastLoginDate: Date,
  address: Text,
  city: String,
  country: String
}
```

## Development

```bash
# Install dependencies
npm install

# Start development server with auto-reload
npm run dev

# Run in production mode
npm start
```

## Testing

Use the provided Postman collection or test endpoints manually:

```bash
# Health check
curl http://localhost:8070/health

# Login (example)
curl -X POST http://localhost:8070/api/admin/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@example.com","password":"password123"}'
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is licensed under the ISC License.
