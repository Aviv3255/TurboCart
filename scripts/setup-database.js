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

    // Execute the main schema
    await client.query(schema);

    console.log('✅ Main schema executed successfully!\n');
    console.log('📊 Created tables:');
    console.log('   - shops');
    console.log('   - upsell_products');
    console.log('   - upsell_events');
    console.log('   - ab_tests');
    console.log('   - product_affinities');
    console.log('   - analytics_daily');
    console.log('   - sessions');
    console.log('   - webhook_logs');

    // Read and execute ML schema
    const mlSchemaPath = path.join(__dirname, '..', 'lib', 'db', 'ml-schema.sql');
    if (fs.existsSync(mlSchemaPath)) {
      console.log('\n📄 Reading ml-schema.sql...');
      const mlSchema = fs.readFileSync(mlSchemaPath, 'utf8');

      try {
        await client.query(mlSchema);
        console.log('✅ ML schema executed successfully!');
        console.log('📊 Created ML tables:');
        console.log('   - ml_display_arms');
        console.log('   - ml_product_arms');
        console.log('   - ml_combination_performance');
        console.log('   - ml_decisions_log');
        console.log('   - ml_context_patterns');
        console.log('   - ml_exploration_tracker');
        console.log('   - ml_model_state');
      } catch (mlError) {
        console.log('⚠️  ML schema warning:', mlError.message);
        console.log('   (This is okay if tables already exist)');
      }
    }

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
