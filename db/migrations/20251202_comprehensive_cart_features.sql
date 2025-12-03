-- TurboCart Comprehensive Cart Features Migration
-- Adds Trust Badges, Enhanced Announcements, Timer Settings, and Rewards configurations

-- ============================================
-- TRUST BADGES TABLE
-- Trust/security badges displayed in cart
-- ============================================
CREATE TABLE IF NOT EXISTS trust_badges (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    shop_id UUID REFERENCES shops(id) ON DELETE CASCADE,
    badge_type VARCHAR(50) NOT NULL, -- 'secure_checkout', 'money_back', 'free_shipping', 'fast_delivery', 'support', 'custom'
    title VARCHAR(255) NOT NULL,
    subtitle VARCHAR(255),
    icon VARCHAR(50) DEFAULT 'shield', -- 'shield', 'lock', 'truck', 'clock', 'heart', 'star', 'check', 'credit-card', 'refresh', 'headphones'
    custom_icon_url TEXT,
    background_color VARCHAR(20) DEFAULT '#f8f9fa',
    text_color VARCHAR(20) DEFAULT '#1a1a1a',
    icon_color VARCHAR(20) DEFAULT '#10b981',
    position INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_trust_badges_shop ON trust_badges(shop_id) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_trust_badges_position ON trust_badges(shop_id, position ASC);

-- ============================================
-- TRUST BADGES SETTINGS TABLE
-- Global trust badge display settings
-- ============================================
CREATE TABLE IF NOT EXISTS trust_badge_settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    shop_id UUID UNIQUE REFERENCES shops(id) ON DELETE CASCADE,
    enabled BOOLEAN DEFAULT true,
    display_style VARCHAR(50) DEFAULT 'horizontal', -- 'horizontal', 'vertical', 'grid', 'compact'
    position VARCHAR(50) DEFAULT 'below_checkout', -- 'above_items', 'below_items', 'below_checkout', 'footer'
    show_border BOOLEAN DEFAULT true,
    show_background BOOLEAN DEFAULT true,
    background_color VARCHAR(20) DEFAULT '#ffffff',
    border_color VARCHAR(20) DEFAULT '#e5e7eb',
    border_radius INTEGER DEFAULT 12,
    padding INTEGER DEFAULT 16,
    spacing INTEGER DEFAULT 12,
    icon_size VARCHAR(20) DEFAULT 'medium', -- 'small', 'medium', 'large'
    animation VARCHAR(50) DEFAULT 'none', -- 'none', 'fade', 'slide', 'bounce'
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- ============================================
-- ANNOUNCEMENT BAR SETTINGS TABLE
-- Enhanced announcement/timer bar settings
-- ============================================
CREATE TABLE IF NOT EXISTS announcement_settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    shop_id UUID UNIQUE REFERENCES shops(id) ON DELETE CASCADE,
    -- General
    enabled BOOLEAN DEFAULT false,
    position VARCHAR(50) DEFAULT 'top', -- 'top', 'bottom', 'floating'
    -- Content
    message TEXT,
    secondary_message TEXT,
    icon VARCHAR(50) DEFAULT 'megaphone',
    -- Link
    link_enabled BOOLEAN DEFAULT false,
    link_url TEXT,
    link_text VARCHAR(100),
    link_new_tab BOOLEAN DEFAULT true,
    -- Styling
    style VARCHAR(50) DEFAULT 'gradient', -- 'gradient', 'solid', 'outline', 'glow'
    background_color VARCHAR(20) DEFAULT '#667eea',
    gradient_end_color VARCHAR(20) DEFAULT '#764ba2',
    text_color VARCHAR(20) DEFAULT '#ffffff',
    font_size INTEGER DEFAULT 14,
    font_weight VARCHAR(20) DEFAULT '500',
    padding INTEGER DEFAULT 12,
    border_radius INTEGER DEFAULT 8,
    -- Animation
    animation VARCHAR(50) DEFAULT 'none', -- 'none', 'pulse', 'shake', 'bounce', 'glow'
    -- Dismissible
    dismissible BOOLEAN DEFAULT false,
    dismiss_duration INTEGER DEFAULT 24, -- hours before showing again
    -- Scheduling
    schedule_enabled BOOLEAN DEFAULT false,
    schedule_start TIMESTAMP,
    schedule_end TIMESTAMP,
    -- Display rules
    show_on_empty_cart BOOLEAN DEFAULT true,
    min_cart_value DECIMAL(10,2) DEFAULT 0,
    max_cart_value DECIMAL(10,2),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- ============================================
-- TIMER SETTINGS TABLE
-- Urgency countdown timer settings
-- ============================================
CREATE TABLE IF NOT EXISTS timer_settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    shop_id UUID UNIQUE REFERENCES shops(id) ON DELETE CASCADE,
    -- General
    enabled BOOLEAN DEFAULT false,
    position VARCHAR(50) DEFAULT 'top', -- 'top', 'bottom', 'floating', 'inline'
    -- Timer Config
    duration_minutes INTEGER DEFAULT 10,
    reset_on_activity BOOLEAN DEFAULT true, -- Reset when cart changes
    -- Messages
    message_template TEXT DEFAULT 'Your cart will expire in {time}!',
    expired_message TEXT DEFAULT 'Your cart has expired. Items may no longer be reserved.',
    urgency_message TEXT, -- Shows when < 2 minutes remaining
    -- Styling
    style VARCHAR(50) DEFAULT 'bar', -- 'bar', 'floating', 'inline', 'countdown-only'
    background_color VARCHAR(20) DEFAULT '#fef3c7',
    text_color VARCHAR(20) DEFAULT '#92400e',
    accent_color VARCHAR(20) DEFAULT '#f59e0b',
    timer_color VARCHAR(20) DEFAULT '#dc2626',
    font_size INTEGER DEFAULT 14,
    padding INTEGER DEFAULT 10,
    border_radius INTEGER DEFAULT 8,
    -- Animation
    animation VARCHAR(50) DEFAULT 'none', -- 'none', 'pulse', 'shake', 'flash'
    animate_last_minute BOOLEAN DEFAULT true,
    -- Behavior
    show_progress_bar BOOLEAN DEFAULT false,
    play_sound_warning BOOLEAN DEFAULT false,
    sound_warning_seconds INTEGER DEFAULT 60,
    -- Display rules
    min_cart_value DECIMAL(10,2) DEFAULT 0,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- ============================================
-- REWARDS SETTINGS TABLE
-- Global rewards/progress bar settings
-- ============================================
CREATE TABLE IF NOT EXISTS rewards_settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    shop_id UUID UNIQUE REFERENCES shops(id) ON DELETE CASCADE,
    -- General
    enabled BOOLEAN DEFAULT false,
    position VARCHAR(50) DEFAULT 'top', -- 'top', 'bottom', 'floating'
    -- Progress bar styling
    progress_bar_height INTEGER DEFAULT 8,
    progress_bar_color VARCHAR(20) DEFAULT '#10b981',
    progress_bar_gradient_end VARCHAR(20) DEFAULT '#059669',
    progress_bar_background VARCHAR(20) DEFAULT '#e5e7eb',
    progress_bar_border_radius INTEGER DEFAULT 4,
    show_percentage BOOLEAN DEFAULT false,
    animate_progress BOOLEAN DEFAULT true,
    -- Milestone styling
    milestone_icon_size INTEGER DEFAULT 32,
    milestone_icon_background VARCHAR(20) DEFAULT '#e5e7eb',
    milestone_icon_active_background VARCHAR(20) DEFAULT '#10b981',
    milestone_icon_color VARCHAR(20) DEFAULT '#6b7280',
    milestone_icon_active_color VARCHAR(20) DEFAULT '#ffffff',
    show_milestone_labels BOOLEAN DEFAULT true,
    show_milestone_amounts BOOLEAN DEFAULT true,
    -- Messages
    message_template TEXT DEFAULT 'Add {amount} more to unlock {reward}!',
    completed_message TEXT DEFAULT 'Congratulations! You have unlocked all rewards!',
    empty_cart_message TEXT DEFAULT 'Add items to start earning rewards!',
    -- Container styling
    background_color VARCHAR(20) DEFAULT '#f9fafb',
    border_color VARCHAR(20) DEFAULT '#e5e7eb',
    border_radius INTEGER DEFAULT 12,
    padding INTEGER DEFAULT 16,
    -- Animation
    celebration_animation BOOLEAN DEFAULT true, -- Confetti/celebration when tier unlocked
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- ============================================
-- SWITCH ADDONS SETTINGS TABLE
-- Global add-on display settings
-- ============================================
CREATE TABLE IF NOT EXISTS addon_settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    shop_id UUID UNIQUE REFERENCES shops(id) ON DELETE CASCADE,
    -- General
    enabled BOOLEAN DEFAULT false,
    position VARCHAR(50) DEFAULT 'below_items', -- 'above_items', 'below_items', 'below_upsells'
    -- Title/Header
    section_title VARCHAR(255) DEFAULT 'Protect Your Order',
    section_subtitle TEXT,
    show_section_header BOOLEAN DEFAULT true,
    -- Display
    display_style VARCHAR(50) DEFAULT 'card', -- 'card', 'compact', 'list', 'inline'
    columns INTEGER DEFAULT 1,
    -- Item styling
    item_background VARCHAR(20) DEFAULT '#f9fafb',
    item_border_color VARCHAR(20) DEFAULT '#e5e7eb',
    item_border_radius INTEGER DEFAULT 10,
    item_padding INTEGER DEFAULT 12,
    -- Toggle styling
    toggle_active_color VARCHAR(20) DEFAULT '#10b981',
    toggle_inactive_color VARCHAR(20) DEFAULT '#d1d5db',
    toggle_style VARCHAR(50) DEFAULT 'switch', -- 'switch', 'checkbox', 'button'
    -- Behavior
    auto_add_defaults BOOLEAN DEFAULT true, -- Auto-add default_enabled items to cart
    show_savings BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Add icon_url column to switch_addons if not exists
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'switch_addons' AND column_name = 'icon_url') THEN
        ALTER TABLE switch_addons ADD COLUMN icon_url TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'switch_addons' AND column_name = 'compare_price') THEN
        ALTER TABLE switch_addons ADD COLUMN compare_price DECIMAL(10,2);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'switch_addons' AND column_name = 'tooltip') THEN
        ALTER TABLE switch_addons ADD COLUMN tooltip TEXT;
    END IF;
END $$;

-- Add more columns to reward_tiers if not exists
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'reward_tiers' AND column_name = 'description') THEN
        ALTER TABLE reward_tiers ADD COLUMN description TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'reward_tiers' AND column_name = 'icon_url') THEN
        ALTER TABLE reward_tiers ADD COLUMN icon_url TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'reward_tiers' AND column_name = 'discount_code') THEN
        ALTER TABLE reward_tiers ADD COLUMN discount_code VARCHAR(100);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'reward_tiers' AND column_name = 'auto_apply') THEN
        ALTER TABLE reward_tiers ADD COLUMN auto_apply BOOLEAN DEFAULT false;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'reward_tiers' AND column_name = 'celebration_message') THEN
        ALTER TABLE reward_tiers ADD COLUMN celebration_message TEXT;
    END IF;
END $$;

-- Create triggers for new tables
CREATE TRIGGER update_trust_badges_updated_at BEFORE UPDATE ON trust_badges
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_trust_badge_settings_updated_at BEFORE UPDATE ON trust_badge_settings
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_announcement_settings_updated_at BEFORE UPDATE ON announcement_settings
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_timer_settings_updated_at BEFORE UPDATE ON timer_settings
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_rewards_settings_updated_at BEFORE UPDATE ON rewards_settings
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_addon_settings_updated_at BEFORE UPDATE ON addon_settings
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Comments
COMMENT ON TABLE trust_badges IS 'Individual trust/security badges for cart display';
COMMENT ON TABLE trust_badge_settings IS 'Global trust badge display configuration';
COMMENT ON TABLE announcement_settings IS 'Promotional announcement bar configuration';
COMMENT ON TABLE timer_settings IS 'Urgency countdown timer configuration';
COMMENT ON TABLE rewards_settings IS 'Cart rewards progress bar configuration';
COMMENT ON TABLE addon_settings IS 'One-click add-on products display configuration';
