/**
 * MongoDB Connection Diagnostic Tool
 * Tests connectivity to MongoDB Atlas cluster
 */

const mongoose = require('mongoose');
const dns = require('dns').promises;

console.log('🔍 MongoDB Connection Diagnostics\n');

// Test 1: DNS Resolution
async function testDNS() {
  console.log('Test 1: DNS Resolution');
  console.log('─────────────────────────────────────');
  try {
    const hostname = 'cluster0.9ccambx.mongodb.net';
    console.log(`Resolving: ${hostname}`);
    const addresses = await dns.resolve(hostname);
    console.log('✅ DNS Resolution Success');
    console.log(`Resolved addresses:`, addresses);
    return true;
  } catch (error) {
    console.log('❌ DNS Resolution Failed');
    console.log(`Error: ${error.message}`);
    return false;
  }
}

// Test 2: MongoDB SRV Record
async function testSRV() {
  console.log('\nTest 2: MongoDB SRV Record');
  console.log('─────────────────────────────────────');
  try {
    const srvRecord = '_mongodb._tcp.cluster0.9ccambx.mongodb.net';
    console.log(`Resolving SRV: ${srvRecord}`);
    const records = await dns.resolveSrv(srvRecord);
    console.log('✅ SRV Resolution Success');
    console.log(`Found ${records.length} MongoDB servers`);
    records.forEach((record, i) => {
      console.log(`  Server ${i + 1}: ${record.name}:${record.port} (priority: ${record.priority})`);
    });
    return true;
  } catch (error) {
    console.log('❌ SRV Resolution Failed');
    console.log(`Error: ${error.message}`);
    return false;
  }
}

// Test 3: Simple MongoDB Connection
async function testConnection() {
  console.log('\nTest 3: MongoDB Connection');
  console.log('─────────────────────────────────────');
  try {
    console.log('Connecting to MongoDB Atlas...');
    const uri = 'mongodb+srv://2022cs056:dH4aTFn3IOerWlVZ@cluster0.9ccambx.mongodb.net/islandhop_trips?retryWrites=true&w=majority';
    
    const conn = await mongoose.createConnection(uri, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 30000,
      connectTimeoutMS: 30000,
      family: 4 // Force IPv4
    }).asPromise();

    console.log('✅ MongoDB Connection Success');
    console.log(`Connected to: ${conn.host}`);
    console.log(`Database: ${conn.name}`);
    console.log(`Ready state: ${conn.readyState} (1 = connected)`);
    
    await conn.close();
    console.log('Connection closed successfully');
    return true;
  } catch (error) {
    console.log('❌ MongoDB Connection Failed');
    console.log(`Error: ${error.message}`);
    console.log(`Error code: ${error.code}`);
    return false;
  }
}

// Test 4: Network Configuration
function testNetworkConfig() {
  console.log('\nTest 4: Network Configuration');
  console.log('─────────────────────────────────────');
  console.log(`Node.js Version: ${process.version}`);
  console.log(`Platform: ${process.platform}`);
  console.log(`Architecture: ${process.arch}`);
  
  // Check DNS servers (Windows)
  if (process.platform === 'win32') {
    console.log('\n💡 Windows DNS Configuration:');
    console.log('Run this command in PowerShell to check DNS:');
    console.log('  Get-DnsClientServerAddress -AddressFamily IPv4');
  }
}

// Run all tests
async function runDiagnostics() {
  console.log('Starting diagnostics...\n');
  
  const dnsOk = await testDNS();
  const srvOk = await testSRV();
  const connOk = await testConnection();
  testNetworkConfig();
  
  console.log('\n═════════════════════════════════════');
  console.log('📊 Diagnostic Summary');
  console.log('═════════════════════════════════════');
  console.log(`DNS Resolution:    ${dnsOk ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`SRV Resolution:    ${srvOk ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`MongoDB Connection: ${connOk ? '✅ PASS' : '❌ FAIL'}`);
  
  if (!dnsOk || !srvOk) {
    console.log('\n🔧 Troubleshooting Steps:');
    console.log('1. Check your internet connection');
    console.log('2. Verify DNS server settings');
    console.log('3. Check if firewall is blocking MongoDB ports (27017)');
    console.log('4. Try using a different DNS server (e.g., Google DNS: 8.8.8.8)');
    console.log('5. Check if VPN/Proxy is interfering with connections');
    console.log('6. Verify MongoDB Atlas IP whitelist settings');
  } else if (!connOk) {
    console.log('\n🔧 Troubleshooting Steps:');
    console.log('1. Verify MongoDB Atlas credentials');
    console.log('2. Check MongoDB Atlas cluster status');
    console.log('3. Verify IP whitelist in MongoDB Atlas (try 0.0.0.0/0 for testing)');
    console.log('4. Check MongoDB Atlas network access settings');
  } else {
    console.log('\n✅ All tests passed! Connection should work fine.');
  }
  
  process.exit(connOk ? 0 : 1);
}

// Run diagnostics
runDiagnostics().catch((error) => {
  console.error('\n💥 Diagnostic script error:', error);
  process.exit(1);
});
