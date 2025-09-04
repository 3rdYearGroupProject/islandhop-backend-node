const DatabaseMigrator = require('./DatabaseMigrator');

// This file can be extended to create an HTTP API for the migration service
// For now, it just provides the migration functionality

console.log('📦 Database Migration Service');
console.log('Run "npm run migrate" to start the migration process');

module.exports = {
  DatabaseMigrator
};
