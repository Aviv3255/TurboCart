-- TurboCart Database Schema
-- PostgreSQL 14+

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- SHOPS TABLE
-- Stores connected Shopify stores
-- ============================================
CREATE TABLE shops (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    shop_domain VARCHAR(255) UNIQUE NOT NULL,
    access_token TEXT NOT NULL,
    plan VARCHAR(50) DEFAULT 'trial',
    plan_status VARCHAR(50) DEFAULT 'active',
    billing_id BIGINT,
    trial_ends_at TIMESTAMP,
    settings JSONB DEFAULT '{
        "display_style": "cards",
        "enabled_display_styles": ["cards"],
        "cart_type": "drawer",
        "max_upsells": 3,
        "position": "top",
        "enable_ab_testing": true
    }'::jsonb,
    installed_at TIMESTAMP DEFAULT NOW(),
    uninstalled_at TIMESTAMP,
    last_active_at TIMESTAMP DEFAULT NOW(),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_shops_domain ON shops(shop_domain);
CREATE INDEX idx_shops_plan ON shops(plan);
CREATE INDEX idx_shops_active ON shops(uninstalled_at) WHERE uninstalled_at IS NULL;

-- ============================================
-- UPSELL PRODUCTS TABLE
-- Products selected by merchants for upselling
-- ============================================
CREATE TABLE upsell_products (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    shop_id UUID REFERENCES shops(id) ON DELETE CASCADE,
    shopify_product_id BIGINT NOT NULL,
    shopify_variant_id BIGINT,
    title VARCHAR(500),
    handle VARCHAR(255),
    product_type VARCHAR(255),
    vendor VARCHAR(255),
    collection_ids BIGINT[],
    price DECIMAL(10,2),
    compare_at_price DECIMAL(10,2),
    image_url TEXT,
    priority INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(shop_id, shopify_product_id)
);

CREATE INDEX idx_upsell_products_shop ON upsell_products(shop_id) WHERE is_active = true;
CREATE INDEX idx_upsell_products_shopify_id ON upsell_products(shopify_product_id);
CREATE INDEX idx_upsell_products_collections ON upsell_products USING GIN (collection_ids);
CREATE INDEX idx_upsell_products_type ON upsell_products(product_type);

-- ============================================
-- UPSELL EVENTS TABLE
-- Tracks all upsell interactions for analytics
-- ============================================
CREATE TABLE upsell_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    shop_id UUID REFERENCES shops(id) ON DELETE CASCADE,
    upsell_product_id UUID REFERENCES upsell_products(id) ON DELETE SET NULL,
    event_type VARCHAR(50) NOT NULL, -- 'impression', 'click', 'add', 'purchase', 'remove'
    session_id VARCHAR(255),
    customer_id BIGINT,
    cart_token VARCHAR(255),
    order_id BIGINT,
    cart_items JSONB, -- Snapshot of cart when event occurred
    context JSONB DEFAULT '{}'::jsonb, -- Additional context (device, location, etc.)
    revenue DECIMAL(10,2), -- For purchase events
    quantity INTEGER DEFAULT 1,
    ab_test_id UUID,
    ab_test_variant VARCHAR(10), -- 'A', 'B', 'control', 'test'
    created_at TIMESTAMP DEFAULT NOW()
);

-- Partitioning by month for performance
CREATE INDEX idx_events_shop_created ON upsell_events(shop_id, created_at DESC);
CREATE INDEX idx_events_product ON upsell_events(upsell_product_id, created_at DESC);
CREATE INDEX idx_events_type ON upsell_events(event_type);
CREATE INDEX idx_events_session ON upsell_events(session_id);
CREATE INDEX idx_events_ab_test ON upsell_events(ab_test_id) WHERE ab_test_id IS NOT NULL;
CREATE INDEX idx_events_revenue ON upsell_events(revenue) WHERE revenue IS NOT NULL;

-- ============================================
-- A/B TESTS TABLE
-- Manages A/B testing experiments
-- ============================================
CREATE TABLE ab_tests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    shop_id UUID REFERENCES shops(id) ON DELETE CASCADE,
    name VARCHAR(255),
    hypothesis TEXT,
    variant_a_config JSONB NOT NULL, -- Product IDs, display config, etc.
    variant_b_config JSONB NOT NULL,
    context_rules JSONB, -- When to run this test (cart value, product types, etc.)
    traffic_split DECIMAL(3,2) DEFAULT 0.50, -- 0.50 = 50/50 split
    status VARCHAR(20) DEFAULT 'running', -- 'draft', 'running', 'paused', 'completed', 'archived'
    winner VARCHAR(10), -- 'A', 'B', or 'tie'
    confidence_level DECIMAL(5,2), -- 0-100
    results JSONB DEFAULT '{
        "variant_a": {"impressions": 0, "clicks": 0, "conversions": 0, "revenue": 0},
        "variant_b": {"impressions": 0, "clicks": 0, "conversions": 0, "revenue": 0}
    }'::jsonb,
    started_at TIMESTAMP,
    ended_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_ab_tests_shop ON ab_tests(shop_id);
CREATE INDEX idx_ab_tests_status ON ab_tests(status);
CREATE INDEX idx_ab_tests_running ON ab_tests(shop_id, status) WHERE status = 'running';

-- ============================================
-- PRODUCT AFFINITIES TABLE
-- ML-learned relationships between products
-- ============================================
CREATE TABLE product_affinities (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    shop_id UUID REFERENCES shops(id) ON DELETE CASCADE,
    product_a_id BIGINT NOT NULL,
    product_b_id BIGINT NOT NULL,
    affinity_score DECIMAL(5,4), -- 0.0000 to 1.0000
    co_occurrence_count INTEGER DEFAULT 0,
    conversion_rate DECIMAL(5,4),
    last_calculated_at TIMESTAMP DEFAULT NOW(),
    created_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(shop_id, product_a_id, product_b_id)
);

CREATE INDEX idx_affinities_shop_product ON product_affinities(shop_id, product_a_id);
CREATE INDEX idx_affinities_score ON product_affinities(affinity_score DESC);

-- ============================================
-- ANALYTICS AGGREGATES TABLE
-- Pre-aggregated analytics for fast dashboard loading
-- ============================================
CREATE TABLE analytics_daily (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    shop_id UUID REFERENCES shops(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    upsell_product_id UUID REFERENCES upsell_products(id) ON DELETE CASCADE,
    impressions INTEGER DEFAULT 0,
    clicks INTEGER DEFAULT 0,
    adds INTEGER DEFAULT 0,
    purchases INTEGER DEFAULT 0,
    revenue DECIMAL(10,2) DEFAULT 0,
    conversion_rate DECIMAL(5,4),
    avg_order_value DECIMAL(10,2),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(shop_id, date, upsell_product_id)
);

CREATE INDEX idx_analytics_shop_date ON analytics_daily(shop_id, date DESC);
CREATE INDEX idx_analytics_product ON analytics_daily(upsell_product_id, date DESC);

-- ============================================
-- SESSIONS TABLE
-- Tracks app sessions for authentication
-- ============================================
CREATE TABLE sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    shop_id UUID REFERENCES shops(id) ON DELETE CASCADE,
    shop_domain VARCHAR(255) NOT NULL,
    access_token TEXT NOT NULL,
    scope TEXT,
    expires_at TIMESTAMP,
    is_online BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_sessions_shop ON sessions(shop_domain);
CREATE INDEX idx_sessions_expires ON sessions(expires_at);

-- ============================================
-- WEBHOOKS LOG TABLE
-- Logs all webhook events for debugging
-- ============================================
CREATE TABLE webhook_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    shop_id UUID REFERENCES shops(id) ON DELETE CASCADE,
    topic VARCHAR(255) NOT NULL,
    payload JSONB,
    hmac_verified BOOLEAN DEFAULT false,
    processing_status VARCHAR(50) DEFAULT 'pending', -- 'pending', 'processed', 'failed', 'retrying'
    error_message TEXT,
    retry_count INTEGER DEFAULT 0,
    processed_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_webhooks_shop ON webhook_logs(shop_id, created_at DESC);
CREATE INDEX idx_webhooks_topic ON webhook_logs(topic);
CREATE INDEX idx_webhooks_status ON webhook_logs(processing_status);

-- ============================================
-- FUNCTIONS & TRIGGERS
-- ============================================

-- Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply to all tables with updated_at
CREATE TRIGGER update_shops_updated_at BEFORE UPDATE ON shops
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_upsell_products_updated_at BEFORE UPDATE ON upsell_products
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_ab_tests_updated_at BEFORE UPDATE ON ab_tests
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_analytics_daily_updated_at BEFORE UPDATE ON analytics_daily
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_sessions_updated_at BEFORE UPDATE ON sessions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- VIEWS FOR COMMON QUERIES
-- ============================================

-- Daily analytics overview per shop
CREATE VIEW v_shop_analytics_overview AS
SELECT
    shop_id,
    date,
    SUM(impressions) as total_impressions,
    SUM(clicks) as total_clicks,
    SUM(adds) as total_adds,
    SUM(purchases) as total_purchases,
    SUM(revenue) as total_revenue,
    CASE
        WHEN SUM(impressions) > 0 THEN ROUND((SUM(adds)::decimal / SUM(impressions)::decimal * 100), 2)
        ELSE 0
    END as acceptance_rate,
    CASE
        WHEN SUM(purchases) > 0 THEN ROUND(SUM(revenue) / SUM(purchases), 2)
        ELSE 0
    END as avg_order_value
FROM analytics_daily
GROUP BY shop_id, date;

-- Top performing upsells
CREATE VIEW v_top_upsells AS
SELECT
    up.shop_id,
    up.id,
    up.title,
    up.shopify_product_id,
    SUM(ad.impressions) as total_impressions,
    SUM(ad.adds) as total_adds,
    SUM(ad.revenue) as total_revenue,
    CASE
        WHEN SUM(ad.impressions) > 0 THEN ROUND((SUM(ad.adds)::decimal / SUM(ad.impressions)::decimal * 100), 2)
        ELSE 0
    END as conversion_rate
FROM upsell_products up
LEFT JOIN analytics_daily ad ON up.id = ad.upsell_product_id
WHERE up.is_active = true
GROUP BY up.shop_id, up.id, up.title, up.shopify_product_id
ORDER BY total_revenue DESC;

-- ============================================
-- SEED DATA (for development)
-- ============================================

-- Sample shop (for local development only)
-- INSERT INTO shops (shop_domain, access_token, plan)
-- VALUES ('dev-store.myshopify.com', 'dummy-token', 'pro');

COMMENT ON TABLE shops IS 'Connected Shopify stores';
COMMENT ON TABLE upsell_products IS 'Products selected for upselling';
COMMENT ON TABLE upsell_events IS 'Tracking all upsell interactions';
COMMENT ON TABLE ab_tests IS 'A/B testing experiments';
COMMENT ON TABLE product_affinities IS 'ML-learned product relationships';
COMMENT ON TABLE analytics_daily IS 'Pre-aggregated daily analytics';
COMMENT ON TABLE sessions IS 'App authentication sessions';
COMMENT ON TABLE webhook_logs IS 'Webhook processing logs';
