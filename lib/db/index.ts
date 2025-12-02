import { Pool, PoolClient, QueryResult } from 'pg';

// Database connection pool
let pool: Pool | null = null;
let migrationsRun = false;

/**
 * Run automatic migrations to ensure database schema is up to date
 */
async function runAutoMigrations(pool: Pool): Promise<void> {
  if (migrationsRun) return;

  try {
    console.log('[DB] Running auto-migrations...');

    // Check if onboarding_completed_at column exists
    const columnCheck = await pool.query(`
      SELECT column_name
      FROM information_schema.columns
      WHERE table_name = 'shops' AND column_name = 'onboarding_completed_at'
    `);

    if (columnCheck.rows.length === 0) {
      console.log('[DB] Adding missing column: onboarding_completed_at');
      await pool.query(`
        ALTER TABLE shops
        ADD COLUMN IF NOT EXISTS onboarding_completed_at TIMESTAMP
      `);
      console.log('[DB] Column onboarding_completed_at added successfully');
    }

    // Create reward_tiers table if not exists
    const rewardTiersCheck = await pool.query(`
      SELECT table_name FROM information_schema.tables
      WHERE table_schema = 'public' AND table_name = 'reward_tiers'
    `);

    if (rewardTiersCheck.rows.length === 0) {
      console.log('[DB] Creating missing table: reward_tiers');
      await pool.query(`
        CREATE TABLE IF NOT EXISTS reward_tiers (
          id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
          shop_id UUID REFERENCES shops(id) ON DELETE CASCADE,
          threshold DECIMAL(10,2) NOT NULL,
          reward_type VARCHAR(50) NOT NULL,
          reward_value VARCHAR(100),
          label VARCHAR(255),
          icon VARCHAR(50) DEFAULT 'truck',
          position INTEGER DEFAULT 0,
          is_active BOOLEAN DEFAULT true,
          created_at TIMESTAMP DEFAULT NOW(),
          updated_at TIMESTAMP DEFAULT NOW()
        )
      `);
      await pool.query(`CREATE INDEX IF NOT EXISTS idx_reward_tiers_shop ON reward_tiers(shop_id) WHERE is_active = true`);
      console.log('[DB] Table reward_tiers created successfully');
    }

    // Create switch_addons table if not exists
    const switchAddonsCheck = await pool.query(`
      SELECT table_name FROM information_schema.tables
      WHERE table_schema = 'public' AND table_name = 'switch_addons'
    `);

    if (switchAddonsCheck.rows.length === 0) {
      console.log('[DB] Creating missing table: switch_addons');
      await pool.query(`
        CREATE TABLE IF NOT EXISTS switch_addons (
          id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
          shop_id UUID REFERENCES shops(id) ON DELETE CASCADE,
          shopify_product_id BIGINT,
          shopify_variant_id BIGINT,
          name VARCHAR(255) NOT NULL,
          description TEXT,
          price DECIMAL(10,2) NOT NULL,
          icon VARCHAR(50) DEFAULT 'shield',
          default_enabled BOOLEAN DEFAULT false,
          position INTEGER DEFAULT 0,
          is_active BOOLEAN DEFAULT true,
          created_at TIMESTAMP DEFAULT NOW(),
          updated_at TIMESTAMP DEFAULT NOW()
        )
      `);
      await pool.query(`CREATE INDEX IF NOT EXISTS idx_switch_addons_shop ON switch_addons(shop_id) WHERE is_active = true`);
      console.log('[DB] Table switch_addons created successfully');
    }

    migrationsRun = true;
    console.log('[DB] Auto-migrations completed');
  } catch (error) {
    console.error('[DB] Auto-migration error:', error);
    // Don't throw - allow app to continue even if migration fails
  }
}

/**
 * Get or create database connection pool
 */
export function getPool(): Pool {
  if (!pool) {
    pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      max: 20,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 10000, // Increased for Render cold starts
    });

    pool.on('error', (err) => {
      console.error('Unexpected database pool error:', err);
    });

    // Run migrations on first connection
    runAutoMigrations(pool);
  }

  return pool;
}

/**
 * Execute a query with automatic connection management
 */
export async function query<T extends Record<string, any> = any>(
  text: string,
  params?: unknown[]
): Promise<QueryResult<T>> {
  const pool = getPool();
  const start = Date.now();

  try {
    const result = await pool.query<T>(text, params);
    const duration = Date.now() - start;

    // Log slow queries (>100ms)
    if (duration > 100) {
      console.warn(`Slow query (${duration}ms):`, text.substring(0, 100));
    }

    return result;
  } catch (error) {
    console.error('Database query error:', error);
    throw error;
  }
}

/**
 * Execute multiple queries in a transaction
 */
export async function transaction<T>(
  callback: (client: PoolClient) => Promise<T>
): Promise<T> {
  const pool = getPool();
  const client = await pool.connect();

  try {
    await client.query('BEGIN');
    const result = await callback(client);
    await client.query('COMMIT');
    return result;
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Transaction error:', error);
    throw error;
  } finally {
    client.release();
  }
}

/**
 * Close database connections (for graceful shutdown)
 */
export async function closePool(): Promise<void> {
  if (pool) {
    await pool.end();
    pool = null;
  }
}

// Graceful shutdown
if (typeof process !== 'undefined') {
  process.on('SIGTERM', async () => {
    await closePool();
  });

  process.on('SIGINT', async () => {
    await closePool();
  });
}
