#!/usr/bin/env node

const DatabaseMigrator = require('./DatabaseMigrator');

async function main() {
  const migrator = new DatabaseMigrator();
  
  // Handle unhandled promise rejections
  process.on('unhandledRejection', (reason, promise) => {
    if (reason && reason.message && 
        (reason.message.includes('shutdown') || 
         reason.message.includes('db_termination') ||
         reason.message.includes('Connection terminated unexpectedly'))) {
      // Ignore shutdown-related errors
      console.log('ℹ️  Connection cleanup completed');
      return;
    }
    console.error('Unhandled promise rejection:', reason);
  });

  // Handle uncaught exceptions
  process.on('uncaughtException', (error) => {
    if (error.message && 
        (error.message.includes('shutdown') || 
         error.message.includes('db_termination') ||
         error.message.includes('Connection terminated unexpectedly'))) {
      // Ignore shutdown-related errors
      console.log('ℹ️  Connection cleanup completed');
      process.exit(0);
    }
    console.error('Uncaught exception:', error);
    process.exit(1);
  });
  
  try {
    await migrator.migrate();
    process.exit(0);
  } catch (error) {
    console.error('\n💥 Migration failed with error:', error.message);
    process.exit(1);
  }
}

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('\n⚠️  Received SIGINT. Shutting down gracefully...');
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\n⚠️  Received SIGTERM. Shutting down gracefully...');
  process.exit(0);
});

if (require.main === module) {
  main();
}
