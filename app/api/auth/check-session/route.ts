import { NextRequest, NextResponse } from 'next/server';
import { getShopByDomain } from '@/lib/db/queries';

// Force dynamic rendering
export const dynamic = 'force-dynamic';

/**
 * Validate access token by making a simple Shopify API call
 */
async function validateAccessToken(shop: string, accessToken: string): Promise<boolean> {
  try {
    const response = await fetch(`https://${shop}/admin/api/2024-01/shop.json`, {
      method: 'GET',
      headers: {
        'X-Shopify-Access-Token': accessToken,
        'Content-Type': 'application/json',
      },
    });

    if (response.ok) {
      console.log('[Check Session] ✅ Access token is valid');
      return true;
    }

    console.log('[Check Session] ❌ Access token validation failed:', response.status, await response.text());
    return false;
  } catch (error) {
    console.error('[Check Session] ❌ Error validating access token:', error);
    return false;
  }
}

/**
 * Check if a shop has an active session
 * GET /api/auth/check-session?shop=...
 *
 * This endpoint is used to prevent OAuth redirect loops by checking
 * if a shop already has a valid session in the database.
 *
 * Now also validates that the access token is actually working!
 */
export async function GET(request: NextRequest) {
  try {
    const shop = request.nextUrl.searchParams.get('shop');

    console.log('[Check Session] ========================================');
    console.log('[Check Session] Checking session for shop:', shop);
    console.log('[Check Session] Request URL:', request.url);
    console.log('[Check Session] Time:', new Date().toISOString());

    if (!shop) {
      console.log('[Check Session] ❌ No shop parameter provided');
      return NextResponse.json({ hasSession: false });
    }

    // Check database for shop with active installation
    console.log('[Check Session] Querying database for shop:', shop);
    const shopRecord = await getShopByDomain(shop);

    if (!shopRecord) {
      console.log('[Check Session] ❌ Shop NOT found in database');
      console.log('[Check Session] ========================================');
      return NextResponse.json({
        hasSession: false,
        shopId: null
      });
    }

    console.log('[Check Session] Shop found in database:', {
      shop,
      shopId: shopRecord.id,
      installedAt: shopRecord.installed_at,
      lastActiveAt: shopRecord.last_active_at,
      hasAccessToken: !!shopRecord.access_token
    });

    // Validate the access token is still working
    console.log('[Check Session] Validating access token...');
    const isTokenValid = await validateAccessToken(shop, shopRecord.access_token);

    if (!isTokenValid) {
      console.log('[Check Session] ❌ Access token is INVALID - forcing re-auth');
      console.log('[Check Session] ========================================');
      return NextResponse.json({
        hasSession: false, // Force re-auth
        shopId: shopRecord.id,
        tokenExpired: true
      });
    }

    console.log('[Check Session] ✅ Session is valid');
    console.log('[Check Session] ========================================');

    return NextResponse.json({
      hasSession: true,
      shopId: shopRecord.id
    });
  } catch (error) {
    console.error('[Check Session] ⚠️ ERROR checking session:', error);
    console.error('[Check Session] Error details:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      name: error instanceof Error ? error.name : undefined
    });
    console.log('[Check Session] ========================================');

    // On error, assume no session to trigger OAuth
    return NextResponse.json({ hasSession: false }, { status: 500 });
  }
}
