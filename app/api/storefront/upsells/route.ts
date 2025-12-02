import { NextRequest, NextResponse } from 'next/server';
import { rateLimit } from '@/lib/shopify/middleware';

// CORS headers for storefront requests
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

// Type for upsell product from database
interface UpsellProduct {
  id: string;
  shopify_product_id: number;
  shopify_variant_id: number | null;
  title: string;
  handle: string;
  price: number;
  compare_at_price: number | null;
  image_url: string | null;
}

/**
 * Get upsell products from database
 * Simple query - returns merchant-selected products
 */
async function getUpsellProducts(shopId: string, maxProducts: number = 10): Promise<UpsellProduct[]> {
  const { query: dbQuery } = await import('@/lib/db');

  const result = await dbQuery<UpsellProduct>(
    `SELECT id, shopify_product_id, shopify_variant_id, title, handle, price, compare_at_price, image_url
     FROM upsell_products
     WHERE shop_id = $1 AND is_active = true
     ORDER BY priority DESC, created_at ASC
     LIMIT $2`,
    [shopId, maxProducts]
  );

  return result.rows;
}

/**
 * Helper to validate shop domain
 */
function isValidShop(s: string | null | undefined): s is string {
  return !!s && s !== 'null' && s !== 'undefined' && s !== '' && s.includes('.myshopify.com');
}

/**
 * Extract shop from request (URL, body, or headers)
 */
function extractShop(
  searchParams: URLSearchParams,
  body: Record<string, unknown>,
  headers: Headers
): string | null {
  // 1. Try URL params
  let shop = searchParams.get('shop');
  if (isValidShop(shop)) return shop;

  // 2. Try request body
  if (body.shop && isValidShop(String(body.shop))) {
    return String(body.shop);
  }

  // 3. Try Referer header
  const referer = headers.get('referer') || '';
  const refererMatch = referer.match(/https?:\/\/([^\/]+\.myshopify\.com)/);
  if (refererMatch && refererMatch[1]) {
    return refererMatch[1];
  }

  // 4. Try Origin header
  const origin = headers.get('origin') || '';
  const originMatch = origin.match(/https?:\/\/([^\/]+\.myshopify\.com)/);
  if (originMatch && originMatch[1]) {
    return originMatch[1];
  }

  return null;
}

/**
 * GET endpoint for debugging - check if shop exists and has products
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const shop = searchParams.get('shop');

    if (!shop) {
      return NextResponse.json({
        status: 'error',
        error: 'Missing shop parameter',
        help: 'Add ?shop=your-store.myshopify.com to the URL',
      }, { status: 400, headers: corsHeaders });
    }

    const { query: dbQuery } = await import('@/lib/db');

    // Check if shop exists
    const shopResult = await dbQuery<{ id: string }>(
      'SELECT id FROM shops WHERE shop_domain = $1 AND uninstalled_at IS NULL',
      [shop]
    );

    if (shopResult.rows.length === 0) {
      return NextResponse.json({
        status: 'error',
        shop,
        shop_exists: false,
        message: 'Shop not found - complete onboarding first',
      }, { status: 404, headers: corsHeaders });
    }

    const shopId = shopResult.rows[0]!.id;

    // Count products
    const productResult = await dbQuery<{ count: string }>(
      'SELECT COUNT(*) as count FROM upsell_products WHERE shop_id = $1 AND is_active = true',
      [shopId]
    );
    const productCount = parseInt(productResult.rows[0]?.count || '0');

    return NextResponse.json({
      status: 'ok',
      shop,
      shop_exists: true,
      active_products: productCount,
      ready: productCount > 0,
      message: productCount > 0
        ? `Shop configured with ${productCount} upsell products`
        : 'Shop exists but no upsell products configured',
    }, { headers: corsHeaders });

  } catch (error) {
    console.error('[Upsells GET] Error:', error);
    return NextResponse.json({
      status: 'error',
      error: 'Server error',
      details: (error as Error).message,
    }, { status: 500, headers: corsHeaders });
  }
}

/**
 * Get upsell products for a cart
 * POST /api/storefront/upsells
 *
 * SIMPLIFIED - No ML, just returns merchant-selected products
 */
export async function POST(request: NextRequest) {
  try {
    // Rate limiting
    const clientIp = request.headers.get('x-forwarded-for') || 'unknown';
    if (!rateLimit(clientIp, 60, 60000)) {
      return NextResponse.json(
        { error: 'Rate limit exceeded' },
        { status: 429, headers: corsHeaders }
      );
    }

    const { searchParams } = new URL(request.url);

    // Parse request body
    let body: Record<string, unknown> = {};
    try {
      const text = await request.text();
      if (text) {
        body = JSON.parse(text);
      }
    } catch {
      // Body parsing failed, continue with empty body
    }

    // Extract shop from request
    const shop = extractShop(searchParams, body, request.headers);

    if (!shop) {
      return NextResponse.json({
        error: 'Missing shop parameter',
        help: 'Ensure TurboCart App Embed is enabled in Theme Editor',
      }, { status: 400, headers: corsHeaders });
    }

    // Get shop from database
    const { query: dbQuery } = await import('@/lib/db');
    const shopResult = await dbQuery<{
      id: string;
      settings: { max_upsells?: number; display_style?: string } | null
    }>(
      'SELECT id, settings FROM shops WHERE shop_domain = $1 AND uninstalled_at IS NULL',
      [shop]
    );

    if (shopResult.rows.length === 0) {
      return NextResponse.json({
        error: 'Shop not found',
        shop,
        help: 'Complete the onboarding process first',
      }, { status: 404, headers: corsHeaders });
    }

    const shopId = shopResult.rows[0]!.id;
    const settings = shopResult.rows[0]!.settings || {};
    const maxUpsells = settings.max_upsells || 10;
    const displayStyle = settings.display_style || 'carousel';

    // Get upsell products (simple query)
    const products = await getUpsellProducts(shopId, maxUpsells);

    // Format response
    const upsells = products.map((p, index) => ({
      id: p.shopify_product_id,
      variant_id: p.shopify_variant_id,
      title: p.title,
      handle: p.handle,
      price: p.price,
      compare_at_price: p.compare_at_price,
      image: p.image_url,
      position: index + 1,
    }));

    console.log('[Upsells] Returning', upsells.length, 'products for shop:', shop);

    return NextResponse.json({
      display_style: displayStyle,
      upsells,
      session_id: String(body.session_id || `session_${Date.now()}`),
      timestamp: new Date().toISOString(),
    }, { headers: corsHeaders });

  } catch (error) {
    console.error('[Upsells POST] Error:', error);
    return NextResponse.json(
      { error: 'Failed to get upsells', details: (error as Error).message },
      { status: 500, headers: corsHeaders }
    );
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
