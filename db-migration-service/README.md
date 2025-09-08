# Database Migration Service

A Node.js microservice for migrating data between PostgreSQL databases. This service exports all rows from every table in a source database and imports them into a target database.

## Features

- ✅ Connects to two PostgreSQL databases (source and target)
- ✅ Exports all rows from every table in the source DB
- ✅ Inserts data into target DB with existing schema
- ✅ Uses PostgreSQL "pg" client library
- ✅ Skips empty tables automatically
- ✅ Handles duplicate key errors with `ON CONFLICT DO NOTHING`
- ✅ Comprehensive progress logging
- ✅ Batch processing for large datasets
- ✅ Graceful error handling

## Prerequisites

- Node.js (v14 or higher)
- npm or yarn
- Access to both source and target PostgreSQL databases
- Target database must have the same schema as source database

## Installation

1. Navigate to the service directory:

```bash
cd db-migration-service
```

2. Install dependencies:

```bash
npm install
```

3. Create environment configuration:

```bash
copy .env.example .env
```

4. Update the `.env` file with your actual database credentials:

```env
# Source Database (NeonDB)
SOURCE_DB_URL=postgresql://neondb_owner:npg_Ig3thklS7cZm@ep-empty-base-a194u9qt-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require

# Target Database (Supabase) - Replace YOUR-PASSWORD with actual password
TARGET_DB_URL=postgresql://postgres.hgpicovzphnrhsdhggqs:YOUR-PASSWORD@aws-1-ap-southeast-1.pooler.supabase.com:5432/postgres

# Migration Settings
BATCH_SIZE=1000
LOG_LEVEL=info
```

## Usage

### Run the Migration

```bash
npm run migrate
```

This will:

1. Connect to both databases
2. Discover all tables in the source database
3. Check row counts for each table
4. Skip empty tables
5. Migrate data in batches with progress logging
6. Handle conflicts gracefully
7. Provide a detailed summary report

### Alternative Commands

```bash
# Run with npm start (same as migrate)
npm start

# Development mode with auto-restart
npm run dev
```

## Configuration

The service can be configured via environment variables:

| Variable        | Description                             | Default  |
| --------------- | --------------------------------------- | -------- |
| `SOURCE_DB_URL` | Source PostgreSQL connection string     | Required |
| `TARGET_DB_URL` | Target PostgreSQL connection string     | Required |
| `BATCH_SIZE`    | Number of rows to process in each batch | 1000     |
| `LOG_LEVEL`     | Logging level (info, debug, error)      | info     |

## Output Example

```
🚀 Starting database migration...

🔌 Connecting to source database...
✅ Connected to source database (NeonDB)
🔌 Connecting to target database...
✅ Connected to target database (Supabase)

📋 Found 5 tables to migrate: users, trips, bookings, reviews, payments

📊 Migrating table: users
📈 Total rows to migrate: 1250
  📦 Processing batch 1/2 (1000 rows)
  📦 Processing batch 2/2 (250 rows)
✅ Successfully migrated 1250 rows from table: users

📊 Migrating table: trips
📈 Total rows to migrate: 89
  📦 Processing batch 1/1 (89 rows)
✅ Successfully migrated 89 rows from table: trips

⏭️  Skipping empty table: temp_data

==================================================
📊 MIGRATION SUMMARY
==================================================
⏱️  Total time: 12.45 seconds
📊 Total rows migrated: 2,543
📋 Tables processed: 5
✅ Successful: 4
⏭️  Skipped (empty): 1
❌ Errors: 0

🎉 Migration completed!

🔌 Database connections closed
```

## Error Handling

The service handles various types of errors:

- **Connection errors**: Proper error messages for database connectivity issues
- **Duplicate key errors**: Uses `ON CONFLICT DO NOTHING` to skip existing records
- **Empty tables**: Automatically skips tables with no data
- **Schema mismatches**: Reports errors for incompatible table structures

## Troubleshooting

### Common Issues

1. **Connection timeout**: Ensure both databases are accessible and credentials are correct
2. **SSL errors**: The service is configured to handle SSL connections for both NeonDB and Supabase
3. **Memory issues**: Adjust `BATCH_SIZE` for very large tables
4. **Schema differences**: Ensure target database has the same table structure as source

### Debug Mode

Set `LOG_LEVEL=debug` in your `.env` file for more detailed logging.

## Architecture

```
db-migration-service/
├── src/
│   ├── DatabaseMigrator.js    # Main migration logic
│   ├── migrate.js             # CLI entry point
│   └── index.js               # Service entry point
├── package.json               # Dependencies and scripts
├── .env.example              # Environment template
└── README.md                 # This file
```

## Security Notes

- Never commit the `.env` file with actual credentials
- Use environment variables or secure secret management in production
- Ensure both databases use SSL connections
- Consider using connection pooling for production deployments

## License

MIT License
