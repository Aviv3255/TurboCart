import { query, transaction } from './index';
import type { PoolClient } from 'pg';

// ============================================
// SHOP QUERIES
// ============================================

export interface Shop {
  id: string;
  shop_domain: string;
  access_token: string;
  plan: string;
  plan_status: string;
  billing_id: number | null;
  trial_ends_at: Date | null;
  settings: ShopSettings;
  installed_at: Date;
  uninstalled_at: Date | null;
  last_active_at: Date;
  created_at: Date;
  updated_at: Date;
}

export interface ShopSettings {
  display_style: 'carousel' | 'list' | 'banner' | 'cards' | 'frequently-bought' | 'inline';
  cart_type: 'drawer' | 'page' | 'both';
  max_upsells: number;
  position: 'top' | 'bottom';
  enable_ab_testing: boolean;
}

export async function getShopByDomain(domain: string): Promise<Shop | null> {
  const result = await query<Shop>(
    'SELECT * FROM shops WHERE shop_domain = $1 AND uninstalled_at IS NULL',
    [domain]
  );
  return result.rows[0] || null;
}

export async function createShop(
  domain: string,
  accessToken: string
): Promise<Shop> {
  const result = await query<Shop>(
    `INSERT INTO shops (shop_domain, access_token)
     VALUES ($1, $2)
     ON CONFLICT (shop_domain)
     DO UPDATE SET
       access_token = $2,
       uninstalled_at = NULL,
       last_active_at = NOW()
     RETURNING *`,
    [domain, accessToken]
  );
  return result.rows[0]!;
}

export async function updateShopSettings(
  shopId: string,
  settings: Partial<ShopSettings>
): Promise<void> {
  await query(
    `UPDATE shops
     SET settings = settings || $1::jsonb,
         updated_at = NOW()
     WHERE id = $2`,
    [JSON.stringify(settings), shopId]
  );
}

export async function markShopUninstalled(shopId: string): Promise<void> {
  await query(
    'UPDATE shops SET uninstalled_at = NOW() WHERE id = $1',
    [shopId]
  );
}

export async function updateShopBilling(
  shopId: string,
  plan: string,
  planStatus: 'trial' | 'active' | 'cancelled' | 'expired',
  billingId?: number,
  trialEndsAt?: Date
): Promise<void> {
  await query(
    `UPDATE shops
     SET plan = $1,
         plan_status = $2,
         billing_id = $3,
         trial_ends_at = $4,
         updated_at = NOW()
     WHERE id = $5`,
    [plan, planStatus, billingId || null, trialEndsAt || null, shopId]
  );
}

// ============================================
// UPSELL PRODUCT QUERIES
// ============================================

export interface UpsellProduct {
  id: string;
  shop_id: string;
  shopify_product_id: number;
  shopify_variant_id: number | null;
  title: string;
  handle: string;
  product_type: string | null;
  vendor: string | null;
  collection_ids: number[];
  price: number;
  compare_at_price: number | null;
  image_url: string | null;
  priority: number;
  is_active: boolean;
  metadata: Record<string, unknown>;
  created_at: Date;
  updated_at: Date;
}

export async function getActiveUpsells(shopId: string): Promise<UpsellProduct[]> {
  const result = await query<UpsellProduct>(
    `SELECT * FROM upsell_products
     WHERE shop_id = $1 AND is_active = true
     ORDER BY priority DESC, created_at ASC`,
    [shopId]
  );
  return result.rows;
}

export async function addUpsellProduct(
  shopId: string,
  productData: Partial<UpsellProduct>
): Promise<UpsellProduct> {
  const result = await query<UpsellProduct>(
    `INSERT INTO upsell_products (
      shop_id, shopify_product_id, shopify_variant_id, title, handle,
      product_type, vendor, collection_ids, price, compare_at_price, image_url
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
    ON CONFLICT (shop_id, shopify_product_id)
    DO UPDATE SET
      is_active = true,
      title = $4,
      price = $9,
      image_url = $11,
      updated_at = NOW()
    RETURNING *`,
    [
      shopId,
      productData.shopify_product_id,
      productData.shopify_variant_id,
      productData.title,
      productData.handle,
      productData.product_type,
      productData.vendor,
      productData.collection_ids || [],
      productData.price,
      productData.compare_at_price,
      productData.image_url,
    ]
  );
  return result.rows[0]!;
}

export async function removeUpsellProduct(
  shopId: string,
  productId: string
): Promise<void> {
  await query(
    'UPDATE upsell_products SET is_active = false WHERE shop_id = $1 AND id = $2',
    [shopId, productId]
  );
}

export async function deactivateAllUpsells(shopId: string): Promise<void> {
  await query(
    'UPDATE upsell_products SET is_active = false WHERE shop_id = $1',
    [shopId]
  );
}

// ============================================
// ANALYTICS QUERIES
// ============================================

export interface UpsellEvent {
  id: string;
  shop_id: string;
  upsell_product_id: string | null;
  event_type: 'impression' | 'click' | 'add' | 'purchase' | 'remove';
  session_id: string;
  customer_id: number | null;
  cart_token: string;
  order_id: number | null;
  cart_items: unknown;
  context: Record<string, unknown>;
  revenue: number | null;
  quantity: number;
  ab_test_id: string | null;
  ab_test_variant: string | null;
  created_at: Date;
}

export async function trackEvent(
  shopId: string,
  eventData: Partial<UpsellEvent>
): Promise<void> {
  await query(
    `INSERT INTO upsell_events (
      shop_id, upsell_product_id, event_type, session_id,
      customer_id, cart_token, order_id, cart_items, context,
      revenue, quantity, ab_test_id, ab_test_variant
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)`,
    [
      shopId,
      eventData.upsell_product_id,
      eventData.event_type,
      eventData.session_id,
      eventData.customer_id,
      eventData.cart_token,
      eventData.order_id,
      JSON.stringify(eventData.cart_items),
      JSON.stringify(eventData.context || {}),
      eventData.revenue,
      eventData.quantity || 1,
      eventData.ab_test_id,
      eventData.ab_test_variant,
    ]
  );
}

export interface AnalyticsSummary {
  total_impressions: number;
  total_clicks: number;
  total_adds: number;
  total_purchases: number;
  total_revenue: number;
  acceptance_rate: number;
  avg_order_value: number;
}

export async function getAnalyticsSummary(
  shopId: string,
  startDate: Date,
  endDate: Date
): Promise<AnalyticsSummary> {
  const result = await query<AnalyticsSummary>(
    `SELECT
       SUM(impressions) as total_impressions,
       SUM(clicks) as total_clicks,
       SUM(adds) as total_adds,
       SUM(purchases) as total_purchases,
       SUM(revenue) as total_revenue,
       CASE
         WHEN SUM(impressions) > 0
         THEN ROUND((SUM(adds)::decimal / SUM(impressions)::decimal * 100), 2)
         ELSE 0
       END as acceptance_rate,
       CASE
         WHEN SUM(purchases) > 0
         THEN ROUND(SUM(revenue) / SUM(purchases), 2)
         ELSE 0
       END as avg_order_value
     FROM analytics_daily
     WHERE shop_id = $1 AND date BETWEEN $2 AND $3`,
    [shopId, startDate, endDate]
  );
  return result.rows[0]!;
}

// ============================================
// A/B TESTING QUERIES
// ============================================

export interface ABTest {
  id: string;
  shop_id: string;
  name: string;
  hypothesis: string | null;
  variant_a_config: Record<string, unknown>;
  variant_b_config: Record<string, unknown>;
  context_rules: Record<string, unknown> | null;
  traffic_split: number;
  status: 'draft' | 'running' | 'paused' | 'completed' | 'archived';
  winner: 'A' | 'B' | 'tie' | null;
  confidence_level: number | null;
  results: {
    variant_a: TestResults;
    variant_b: TestResults;
  };
  started_at: Date | null;
  ended_at: Date | null;
  created_at: Date;
  updated_at: Date;
}

interface TestResults {
  impressions: number;
  clicks: number;
  conversions: number;
  revenue: number;
}

export async function getActiveABTests(shopId: string): Promise<ABTest[]> {
  const result = await query<ABTest>(
    `SELECT * FROM ab_tests
     WHERE shop_id = $1 AND status = 'running'
     ORDER BY created_at DESC`,
    [shopId]
  );
  return result.rows;
}

export async function createABTest(
  shopId: string,
  testData: Partial<ABTest>
): Promise<ABTest> {
  const result = await query<ABTest>(
    `INSERT INTO ab_tests (
      shop_id, name, hypothesis, variant_a_config, variant_b_config,
      context_rules, traffic_split, status
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
    RETURNING *`,
    [
      shopId,
      testData.name,
      testData.hypothesis,
      JSON.stringify(testData.variant_a_config),
      JSON.stringify(testData.variant_b_config),
      testData.context_rules ? JSON.stringify(testData.context_rules) : null,
      testData.traffic_split || 0.5,
      testData.status || 'draft',
    ]
  );
  return result.rows[0]!;
}

// ============================================
// PRODUCT AFFINITY QUERIES
// ============================================

export async function getProductAffinities(
  shopId: string,
  productId: number,
  limit: number = 10
): Promise<Array<{ product_id: number; score: number }>> {
  const result = await query<{ product_b_id: number; affinity_score: number }>(
    `SELECT product_b_id, affinity_score
     FROM product_affinities
     WHERE shop_id = $1 AND product_a_id = $2
     ORDER BY affinity_score DESC
     LIMIT $3`,
    [shopId, productId, limit]
  );

  return result.rows.map(row => ({
    product_id: row.product_b_id,
    score: Number(row.affinity_score),
  }));
}

export async function updateProductAffinity(
  shopId: string,
  productAId: number,
  productBId: number,
  score: number
): Promise<void> {
  await query(
    `INSERT INTO product_affinities (
      shop_id, product_a_id, product_b_id, affinity_score, co_occurrence_count
    ) VALUES ($1, $2, $3, $4, 1)
    ON CONFLICT (shop_id, product_a_id, product_b_id)
    DO UPDATE SET
      affinity_score = $4,
      co_occurrence_count = product_affinities.co_occurrence_count + 1,
      last_calculated_at = NOW()`,
    [shopId, productAId, productBId, score]
  );
}
