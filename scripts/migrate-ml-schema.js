/**
 * Database Migration Script for ML Optimization Engine
 * Run this to set up ML tables
 *
 * Usage: node scripts/migrate-ml-schema.js
 */

const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

async function runMigration() {
  // Get database URL from environment
  const databaseUrl = process.env.DATABASE_URL;

  if (!databaseUrl) {
    console.error('ERROR: DATABASE_URL environment variable not set');
    process.exit(1);
  }

  console.log('🚀 Starting ML schema migration...\n');

  const client = new Client({
    connectionString: databaseUrl,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
  });

  try {
    await client.connect();
    console.log('✅ Connected to database\n');

    // Read the ML schema SQL file
    const schemaPath = path.join(__dirname, '../lib/db/ml-schema.sql');
    const schemaSql = fs.readFileSync(schemaPath, 'utf8');

    console.log('📝 Executing ML schema SQL...\n');

    // Execute the schema
    await client.query(schemaSql);

    console.log('✅ ML schema created successfully!\n');

    // Initialize ML model state for existing shops
    console.log('🔧 Initializing ML model state for existing shops...\n');

    const result = await client.query('SELECT id, shop_domain FROM shops WHERE uninstalled_at IS NULL');

    for (const shop of result.rows) {
      // Check if ML model state already exists
      const existingState = await client.query(
        'SELECT id FROM ml_model_state WHERE shop_id = $1',
        [shop.id]
      );

      if (existingState.rows.length === 0) {
        await client.query(
          `INSERT INTO ml_model_state (
            shop_id,
            exploration_rate,
            min_samples_for_exploit,
            baseline_revenue_per_order,
            current_revenue_per_order,
            improvement_percentage
          ) VALUES ($1, 0.20, 100, 0, 0, 0)`,
          [shop.id]
        );

        console.log(`  ✅ Initialized ML state for shop: ${shop.shop_domain}`);
      } else {
        console.log(`  ℹ️  ML state already exists for shop: ${shop.shop_domain}`);
      }
    }

    console.log('\n🎉 Migration completed successfully!\n');
    console.log('Summary:');
    console.log('  - ML optimization tables created');
    console.log('  - Thompson Sampling arms initialized');
    console.log('  - Context tracking enabled');
    console.log('  - Learning engine ready');
    console.log('\n🚀 Your ML optimization engine is now active!\n');

  } catch (error) {
    console.error('\n❌ Migration failed:', error.message);
    console.error('\nDetails:', error);
    process.exit(1);
  } finally {
    await client.end();
  }
}

// Run migration
runMigration();
