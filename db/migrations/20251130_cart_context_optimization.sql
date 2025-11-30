-- ============================================
-- Cart Context Optimization Enhancements
-- Migration: 20251130_cart_context_optimization.sql
--
-- Adds support for:
-- 1. Cart item count buckets (small/medium/large carts)
-- 2. Product-in-cart tracking (what works when product X is in cart)
-- 3. Cart category combinations
-- 4. Cart value + item count combinations
-- ============================================

-- Add cart item count bucket to combination performance
ALTER TABLE ml_combination_performance
  ADD COLUMN IF NOT EXISTS cart_item_count_bucket TEXT;

-- Create index for item count queries
CREATE INDEX IF NOT EXISTS idx_ml_perf_item_count
  ON ml_combination_performance(shop_id, cart_item_count_bucket);

-- Create index for combined cart context (value + items)
CREATE INDEX IF NOT EXISTS idx_ml_perf_cart_context
  ON ml_combination_performance(shop_id, cart_value_bucket, cart_item_count_bucket, display_style);

-- Create table for tracking what works when specific products are in cart
CREATE TABLE IF NOT EXISTS ml_cart_product_context (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shop_id TEXT NOT NULL,
  trigger_product_id BIGINT NOT NULL,  -- Product that's in cart
  display_style TEXT NOT NULL,
  recommended_product_ids BIGINT[] NOT NULL,  -- Products to upsell
  impressions INTEGER DEFAULT 0,
  adds INTEGER DEFAULT 0,
  revenue NUMERIC(12,2) DEFAULT 0,
  acceptance_rate NUMERIC(5,4) DEFAULT 0,
  revenue_per_impression NUMERIC(12,4) DEFAULT 0,
  alpha NUMERIC(10,4) DEFAULT 1,  -- Thompson Sampling
  beta NUMERIC(10,4) DEFAULT 1,
  confidence_score NUMERIC(5,4) DEFAULT 0.5,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(shop_id, trigger_product_id, display_style)
);

-- Indexes for cart product context
CREATE INDEX IF NOT EXISTS idx_cart_product_ctx_shop
  ON ml_cart_product_context(shop_id);
CREATE INDEX IF NOT EXISTS idx_cart_product_ctx_trigger
  ON ml_cart_product_context(shop_id, trigger_product_id);
CREATE INDEX IF NOT EXISTS idx_cart_product_ctx_perf
  ON ml_cart_product_context(shop_id, revenue_per_impression DESC);

-- Create table for cart category performance
CREATE TABLE IF NOT EXISTS ml_cart_category_context (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shop_id TEXT NOT NULL,
  cart_categories TEXT[] NOT NULL,  -- Categories in cart (e.g., ['Shoes', 'Accessories'])
  display_style TEXT NOT NULL,
  impressions INTEGER DEFAULT 0,
  adds INTEGER DEFAULT 0,
  revenue NUMERIC(12,2) DEFAULT 0,
  acceptance_rate NUMERIC(5,4) DEFAULT 0,
  revenue_per_impression NUMERIC(12,4) DEFAULT 0,
  best_upsell_products BIGINT[],  -- Products that work best for this category combo
  alpha NUMERIC(10,4) DEFAULT 1,
  beta NUMERIC(10,4) DEFAULT 1,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(shop_id, cart_categories, display_style)
);

-- Indexes for category context
CREATE INDEX IF NOT EXISTS idx_cart_category_ctx_shop
  ON ml_cart_category_context(shop_id);
CREATE INDEX IF NOT EXISTS idx_cart_category_ctx_perf
  ON ml_cart_category_context(shop_id, revenue_per_impression DESC);

-- Create comprehensive cart context tracking
CREATE TABLE IF NOT EXISTS ml_cart_context_matrix (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shop_id TEXT NOT NULL,
  -- Cart dimensions
  cart_value_bucket TEXT NOT NULL,  -- '0-50', '50-100', '100-200', '200+'
  cart_item_count_bucket TEXT NOT NULL,  -- '1', '2-3', '4-5', '6+'
  -- Performance data
  display_style TEXT NOT NULL,
  impressions INTEGER DEFAULT 0,
  adds INTEGER DEFAULT 0,
  revenue NUMERIC(12,2) DEFAULT 0,
  acceptance_rate NUMERIC(5,4) DEFAULT 0,
  revenue_per_impression NUMERIC(12,4) DEFAULT 0,
  -- Thompson Sampling
  alpha NUMERIC(10,4) DEFAULT 1,
  beta NUMERIC(10,4) DEFAULT 1,
  -- Best performers
  best_products JSONB,  -- {product_id: score, ...}
  -- Meta
  sample_size INTEGER DEFAULT 0,
  confidence_score NUMERIC(5,4) DEFAULT 0.5,
  last_significant_change TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(shop_id, cart_value_bucket, cart_item_count_bucket, display_style)
);

-- Indexes for matrix
CREATE INDEX IF NOT EXISTS idx_cart_matrix_shop
  ON ml_cart_context_matrix(shop_id);
CREATE INDEX IF NOT EXISTS idx_cart_matrix_context
  ON ml_cart_context_matrix(shop_id, cart_value_bucket, cart_item_count_bucket);
CREATE INDEX IF NOT EXISTS idx_cart_matrix_perf
  ON ml_cart_context_matrix(shop_id, revenue_per_impression DESC);

-- Create view for cart context insights
CREATE OR REPLACE VIEW ml_cart_context_insights AS
SELECT
  shop_id,
  cart_value_bucket,
  cart_item_count_bucket,
  display_style,
  impressions,
  adds,
  revenue,
  acceptance_rate,
  revenue_per_impression,
  confidence_score,
  CASE
    WHEN impressions < 20 THEN 'learning'
    WHEN confidence_score < 0.6 THEN 'low_confidence'
    WHEN confidence_score < 0.8 THEN 'moderate_confidence'
    ELSE 'high_confidence'
  END as optimization_status,
  updated_at
FROM ml_cart_context_matrix
WHERE impressions > 0
ORDER BY shop_id, cart_value_bucket, cart_item_count_bucket, revenue_per_impression DESC;

-- Create view for best display style per cart context
CREATE OR REPLACE VIEW ml_best_style_per_cart AS
SELECT DISTINCT ON (shop_id, cart_value_bucket, cart_item_count_bucket)
  shop_id,
  cart_value_bucket,
  cart_item_count_bucket,
  display_style as best_display_style,
  revenue_per_impression,
  acceptance_rate,
  confidence_score,
  impressions as sample_size
FROM ml_cart_context_matrix
WHERE impressions >= 20  -- Minimum sample size
ORDER BY shop_id, cart_value_bucket, cart_item_count_bucket, revenue_per_impression DESC;

-- Create function to get cart item count bucket
CREATE OR REPLACE FUNCTION get_cart_item_bucket(item_count INTEGER)
RETURNS TEXT AS $$
BEGIN
  RETURN CASE
    WHEN item_count = 1 THEN '1'
    WHEN item_count BETWEEN 2 AND 3 THEN '2-3'
    WHEN item_count BETWEEN 4 AND 5 THEN '4-5'
    ELSE '6+'
  END;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Create function to get cart value bucket
CREATE OR REPLACE FUNCTION get_cart_value_bucket(cart_value NUMERIC)
RETURNS TEXT AS $$
BEGIN
  RETURN CASE
    WHEN cart_value < 50 THEN '0-50'
    WHEN cart_value < 100 THEN '50-100'
    WHEN cart_value < 200 THEN '100-200'
    ELSE '200+'
  END;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Function to update cart context matrix with outcome
CREATE OR REPLACE FUNCTION update_cart_context_outcome(
  p_shop_id TEXT,
  p_cart_value NUMERIC,
  p_item_count INTEGER,
  p_display_style TEXT,
  p_was_success BOOLEAN,
  p_revenue NUMERIC DEFAULT 0
)
RETURNS VOID AS $$
DECLARE
  v_value_bucket TEXT;
  v_item_bucket TEXT;
BEGIN
  v_value_bucket := get_cart_value_bucket(p_cart_value);
  v_item_bucket := get_cart_item_bucket(p_item_count);

  INSERT INTO ml_cart_context_matrix (
    shop_id, cart_value_bucket, cart_item_count_bucket, display_style,
    impressions, adds, revenue, alpha, beta
  )
  VALUES (
    p_shop_id, v_value_bucket, v_item_bucket, p_display_style,
    1,
    CASE WHEN p_was_success THEN 1 ELSE 0 END,
    COALESCE(p_revenue, 0),
    CASE WHEN p_was_success THEN 1 ELSE 0 END + 1,  -- alpha = successes + prior
    CASE WHEN p_was_success THEN 0 ELSE 1 END + 1   -- beta = failures + prior
  )
  ON CONFLICT (shop_id, cart_value_bucket, cart_item_count_bucket, display_style)
  DO UPDATE SET
    impressions = ml_cart_context_matrix.impressions + 1,
    adds = ml_cart_context_matrix.adds + CASE WHEN p_was_success THEN 1 ELSE 0 END,
    revenue = ml_cart_context_matrix.revenue + COALESCE(p_revenue, 0),
    alpha = ml_cart_context_matrix.alpha + CASE WHEN p_was_success THEN 1 ELSE 0 END,
    beta = ml_cart_context_matrix.beta + CASE WHEN p_was_success THEN 0 ELSE 1 END,
    acceptance_rate = (ml_cart_context_matrix.adds + CASE WHEN p_was_success THEN 1 ELSE 0 END)::NUMERIC /
                      (ml_cart_context_matrix.impressions + 1)::NUMERIC,
    revenue_per_impression = (ml_cart_context_matrix.revenue + COALESCE(p_revenue, 0)) /
                             (ml_cart_context_matrix.impressions + 1),
    sample_size = ml_cart_context_matrix.impressions + 1,
    confidence_score = LEAST(0.99, 1 - 1.0 / SQRT((ml_cart_context_matrix.alpha + ml_cart_context_matrix.beta +
                       CASE WHEN p_was_success THEN 1 ELSE 0 END + CASE WHEN p_was_success THEN 0 ELSE 1 END))),
    updated_at = NOW();
END;
$$ LANGUAGE plpgsql;

-- Function to get best style for cart context
CREATE OR REPLACE FUNCTION get_best_style_for_cart(
  p_shop_id TEXT,
  p_cart_value NUMERIC,
  p_item_count INTEGER
)
RETURNS TABLE(
  display_style TEXT,
  score NUMERIC,
  confidence_score NUMERIC,
  sample_size INTEGER
) AS $$
DECLARE
  v_value_bucket TEXT;
  v_item_bucket TEXT;
BEGIN
  v_value_bucket := get_cart_value_bucket(p_cart_value);
  v_item_bucket := get_cart_item_bucket(p_item_count);

  RETURN QUERY
  SELECT
    m.display_style,
    m.revenue_per_impression as score,
    m.confidence_score,
    m.impressions as sample_size
  FROM ml_cart_context_matrix m
  WHERE m.shop_id = p_shop_id
    AND m.cart_value_bucket = v_value_bucket
    AND m.cart_item_count_bucket = v_item_bucket
    AND m.impressions >= 10  -- Minimum samples
  ORDER BY m.revenue_per_impression DESC;
END;
$$ LANGUAGE plpgsql;

-- Comments
COMMENT ON TABLE ml_cart_product_context IS
  'Tracks what upsells work best when specific products are in the cart';

COMMENT ON TABLE ml_cart_category_context IS
  'Tracks what upsells work best for different category combinations in cart';

COMMENT ON TABLE ml_cart_context_matrix IS
  'Main matrix tracking performance by cart value × item count × display style';

COMMENT ON FUNCTION update_cart_context_outcome IS
  'Updates the cart context matrix with a new outcome (impression/add/purchase)';

COMMENT ON FUNCTION get_best_style_for_cart IS
  'Returns the best performing display styles for a given cart context';

-- Migration complete
SELECT 'Cart Context Optimization migration completed successfully!' as status;
