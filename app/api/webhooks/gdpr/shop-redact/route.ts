import { NextRequest, NextResponse } from 'next/server';
import { verifyWebhook } from '@/lib/shopify/auth';
import { query, transaction } from '@/lib/db';

/**
 * GDPR Webhook: shop/redact
 * Shop owner requests deletion of all store data (48 hours after app uninstall)
 *
 * Required response time: Immediate
 * Must delete ALL shop data
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.text();
    const hmac = request.headers.get('x-shopify-hmac-sha256');

    if (!hmac) {
      return NextResponse.json(
        { error: 'Missing HMAC header' },
        { status: 401 }
      );
    }

    // Verify webhook authenticity
    if (!verifyWebhook(body, hmac)) {
      return NextResponse.json(
        { error: 'Invalid HMAC signature' },
        { status: 403 }
      );
    }

    const payload = JSON.parse(body);
    const { shop_domain } = payload;

    console.log('GDPR shop redaction request:', {
      shop: shop_domain,
    });

    // Get shop ID
    const shopResult = await query(
      'SELECT id FROM shops WHERE shop_domain = $1',
      [shop_domain]
    );

    if (shopResult.rows.length === 0) {
      // Shop not found - no data to redact
      return NextResponse.json({
        message: 'No data found for this shop',
      });
    }

    const shopId = shopResult.rows[0]!.id;

    // Delete all shop data
    await deleteShopData(shopId, shop_domain, JSON.stringify(payload));

    return NextResponse.json({
      message: 'Shop data deleted successfully',
    });
  } catch (error) {
    console.error('GDPR shop redaction error:', error);
    return NextResponse.json(
      { error: 'Failed to delete shop data' },
      { status: 500 }
    );
  }
}

/**
 * Delete all data associated with a shop
 */
async function deleteShopData(
  shopId: string,
  shopDomain: string,
  payload: string
): Promise<void> {
  try {
    await transaction(async (client) => {
      // Log the redaction first (before deleting shop)
      await client.query(
        `INSERT INTO webhook_logs (shop_id, topic, payload, hmac_verified, processing_status)
         VALUES ($1, $2, $3, true, 'processed')`,
        [shopId, 'shop/redact', payload]
      );

      // Delete all related data (cascading deletes will handle most of this)
      // But we'll be explicit for clarity

      // Delete product affinities
      await client.query(
        'DELETE FROM product_affinities WHERE shop_id = $1',
        [shopId]
      );

      // Delete analytics aggregates
      await client.query(
        'DELETE FROM analytics_daily WHERE shop_id = $1',
        [shopId]
      );

      // Delete A/B tests
      await client.query(
        'DELETE FROM ab_tests WHERE shop_id = $1',
        [shopId]
      );

      // Delete upsell events
      await client.query(
        'DELETE FROM upsell_events WHERE shop_id = $1',
        [shopId]
      );

      // Delete upsell products
      await client.query(
        'DELETE FROM upsell_products WHERE shop_id = $1',
        [shopId]
      );

      // Delete sessions
      await client.query(
        'DELETE FROM sessions WHERE shop_id = $1',
        [shopId]
      );

      // Finally, delete the shop record
      await client.query(
        'DELETE FROM shops WHERE id = $1',
        [shopId]
      );

      console.log(`Successfully deleted all data for shop: ${shopDomain}`);
    });
  } catch (error) {
    console.error('Error deleting shop data:', error);
    throw error;
  }
}
