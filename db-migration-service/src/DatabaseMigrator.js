const { Pool } = require('pg');
require('dotenv').config();

class DatabaseMigrator {
  constructor() {
    this.sourcePool = new Pool({
      connectionString: process.env.SOURCE_DB_URL,
      ssl: {
        rejectUnauthorized: false
      }
    });

    this.targetPool = new Pool({
      connectionString: process.env.TARGET_DB_URL,
      ssl: {
        rejectUnauthorized: false
      }
    });

    // Handle pool errors gracefully
    this.sourcePool.on('error', (err) => {
      if (err.message.includes('shutdown') || err.message.includes('db_termination')) {
        // Ignore shutdown errors
        return;
      }
      console.error('Source pool error:', err.message);
    });

    this.targetPool.on('error', (err) => {
      if (err.message.includes('shutdown') || err.message.includes('db_termination')) {
        // Ignore shutdown errors
        return;
      }
      console.error('Target pool error:', err.message);
    });

    this.batchSize = parseInt(process.env.BATCH_SIZE) || 1000;
  }

  async connect() {
    try {
      console.log('🔌 Connecting to source database...');
      await this.sourcePool.connect();
      console.log('✅ Connected to source database (NeonDB)');

      console.log('🔌 Connecting to target database...');
      await this.targetPool.connect();
      console.log('✅ Connected to target database (Supabase)');
    } catch (error) {
      console.error('❌ Connection failed:', error.message);
      throw error;
    }
  }

  async getAllTables() {
    const query = `
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_type = 'BASE TABLE'
      ORDER BY table_name;
    `;

    try {
      const result = await this.sourcePool.query(query);
      return result.rows.map(row => row.table_name);
    } catch (error) {
      console.error('❌ Error fetching tables:', error.message);
      throw error;
    }
  }

  async getTableColumns(tableName) {
    const query = `
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = $1 
      AND table_schema = 'public'
      ORDER BY ordinal_position;
    `;

    try {
      const result = await this.sourcePool.query(query, [tableName]);
      return result.rows.map(row => row.column_name);
    } catch (error) {
      console.error(`❌ Error fetching columns for table ${tableName}:`, error.message);
      throw error;
    }
  }

  async getCommonColumns(tableName) {
    const sourceQuery = `
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = $1 
      AND table_schema = 'public'
      ORDER BY ordinal_position;
    `;

    const targetQuery = `
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = $1 
      AND table_schema = 'public'
      ORDER BY ordinal_position;
    `;

    try {
      const [sourceResult, targetResult] = await Promise.all([
        this.sourcePool.query(sourceQuery, [tableName]),
        this.targetPool.query(targetQuery, [tableName])
      ]);

      const sourceColumns = sourceResult.rows.map(row => row.column_name);
      const targetColumns = targetResult.rows.map(row => row.column_name);

      // Find common columns
      const commonColumns = sourceColumns.filter(col => targetColumns.includes(col));
      
      if (commonColumns.length === 0) {
        throw new Error(`No common columns found between source and target for table ${tableName}`);
      }

      const skippedColumns = sourceColumns.filter(col => !targetColumns.includes(col));
      if (skippedColumns.length > 0) {
        console.log(`  ⚠️  Skipping columns not in target: ${skippedColumns.join(', ')}`);
      }

      return commonColumns;
    } catch (error) {
      console.error(`❌ Error comparing columns for table ${tableName}:`, error.message);
      throw error;
    }
  }

  async getRowCount(tableName) {
    const query = `SELECT COUNT(*) as count FROM "${tableName}";`;
    
    try {
      const result = await this.sourcePool.query(query);
      return parseInt(result.rows[0].count);
    } catch (error) {
      console.error(`❌ Error counting rows in table ${tableName}:`, error.message);
      return 0;
    }
  }

  async migrateTable(tableName) {
    console.log(`\n📊 Migrating table: ${tableName}`);
    
    try {
      // Get row count first
      const totalRows = await this.getRowCount(tableName);
      
      if (totalRows === 0) {
        console.log(`⏭️  Skipping empty table: ${tableName}`);
        return { tableName, rowsInserted: 0, skipped: true };
      }

      console.log(`📈 Total rows to migrate: ${totalRows}`);

      // Get common columns between source and target
      const columns = await this.getCommonColumns(tableName);
      const columnsList = columns.map(col => `"${col}"`).join(', ');
      
      // Select all data from source table
      const selectQuery = `SELECT ${columnsList} FROM "${tableName}";`;
      const sourceResult = await this.sourcePool.query(selectQuery);
      
      if (sourceResult.rows.length === 0) {
        console.log(`⏭️  No data found in table: ${tableName}`);
        return { tableName, rowsInserted: 0, skipped: true };
      }

      // Prepare insert query with ON CONFLICT DO NOTHING
      const placeholders = columns.map((_, index) => `$${index + 1}`).join(', ');
      const insertQuery = `
        INSERT INTO "${tableName}" (${columnsList}) 
        VALUES (${placeholders}) 
        ON CONFLICT DO NOTHING;
      `;

      let rowsInserted = 0;
      const totalBatches = Math.ceil(sourceResult.rows.length / this.batchSize);

      // Process data in batches
      for (let i = 0; i < sourceResult.rows.length; i += this.batchSize) {
        const batch = sourceResult.rows.slice(i, i + this.batchSize);
        const currentBatch = Math.floor(i / this.batchSize) + 1;
        
        console.log(`  📦 Processing batch ${currentBatch}/${totalBatches} (${batch.length} rows)`);

        // Insert batch
        for (const row of batch) {
          try {
            const values = columns.map(col => row[col]);
            const result = await this.targetPool.query(insertQuery, values);
            if (result.rowCount > 0) {
              rowsInserted++;
            }
          } catch (error) {
            if (error.code === '23505') {
              // Duplicate key error - skip silently due to ON CONFLICT DO NOTHING
              continue;
            } else {
              console.error(`❌ Error inserting row:`, error.message);
            }
          }
        }
      }

      console.log(`✅ Successfully migrated ${rowsInserted} rows from table: ${tableName}`);
      return { tableName, rowsInserted, skipped: false };

    } catch (error) {
      console.error(`❌ Error migrating table ${tableName}:`, error.message);
      return { tableName, rowsInserted: 0, error: error.message };
    }
  }

  async migrate() {
    const startTime = Date.now();
    console.log('🚀 Starting database migration...\n');

    try {
      await this.connect();

      const tables = await this.getAllTables();
      console.log(`\n📋 Found ${tables.length} tables to migrate:`, tables.join(', '));

      const results = [];
      let totalRowsMigrated = 0;

      for (const table of tables) {
        const result = await this.migrateTable(table);
        results.push(result);
        if (!result.skipped && !result.error) {
          totalRowsMigrated += result.rowsInserted;
        }
      }

      // Summary
      const endTime = Date.now();
      const duration = ((endTime - startTime) / 1000).toFixed(2);
      
      console.log('\n' + '='.repeat(50));
      console.log('📊 MIGRATION SUMMARY');
      console.log('='.repeat(50));
      console.log(`⏱️  Total time: ${duration} seconds`);
      console.log(`📊 Total rows migrated: ${totalRowsMigrated}`);
      console.log(`📋 Tables processed: ${results.length}`);
      
      const successful = results.filter(r => !r.error && !r.skipped).length;
      const skipped = results.filter(r => r.skipped).length;
      const errors = results.filter(r => r.error).length;
      
      console.log(`✅ Successful: ${successful}`);
      console.log(`⏭️  Skipped (empty): ${skipped}`);
      console.log(`❌ Errors: ${errors}`);

      if (errors > 0) {
        console.log('\n❌ Tables with errors:');
        results.filter(r => r.error).forEach(r => {
          console.log(`  - ${r.tableName}: ${r.error}`);
        });
      }

      console.log('\n🎉 Migration completed!');

    } catch (error) {
      console.error('💥 Migration failed:', error.message);
      throw error;
    } finally {
      await this.close();
    }
  }

  async close() {
    try {
      console.log('\n🔌 Closing database connections...');
      
      // Close source pool
      try {
        await this.sourcePool.end();
        console.log('✅ Source database connection closed');
      } catch (error) {
        // Ignore shutdown errors
        console.log('ℹ️  Source connection closed (with expected termination signal)');
      }

      // Close target pool
      try {
        await this.targetPool.end();
        console.log('✅ Target database connection closed');
      } catch (error) {
        // Ignore shutdown errors
        console.log('ℹ️  Target connection closed (with expected termination signal)');
      }
      
    } catch (error) {
      console.error('❌ Error closing connections:', error.message);
    }
  }
}

module.exports = DatabaseMigrator;
