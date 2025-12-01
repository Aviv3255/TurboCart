import { NextRequest, NextResponse } from 'next/server';
import { type CartItem } from '@/lib/ai/recommendations';
import { rateLimit } from '@/lib/shopify/middleware';
import { MLOptimizationEngine } from '@/lib/ml/optimization-engine';
import { trackEvent } from '@/lib/db/queries';

// CORS headers for storefront requests
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

/**
 * Get upsell recommendations for a cart
 * POST /api/storefront/upsells
 *
 * NOW POWERED BY ML OPTIMIZATION ENGINE!
 * Uses Thompson Sampling + contextual learning for maximum revenue
 */
export async function POST(request: NextRequest) {
  try {
    // Rate limiting
    const clientIp = request.headers.get('x-forwarded-for') || 'unknown';
    if (!rateLimit(clientIp, 60, 60000)) { // 60 requests per minute
      return NextResponse.json(
        { error: 'Rate limit exceeded' },
        { status: 429, headers: corsHeaders }
      );
    }

    // Get shop from request (shop parameter or domain)
    const { searchParams } = new URL(request.url);
    let shop = searchParams.get('shop');

    // Also try to get shop from request body
    let body;
    try {
      body = await request.json();
      if (!shop && body.shop) {
        shop = body.shop;
      }
    } catch {
      body = {};
    }

    if (!shop) {
      return NextResponse.json(
        { error: 'Missing shop parameter' },
        { status: 400, headers: corsHeaders }
      );
    }

    // Parse request body
    const { cart_items, session_id = `session_${Date.now()}`, customer_id } = body;

    if (!cart_items || !Array.isArray(cart_items)) {
      return NextResponse.json(
        { error: 'Invalid cart_items' },
        { status: 400, headers: corsHeaders }
      );
    }

    // Convert Shopify cart format to our format
    const formattedCartItems: CartItem[] = cart_items.map((item: {
      id?: number;
      key?: string;
      product_id: number;
      variant_id?: number;
      title?: string;
      product_title?: string;
      product_type?: string;
      vendor?: string;
      collection_id?: number;
      price: number;
      quantity?: number;
    }) => ({
      id: Number(item.id || item.key || 0),
      product_id: item.product_id,
      variant_id: item.variant_id || item.id || 0,
      title: item.title || item.product_title || '',
      product_type: item.product_type || undefined,
      vendor: item.vendor || undefined,
      collection_id: item.collection_id || undefined,
      price: item.price,
      quantity: item.quantity || 1,
    }));

    // Get shop ID from database
    const { query: dbQuery } = await import('@/lib/db');
    const shopResult = await dbQuery(
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

    // Extract context from cart
    const context = MLOptimizationEngine.extractContext(
      formattedCartItems,
      session_id,
      customer_id
    );

    // Use ML optimization engine to make decision
    const mlEngine = new MLOptimizationEngine(shopId);
    const decision = await mlEngine.makeDecision(context);

    // Track impression event for each product
    for (const product of decision.products) {
      await trackEvent(shopId, {
        upsell_product_id: product.product.id,
        event_type: 'impression',
        session_id: session_id,
        customer_id: customer_id || null,
        cart_token: session_id,
        cart_items: formattedCartItems,
        context: {
          display_style: decision.displayStyle,
          decision_type: decision.decisionType,
          position: product.position,
          confidence: decision.confidence,
        },
      });
    }

    // Format response for storefront
    const upsells = decision.products.map(p => ({
      id: p.product.shopify_product_id,
      variant_id: p.product.shopify_variant_id,
      title: p.product.title,
      handle: p.product.handle,
      price: p.product.price,
      compare_at_price: p.product.compare_at_price,
      image: p.product.image_url,
      position: p.position,
      ml_score: p.score,
    }));

    return NextResponse.json({
      display_style: decision.displayStyle,
      upsells,
      session_id: session_id,
      decision_id: decision.decisionId,
      confidence: decision.confidence,
      decision_type: decision.decisionType,
      ml_powered: true,
      timestamp: new Date().toISOString(),
    }, { headers: corsHeaders });

  } catch (error) {
    console.error('Error getting ML upsells:', error);
    return NextResponse.json(
      { error: 'Failed to get recommendations' },
      { status: 500, headers: corsHeaders }
    );
  }
}

/**
 * Options for CORS
 */
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: corsHeaders,
  });
}
