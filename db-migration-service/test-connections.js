const { Pool } = require('pg');
require('dotenv').config();

async function testConnections() {
  console.log('🧪 Testing database connections...\n');

  // Test source database
  const sourcePool = new Pool({
    connectionString: process.env.SOURCE_DB_URL,
    ssl: { rejectUnauthorized: false }
  });

  try {
    console.log('🔌 Testing source database connection...');
    const sourceClient = await sourcePool.connect();
    const sourceResult = await sourceClient.query('SELECT NOW() as current_time, version()');
    console.log('✅ Source database connected successfully');
    console.log(`   Time: ${sourceResult.rows[0].current_time}`);
    console.log(`   Version: ${sourceResult.rows[0].version.split(' ')[0]}`);
    sourceClient.release();
  } catch (error) {
    console.error('❌ Source database connection failed:', error.message);
  } finally {
    try {
      await sourcePool.end();
    } catch (error) {
      // Ignore shutdown errors
    }
  }

  // Test target database
  const targetPool = new Pool({
    connectionString: process.env.TARGET_DB_URL,
    ssl: { rejectUnauthorized: false }
  });

  try {
    console.log('\n🔌 Testing target database connection...');
    const targetClient = await targetPool.connect();
    const targetResult = await targetClient.query('SELECT NOW() as current_time, version()');
    console.log('✅ Target database connected successfully');
    console.log(`   Time: ${targetResult.rows[0].current_time}`);
    console.log(`   Version: ${targetResult.rows[0].version.split(' ')[0]}`);
    targetClient.release();
  } catch (error) {
    console.error('❌ Target database connection failed:', error.message);
  } finally {
    try {
      await targetPool.end();
    } catch (error) {
      // Ignore shutdown errors
    }
  }

  console.log('\n🏁 Connection tests completed');
}

if (require.main === module) {
  testConnections().catch(console.error);
}
