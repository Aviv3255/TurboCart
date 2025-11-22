import { NextRequest, NextResponse } from 'next/server';
import { verifyWebhook } from '@/lib/shopify/auth';
import { query } from '@/lib/db';

/**
 * GDPR Webhook: customers/data_request
 * Merchant requests customer data for GDPR compliance
 *
 * Required response time: 30 days
 * Must provide all customer data stored by the app
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
    const { shop_domain, customer, orders_requested } = payload;

    // Log the request
    console.log('GDPR data request received:', {
      shop: shop_domain,
      customer_id: customer?.id,
      orders_requested: orders_requested?.length || 0,
    });

    // Collect all data we have about this customer
    const customerData = await collectCustomerData(
      shop_domain,
      customer?.id,
      customer?.email
    );

    // In production, you would:
    // 1. Generate a comprehensive data export
    // 2. Store it securely
    // 3. Send email to merchant with download link
    // 4. Delete export after 30 days

    // For now, log the data request
    await query(
      `INSERT INTO webhook_logs (shop_id, topic, payload, hmac_verified, processing_status)
       VALUES ((SELECT id FROM shops WHERE shop_domain = $1), $2, $3, true, 'processed')`,
      [shop_domain, 'customers/data_request', JSON.stringify(payload)]
    );

    // Acknowledge receipt
    return NextResponse.json({
      message: 'Data request received and will be processed within 30 days',
    });
  } catch (error) {
    console.error('GDPR data request error:', error);
    return NextResponse.json(
      { error: 'Failed to process data request' },
      { status: 500 }
    );
  }
}

/**
 * Collect all customer data from our database
 */
async function collectCustomerData(
  shopDomain: string,
  customerId?: number,
  email?: string
): Promise<Record<string, unknown>> {
  try {
    // Get shop
    const shopResult = await query(
      'SELECT id FROM shops WHERE shop_domain = $1',
      [shopDomain]
    );

    if (shopResult.rows.length === 0) {
      return { message: 'No data found for this shop' };
    }

    const shopId = shopResult.rows[0]!.id;

    // Collect upsell events for this customer
    const eventsResult = await query(
      `SELECT
         event_type,
         created_at,
         revenue,
         quantity,
         context
       FROM upsell_events
       WHERE shop_id = $1 AND customer_id = $2
       ORDER BY created_at DESC`,
      [shopId, customerId]
    );

    return {
      shop_domain: shopDomain,
      customer_id: customerId,
      customer_email: email,
      upsell_interactions: eventsResult.rows,
      data_collected_at: new Date().toISOString(),
    };
  } catch (error) {
    console.error('Error collecting customer data:', error);
    throw error;
  }
}
