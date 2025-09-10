# Firebase JWT Authentication Middleware

This middleware provides Firebase JWT token verification for the admin subservice to ensure only authorized admin users can access protected routes.

## Setup

1. **Firebase Admin SDK**: The service account key is configured in `config/serviceAccountKey.json`
2. **Middleware**: Located in `middlewares/auth.js`
3. **Protected Routes**: All admin routes now require valid JWT tokens

## How It Works

### Token Verification Process

1. Extract JWT token from `Authorization: Bearer <token>` header
2. Verify token with Firebase Admin SDK
3. Check if user has admin privileges
4. Attach user info to request object
5. Allow access to protected route

### Middleware Functions

#### `verifyAdminToken`

- Verifies JWT token and checks admin role
- Used for all admin-only routes
- Returns 403 if user is not admin

#### `verifyToken`

- Verifies JWT token without admin check
- Available for routes that need user info but don't require admin

## Usage in Routes

```javascript
const { verifyAdminToken } = require("../middlewares/auth");

// Apply to all routes in the router
router.use(verifyAdminToken);

// Or apply to specific routes
router.get("/admin-only", verifyAdminToken, controllerFunction);
```

## Frontend Integration

Send requests with Authorization header:

```javascript
const response = await fetch(
  `http://localhost:8070/api/admin/users?page=${page}&size=${size}`,
  {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  }
);
```

## Error Responses

### 401 Unauthorized

```json
{
  "success": false,
  "message": "Access denied. No token provided or invalid format."
}
```

### 403 Forbidden

```json
{
  "success": false,
  "message": "Access denied. Admin privileges required."
}
```

### Token Expired

```json
{
  "success": false,
  "message": "Token expired. Please login again."
}
```

## Protected Routes

All the following route groups now require admin authentication:

- **User Routes** (`/api/admin/users/*`)

  - GET `/` - Get all users
  - GET `/stats` - Get user statistics
  - GET `/total-count` - Get total user count
  - GET `/:id` - Get user by ID
  - PUT `/:id` - Update user
  - DELETE `/:id` - Delete user
  - PATCH `/:id/status` - Toggle user status

- **Analytics Routes** (`/api/admin/analytics/*`)

  - GET `/payments` - Get payment details
  - GET `/payments/stats` - Get payment statistics
  - GET `/payments/trip/:tripId` - Get payment by trip ID
  - GET `/payments/daily-summary` - Get daily payment summary
  - GET `/revenue/monthly` - Get monthly revenue
  - GET `/users/count` - Get all user counts
  - GET `/users/statistics` - Get user statistics

- **Role Routes** (`/api/admin/roles/*`)

  - GET `/` - Get all roles
  - GET `/:id` - Get role by ID
  - POST `/` - Create role
  - PUT `/:id` - Update role
  - DELETE `/:id` - Delete role
  - GET `/permissions/all` - Get all permissions
  - POST `/permissions` - Create permission
  - DELETE `/permissions/:id` - Delete permission

- **Dashboard Routes** (`/api/admin/dashboard/*`)

  - GET `/` - Get dashboard stats
  - GET `/health` - Get system health
  - GET `/analytics` - Get analytics

- **Admin Management Routes** (`/api/admin/auth/*`)
  - GET `/admins` - Get all admins (protected)
  - GET `/admins/:id` - Get admin by ID (protected)
  - PUT `/admins/:id` - Update admin (protected)
  - DELETE `/admins/:id` - Delete admin (protected)
  - POST `/register` - Register admin (public - configure as needed)

## Testing

Use the test file `test-auth.js` to verify authentication:

```bash
node test-auth.js
```

Then test with curl:

```bash
# Public endpoint
curl http://localhost:3001/test/public

# Protected endpoint (requires valid token)
curl -H "Authorization: Bearer YOUR_FIREBASE_JWT_TOKEN" http://localhost:3001/test/protected
```

## User Object

After successful authentication, the request object contains:

```javascript
req.user = {
  uid: "firebase-user-id",
  email: "admin@example.com",
  role: "admin",
  admin: true,
};
```

## Security Notes

1. **Service Account Key**: Keep `serviceAccountKey.json` secure and never commit to version control
2. **Token Expiration**: Handle token expiration gracefully in frontend
3. **Admin Claims**: Ensure Firebase users have proper admin claims set
4. **HTTPS**: Use HTTPS in production for secure token transmission
