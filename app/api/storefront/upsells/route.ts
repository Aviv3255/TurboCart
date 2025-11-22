import { NextRequest, NextResponse } from 'next/server';
import { getSmartRecommendations, type CartItem } from '@/lib/ai/recommendations';
import { trackEvent } from '@/lib/db/queries';
import { rateLimit } from '@/lib/shopify/middleware';

/**
 * Get upsell recommendations for a cart
 * POST /api/storefront/upsells
 */
export async function POST(request: NextRequest) {
  try {
    // Rate limiting
    const clientIp = request.headers.get('x-forwarded-for') || 'unknown';
    if (!rateLimit(clientIp, 60, 60000)) { // 60 requests per minute
      return NextResponse.json(
        { error: 'Rate limit exceeded' },
        { status: 429 }
      );
    }

    // Get shop from request (shop parameter or domain)
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
    const { cart_items, session_id, customer_id, max_results = 5 } = body;

    if (!cart_items || !Array.isArray(cart_items)) {
      return NextResponse.json(
        { error: 'Invalid cart_items' },
        { status: 400 }
      );
    }

    // Convert Shopify cart format to our format
    const formattedCartItems: CartItem[] = cart_items.map((item: any) => ({
      id: item.id || item.key,
      product_id: item.product_id,
      variant_id: item.variant_id || item.id,
      title: item.title || item.product_title,
      product_type: item.product_type,
      vendor: item.vendor,
      collection_id: item.collection_id,
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
        { status: 404 }
      );
    }

    const shopId = shopResult.rows[0]!.id;

    // Get recommendations
    const recommendations = await getSmartRecommendations(
      shopId,
      formattedCartItems,
      {
        maxResults: max_results,
        customerId: customer_id,
        sessionId: session_id,
      }
    );

    // Format response for storefront
    const upsells = recommendations.map(rec => ({
      id: rec.shopify_product_id,
      variant_id: rec.shopify_variant_id,
      title: rec.title,
      handle: rec.handle,
      price: rec.price,
      compare_at_price: rec.compare_at_price,
      image: rec.image_url,
      score: rec.score,
      confidence: rec.confidence,
      matching_factors: rec.matching_factors,
    }));

    return NextResponse.json({
      upsells,
      session_id: session_id,
      timestamp: new Date().toISOString(),
    });

  } catch (error) {
    console.error('Error getting upsells:', error);
    return NextResponse.json(
      { error: 'Failed to get recommendations' },
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
