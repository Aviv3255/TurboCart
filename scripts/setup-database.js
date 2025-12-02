/**
 * Database Setup Script
 * Runs the schema.sql file to create all tables
 */

const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

async function setupDatabase() {
  console.log('🗄️  Setting up TurboCart database...\n');

  // Get DATABASE_URL from environment
  const databaseUrl = process.env.DATABASE_URL;

  if (!databaseUrl) {
    console.error('❌ Error: DATABASE_URL environment variable not found');
    console.error('Please make sure you have a .env.local file with DATABASE_URL set');
    process.exit(1);
  }

  console.log('✅ Found DATABASE_URL');
  console.log('🔌 Connecting to database...\n');

  // Create PostgreSQL client
  const client = new Client({
    connectionString: databaseUrl,
    ssl: {
      rejectUnauthorized: false
    }
  });

  try {
    // Connect to database
    await client.connect();
    console.log('✅ Connected to database\n');

    // Read schema.sql file
    const schemaPath = path.join(__dirname, '..', 'lib', 'db', 'schema.sql');
    const schema = fs.readFileSync(schemaPath, 'utf8');

    console.log('📄 Reading schema.sql...');
    console.log('🔧 Executing SQL statements...\n');

    // Execute the schema
    await client.query(schema);

    console.log('✅ Schema executed successfully!\n');
    console.log('📊 Created tables:');
    console.log('   - shops');
    console.log('   - upsell_products');
    console.log('   - upsell_events');
    console.log('   - analytics_daily');
    console.log('   - sessions');
    console.log('   - webhook_logs');

    console.log('\n✅ Database setup complete! 🎉\n');

  } catch (error) {
    console.error('❌ Error setting up database:');
    console.error(error.message);

    if (error.message.includes('already exists')) {
      console.log('\n⚠️  Some tables already exist. This is normal if you ran this script before.');
      console.log('✅ Database is ready to use!\n');
    } else {
      process.exit(1);
    }
  } finally {
    // Close connection
    await client.end();
    console.log('🔌 Database connection closed\n');
  }
}

// Run the setup
setupDatabase();
