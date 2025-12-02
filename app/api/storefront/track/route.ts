import { NextRequest, NextResponse } from 'next/server';
import { trackEvent } from '@/lib/db/queries';
import { rateLimit } from '@/lib/shopify/middleware';

// CORS headers for storefront requests
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

/**
 * Helper to validate shop domain
 */
function isValidShop(s: string | null | undefined): s is string {
  return !!s && s !== 'null' && s !== 'undefined' && s !== '' && s.includes('.myshopify.com');
}

/**
 * Extract shop from request
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

  return null;
}

/**
 * Track upsell events (impressions, clicks, adds, purchases)
 * POST /api/storefront/track
 *
 * SIMPLIFIED - Just logs events to database, no ML processing
 */
export async function POST(request: NextRequest) {
  try {
    // Rate limiting
    const clientIp = request.headers.get('x-forwarded-for') || 'unknown';
    if (!rateLimit(clientIp, 120, 60000)) {
      return NextResponse.json(
        { error: 'Rate limit exceeded' },
        { status: 429, headers: corsHeaders }
      );
    }

    const { searchParams } = new URL(request.url);

    // Parse request body
    let body: Record<string, unknown> = {};
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { error: 'Invalid JSON body' },
        { status: 400, headers: corsHeaders }
      );
    }

    // Extract shop
    const shop = extractShop(searchParams, body, request.headers);
    if (!shop) {
      return NextResponse.json(
        { error: 'Missing shop parameter' },
        { status: 400, headers: corsHeaders }
      );
    }

    const {
      event_type,
      product_id,
      product_ids,
      session_id,
      customer_id,
      cart_token,
      revenue,
      quantity = 1,
      display_style,
      cart_value,
      cart_item_count,
      position,
    } = body as {
      event_type?: string;
      product_id?: number;
      product_ids?: number[];
      session_id?: string;
      customer_id?: number;
      cart_token?: string;
      revenue?: number;
      quantity?: number;
      display_style?: string;
      cart_value?: number;
      cart_item_count?: number;
      position?: number;
    };

    if (!event_type || (!product_id && !product_ids)) {
      return NextResponse.json(
        { error: 'Missing required parameters: event_type and product_id/product_ids' },
        { status: 400, headers: corsHeaders }
      );
    }

    // Validate event type
    const validEventTypes = ['impression', 'click', 'add', 'purchase', 'remove'];
    if (!validEventTypes.includes(event_type)) {
      return NextResponse.json(
        { error: 'Invalid event type' },
        { status: 400, headers: corsHeaders }
      );
    }

    // Get shop ID
    const { query: dbQuery } = await import('@/lib/db');
    const shopResult = await dbQuery<{ id: string }>(
      'SELECT id FROM shops WHERE shop_domain = $1 AND uninstalled_at IS NULL',
      [shop]
    );

    if (shopResult.rows.length === 0) {
      return NextResponse.json(
        { error: 'Shop not found' },
        { status: 404, headers: corsHeaders }
      );
    }

    const shopId = shopResult.rows[0]!.id;
    const productIdsArray = product_ids || (product_id ? [product_id] : []);

    // Track events in database
    for (const pid of productIdsArray) {
      const productResult = await dbQuery<{ id: string }>(
        'SELECT id FROM upsell_products WHERE shop_id = $1 AND shopify_product_id = $2',
        [shopId, pid]
      );

      const upsellProductId = productResult.rows[0]?.id || null;

      await trackEvent(shopId, {
        upsell_product_id: upsellProductId,
        event_type: event_type as 'impression' | 'click' | 'add' | 'purchase' | 'remove',
        session_id: session_id || 'unknown',
        customer_id: customer_id,
        cart_token: cart_token || '',
        revenue: revenue,
        quantity: quantity,
        context: {
          display_style,
          position,
          cart_value,
          cart_item_count,
          user_agent: request.headers.get('user-agent'),
          timestamp: new Date().toISOString(),
        },
      });
    }

    return NextResponse.json({
      success: true,
      event_type,
      products_tracked: productIdsArray.length,
      tracked_at: new Date().toISOString(),
    }, { headers: corsHeaders });

  } catch (error) {
    console.error('[Track] Error:', error);
    return NextResponse.json(
      { error: 'Failed to track event' },
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
