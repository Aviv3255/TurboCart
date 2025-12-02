/**
 * Test endpoint for TurboCart storefront injection
 * Accessible without auth for debugging
 */

import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const shop = searchParams.get('shop');

  const results: Record<string, unknown> = {
    status: 'ok',
    timestamp: new Date().toISOString(),
    version: '2.0.0',
    endpoints: {
      inject_js: 'https://turbocart.onrender.com/api/storefront/inject.js',
      upsells: 'https://turbocart.onrender.com/api/storefront/upsells?shop=YOUR_SHOP',
      test: 'https://turbocart.onrender.com/api/storefront/test?shop=YOUR_SHOP',
    },
  };

  if (shop) {
    try {
      // Check if shop exists in database
      const shopResult = await query(
        `SELECT id, shop_domain, settings, created_at FROM shops WHERE shop_domain = $1`,
        [shop]
      );

      if (shopResult.rows.length > 0) {
        const shopData = shopResult.rows[0];
        results.shop = {
          found: true,
          domain: shopData.shop_domain,
          settings: shopData.settings,
          created: shopData.created_at,
        };

        // Check for upsell products
        const upsellResult = await query(
          `SELECT COUNT(*) as count FROM upsell_products WHERE shop_id = $1 AND is_active = true`,
          [shopData.id]
        );
        results.upsell_products = parseInt(upsellResult.rows[0]?.count || '0');

        // Check for ScriptTag status (from database if we stored it)
        results.script_tag_url = 'https://turbocart.onrender.com/api/storefront/inject.js';
        results.app_embed_url = 'Check Theme Editor > App embeds > TurboCart';
      } else {
        results.shop = {
          found: false,
          message: 'Shop not found in database. Make sure the app is installed.',
        };
      }
    } catch (error) {
      results.shop = {
        found: false,
        error: error instanceof Error ? error.message : 'Database error',
      };
    }
  } else {
    results.usage = 'Add ?shop=your-store.myshopify.com to check shop status';
  }

  return NextResponse.json(results, {
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Cache-Control': 'no-cache',
    },
  });
}
