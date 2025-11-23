import { NextRequest, NextResponse } from 'next/server';
import { trackEvent } from '@/lib/db/queries';
import { rateLimit } from '@/lib/shopify/middleware';

/**
 * Track upsell events (impressions, clicks, adds)
 * POST /api/storefront/track
 */
export async function POST(request: NextRequest) {
  try {
    // Rate limiting
    const clientIp = request.headers.get('x-forwarded-for') || 'unknown';
    if (!rateLimit(clientIp, 120, 60000)) { // 120 requests per minute
      return NextResponse.json(
        { error: 'Rate limit exceeded' },
        { status: 429 }
      );
    }

    // Get shop from request
    const { searchParams } = new URL(request.url);
    const shop = searchParams.get('shop');

    if (!shop) {
      return NextResponse.json(
        { error: 'Missing shop parameter' },
        { status: 400 }
      );
    }

    // Parse request body
    const body = await request.json();
    const {
      event_type,
      product_id,
      session_id,
      customer_id,
      cart_token,
      revenue,
      quantity = 1,
    } = body;

    if (!event_type || !product_id) {
      return NextResponse.json(
        { error: 'Missing required parameters' },
        { status: 400 }
      );
    }

    // Validate event type
    const validEventTypes = ['impression', 'click', 'add', 'purchase', 'remove'];
    if (!validEventTypes.includes(event_type)) {
      return NextResponse.json(
        { error: 'Invalid event type' },
        { status: 400 }
      );
    }

    // Get shop ID
    const { query: dbQuery } = await import('@/lib/db');
    const shopResult = await dbQuery(
      'SELECT id FROM shops WHERE shop_domain = $1 AND uninstalled_at IS NULL',
      [shop]
    );

    if (shopResult.rows.length === 0) {
      return NextResponse.json(
        { error: 'Shop not found' },
        { status: 404 }
      );
    }

    const shopId = shopResult.rows[0]!.id;

    // Get upsell product ID
    const productResult = await dbQuery(
      'SELECT id FROM upsell_products WHERE shop_id = $1 AND shopify_product_id = $2',
      [shopId, product_id]
    );

    const upsellProductId = productResult.rows[0]?.id || null;

    // Track the event
    await trackEvent(shopId, {
      upsell_product_id: upsellProductId,
      event_type: event_type as 'impression' | 'click' | 'add' | 'purchase' | 'remove',
      session_id: session_id || 'unknown',
      customer_id: customer_id || null,
      cart_token: cart_token || null,
      revenue: revenue || null,
      quantity: quantity,
      context: {
        user_agent: request.headers.get('user-agent'),
        referer: request.headers.get('referer'),
        timestamp: new Date().toISOString(),
      },
    });

    return NextResponse.json({
      success: true,
      event_type,
      tracked_at: new Date().toISOString(),
    });

  } catch (error) {
    console.error('Error tracking event:', error);
    return NextResponse.json(
      { error: 'Failed to track event' },
      { status: 500 }
    );
  }
}

/**
 * Options for CORS
 */
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}
