import { NextRequest, NextResponse } from 'next/server';
import { type CartItem } from '@/lib/ai/recommendations';
import { rateLimit } from '@/lib/shopify/middleware';

// CORS headers for storefront requests
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
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
 * Simple fallback: Get upsell products directly from database
 * Used when ML tables don't exist yet
 */
async function getSimpleUpsells(shopId: string, maxProducts: number = 3): Promise<UpsellProduct[]> {
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
 * Get upsell recommendations for a cart
 * POST /api/storefront/upsells
 *
 * Uses ML when available, falls back to simple product list otherwise
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
    const { session_id = `session_${Date.now()}` } = body;

    // Get shop ID from database
    const { query: dbQuery } = await import('@/lib/db');
    const shopResult = await dbQuery<{ id: string; settings: { max_upsells?: number; display_style?: string } | null }>(
      'SELECT id, settings FROM shops WHERE shop_domain = $1 AND uninstalled_at IS NULL',
      [shop]
    );

    if (shopResult.rows.length === 0) {
      return NextResponse.json(
        { error: 'Shop not found' },
        { status: 404, headers: corsHeaders }
      );
    }

    const shopId = shopResult.rows[0]!.id;
    const settings = shopResult.rows[0]!.settings || {};
    const maxUpsells = settings.max_upsells || 3;
    const displayStyle = settings.display_style || 'minimal-strip';

    // Try ML engine first, fall back to simple query
    let upsells: Array<{
      id: number;
      variant_id: number | null;
      title: string;
      handle: string;
      price: number;
      compare_at_price: number | null;
      image: string | null;
      position: number;
      ml_score?: number;
    }> = [];

    let mlPowered = false;
    let decisionType = 'simple';

    try {
      // Try to use ML engine
      const { MLOptimizationEngine } = await import('@/lib/ml/optimization-engine');

      const formattedCartItems: CartItem[] = (body.cart_items || []).map((item: {
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

      const context = MLOptimizationEngine.extractContext(formattedCartItems, session_id);
      const mlEngine = new MLOptimizationEngine(shopId);
      const decision = await mlEngine.makeDecision(context);

      // Check if we got real products (not emergency fallback)
      if (decision.products.length > 0 && decision.products[0]?.product.shopify_product_id !== 0) {
        upsells = decision.products.map(p => ({
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
        mlPowered = true;
        decisionType = decision.decisionType;
      }
    } catch (mlError) {
      console.log('ML engine not available, using simple fallback:', (mlError as Error).message);
    }

    // If ML didn't return products, use simple fallback
    if (upsells.length === 0) {
      const simpleProducts = await getSimpleUpsells(shopId, maxUpsells);
      upsells = simpleProducts.map((p, index) => ({
        id: p.shopify_product_id,
        variant_id: p.shopify_variant_id,
        title: p.title,
        handle: p.handle,
        price: p.price,
        compare_at_price: p.compare_at_price,
        image: p.image_url,
        position: index + 1,
      }));
    }

    return NextResponse.json({
      display_style: displayStyle,
      upsells,
      session_id: session_id,
      decision_id: `dec_${Date.now()}`,
      confidence: mlPowered ? 0.7 : 0.5,
      decision_type: decisionType,
      ml_powered: mlPowered,
      timestamp: new Date().toISOString(),
    }, { headers: corsHeaders });

  } catch (error) {
    console.error('Error getting upsells:', error);
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
