import { Pool, PoolClient, QueryResult } from 'pg';

// Database connection pool
let pool: Pool | null = null;
let migrationsStarted = false;

/**
 * Run automatic migrations to ensure database schema is up to date
 * This runs in the background and doesn't block queries
 */
async function runAutoMigrations(pool: Pool): Promise<void> {
  if (migrationsStarted) return;
  migrationsStarted = true;

  try {
    console.log('[DB] Running auto-migrations...');

    // Create reward_tiers table if not exists
    console.log('[DB] Checking reward_tiers table...');
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
    console.log('[DB] reward_tiers table ready');

    // Create switch_addons table if not exists
    console.log('[DB] Checking switch_addons table...');
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
    console.log('[DB] switch_addons table ready');

    // Add onboarding_completed_at column if missing
    await pool.query(`
      ALTER TABLE shops
      ADD COLUMN IF NOT EXISTS onboarding_completed_at TIMESTAMP
    `).catch(() => {}); // Ignore if column exists

    console.log('[DB] Auto-migrations completed successfully');
  } catch (error) {
    console.error('[DB] Auto-migration error:', error);
    // Don't throw - app continues even if migration fails
  }
}

/**
 * Get or create database connection pool
 */
function getPool(): Pool {
  if (!pool) {
    console.log('[DB] Creating new connection pool...');
    pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      max: 20,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 10000,
    });

    pool.on('error', (err) => {
      console.error('[DB] Pool error:', err);
    });

    // Run migrations in background - don't block queries
    runAutoMigrations(pool).catch(err => {
      console.error('[DB] Migration background error:', err);
    });
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

    if (duration > 100) {
      console.warn(`[DB] Slow query (${duration}ms):`, text.substring(0, 80));
    }

    return result;
  } catch (error) {
    console.error('[DB] Query error:', error);
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
    console.error('[DB] Transaction error:', error);
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
    migrationsStarted = false;
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
