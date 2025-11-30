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
    // Try session token first (App Bridge)
    const authHeader = request.headers.get('authorization');
    if (authHeader?.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      try {
        const { shop } = validateSessionToken(token);
        console.log('[withAuth] Session token validated for shop:', shop);
        const shopRecord = await getShopByDomain(shop);

        if (!shopRecord) {
          console.log('[withAuth] Shop not found in database:', shop);
          return NextResponse.json(
            { error: 'Shop not found' },
            { status: 404 }
          );
        }

        (request as AuthenticatedRequest).shop = shopRecord;
        return handler(request as AuthenticatedRequest);
      } catch (error) {
        console.error('[withAuth] Session token validation error:', error);
        // Continue to try other methods
      }
    }

    // Fall back to session cookie
    const sessionCookie = request.cookies.get('shopify_session')?.value;
    if (sessionCookie) {
      try {
        const session = JSON.parse(sessionCookie);
        console.log('[withAuth] Session cookie found for shop:', session.shop);
        const shopRecord = await getShopByDomain(session.shop);

        if (!shopRecord) {
          console.log('[withAuth] Shop from cookie not found:', session.shop);
          return NextResponse.json(
            { error: 'Shop not found' },
            { status: 404 }
          );
        }

        (request as AuthenticatedRequest).shop = shopRecord;
        return handler(request as AuthenticatedRequest);
      } catch (error) {
        console.error('[withAuth] Session cookie parsing error:', error);
        // Continue to try URL params
      }
    }

    // Fallback: Try shop from URL params (Shopify embeds send this)
    const { searchParams } = new URL(request.url);
    const shopFromUrl = searchParams.get('shop');

    // Also check referer for shop domain (embedded apps in Shopify admin)
    const referer = request.headers.get('referer');
    let shopFromReferer: string | null = null;
    if (referer) {
      const refererMatch = referer.match(/https:\/\/([^.]+\.myshopify\.com)/);
      if (refererMatch && refererMatch[1]) {
        shopFromReferer = refererMatch[1];
      }
    }

    const shopDomain = shopFromUrl || shopFromReferer;
    if (shopDomain) {
      console.log('[withAuth] Trying shop from URL/referer:', shopDomain);
      const normalizedShop = shopDomain.replace('https://', '').replace('http://', '');
      const shopRecord = await getShopByDomain(normalizedShop);

      if (shopRecord) {
        console.log('[withAuth] Shop found via URL param:', normalizedShop);
        (request as AuthenticatedRequest).shop = shopRecord;
        return handler(request as AuthenticatedRequest);
      }
    }

    // No valid authentication found
    console.log('[withAuth] No valid authentication found. Headers:', {
      hasAuth: !!authHeader,
      hasCookie: !!sessionCookie,
      shopFromUrl,
      shopFromReferer,
      referer
    });

    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    );
  } catch (error) {
    console.error('[withAuth] Authentication middleware error:', error);
    return NextResponse.json(
      { error: 'Authentication failed' },
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
