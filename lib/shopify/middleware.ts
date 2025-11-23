import { NextRequest, NextResponse } from 'next/server';
import { validateSessionToken } from './auth';
import { getShopByDomain, type Shop } from '../db/queries';

export interface AuthenticatedRequest extends NextRequest {
  shop?: Shop;
}

/**
 * Middleware to verify authentication via session token or session cookie
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
        const shopRecord = await getShopByDomain(shop);

        if (!shopRecord) {
          return NextResponse.json(
            { error: 'Shop not found' },
            { status: 404 }
          );
        }

        (request as AuthenticatedRequest).shop = shopRecord;

        return handler(request as AuthenticatedRequest);
      } catch (error) {
        console.error('Session token validation error:', error);
      }
    }

    // Fall back to session cookie
    const sessionCookie = request.cookies.get('shopify_session')?.value;
    if (sessionCookie) {
      try {
        const session = JSON.parse(sessionCookie);
        const shopRecord = await getShopByDomain(session.shop);

        if (!shopRecord) {
          return NextResponse.json(
            { error: 'Shop not found' },
            { status: 404 }
          );
        }

        (request as AuthenticatedRequest).shop = shopRecord;

        return handler(request as AuthenticatedRequest);
      } catch (error) {
        console.error('Session cookie parsing error:', error);
      }
    }

    // No valid authentication found
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    );
  } catch (error) {
    console.error('Authentication middleware error:', error);
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
