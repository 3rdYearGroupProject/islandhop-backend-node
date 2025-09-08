# IslandHop API Gateway

A Node.js API Gateway built with Express.js that routes requests to various microservices in the IslandHop ecosystem.

## Features

- **Port 3000**: Main gateway listening port
- **HTTP Proxy Middleware**: Routes requests to appropriate microservices
- **Comprehensive Logging**: Uses Winston for detailed request/response logging
- **Global Error Handling**: Handles failed requests gracefully
- **CORS Support**: Configured for cross-origin requests
- **Health Checks**: Built-in health monitoring
- **Service Discovery**: Configurable service endpoints

## Services Routing

### Existing Services
- `/api/verification` → Verification Service (Port 8060)
- `/api/support-agent` → Support Agent Service (Port 8061)
- `/api/email` → Email Service (Port 8062)

### Additional Services
- `/api/users` → User Service (Port 8063)
- `/api/orders` → Order Service (Port 8064)
- `/api/trip-planning` → Trip Planning Service (Port 8065)
- `/api/auth` → Firebase Auth Service (Port 8066)
- `/api/emergency` → Emergency Service (Port 8067)
- `/api/payments` → PayHere Service (Port 8068)
- `/api/trip-initiation` → Trip Initiation Service (Port 8069)

## Quick Start

1. **Install Dependencies**
   ```bash
   cd api-gateway
   npm install
   ```

2. **Environment Setup**
   ```bash
   cp .env.example .env
   # Edit .env with your service URLs
   ```

3. **Start the Gateway**
   ```bash
   # Development
   npm run dev
   
   # Production
   npm start
   ```

4. **Access the Gateway**
   - Gateway: http://localhost:3000
   - Health Check: http://localhost:3000/health
   - API Documentation: http://localhost:3000/api

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | 3000 | Gateway listening port |
| `HOST` | 0.0.0.0 | Gateway host address |
| `VERIFICATION_SERVICE_URL` | http://localhost:8060 | Verification service endpoint |
| `SUPPORT_AGENT_SERVICE_URL` | http://localhost:8061 | Support agent service endpoint |
| `EMAIL_SERVICE_URL` | http://localhost:8062 | Email service endpoint |
| `USER_SERVICE_URL` | http://localhost:8063 | User service endpoint |
| `ORDER_SERVICE_URL` | http://localhost:8064 | Order service endpoint |
| `TRIP_PLANNING_SERVICE_URL` | http://localhost:8065 | Trip planning service endpoint |
| `FIREBASE_AUTH_SERVICE_URL` | http://localhost:8066 | Firebase auth service endpoint |
| `EMERGENCY_SERVICE_URL` | http://localhost:8067 | Emergency service endpoint |
| `PAYHERE_SERVICE_URL` | http://localhost:8068 | PayHere service endpoint |
| `TRIP_INITIATION_SERVICE_URL` | http://localhost:8069 | Trip initiation service endpoint |

## API Endpoints

### Gateway Management
- `GET /` - Gateway information
- `GET /health` - Health check
- `GET /api` - API documentation

### Service Proxying
All requests to `/api/{service}/*` are forwarded to the corresponding microservice.

## Logging

The gateway provides comprehensive logging:
- **Request Logging**: All incoming requests with Morgan
- **Proxy Logging**: Service forwarding details
- **Error Logging**: Failed requests and service errors
- **Winston Integration**: Structured logging with multiple transports

Log files are stored in the `logs/` directory:
- `combined.log` - All logs
- `error.log` - Error logs only

## Error Handling

- **Service Unavailable (503)**: When a microservice is down
- **Route Not Found (404)**: For undefined routes
- **Internal Server Error (500)**: For unexpected errors
- **Timeout Handling**: 30-second timeout for service requests
- **Retry Logic**: 3 retries for failed requests

## Development

### Adding New Services

1. Add service configuration in `index.js`:
   ```javascript
   newService: {
     target: process.env.NEW_SERVICE_URL || 'http://localhost:8070',
     changeOrigin: true,
     timeout: 30000,
     retries: 3
   }
   ```

2. Add route mapping:
   ```javascript
   app.use('/api/new-service', createProxy('newService', services.newService));
   ```

3. Update environment variables in `.env.example`

4. Update documentation in this README

### Testing Services

Use the health check endpoint to verify the gateway is running:
```bash
curl http://localhost:3000/health
```

Test service routing:
```bash
# Test verification service
curl http://localhost:3000/api/verification/health

# Test support agent service  
curl http://localhost:3000/api/support-agent/health
```

## Architecture

```
Client Request
      ↓
API Gateway (Port 3000)
      ↓
┌─────────────────────────────────────┐
│  Route Matching & Proxy Middleware │
└─────────────────────────────────────┘
      ↓
┌─────────────────────────────────────┐
│         Target Service              │
│  - Verification (8060)              │
│  - Support Agent (8061)             │
│  - Email (8062)                     │
│  - Users (8063)                     │
│  - Orders (8064)                    │
│  - Trip Planning (8065)             │
│  - Auth (8066)                      │
│  - Emergency (8067)                 │
│  - PayHere (8068)                   │
│  - Trip Initiation (8069)           │
└─────────────────────────────────────┘
```

## Production Considerations

- Set up reverse proxy (nginx) for SSL termination
- Configure load balancing for high availability
- Implement rate limiting and request throttling
- Set up monitoring and alerting
- Use environment-specific configuration
- Implement authentication/authorization middleware
- Add request/response caching where appropriate

## Contributing

1. Follow the existing code structure
2. Add proper error handling for new features
3. Update documentation for new services
4. Test all changes thoroughly
5. Follow the logging conventions
