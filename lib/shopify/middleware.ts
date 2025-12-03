import { NextRequest, NextResponse } from 'next/server';
import { validateSessionToken } from './auth';
import { getShopByDomain, type Shop } from '../db/queries';

export interface AuthenticatedRequest extends NextRequest {
  shop?: Shop;
}

/**
 * Middleware to verify authentication via session token, session cookie, or URL params
 *
 * Authentication methods (in order of preference):
 * 1. Bearer token from App Bridge (Authorization header)
 * 2. Session cookie (set during OAuth callback)
 * 3. Shop parameter from URL (Shopify always sends this for embedded apps)
 */
export async function withAuth(
  request: NextRequest,
  handler: (req: AuthenticatedRequest) => Promise<NextResponse>
): Promise<NextResponse> {
  try {
    let shopDomain: string | null = null;

    // Extract shop from URL params first (most reliable for embedded apps)
    const { searchParams } = new URL(request.url);
    const shopFromUrl = searchParams.get('shop');
    if (shopFromUrl) {
      shopDomain = shopFromUrl.replace('https://', '').replace('http://', '');
      console.log('[withAuth] Shop from URL params:', shopDomain);
    }

    // Try to extract from referer header
    if (!shopDomain) {
      const referer = request.headers.get('referer');
      if (referer) {
        // Match both formats: store-name.myshopify.com and admin.shopify.com/store/store-name
        const refererMatch = referer.match(/https:\/\/([^\/]+\.myshopify\.com)/) ||
                            referer.match(/admin\.shopify\.com\/store\/([^\/]+)/);
        if (refererMatch && refererMatch[1]) {
          shopDomain = refererMatch[1].includes('.myshopify.com')
            ? refererMatch[1]
            : `${refererMatch[1]}.myshopify.com`;
          console.log('[withAuth] Shop from referer:', shopDomain);
        }
      }
    }

    // Try session token from App Bridge
    const authHeader = request.headers.get('authorization');
    if (authHeader?.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      try {
        const tokenData = validateSessionToken(token);
        if (tokenData.shop) {
          shopDomain = tokenData.shop;
          console.log('[withAuth] Shop from session token:', shopDomain);
        }
      } catch (error) {
        console.warn('[withAuth] Session token validation failed:', (error as Error).message);
        // Continue - we may have shop from URL params
      }
    }

    // Try session cookie
    if (!shopDomain) {
      const sessionCookie = request.cookies.get('shopify_session')?.value;
      if (sessionCookie) {
        try {
          const session = JSON.parse(sessionCookie);
          if (session.shop) {
            shopDomain = session.shop;
            console.log('[withAuth] Shop from cookie:', shopDomain);
          }
        } catch (error) {
          console.warn('[withAuth] Session cookie parsing failed');
        }
      }
    }

    // Look up shop in database
    if (shopDomain) {
      const shopRecord = await getShopByDomain(shopDomain);

      if (shopRecord) {
        console.log('[withAuth] ✓ Authenticated shop:', shopDomain);
        (request as AuthenticatedRequest).shop = shopRecord;
        return handler(request as AuthenticatedRequest);
      } else {
        console.log('[withAuth] Shop not found in database:', shopDomain);
        // Return specific error for shop not found - might need OAuth
        return NextResponse.json(
          { error: 'Shop not installed', code: 'SHOP_NOT_FOUND', shop: shopDomain },
          { status: 401 }
        );
      }
    }

    // No shop found
    console.log('[withAuth] Could not determine shop. Headers:', {
      hasAuth: !!authHeader,
      hasCookie: !!request.cookies.get('shopify_session'),
      shopFromUrl,
      referer: request.headers.get('referer')
    });

    return NextResponse.json(
      { error: 'Unauthorized', code: 'NO_SHOP' },
      { status: 401 }
    );
  } catch (error) {
    console.error('[withAuth] Authentication middleware error:', error);
    return NextResponse.json(
      { error: 'Authentication failed', details: (error as Error).message },
      { status: 500 }
    );
  }
}

/**
 * Rate limiting middleware
 */
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();

export function rateLimit(
  identifier: string,
  limit: number = 100,
  windowMs: number = 60000
): boolean {
  const now = Date.now();
  const record = rateLimitMap.get(identifier);

  if (!record || now > record.resetTime) {
    rateLimitMap.set(identifier, {
      count: 1,
      resetTime: now + windowMs,
    });
    return true;
  }

  if (record.count >= limit) {
    return false;
  }

  record.count++;
  return true;
}

/**
 * Clean up expired rate limit entries (call periodically)
 */
export function cleanupRateLimit(): void {
  const now = Date.now();
  for (const [key, record] of rateLimitMap.entries()) {
    if (now > record.resetTime) {
      rateLimitMap.delete(key);
    }
  }
}

// Cleanup every 5 minutes
if (typeof setInterval !== 'undefined') {
  setInterval(cleanupRateLimit, 5 * 60 * 1000);
}
