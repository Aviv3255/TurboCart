import { NextRequest, NextResponse } from 'next/server';
import { getShopByDomain } from '@/lib/db/queries';

// Force dynamic rendering
export const dynamic = 'force-dynamic';

/**
 * Check if a shop has an active session
 * GET /api/auth/check-session?shop=...
 *
 * This endpoint is used to prevent OAuth redirect loops by checking
 * if a shop already has a valid session in the database.
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

    const hasSession = !!shopRecord;

    if (hasSession) {
      console.log('[Check Session] ✅ Shop found in database:', {
        shop,
        shopId: shopRecord.id,
        installedAt: shopRecord.installed_at,
        lastActiveAt: shopRecord.last_active_at,
        hasAccessToken: !!shopRecord.access_token
      });
    } else {
      console.log('[Check Session] ❌ Shop NOT found in database');
    }

    console.log('[Check Session] Returning hasSession:', hasSession);
    console.log('[Check Session] ========================================');

    return NextResponse.json({
      hasSession,
      shopId: shopRecord?.id || null
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
