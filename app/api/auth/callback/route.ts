import { NextRequest, NextResponse } from 'next/server';
import { exchangeCodeForToken, verifyHmac } from '@/lib/shopify/auth';
import { createShop } from '@/lib/db/queries';
import { registerWebhooks } from '@/lib/shopify/webhooks';

// Force dynamic rendering for OAuth routes
export const dynamic = 'force-dynamic';

/**
 * OAuth callback endpoint
 * GET /api/auth/callback?code=...&hmac=...&shop=...&state=...
 */
export async function GET(request: NextRequest) {
  try {
    console.log('[OAuth Callback] Starting callback processing');

    const searchParams = request.nextUrl.searchParams;
    const code = searchParams.get('code');
    const hmac = searchParams.get('hmac');
    const shop = searchParams.get('shop');
    const state = searchParams.get('state');

    console.log('[OAuth Callback] Parameters received:', {
      hasCode: !!code,
      hasHmac: !!hmac,
      shop,
      hasState: !!state
    });

    // Validate required parameters
    if (!code || !hmac || !shop || !state) {
      console.error('[OAuth Callback] Missing required parameters');
      return NextResponse.json(
        { error: 'Missing required parameters' },
        { status: 400 }
      );
    }

    // Verify state (CSRF protection)
    const storedState = request.cookies.get('shopify_oauth_state')?.value;
    const storedShop = request.cookies.get('shopify_shop')?.value;

    if (!storedState || storedState !== state) {
      return NextResponse.json(
        { error: 'Invalid state parameter' },
        { status: 403 }
      );
    }

    if (!storedShop || storedShop !== shop) {
      return NextResponse.json(
        { error: 'Shop mismatch' },
        { status: 403 }
      );
    }

    // Verify HMAC
    const params: Record<string, string> = {};
    searchParams.forEach((value, key) => {
      params[key] = value;
    });

    if (!verifyHmac(params, hmac)) {
      return NextResponse.json(
        { error: 'Invalid HMAC signature' },
        { status: 403 }
      );
    }

    // Exchange code for access token
    console.log('[OAuth Callback] Exchanging code for access token');
    const { access_token, scope } = await exchangeCodeForToken(shop, code);
    console.log('[OAuth Callback] Access token received, scope:', scope);

    // Save shop to database
    console.log('[OAuth Callback] ========================================');
    console.log('[OAuth Callback] Saving shop to database:', shop);
    const shopRecord = await createShop(shop, access_token);
    console.log('[OAuth Callback] ✅ Shop saved successfully!');
    console.log('[OAuth Callback] Shop details:', {
      id: shopRecord.id,
      shop_domain: shopRecord.shop_domain,
      installed_at: shopRecord.installed_at,
      uninstalled_at: shopRecord.uninstalled_at,
      hasAccessToken: !!shopRecord.access_token
    });
    console.log('[OAuth Callback] ========================================');

    // Register webhooks
    console.log('[OAuth Callback] Registering webhooks...');
    const webhookResult = await registerWebhooks(shop, access_token);
    if (!webhookResult.success) {
      console.warn('[OAuth Callback] Some webhooks failed to register:', webhookResult.errors);
    } else {
      console.log('[OAuth Callback] ✅ All webhooks registered successfully');
    }

    // Get API key for redirect
    const apiKey = process.env.SHOPIFY_API_KEY;
    if (!apiKey) {
      throw new Error('SHOPIFY_API_KEY not configured');
    }

    // Create Shopify admin app URL (this will embed the app in Shopify admin)
    const shopifyAdminUrl = `https://${shop}/admin/apps/${apiKey}`;
    console.log('[OAuth Callback] Redirecting to Shopify Admin:', shopifyAdminUrl);

    // Create response with redirect to Shopify admin (embedded)
    const response = NextResponse.redirect(shopifyAdminUrl);

    // Set session cookie with correct attributes for embedded apps
    // SameSite=None is required for cross-origin iframe (Shopify embedded app)
    // Secure=true is required when using SameSite=None
    response.cookies.set('shopify_session', JSON.stringify({
      shop: shop,
      shopId: shopRecord.id,
      accessToken: access_token,
    }), {
      httpOnly: true,
      secure: true, // Always true for SameSite=None
      sameSite: 'none', // Required for embedded apps in iframe
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: '/',
    });

    // Clear OAuth cookies
    response.cookies.delete('shopify_oauth_state');
    response.cookies.delete('shopify_shop');

    console.log('[OAuth Callback] OAuth flow completed successfully');
    return response;
  } catch (error) {
    console.error('[OAuth Callback] Fatal error:', error);
    console.error('[OAuth Callback] Error details:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      name: error instanceof Error ? error.name : undefined
    });

    // Create error page URL
    const errorUrl = new URL('/', request.url);
    errorUrl.searchParams.set('error', 'auth_failed');
    errorUrl.searchParams.set('message', error instanceof Error ? error.message : 'Unknown error');

    // Redirect to error page
    const response = NextResponse.redirect(errorUrl);

    // Clear any OAuth cookies
    response.cookies.delete('shopify_oauth_state');
    response.cookies.delete('shopify_shop');

    return response;
  }
}
