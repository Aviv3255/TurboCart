import { NextRequest, NextResponse } from 'next/server';
import { verifyWebhook } from '@/lib/shopify/auth';
import { query } from '@/lib/db';

/**
 * GDPR Webhook: customers/redact
 * Customer requests deletion of their data
 *
 * Required response time: 30 days
 * Must delete all customer personal data
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
    const { shop_domain, customer, orders_to_redact } = payload;

    console.log('GDPR customer redaction request:', {
      shop: shop_domain,
      customer_id: customer?.id,
      orders_to_redact: orders_to_redact?.length || 0,
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

    // Redact customer data
    await redactCustomerData(shopId, customer?.id);

    // Log the redaction
    await query(
      `INSERT INTO webhook_logs (shop_id, topic, payload, hmac_verified, processing_status)
       VALUES ($1, $2, $3, true, 'processed')`,
      [shopId, 'customers/redact', JSON.stringify(payload)]
    );

    return NextResponse.json({
      message: 'Customer data redacted successfully',
    });
  } catch (error) {
    console.error('GDPR customer redaction error:', error);
    return NextResponse.json(
      { error: 'Failed to redact customer data' },
      { status: 500 }
    );
  }
}

/**
 * Redact (anonymize) all customer personal data
 */
async function redactCustomerData(
  shopId: string,
  customerId?: number
): Promise<void> {
  try {
    // We don't store much personal data, but we need to redact what we have
    // Update events to remove customer_id (keep the event for analytics but anonymize it)
    await query(
      `UPDATE upsell_events
       SET customer_id = NULL,
           context = context || '{"redacted": true}'::jsonb
       WHERE shop_id = $1 AND customer_id = $2`,
      [shopId, customerId]
    );

    console.log(`Redacted data for customer ${customerId} in shop ${shopId}`);
  } catch (error) {
    console.error('Error redacting customer data:', error);
    throw error;
  }
}
