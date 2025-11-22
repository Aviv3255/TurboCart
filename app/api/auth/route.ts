import { NextRequest, NextResponse } from 'next/server';
import { getAuthorizationUrl, generateState, verifyHmac } from '@/lib/shopify/auth';

/**
 * OAuth initiation endpoint
 * GET /api/auth?shop=store.myshopify.com
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const shop = searchParams.get('shop');
    const hmac = searchParams.get('hmac');

    if (!shop) {
      return NextResponse.json(
        { error: 'Missing shop parameter' },
        { status: 400 }
      );
    }

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

    // Store state in a cookie
    const response = NextResponse.redirect(
      getAuthorizationUrl(shopDomain, state)
    );

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

    return response;
  } catch (error) {
    console.error('OAuth initiation error:', error);
    return NextResponse.json(
      { error: 'Authentication failed' },
      { status: 500 }
    );
  }
}
