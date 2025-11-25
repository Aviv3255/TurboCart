import { NextRequest, NextResponse } from 'next/server';
import { trackEvent } from '@/lib/db/queries';
import { rateLimit } from '@/lib/shopify/middleware';
import { learnFromEvent } from '@/lib/ml/learning-engine';

/**
 * Track upsell events (impressions, clicks, adds, purchases)
 * POST /api/storefront/track
 *
 * NOW FEEDS INTO ML LEARNING ENGINE!
 * Every event updates Thompson Sampling parameters and learns patterns
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
      product_ids,        // Can track multiple products at once
      session_id,
      customer_id,
      cart_token,
      revenue,
      quantity = 1,
      display_style,      // NEW: Which display style was shown
      cart_value,         // NEW: Cart value for context
      cart_item_count,    // NEW: Cart item count for context
      position,           // NEW: Product position
      decision_id,        // NEW: Link to ML decision
    } = body;

    if (!event_type || (!product_id && !product_ids)) {
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

    // Handle single or multiple products
    const productIdsArray = product_ids || [product_id];

    // Track event in database
    for (const pid of productIdsArray) {
      const productResult = await dbQuery(
        'SELECT id FROM upsell_products WHERE shop_id = $1 AND shopify_product_id = $2',
        [shopId, pid]
      );

      const upsellProductId = productResult.rows[0]?.id || null;

      await trackEvent(shopId, {
        upsell_product_id: upsellProductId,
        event_type: event_type as 'impression' | 'click' | 'add' | 'purchase' | 'remove',
        session_id: session_id || 'unknown',
        customer_id: customer_id || null,
        cart_token: cart_token || null,
        revenue: revenue || null,
        quantity: quantity,
        context: {
          display_style: display_style,
          position: position,
          decision_id: decision_id,
          cart_value: cart_value,
          cart_item_count: cart_item_count,
          user_agent: request.headers.get('user-agent'),
          referer: request.headers.get('referer'),
          timestamp: new Date().toISOString(),
        },
      });
    }

    // Feed event into ML learning engine (async, don't wait)
    if (display_style && cart_value !== undefined) {
      const hour = new Date().getHours();
      let timeOfDay: string;
      if (hour < 12) timeOfDay = 'morning';
      else if (hour < 17) timeOfDay = 'afternoon';
      else if (hour < 21) timeOfDay = 'evening';
      else timeOfDay = 'night';

      const productPositions: Record<number, number> = {};
      productIdsArray.forEach((pid: number, index: number) => {
        productPositions[pid] = position || index + 1;
      });

      learnFromEvent({
        shopId,
        sessionId: session_id || 'unknown',
        eventType: event_type as 'impression' | 'click' | 'add' | 'purchase',
        displayStyle: display_style,
        productIds: productIdsArray,
        productPositions,
        revenue: revenue || undefined,
        cartValue: cart_value,
        cartItemCount: cart_item_count || 1,
        timeOfDay,
        dayOfWeek: new Date().getDay(),
        decisionId: decision_id,
      }).catch((err) => {
        console.error('ML learning error:', err);
        // Don't fail the request if ML learning fails
      });
    }

    return NextResponse.json({
      success: true,
      event_type,
      ml_learning: display_style ? 'enabled' : 'disabled',
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
