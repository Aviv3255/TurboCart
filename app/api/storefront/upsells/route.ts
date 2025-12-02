import { NextRequest, NextResponse } from 'next/server';
import { type CartItem } from '@/lib/ai/recommendations';
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
        received_params: Object.fromEntries(searchParams.entries()),
      }, { status: 400, headers: corsHeaders });
    }

    // Try to connect to database
    let dbConnected = false;
    let shopExists = false;
    let productCount = 0;

    try {
      const { query: dbQuery } = await import('@/lib/db');

      // Test connection
      await dbQuery('SELECT 1');
      dbConnected = true;

      // Check if shop exists
      const shopResult = await dbQuery<{ id: string }>(
        'SELECT id FROM shops WHERE shop_domain = $1 AND uninstalled_at IS NULL',
        [shop]
      );

      if (shopResult.rows.length > 0) {
        shopExists = true;
        const shopId = shopResult.rows[0]!.id;

        // Count products
        const productResult = await dbQuery<{ count: string }>(
          'SELECT COUNT(*) as count FROM upsell_products WHERE shop_id = $1 AND is_active = true',
          [shopId]
        );
        productCount = parseInt(productResult.rows[0]?.count || '0');
      }
    } catch (dbError) {
      return NextResponse.json({
        status: 'error',
        error: 'Database connection failed',
        details: (dbError as Error).message,
        shop,
      }, { status: 503, headers: corsHeaders });
    }

    return NextResponse.json({
      status: 'ok',
      shop,
      database_connected: dbConnected,
      shop_exists: shopExists,
      active_products: productCount,
      ready: shopExists && productCount > 0,
      message: shopExists
        ? (productCount > 0
          ? `Shop configured with ${productCount} upsell products`
          : 'Shop exists but no upsell products configured')
        : 'Shop not found in database - complete onboarding first',
    }, { headers: corsHeaders });

  } catch (error) {
    return NextResponse.json({
      status: 'error',
      error: 'Unexpected error',
      details: (error as Error).message,
    }, { status: 500, headers: corsHeaders });
  }
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

    // Get shop from URL query params first
    const { searchParams } = new URL(request.url);
    let shop = searchParams.get('shop');

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

    // Helper to check if shop is valid
    const isValidShop = (s: string | null | undefined): s is string => {
      return !!s && s !== 'null' && s !== 'undefined' && s !== '' && s.includes('.myshopify.com');
    };

    // Try to get shop from body if URL param is invalid
    if (!isValidShop(shop) && body.shop) {
      shop = String(body.shop);
    }

    // Try to extract shop from Referer or Origin headers as fallback
    if (!isValidShop(shop)) {
      const referer = request.headers.get('referer') || '';
      const origin = request.headers.get('origin') || '';

      // Try referer first
      const refererMatch = referer.match(/https?:\/\/([^\/]+\.myshopify\.com)/);
      if (refererMatch && refererMatch[1]) {
        shop = refererMatch[1];
        console.log('[Upsells] Extracted shop from referer:', shop);
      } else {
        // Try origin
        const originMatch = origin.match(/https?:\/\/([^\/]+\.myshopify\.com)/);
        if (originMatch && originMatch[1]) {
          shop = originMatch[1];
          console.log('[Upsells] Extracted shop from origin:', shop);
        }
      }
    }

    // Log what we received for debugging
    console.log('[Upsells] Request:', {
      url_shop: searchParams.get('shop'),
      body_shop: body.shop,
      final_shop: shop,
      referer: request.headers.get('referer')?.substring(0, 100),
    });

    // Validate shop parameter
    if (!isValidShop(shop)) {
      return NextResponse.json({
        error: 'Missing or invalid shop parameter',
        debug: {
          received_url_shop: searchParams.get('shop'),
          received_body_shop: body.shop || null,
          referer: request.headers.get('referer'),
        },
        help: 'Ensure TurboCart App Embed is enabled in Theme Editor, or check that window.Shopify.shop is available',
      }, { status: 400, headers: corsHeaders });
    }

    // Get session_id from body
    const session_id = String(body.session_id || `session_${Date.now()}`);

    // Get shop ID from database
    let shopId: string;
    let settings: { max_upsells?: number; display_style?: string } = {};

    try {
      const { query: dbQuery } = await import('@/lib/db');
      const shopResult = await dbQuery<{ id: string; settings: { max_upsells?: number; display_style?: string } | null }>(
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

      shopId = shopResult.rows[0]!.id;
      settings = shopResult.rows[0]!.settings || {};
    } catch (dbError) {
      console.error('Database error:', dbError);
      return NextResponse.json({
        error: 'Database unavailable',
        details: (dbError as Error).message,
      }, { status: 503, headers: corsHeaders });
    }

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

      const cartItems = Array.isArray(body.cart_items) ? body.cart_items : [];
      const formattedCartItems: CartItem[] = cartItems.map((item: {
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
      console.log('ML decision failed, falling back:', (mlError as Error).message);
    }

    // If ML didn't return products, use simple fallback
    if (upsells.length === 0) {
      console.log('[Upsells] ML returned 0 products, using simple fallback for shop:', shopId);
      try {
        const simpleProducts = await getSimpleUpsells(shopId, maxUpsells);
        console.log('[Upsells] Simple fallback returned', simpleProducts.length, 'products');
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
      } catch (dbError) {
        console.error('[Upsells] Error fetching upsell products:', dbError);
      }
    }

    console.log('[Upsells] Returning', upsells.length, 'products for shop:', shop);

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
      { error: 'Failed to get recommendations', details: (error as Error).message },
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
