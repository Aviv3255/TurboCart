import { NextRequest, NextResponse } from 'next/server';

// CORS headers for storefront requests
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

interface ShopSettings {
  display_style: string;
  cart_type: string;
  max_upsells: number;
  position: string;
  features: {
    upsells: boolean;
    rewards: boolean;
    addons: boolean;
    timer: boolean;
    announcement: boolean;
    trust_badges: boolean;
  };
  timer: {
    duration: number;
    message: string;
  };
  announcement: {
    text: string;
    icon: string;
  };
}

interface UpsellProduct {
  id: number;
  variant_id: number | null;
  title: string;
  handle: string;
  price: number;
  compare_at_price: number | null;
  image: string | null;
}

interface RewardTier {
  threshold: number;
  reward_type: string;
  reward_value: string | null;
  label: string | null;
  description: string | null;
  icon: string;
  icon_url: string | null;
  discount_code: string | null;
  auto_apply: boolean;
  celebration_message: string | null;
}

interface SwitchAddon {
  id: string;
  product_id: number | null;
  variant_id: number | null;
  name: string;
  description: string | null;
  price: number;
  compare_price: number | null;
  icon: string;
  icon_url: string | null;
  tooltip: string | null;
  default_enabled: boolean;
}

interface TrustBadge {
  id: string;
  icon: string;
  icon_url: string | null;
  label: string;
  tooltip: string | null;
  background_color: string;
  text_color: string;
  border_color: string;
}

interface TrustBadgeSettings {
  layout: string;
  position: string;
  spacing: number;
  animation: string;
  show_on_hover: boolean;
  border_radius: number;
  padding: number;
  icon_size: number;
  font_size: number;
}

interface TimerSettings {
  style: string;
  duration: number;
  reset_on_change: boolean;
  background_color: string;
  text_color: string;
  accent_color: string;
  border_radius: number;
  icon: string;
  show_icon: boolean;
  normal_message: string;
  urgency_message: string;
  expired_message: string;
  urgency_threshold: number;
  show_progress_bar: boolean;
  pulse_animation: boolean;
  expired_action: string;
}

interface AnnouncementSettings {
  style: string;
  message: string;
  icon: string;
  link_url: string | null;
  link_text: string | null;
  background_color: string;
  text_color: string;
  accent_color: string;
  border_radius: number;
  animation: string;
  dismissible: boolean;
  min_cart_value: number | null;
  max_cart_value: number | null;
}

interface RewardsDisplaySettings {
  progress_bar_height: number;
  progress_bar_color: string;
  progress_bar_gradient_end: string;
  progress_bar_background: string;
  progress_bar_border_radius: number;
  show_percentage: boolean;
  animate_progress: boolean;
  milestone_icon_size: number;
  milestone_icon_background: string;
  milestone_icon_active_background: string;
  milestone_icon_color: string;
  milestone_icon_active_color: string;
  show_milestone_labels: boolean;
  show_milestone_amounts: boolean;
  message_template: string;
  completed_message: string;
  empty_cart_message: string;
  background_color: string;
  border_color: string;
  border_radius: number;
  padding: number;
  celebration_animation: boolean;
}

interface AddonsDisplaySettings {
  section_title: string;
  section_subtitle: string | null;
  show_section_header: boolean;
  display_style: string;
  columns: number;
  item_background: string;
  item_border_color: string;
  item_border_radius: number;
  item_padding: number;
  toggle_active_color: string;
  toggle_inactive_color: string;
  toggle_style: string;
  auto_add_defaults: boolean;
  show_savings: boolean;
}

/**
 * Extract shop from request headers
 */
function extractShop(request: NextRequest): string | null {
  const { searchParams } = new URL(request.url);

  // 1. Try URL params
  const shopParam = searchParams.get('shop');
  if (shopParam && shopParam.includes('.myshopify.com')) {
    return shopParam;
  }

  // 2. Try Referer header
  const referer = request.headers.get('referer') || '';
  const refererMatch = referer.match(/https?:\/\/([^\/]+\.myshopify\.com)/);
  if (refererMatch && refererMatch[1]) {
    return refererMatch[1];
  }

  return null;
}

/**
 * GET /api/storefront/config
 * Returns all cart feature configuration for a shop
 */
export async function GET(request: NextRequest) {
  try {
    const shop = extractShop(request);

    if (!shop) {
      return NextResponse.json({
        error: 'Missing shop parameter',
        help: 'Add ?shop=your-store.myshopify.com',
      }, { status: 400, headers: corsHeaders });
    }

    const { query: dbQuery } = await import('@/lib/db');

    // Get shop settings
    const shopResult = await dbQuery<{
      id: string;
      settings: ShopSettings | null;
    }>(
      'SELECT id, settings FROM shops WHERE shop_domain = $1 AND uninstalled_at IS NULL',
      [shop]
    );

    if (shopResult.rows.length === 0) {
      return NextResponse.json({
        error: 'Shop not found',
        shop,
      }, { status: 404, headers: corsHeaders });
    }

    const shopId = shopResult.rows[0]!.id;
    const settings = shopResult.rows[0]!.settings || {
      display_style: 'carousel',
      cart_type: 'drawer',
      max_upsells: 10,
      position: 'top',
      features: {
        upsells: true,
        rewards: false,
        addons: false,
        timer: false,
        announcement: false,
        trust_badges: false,
      },
      timer: {
        duration: 10,
        message: 'Your cart will expire in {time}!',
      },
      announcement: {
        text: '',
        icon: 'info',
      },
    };

    // Get upsell products (if feature enabled)
    let upsells: UpsellProduct[] = [];
    if (settings.features?.upsells !== false) {
      try {
        const productsResult = await dbQuery<{
          shopify_product_id: number;
          shopify_variant_id: number | null;
          title: string;
          handle: string;
          price: number;
          compare_at_price: number | null;
          image_url: string | null;
        }>(
          `SELECT shopify_product_id, shopify_variant_id, title, handle, price, compare_at_price, image_url
           FROM upsell_products
           WHERE shop_id = $1 AND is_active = true
           ORDER BY priority DESC, created_at ASC
           LIMIT $2`,
          [shopId, settings.max_upsells || 10]
        );

        upsells = productsResult.rows.map(p => ({
          id: p.shopify_product_id,
          variant_id: p.shopify_variant_id,
          title: p.title,
          handle: p.handle,
          price: p.price,
          compare_at_price: p.compare_at_price,
          image: p.image_url,
        }));
      } catch (err) {
        const dbError = err as { code?: string };
        if (dbError.code !== '42P01') throw err;
      }
    }

    // Get reward tiers and settings (if feature enabled)
    let rewards: RewardTier[] = [];
    let rewardsSettings: RewardsDisplaySettings | null = null;
    if (settings.features?.rewards) {
      try {
        // Get rewards display settings
        const rewardsSettingsResult = await dbQuery<RewardsDisplaySettings>(
          `SELECT progress_bar_height, progress_bar_color, progress_bar_gradient_end,
                  progress_bar_background, progress_bar_border_radius, show_percentage,
                  animate_progress, milestone_icon_size, milestone_icon_background,
                  milestone_icon_active_background, milestone_icon_color, milestone_icon_active_color,
                  show_milestone_labels, show_milestone_amounts, message_template,
                  completed_message, empty_cart_message, background_color, border_color,
                  border_radius, padding, celebration_animation
           FROM rewards_settings WHERE shop_id = $1`,
          [shopId]
        );
        if (rewardsSettingsResult.rows[0]) {
          rewardsSettings = rewardsSettingsResult.rows[0];
        }
      } catch (err) {
        const dbError = err as { code?: string };
        if (dbError.code !== '42P01') throw err;
      }

      try {
        const rewardsResult = await dbQuery<{
          threshold: string;
          reward_type: string;
          reward_value: string | null;
          label: string | null;
          description: string | null;
          icon: string;
          icon_url: string | null;
          discount_code: string | null;
          auto_apply: boolean;
          celebration_message: string | null;
        }>(
          `SELECT threshold, reward_type, reward_value, label, description, icon, icon_url,
                  discount_code, auto_apply, celebration_message
           FROM reward_tiers
           WHERE shop_id = $1 AND is_active = true
           ORDER BY threshold ASC`,
          [shopId]
        );

        rewards = rewardsResult.rows.map(r => ({
          threshold: parseFloat(r.threshold),
          reward_type: r.reward_type,
          reward_value: r.reward_value,
          label: r.label,
          description: r.description,
          icon: r.icon,
          icon_url: r.icon_url,
          discount_code: r.discount_code,
          auto_apply: r.auto_apply,
          celebration_message: r.celebration_message,
        }));
      } catch (err) {
        const dbError = err as { code?: string };
        if (dbError.code !== '42P01') throw err;
      }
    }

    // Get switch add-ons and settings (if feature enabled)
    let addons: SwitchAddon[] = [];
    let addonsSettings: AddonsDisplaySettings | null = null;
    if (settings.features?.addons) {
      try {
        // Get addons display settings
        const addonsSettingsResult = await dbQuery<AddonsDisplaySettings>(
          `SELECT section_title, section_subtitle, show_section_header, display_style,
                  columns, item_background, item_border_color, item_border_radius,
                  item_padding, toggle_active_color, toggle_inactive_color, toggle_style,
                  auto_add_defaults, show_savings
           FROM addon_settings WHERE shop_id = $1`,
          [shopId]
        );
        if (addonsSettingsResult.rows[0]) {
          addonsSettings = addonsSettingsResult.rows[0];
        }
      } catch (err) {
        const dbError = err as { code?: string };
        if (dbError.code !== '42P01') throw err;
      }

      try {
        const addonsResult = await dbQuery<{
          id: string;
          shopify_product_id: number | null;
          shopify_variant_id: number | null;
          name: string;
          description: string | null;
          price: string;
          compare_price: string | null;
          icon: string;
          icon_url: string | null;
          tooltip: string | null;
          default_enabled: boolean;
        }>(
          `SELECT id, shopify_product_id, shopify_variant_id, name, description, price,
                  compare_price, icon, icon_url, tooltip, default_enabled
           FROM switch_addons
           WHERE shop_id = $1 AND is_active = true
           ORDER BY position ASC`,
          [shopId]
        );

        addons = addonsResult.rows.map(a => ({
          id: a.id,
          product_id: a.shopify_product_id,
          variant_id: a.shopify_variant_id,
          name: a.name,
          description: a.description,
          price: parseFloat(a.price),
          compare_price: a.compare_price ? parseFloat(a.compare_price) : null,
          icon: a.icon,
          icon_url: a.icon_url,
          tooltip: a.tooltip,
          default_enabled: a.default_enabled,
        }));
      } catch (err) {
        const dbError = err as { code?: string };
        if (dbError.code !== '42P01') throw err;
      }
    }

    // Get trust badges and settings (if feature enabled)
    let trustBadges: TrustBadge[] = [];
    let trustBadgeSettings: TrustBadgeSettings | null = null;
    if (settings.features?.trust_badges) {
      try {
        // Get trust badge display settings
        const badgeSettingsResult = await dbQuery<TrustBadgeSettings>(
          `SELECT layout, position, spacing, animation, show_on_hover, border_radius,
                  padding, icon_size, font_size
           FROM trust_badge_settings WHERE shop_id = $1`,
          [shopId]
        );
        if (badgeSettingsResult.rows[0]) {
          trustBadgeSettings = badgeSettingsResult.rows[0];
        }
      } catch (err) {
        const dbError = err as { code?: string };
        if (dbError.code !== '42P01') throw err;
      }

      try {
        const badgesResult = await dbQuery<{
          id: string;
          icon: string;
          icon_url: string | null;
          label: string;
          tooltip: string | null;
          background_color: string;
          text_color: string;
          border_color: string;
        }>(
          `SELECT id, icon, icon_url, label, tooltip, background_color, text_color, border_color
           FROM trust_badges
           WHERE shop_id = $1 AND is_active = true
           ORDER BY position ASC`,
          [shopId]
        );

        trustBadges = badgesResult.rows.map(b => ({
          id: b.id,
          icon: b.icon,
          icon_url: b.icon_url,
          label: b.label,
          tooltip: b.tooltip,
          background_color: b.background_color,
          text_color: b.text_color,
          border_color: b.border_color,
        }));
      } catch (err) {
        const dbError = err as { code?: string };
        if (dbError.code !== '42P01') throw err;
      }
    }

    // Get timer settings (if feature enabled)
    let timerConfig: TimerSettings | null = null;
    if (settings.features?.timer) {
      try {
        const timerResult = await dbQuery<TimerSettings>(
          `SELECT style, duration, reset_on_change, background_color, text_color, accent_color,
                  border_radius, icon, show_icon, normal_message, urgency_message, expired_message,
                  urgency_threshold, show_progress_bar, pulse_animation, expired_action
           FROM timer_settings WHERE shop_id = $1`,
          [shopId]
        );
        if (timerResult.rows[0]) {
          timerConfig = timerResult.rows[0];
        } else {
          // Default timer settings from shop settings
          timerConfig = {
            style: 'bar',
            duration: settings.timer?.duration || 10,
            reset_on_change: true,
            background_color: '#FEF3C7',
            text_color: '#92400E',
            accent_color: '#F59E0B',
            border_radius: 8,
            icon: 'clock',
            show_icon: true,
            normal_message: settings.timer?.message || 'Your cart will expire in {time}!',
            urgency_message: 'Hurry! Only {time} left!',
            expired_message: 'Your cart has expired. Items may no longer be available.',
            urgency_threshold: 60,
            show_progress_bar: false,
            pulse_animation: true,
            expired_action: 'show_message',
          };
        }
      } catch (err) {
        const dbError = err as { code?: string };
        if (dbError.code !== '42P01') {
          // Default timer settings
          timerConfig = {
            style: 'bar',
            duration: settings.timer?.duration || 10,
            reset_on_change: true,
            background_color: '#FEF3C7',
            text_color: '#92400E',
            accent_color: '#F59E0B',
            border_radius: 8,
            icon: 'clock',
            show_icon: true,
            normal_message: settings.timer?.message || 'Your cart will expire in {time}!',
            urgency_message: 'Hurry! Only {time} left!',
            expired_message: 'Your cart has expired. Items may no longer be available.',
            urgency_threshold: 60,
            show_progress_bar: false,
            pulse_animation: true,
            expired_action: 'show_message',
          };
        }
      }
    }

    // Get announcement settings (if feature enabled)
    let announcementConfig: AnnouncementSettings | null = null;
    if (settings.features?.announcement) {
      try {
        const announcementResult = await dbQuery<AnnouncementSettings>(
          `SELECT style, message, icon, link_url, link_text, background_color, text_color,
                  accent_color, border_radius, animation, dismissible, min_cart_value, max_cart_value
           FROM announcement_settings WHERE shop_id = $1`,
          [shopId]
        );
        if (announcementResult.rows[0]) {
          announcementConfig = announcementResult.rows[0];
        } else if (settings.announcement?.text) {
          // Default from shop settings
          announcementConfig = {
            style: 'gradient',
            message: settings.announcement.text,
            icon: settings.announcement.icon || 'info',
            link_url: null,
            link_text: null,
            background_color: '#667eea',
            text_color: '#ffffff',
            accent_color: '#764ba2',
            border_radius: 8,
            animation: 'none',
            dismissible: false,
            min_cart_value: null,
            max_cart_value: null,
          };
        }
      } catch (err) {
        const dbError = err as { code?: string };
        if (dbError.code !== '42P01' && settings.announcement?.text) {
          // Default from shop settings
          announcementConfig = {
            style: 'gradient',
            message: settings.announcement.text,
            icon: settings.announcement.icon || 'info',
            link_url: null,
            link_text: null,
            background_color: '#667eea',
            text_color: '#ffffff',
            accent_color: '#764ba2',
            border_radius: 8,
            animation: 'none',
            dismissible: false,
            min_cart_value: null,
            max_cart_value: null,
          };
        }
      }
    }

    // Build response
    const config = {
      // Display settings
      display_style: settings.display_style || 'carousel',
      cart_type: settings.cart_type || 'drawer',
      position: settings.position || 'top',

      // Features enabled
      features: {
        upsells: settings.features?.upsells !== false,
        rewards: settings.features?.rewards || false,
        addons: settings.features?.addons || false,
        timer: settings.features?.timer || false,
        announcement: settings.features?.announcement || false,
        trust_badges: settings.features?.trust_badges || false,
      },

      // Upsell products
      upsells,

      // Rewards configuration
      rewards,
      rewards_settings: rewardsSettings,

      // Switch add-ons
      addons,
      addons_settings: addonsSettings,

      // Trust badges
      trust_badges: trustBadges,
      trust_badge_settings: trustBadgeSettings,

      // Timer settings
      timer: timerConfig,

      // Announcement settings
      announcement: announcementConfig,

      // Metadata
      timestamp: new Date().toISOString(),
    };

    return NextResponse.json(config, { headers: corsHeaders });

  } catch (error) {
    console.error('[Config] Error:', error);
    return NextResponse.json({
      error: 'Failed to get configuration',
      details: (error as Error).message,
    }, { status: 500, headers: corsHeaders });
  }
}

/**
 * CORS preflight
 */
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: corsHeaders,
  });
}
