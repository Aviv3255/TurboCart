-- ============================================
-- TurboCart ML Optimization Engine Schema
-- Multi-Armed Bandit + Contextual Learning
-- ============================================

-- ============================================
-- DISPLAY STYLE ARMS TABLE
-- Tracks Thompson Sampling state for each display style
-- ============================================
CREATE TABLE IF NOT EXISTS ml_display_arms (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    shop_id UUID REFERENCES shops(id) ON DELETE CASCADE,
    display_style VARCHAR(50) NOT NULL,

    -- Thompson Sampling parameters (Beta distribution)
    alpha DECIMAL(12,4) DEFAULT 1.0,  -- Success count + 1
    beta DECIMAL(12,4) DEFAULT 1.0,   -- Failure count + 1

    -- Performance metrics
    total_impressions INTEGER DEFAULT 0,
    total_clicks INTEGER DEFAULT 0,
    total_adds INTEGER DEFAULT 0,
    total_revenue DECIMAL(12,2) DEFAULT 0,

    -- Calculated metrics
    revenue_per_impression DECIMAL(10,4) DEFAULT 0,
    acceptance_rate DECIMAL(5,4) DEFAULT 0,
    avg_cart_value DECIMAL(10,2) DEFAULT 0,

    -- Context-specific performance
    best_contexts JSONB DEFAULT '[]'::jsonb,

    -- Statistical confidence
    confidence_interval JSONB DEFAULT '{"lower": 0, "upper": 1}'::jsonb,
    sample_size INTEGER DEFAULT 0,

    last_updated_at TIMESTAMP DEFAULT NOW(),
    created_at TIMESTAMP DEFAULT NOW(),

    UNIQUE(shop_id, display_style)
);

CREATE INDEX idx_ml_display_arms_shop ON ml_display_arms(shop_id);
CREATE INDEX idx_ml_display_arms_revenue ON ml_display_arms(revenue_per_impression DESC);

-- ============================================
-- PRODUCT ARMS TABLE
-- Tracks Thompson Sampling state for each product in the pool
-- ============================================
CREATE TABLE IF NOT EXISTS ml_product_arms (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    shop_id UUID REFERENCES shops(id) ON DELETE CASCADE,
    upsell_product_id UUID REFERENCES upsell_products(id) ON DELETE CASCADE,

    -- Thompson Sampling parameters
    alpha DECIMAL(12,4) DEFAULT 1.0,
    beta DECIMAL(12,4) DEFAULT 1.0,

    -- Performance metrics
    total_impressions INTEGER DEFAULT 0,
    total_adds INTEGER DEFAULT 0,
    total_revenue DECIMAL(12,2) DEFAULT 0,

    -- Position performance (which position converts best)
    position_performance JSONB DEFAULT '{
        "1": {"impressions": 0, "adds": 0, "revenue": 0},
        "2": {"impressions": 0, "adds": 0, "revenue": 0},
        "3": {"impressions": 0, "adds": 0, "revenue": 0}
    }'::jsonb,

    -- Context-specific performance
    context_performance JSONB DEFAULT '{}'::jsonb,

    -- Best pairing products
    best_pairings JSONB DEFAULT '[]'::jsonb,

    -- Statistical metrics
    conversion_rate DECIMAL(5,4) DEFAULT 0,
    revenue_per_impression DECIMAL(10,4) DEFAULT 0,
    confidence_score DECIMAL(5,4) DEFAULT 0,

    last_updated_at TIMESTAMP DEFAULT NOW(),
    created_at TIMESTAMP DEFAULT NOW(),

    UNIQUE(shop_id, upsell_product_id)
);

CREATE INDEX idx_ml_product_arms_shop ON ml_product_arms(shop_id);
CREATE INDEX idx_ml_product_arms_product ON ml_product_arms(upsell_product_id);
CREATE INDEX idx_ml_product_arms_performance ON ml_product_arms(revenue_per_impression DESC);

-- ============================================
-- COMBINATION PERFORMANCE TABLE
-- Tracks performance of specific [display style + products + order] combinations
-- ============================================
CREATE TABLE IF NOT EXISTS ml_combination_performance (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    shop_id UUID REFERENCES shops(id) ON DELETE CASCADE,

    -- The combination
    display_style VARCHAR(50) NOT NULL,
    product_ids BIGINT[] NOT NULL,           -- Ordered array of product IDs
    product_order INTEGER[] NOT NULL,         -- Position of each product

    -- Context when shown
    cart_value_bucket VARCHAR(20),            -- '0-50', '50-100', '100-200', '200+'
    cart_item_count_bucket VARCHAR(20),       -- '1', '2-3', '4-5', '6+'
    cart_collections INTEGER[],
    cart_product_types VARCHAR(100)[],
    time_of_day VARCHAR(20),                  -- 'morning', 'afternoon', 'evening', 'night'
    day_of_week INTEGER,                      -- 0-6

    -- Performance
    impressions INTEGER DEFAULT 0,
    clicks INTEGER DEFAULT 0,
    adds INTEGER DEFAULT 0,
    revenue DECIMAL(12,2) DEFAULT 0,

    -- Calculated metrics
    revenue_per_impression DECIMAL(10,4) DEFAULT 0,
    acceptance_rate DECIMAL(5,4) DEFAULT 0,
    ctr DECIMAL(5,4) DEFAULT 0,

    -- Thompson Sampling for this combination
    alpha DECIMAL(12,4) DEFAULT 1.0,
    beta DECIMAL(12,4) DEFAULT 1.0,

    -- Recency weighting (recent performance = more valuable)
    last_shown_at TIMESTAMP,
    performance_trend VARCHAR(20),            -- 'improving', 'declining', 'stable'

    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Indexes for fast context matching
CREATE INDEX idx_ml_combo_shop_style ON ml_combination_performance(shop_id, display_style);
CREATE INDEX idx_ml_combo_context ON ml_combination_performance(
    shop_id, cart_value_bucket, cart_item_count_bucket
);
CREATE INDEX idx_ml_combo_performance ON ml_combination_performance(revenue_per_impression DESC);
CREATE INDEX idx_ml_combo_products ON ml_combination_performance USING GIN (product_ids);
CREATE INDEX idx_ml_combo_time ON ml_combination_performance(day_of_week, time_of_day);

-- ============================================
-- ML DECISIONS LOG
-- Records every decision made by the ML engine for analysis
-- ============================================
CREATE TABLE IF NOT EXISTS ml_decisions_log (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    shop_id UUID REFERENCES shops(id) ON DELETE CASCADE,
    session_id VARCHAR(255),

    -- Decision context
    cart_snapshot JSONB NOT NULL,
    cart_value DECIMAL(10,2),
    cart_item_count INTEGER,

    -- What the ML engine decided
    decision_type VARCHAR(20) NOT NULL,       -- 'exploit' or 'explore'
    selected_display_style VARCHAR(50) NOT NULL,
    selected_products JSONB NOT NULL,         -- Array of {id, position, score}

    -- Why it made this decision
    reasoning JSONB,                          -- Scores, probabilities, context matches

    -- Thompson Sampling draws
    thompson_samples JSONB,                   -- The random samples drawn from Beta distributions

    -- Alternative options considered
    alternatives JSONB,                       -- Other top combinations not chosen

    -- Outcome (updated later)
    outcome VARCHAR(20),                      -- 'impression', 'click', 'add', 'no_response'
    outcome_revenue DECIMAL(10,2),
    outcome_recorded_at TIMESTAMP,

    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_ml_decisions_shop ON ml_decisions_log(shop_id, created_at DESC);
CREATE INDEX idx_ml_decisions_session ON ml_decisions_log(session_id);
CREATE INDEX idx_ml_decisions_type ON ml_decisions_log(decision_type);
CREATE INDEX idx_ml_decisions_outcome ON ml_decisions_log(outcome) WHERE outcome IS NOT NULL;

-- ============================================
-- CONTEXT PATTERNS TABLE
-- Learns which contexts lead to best performance
-- ============================================
CREATE TABLE IF NOT EXISTS ml_context_patterns (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    shop_id UUID REFERENCES shops(id) ON DELETE CASCADE,

    -- Context definition
    pattern_type VARCHAR(50) NOT NULL,        -- 'cart_value_range', 'product_type_combo', 'time_pattern', etc.
    pattern_definition JSONB NOT NULL,

    -- Performance for this pattern
    occurrences INTEGER DEFAULT 0,
    total_revenue DECIMAL(12,2) DEFAULT 0,
    avg_acceptance_rate DECIMAL(5,4) DEFAULT 0,

    -- Best display style for this context
    best_display_style VARCHAR(50),
    best_display_style_revenue DECIMAL(10,4),

    -- Best products for this context
    best_products JSONB DEFAULT '[]'::jsonb,

    -- Statistical significance
    confidence_level DECIMAL(5,4) DEFAULT 0,
    p_value DECIMAL(10,8),

    last_calculated_at TIMESTAMP DEFAULT NOW(),
    created_at TIMESTAMP DEFAULT NOW(),

    UNIQUE(shop_id, pattern_type, pattern_definition)
);

CREATE INDEX idx_ml_context_patterns_shop ON ml_context_patterns(shop_id);
CREATE INDEX idx_ml_context_patterns_type ON ml_context_patterns(pattern_type);
CREATE INDEX idx_ml_context_patterns_performance ON ml_context_patterns(avg_acceptance_rate DESC);

-- ============================================
-- EXPLORATION TRACKER
-- Ensures we explore all combinations sufficiently
-- ============================================
CREATE TABLE IF NOT EXISTS ml_exploration_tracker (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    shop_id UUID REFERENCES shops(id) ON DELETE CASCADE,

    -- What needs exploration
    display_style VARCHAR(50),
    product_id BIGINT,
    context_signature VARCHAR(255),           -- Hash of context

    -- Exploration status
    times_explored INTEGER DEFAULT 0,
    needs_more_exploration BOOLEAN DEFAULT true,
    min_exploration_count INTEGER DEFAULT 20,

    last_explored_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW(),

    UNIQUE(shop_id, display_style, product_id, context_signature)
);

CREATE INDEX idx_ml_exploration_shop ON ml_exploration_tracker(shop_id);
CREATE INDEX idx_ml_exploration_needs ON ml_exploration_tracker(needs_more_exploration)
    WHERE needs_more_exploration = true;

-- ============================================
-- ML MODEL STATE
-- Stores overall ML model parameters and config
-- ============================================
CREATE TABLE IF NOT EXISTS ml_model_state (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    shop_id UUID REFERENCES shops(id) ON DELETE CASCADE,

    -- Algorithm parameters
    exploration_rate DECIMAL(3,2) DEFAULT 0.20,  -- 20% exploration
    min_samples_for_exploit INTEGER DEFAULT 100,
    context_matching_threshold DECIMAL(3,2) DEFAULT 0.70,
    recency_weight DECIMAL(3,2) DEFAULT 0.30,

    -- Performance tracking
    total_decisions INTEGER DEFAULT 0,
    exploration_decisions INTEGER DEFAULT 0,
    exploitation_decisions INTEGER DEFAULT 0,

    -- Improvement metrics
    baseline_revenue_per_order DECIMAL(10,2),
    current_revenue_per_order DECIMAL(10,2),
    improvement_percentage DECIMAL(5,2),

    -- Model health
    model_confidence DECIMAL(5,4) DEFAULT 0,
    last_trained_at TIMESTAMP,
    training_status VARCHAR(50) DEFAULT 'learning',  -- 'learning', 'trained', 'optimizing'

    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),

    UNIQUE(shop_id)
);

CREATE INDEX idx_ml_model_state_shop ON ml_model_state(shop_id);

-- ============================================
-- TRIGGERS FOR AUTO-UPDATE
-- ============================================

CREATE OR REPLACE FUNCTION update_ml_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_ml_display_arms_updated_at
    BEFORE UPDATE ON ml_display_arms
    FOR EACH ROW EXECUTE FUNCTION update_ml_updated_at();

CREATE TRIGGER update_ml_product_arms_updated_at
    BEFORE UPDATE ON ml_product_arms
    FOR EACH ROW EXECUTE FUNCTION update_ml_updated_at();

CREATE TRIGGER update_ml_combination_updated_at
    BEFORE UPDATE ON ml_combination_performance
    FOR EACH ROW EXECUTE FUNCTION update_ml_updated_at();

CREATE TRIGGER update_ml_model_state_updated_at
    BEFORE UPDATE ON ml_model_state
    FOR EACH ROW EXECUTE FUNCTION update_ml_updated_at();

-- ============================================
-- VIEWS FOR ANALYTICS
-- ============================================

-- Top performing display styles
CREATE OR REPLACE VIEW v_ml_display_performance AS
SELECT
    shop_id,
    display_style,
    total_impressions,
    total_adds,
    total_revenue,
    revenue_per_impression,
    acceptance_rate,
    ROUND((alpha / (alpha + beta))::numeric, 4) as estimated_success_rate,
    confidence_interval,
    sample_size
FROM ml_display_arms
WHERE total_impressions > 0
ORDER BY revenue_per_impression DESC;

-- Top performing products
CREATE OR REPLACE VIEW v_ml_product_performance AS
SELECT
    mpa.shop_id,
    mpa.upsell_product_id,
    up.title,
    up.shopify_product_id,
    mpa.total_impressions,
    mpa.total_adds,
    mpa.total_revenue,
    mpa.revenue_per_impression,
    mpa.conversion_rate,
    ROUND((mpa.alpha / (mpa.alpha + mpa.beta))::numeric, 4) as estimated_conversion_rate,
    mpa.confidence_score,
    mpa.position_performance
FROM ml_product_arms mpa
JOIN upsell_products up ON mpa.upsell_product_id = up.id
WHERE mpa.total_impressions > 0
ORDER BY mpa.revenue_per_impression DESC;

-- Context performance heatmap data
CREATE OR REPLACE VIEW v_ml_context_heatmap AS
SELECT
    shop_id,
    cart_value_bucket,
    cart_item_count_bucket,
    display_style,
    SUM(impressions) as total_impressions,
    SUM(adds) as total_adds,
    SUM(revenue) as total_revenue,
    CASE
        WHEN SUM(impressions) > 0
        THEN ROUND((SUM(revenue) / SUM(impressions))::numeric, 4)
        ELSE 0
    END as revenue_per_impression,
    CASE
        WHEN SUM(impressions) > 0
        THEN ROUND((SUM(adds)::decimal / SUM(impressions)::decimal * 100)::numeric, 2)
        ELSE 0
    END as acceptance_rate
FROM ml_combination_performance
WHERE impressions > 0
GROUP BY shop_id, cart_value_bucket, cart_item_count_bucket, display_style;

COMMENT ON TABLE ml_display_arms IS 'Thompson Sampling state for each display style';
COMMENT ON TABLE ml_product_arms IS 'Thompson Sampling state for each product';
COMMENT ON TABLE ml_combination_performance IS 'Performance tracking for specific display+product combinations';
COMMENT ON TABLE ml_decisions_log IS 'Log of every ML decision for analysis';
COMMENT ON TABLE ml_context_patterns IS 'Learned patterns about which contexts work best';
COMMENT ON TABLE ml_exploration_tracker IS 'Ensures sufficient exploration of all options';
COMMENT ON TABLE ml_model_state IS 'Overall ML model configuration and state';
