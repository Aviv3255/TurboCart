-- ============================================
-- ML Optimization Engine Enhancements
-- Migration: 20250125_ml_enhancements.sql
--
-- Adds support for:
-- 1. Multi-factor context (time, customer, session, store)
-- 2. Pattern insights storage
-- 3. Store volume tracking
-- 4. Enhanced performance metrics
-- ============================================

-- Add new columns to ml_combination_performance for multi-factor context
ALTER TABLE ml_combination_performance
  ADD COLUMN IF NOT EXISTS time_of_day TEXT,
  ADD COLUMN IF NOT EXISTS is_weekend BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS customer_segment TEXT,
  ADD COLUMN IF NOT EXISTS device_type TEXT,
  ADD COLUMN IF NOT EXISTS is_holiday BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS hour INTEGER;

-- Create indexes for fast lookups on new context columns
CREATE INDEX IF NOT EXISTS idx_ml_perf_time_context
  ON ml_combination_performance(shop_id, time_of_day, is_weekend);

CREATE INDEX IF NOT EXISTS idx_ml_perf_customer_context
  ON ml_combination_performance(shop_id, customer_segment);

CREATE INDEX IF NOT EXISTS idx_ml_perf_device_context
  ON ml_combination_performance(shop_id, device_type);

CREATE INDEX IF NOT EXISTS idx_ml_perf_updated_at
  ON ml_combination_performance(shop_id, updated_at DESC);

-- Create pattern insights table for storing detected patterns
CREATE TABLE IF NOT EXISTS ml_pattern_insights (
  shop_id TEXT NOT NULL,
  pattern_type TEXT NOT NULL,
  pattern_data JSONB NOT NULL,
  detected_at TIMESTAMP DEFAULT NOW(),
  PRIMARY KEY (shop_id, pattern_type)
);

CREATE INDEX IF NOT EXISTS idx_ml_pattern_detected_at
  ON ml_pattern_insights(detected_at DESC);

-- Add store volume to shops table
ALTER TABLE shops
  ADD COLUMN IF NOT EXISTS last_optimization_run TIMESTAMP,
  ADD COLUMN IF NOT EXISTS store_volume_category TEXT DEFAULT 'medium';

CREATE INDEX IF NOT EXISTS idx_shops_optimization
  ON shops(is_active, last_optimization_run);

-- Add indexes to ml_display_arms for faster queries
CREATE INDEX IF NOT EXISTS idx_ml_display_shop
  ON ml_display_arms(shop_id);

-- Add indexes to ml_product_arms for faster queries
CREATE INDEX IF NOT EXISTS idx_ml_product_shop
  ON ml_product_arms(shop_id);

-- Add index to ml_decisions_log for faster analytics
CREATE INDEX IF NOT EXISTS idx_ml_decisions_created_at
  ON ml_decisions_log(shop_id, created_at DESC);

-- Add statistics columns to ml_model_state
ALTER TABLE ml_model_state
  ADD COLUMN IF NOT EXISTS last_rebalance TIMESTAMP,
  ADD COLUMN IF NOT EXISTS avg_confidence NUMERIC DEFAULT 0.5,
  ADD COLUMN IF NOT EXISTS total_revenue NUMERIC DEFAULT 0;

-- Create a view for easy performance monitoring
CREATE OR REPLACE VIEW ml_performance_summary AS
SELECT
  shop_id,
  display_style,
  COUNT(*) as total_records,
  SUM(revenue) as total_revenue,
  SUM(impressions) as total_impressions,
  SUM(adds) as total_adds,
  CASE
    WHEN SUM(impressions) > 0
    THEN ROUND((SUM(adds)::NUMERIC / SUM(impressions)::NUMERIC * 100)::NUMERIC, 2)
    ELSE 0
  END as conversion_rate,
  CASE
    WHEN SUM(impressions) > 0
    THEN ROUND((SUM(revenue)::NUMERIC / SUM(impressions)::NUMERIC)::NUMERIC, 2)
    ELSE 0
  END as revenue_per_impression,
  MAX(updated_at) as last_update,
  EXTRACT(DAY FROM NOW() - MAX(updated_at)) as days_since_update
FROM ml_combination_performance
GROUP BY shop_id, display_style
ORDER BY total_revenue DESC;

-- Create a view for multi-factor context analysis
CREATE OR REPLACE VIEW ml_context_performance AS
SELECT
  shop_id,
  time_of_day,
  is_weekend,
  customer_segment,
  device_type,
  COUNT(*) as sample_size,
  AVG(acceptance_rate) as avg_acceptance_rate,
  AVG(revenue_per_impression) as avg_revenue_per_impression,
  SUM(revenue) as total_revenue,
  MAX(updated_at) as last_update
FROM ml_combination_performance
WHERE updated_at >= NOW() - INTERVAL '30 days'
  AND time_of_day IS NOT NULL
GROUP BY shop_id, time_of_day, is_weekend, customer_segment, device_type
HAVING COUNT(*) >= 10
ORDER BY avg_revenue_per_impression DESC;

-- Grant permissions (adjust as needed)
-- GRANT SELECT ON ml_performance_summary TO app_user;
-- GRANT SELECT ON ml_context_performance TO app_user;

-- Add comment for documentation
COMMENT ON TABLE ml_pattern_insights IS
  'Stores detected performance patterns for time, customer, and device contexts';

COMMENT ON COLUMN ml_combination_performance.time_of_day IS
  'Time of day: morning, afternoon, evening, night';

COMMENT ON COLUMN ml_combination_performance.customer_segment IS
  'Customer segment: new, returning, vip, at_risk';

COMMENT ON COLUMN ml_combination_performance.device_type IS
  'Device type: mobile, tablet, desktop';

COMMENT ON VIEW ml_performance_summary IS
  'Aggregated ML performance metrics by shop and display style';

COMMENT ON VIEW ml_context_performance IS
  'Multi-factor context performance analysis (last 30 days, min 10 samples)';

-- Migration complete
SELECT 'ML Enhancement migration completed successfully!' as status;
