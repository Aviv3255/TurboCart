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
  icon: string;
}

interface SwitchAddon {
  id: string;
  product_id: number | null;
  variant_id: number | null;
  name: string;
  description: string | null;
  price: number;
  icon: string;
  default_enabled: boolean;
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
    }

    // Get reward tiers (if feature enabled)
    let rewards: RewardTier[] = [];
    if (settings.features?.rewards) {
      const rewardsResult = await dbQuery<{
        threshold: string;
        reward_type: string;
        reward_value: string | null;
        label: string | null;
        icon: string;
      }>(
        `SELECT threshold, reward_type, reward_value, label, icon
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
        icon: r.icon,
      }));
    }

    // Get switch add-ons (if feature enabled)
    let addons: SwitchAddon[] = [];
    if (settings.features?.addons) {
      const addonsResult = await dbQuery<{
        id: string;
        shopify_product_id: number | null;
        shopify_variant_id: number | null;
        name: string;
        description: string | null;
        price: string;
        icon: string;
        default_enabled: boolean;
      }>(
        `SELECT id, shopify_product_id, shopify_variant_id, name, description, price, icon, default_enabled
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
        icon: a.icon,
        default_enabled: a.default_enabled,
      }));
    }

    // Build response
    const config = {
      // Display settings
      display_style: settings.display_style || 'carousel',
      cart_type: settings.cart_type || 'drawer',
      position: settings.position || 'top',

      // Features enabled
      features: settings.features || {
        upsells: true,
        rewards: false,
        addons: false,
        timer: false,
        announcement: false,
      },

      // Upsell products
      upsells,

      // Rewards configuration
      rewards,

      // Switch add-ons
      addons,

      // Timer settings
      timer: settings.features?.timer ? {
        duration: settings.timer?.duration || 10,
        message: settings.timer?.message || 'Your cart will expire in {time}!',
      } : null,

      // Announcement settings
      announcement: settings.features?.announcement && settings.announcement?.text ? {
        text: settings.announcement.text,
        icon: settings.announcement.icon || 'info',
      } : null,

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
