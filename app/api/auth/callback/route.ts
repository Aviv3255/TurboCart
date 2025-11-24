import { NextRequest, NextResponse } from 'next/server';
import { exchangeCodeForToken, verifyHmac } from '@/lib/shopify/auth';
import { createShop } from '@/lib/db/queries';

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
    const { access_token, scope } = await exchangeCodeForToken(shop, code);

    // Save shop to database
    const shopRecord = await createShop(shop, access_token);

    // Create session
    const response = NextResponse.redirect(
      new URL('/dashboard', request.url)
    );

    // Set session cookie
    response.cookies.set('shopify_session', JSON.stringify({
      shop: shop,
      shopId: shopRecord.id,
      accessToken: access_token,
    }), {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: '/',
    });

    // Clear OAuth cookies
    response.cookies.delete('shopify_oauth_state');
    response.cookies.delete('shopify_shop');

    return response;
  } catch (error) {
    console.error('OAuth callback error:', error);
    return NextResponse.json(
      { error: 'Authentication callback failed' },
      { status: 500 }
    );
  }
}
