# Data Migration Service

A comprehensive microservice for copying, syncing, and managing data between MongoDB collections in the IslandHop ecosystem.

## Features

- **Collection Management**: List, count, and sample data from collections
- **Data Copy**: Copy data between collections with filtering and transformation
- **Data Sync**: Bidirectional synchronization between collections
- **Backup & Restore**: Create backups and restore collections
- **Migration Tracking**: Monitor migration progress and status
- **Scheduled Operations**: Cron-based automated migrations
- **Health Monitoring**: Comprehensive health checks and statistics
- **Data Validation**: Validate collection structure and data integrity

## Installation

```bash
cd data-migration-service
npm install
```

## Configuration

1. Update the MongoDB connection string in `config/database.js`
2. Set environment variables:
   ```bash
   export MONGODB_URI="your-mongodb-connection-string"
   export NODE_ENV="development"
   export PORT=5003
   ```

## Usage

### Start the Service

```bash
npm start
```

The service will run on port 5003 by default.

### Development Mode

```bash
npm run dev
```

## API Endpoints

### Health & Status
- `GET /health` - Service health check
- `GET /health/ready` - Readiness probe
- `GET /health/live` - Liveness probe
- `GET /health/stats` - Service statistics

### Collection Management
- `GET /api/migrations/collections` - List all collections
- `GET /api/migrations/collections/:name/count` - Get document count
- `GET /api/migrations/collections/:name/sample` - Get sample data
- `POST /api/migrations/collections/:name/validate` - Validate collection

### Data Operations
- `POST /api/migrations/copy` - Copy data between collections
- `POST /api/migrations/sync` - Sync data between collections
- `POST /api/migrations/backup` - Backup collection
- `POST /api/migrations/restore` - Restore collection

### Migration Tracking
- `GET /api/migrations` - List all migrations
- `GET /api/migrations/:id` - Get migration status
- `DELETE /api/migrations/:id` - Delete migration record

### Scheduled Operations
- `GET /api/migrations/schedules` - List schedules
- `POST /api/migrations/schedules` - Create schedule
- `DELETE /api/migrations/schedules/:id` - Delete schedule

## API Examples

### Copy Data Between Collections

```json
POST /api/migrations/copy
{
  "sourceCollection": "Driver_info",
  "targetCollection": "Driver_backup",
  "filter": { "status": "active" },
  "batchSize": 1000,
  "skipExisting": true
}
```

### Sync Collections

```json
POST /api/migrations/sync
{
  "collection1": "Driver_info",
  "collection2": "Driver_replica",
  "syncDirection": "bidirectional",
  "conflictResolution": "latest_timestamp"
}
```

### Create Backup

```json
POST /api/migrations/backup
{
  "sourceCollection": "Guide_info",
  "backupName": "guide_daily_backup",
  "compress": true
}
```

### Schedule Migration

```json
POST /api/migrations/schedules
{
  "name": "Daily Driver Backup",
  "cronExpression": "0 2 * * *",
  "migrationConfig": {
    "type": "backup",
    "sourceCollection": "Driver_info",
    "backupName": "driver_daily"
  },
  "enabled": true
}
```

## Migration Types

### Copy Operation
- One-way data copying from source to target
- Supports filtering and transformation
- Batch processing for large datasets
- Skip existing documents option

### Sync Operation
- Bidirectional data synchronization
- Conflict resolution strategies
- Change tracking and delta updates
- Scheduled sync support

### Backup Operation
- Full collection backup
- Compression support
- Timestamped backups
- Metadata preservation

### Restore Operation
- Restore from backup
- Replace or merge options
- Data validation during restore
- Rollback capability

## Monitoring

### Migration Status
- **running**: Migration in progress
- **completed**: Successfully finished
- **failed**: Error occurred
- **paused**: Temporarily stopped

### Progress Tracking
- Total documents count
- Processed documents count
- Progress percentage
- Error logs and details

### Health Metrics
- Service uptime
- Memory usage
- Database connection status
- Collection statistics

## Error Handling

The service provides comprehensive error handling:
- Document-level error tracking
- Batch operation resilience
- Connection failure recovery
- Detailed error reporting

## Security

- Input validation and sanitization
- Rate limiting for API endpoints
- Secure database connections
- Audit logging for operations

## Dependencies

- **express**: Web framework
- **mongoose**: MongoDB ODM
- **uuid**: Unique ID generation
- **node-cron**: Scheduled operations
- **cors**: Cross-origin requests
- **helmet**: Security headers
- **morgan**: HTTP logging

## Development

### Project Structure
```
data-migration-service/
├── server.js              # Main server file
├── package.json           # Dependencies
├── config/
│   └── database.js        # Database configuration
├── controllers/
│   ├── migrationController.js  # Migration logic
│   └── healthController.js     # Health checks
└── routes/
    ├── migrations.js      # Migration routes
    └── health.js          # Health routes
```

### Testing

```bash
# Test basic connectivity
curl http://localhost:5003/health

# List collections
curl http://localhost:5003/api/migrations/collections

# Check migration status
curl http://localhost:5003/api/migrations
```

## Production Deployment

1. Set production environment variables
2. Configure MongoDB connection with replica set
3. Set up monitoring and alerting
4. Configure backup retention policies
5. Implement proper logging and audit trails

## Contributing

1. Follow the existing code style
2. Add comprehensive error handling
3. Include proper logging
4. Write unit tests for new features
5. Update documentation

## License

Part of the IslandHop Backend Node.js microservices ecosystem.