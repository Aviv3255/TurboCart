import { NextRequest, NextResponse } from 'next/server';
import { getAuthorizationUrl, generateState, verifyHmac } from '@/lib/shopify/auth';

// Force dynamic rendering for OAuth routes
export const dynamic = 'force-dynamic';

/**
 * OAuth initiation endpoint
 * GET /api/auth?shop=store.myshopify.com
 */
export async function GET(request: NextRequest) {
  try {
    console.log('[OAuth] Starting OAuth initiation');

    const searchParams = request.nextUrl.searchParams;
    const shop = searchParams.get('shop');
    const hmac = searchParams.get('hmac');

    console.log('[OAuth] Shop parameter:', shop);
    console.log('[OAuth] Has HMAC:', !!hmac);

    if (!shop) {
      console.error('[OAuth] Missing shop parameter');
      return NextResponse.json(
        { error: 'Missing shop parameter' },
        { status: 400 }
      );
    }

    // Verify environment variables are set
    const apiKey = process.env.SHOPIFY_API_KEY;
    const apiSecret = process.env.SHOPIFY_API_SECRET;
    let appUrl = process.env.SHOPIFY_APP_URL || process.env.NEXT_PUBLIC_APP_URL;

    console.log('[OAuth] Environment check:', {
      hasApiKey: !!apiKey,
      hasApiSecret: !!apiSecret,
      hasAppUrl: !!appUrl,
      appUrlValue: appUrl
    });

    // AGGRESSIVE FALLBACK: Use production URL if env var missing or invalid
    if (!appUrl || appUrl.includes('localhost') || appUrl.includes('your-app-url')) {
      console.warn('[OAuth] No valid SHOPIFY_APP_URL found, using hardcoded production URL');
      appUrl = 'https://turbocart.onrender.com';
    }

    if (!apiKey || !apiSecret) {
      console.error('[OAuth] Missing critical environment variables (API Key or Secret)');
      return NextResponse.json(
        { error: 'Server configuration error - missing credentials' },
        { status: 500 }
      );
    }

    console.log('[OAuth] Environment variables OK, using App URL:', appUrl);

    // Sanitize shop domain
    const shopDomain = shop.replace(/^https?:\/\//, '').replace(/\/$/, '');

    // Validate shop domain format
    if (!shopDomain.endsWith('.myshopify.com')) {
      return NextResponse.json(
        { error: 'Invalid shop domain' },
        { status: 400 }
      );
    }

    // If HMAC is present, verify it
    if (hmac) {
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
    }

    // Generate state parameter for CSRF protection
    const state = generateState();
    console.log('[OAuth] Generated state parameter');

    // Get authorization URL
    const authUrl = getAuthorizationUrl(shopDomain, state);
    console.log('[OAuth] Authorization URL generated:', authUrl.substring(0, 50) + '...');

    // Store state in a cookie
    const response = NextResponse.redirect(authUrl);

    response.cookies.set('shopify_oauth_state', state, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 10, // 10 minutes
      path: '/',
    });

    response.cookies.set('shopify_shop', shopDomain, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 10,
      path: '/',
    });

    console.log('[OAuth] Redirecting to Shopify OAuth');
    return response;
  } catch (error) {
    console.error('[OAuth] Initiation error:', error);
    console.error('[OAuth] Error details:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    });
    return NextResponse.json(
      {
        error: 'Authentication failed',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
