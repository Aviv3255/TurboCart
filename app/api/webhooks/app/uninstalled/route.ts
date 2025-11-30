/**
 * App Uninstalled Webhook
 * Handles cleanup when a shop uninstalls the app
 */

import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import crypto from 'crypto';

// Force dynamic rendering
export const dynamic = 'force-dynamic';

/**
 * Verify Shopify webhook signature
 */
function verifyWebhookSignature(body: string, hmacHeader: string): boolean {
  const secret = process.env.SHOPIFY_API_SECRET;
  if (!secret) {
    console.error('[Uninstall Webhook] Missing SHOPIFY_API_SECRET');
    return false;
  }

  const hash = crypto
    .createHmac('sha256', secret)
    .update(body, 'utf8')
    .digest('base64');

  return crypto.timingSafeEqual(Buffer.from(hash), Buffer.from(hmacHeader));
}

/**
 * POST /api/webhooks/app/uninstalled
 * Called by Shopify when the app is uninstalled
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.text();
    const hmacHeader = request.headers.get('x-shopify-hmac-sha256');

    console.log('[Uninstall Webhook] ========================================');
    console.log('[Uninstall Webhook] Received uninstall webhook');

    // Verify webhook signature
    if (hmacHeader && !verifyWebhookSignature(body, hmacHeader)) {
      console.error('[Uninstall Webhook] Invalid HMAC signature');
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
    }

    const data = JSON.parse(body);
    const shopDomain = data.myshopify_domain || data.domain;

    console.log('[Uninstall Webhook] Shop domain:', shopDomain);

    if (!shopDomain) {
      console.error('[Uninstall Webhook] No shop domain in webhook payload');
      return NextResponse.json({ error: 'Missing shop domain' }, { status: 400 });
    }

    // Get the shop record
    const shopResult = await query<{ id: string }>(
      'SELECT id FROM shops WHERE shop_domain = $1',
      [shopDomain]
    );

    if (shopResult.rows.length === 0) {
      console.log('[Uninstall Webhook] Shop not found:', shopDomain);
      return NextResponse.json({ success: true, message: 'Shop not found' });
    }

    const shopId = shopResult.rows[0].id;
    console.log('[Uninstall Webhook] Found shop ID:', shopId);

    // Clean up all shop data
    console.log('[Uninstall Webhook] Cleaning up shop data...');

    // Delete upsell products
    await query('DELETE FROM upsell_products WHERE shop_id = $1', [shopId]);
    console.log('[Uninstall Webhook] Deleted upsell products');

    // Delete upsell events
    await query('DELETE FROM upsell_events WHERE shop_id = $1', [shopId]);
    console.log('[Uninstall Webhook] Deleted upsell events');

    // Delete analytics data
    await query('DELETE FROM analytics_daily WHERE shop_id = $1', [shopId]);
    console.log('[Uninstall Webhook] Deleted analytics data');

    // Delete A/B tests
    await query('DELETE FROM ab_tests WHERE shop_id = $1', [shopId]);
    console.log('[Uninstall Webhook] Deleted A/B tests');

    // Delete product affinities
    await query('DELETE FROM product_affinities WHERE shop_id = $1', [shopId]);
    console.log('[Uninstall Webhook] Deleted product affinities');

    // Reset shop settings and mark as uninstalled
    await query(
      `UPDATE shops
       SET uninstalled_at = NOW(),
           settings = '{"display_style": "minimal-strip", "cart_type": "drawer", "max_upsells": 3, "position": "top", "enable_ab_testing": true}'::jsonb,
           plan = 'free',
           plan_status = 'trial',
           billing_id = NULL,
           trial_ends_at = NULL
       WHERE id = $1`,
      [shopId]
    );
    console.log('[Uninstall Webhook] Reset shop settings and marked as uninstalled');

    console.log('[Uninstall Webhook] ✅ Successfully cleaned up shop:', shopDomain);
    console.log('[Uninstall Webhook] ========================================');

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[Uninstall Webhook] ❌ Error:', error);
    // Return 200 to prevent Shopify from retrying
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}
