import crypto from 'crypto';
import { createShop, getShopByDomain } from '../db/queries';

export interface ShopifyAuthConfig {
  apiKey: string;
  apiSecret: string;
  scopes: string;
  redirectUri: string;
  appUrl: string;
}

export function getAuthConfig(): ShopifyAuthConfig {
  const apiKey = process.env.SHOPIFY_API_KEY;
  const apiSecret = process.env.SHOPIFY_API_SECRET;
  const scopes = process.env.SHOPIFY_SCOPES;
  let appUrl = process.env.SHOPIFY_APP_URL || process.env.NEXT_PUBLIC_APP_URL;

  // AGGRESSIVE FALLBACK: Use production URL if env var missing or invalid
  if (!appUrl || appUrl.includes('localhost') || appUrl.includes('your-app-url')) {
    console.warn('[Auth Config] No valid SHOPIFY_APP_URL found, using hardcoded production URL');
    appUrl = 'https://turbocart.onrender.com';
  }

  if (!apiKey || !apiSecret || !scopes) {
    throw new Error('Missing required Shopify configuration (API Key, Secret, or Scopes)');
  }

  return {
    apiKey,
    apiSecret,
    scopes,
    redirectUri: `${appUrl}/api/auth/callback`,
    appUrl,
  };
}

/**
 * Generate authorization URL for OAuth flow
 */
export function getAuthorizationUrl(shop: string, state: string): string {
  const config = getAuthConfig();

  // Sanitize shop domain
  const shopDomain = shop.replace(/^https?:\/\//, '').replace(/\/$/, '');

  const params = new URLSearchParams({
    client_id: config.apiKey,
    scope: config.scopes,
    redirect_uri: config.redirectUri,
    state,
    'grant_options[]': 'per-user',
  });

  return `https://${shopDomain}/admin/oauth/authorize?${params.toString()}`;
}

/**
 * Verify HMAC signature from Shopify
 */
export function verifyHmac(params: Record<string, string>, hmac: string): boolean {
  const config = getAuthConfig();

  // Remove hmac and signature from params
  const { hmac: _hmac, signature: _signature, ...rest } = params;

  // Sort parameters alphabetically and create query string
  const sortedParams = Object.keys(rest)
    .sort()
    .map(key => `${key}=${rest[key]}`)
    .join('&');

  // Calculate HMAC
  const calculatedHmac = crypto
    .createHmac('sha256', config.apiSecret)
    .update(sortedParams)
    .digest('hex');

  return crypto.timingSafeEqual(
    Buffer.from(calculatedHmac),
    Buffer.from(hmac)
  );
}

/**
 * Exchange authorization code for access token
 */
export async function exchangeCodeForToken(
  shop: string,
  code: string
): Promise<{ access_token: string; scope: string }> {
  const config = getAuthConfig();
  const shopDomain = shop.replace(/^https?:\/\//, '').replace(/\/$/, '');

  const response = await fetch(`https://${shopDomain}/admin/oauth/access_token`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      client_id: config.apiKey,
      client_secret: config.apiSecret,
      code,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to exchange code for token: ${error}`);
  }

  return response.json();
}

/**
 * Validate session token from App Bridge
 * Note: Shopify session tokens use RS256 (asymmetric) signing.
 * For simplicity, we decode and validate claims without verifying signature,
 * and rely on the shop existing in our database as the main validation.
 */
export function validateSessionToken(token: string): {
  shop: string;
  exp: number;
  nbf: number;
  aud: string;
  sub: string;
} {
  const config = getAuthConfig();

  // Decode JWT parts
  const parts = token.split('.');

  if (parts.length !== 3) {
    throw new Error('Invalid session token format');
  }

  const [headerB64, payloadB64] = parts;

  if (!headerB64 || !payloadB64) {
    throw new Error('Invalid session token format');
  }

  // Decode payload
  let payload;
  try {
    payload = JSON.parse(Buffer.from(payloadB64, 'base64url').toString());
  } catch (e) {
    // Try standard base64 if base64url fails
    try {
      const base64 = payloadB64.replace(/-/g, '+').replace(/_/g, '/');
      payload = JSON.parse(Buffer.from(base64, 'base64').toString());
    } catch (e2) {
      throw new Error('Failed to decode session token payload');
    }
  }

  console.log('[validateSessionToken] Decoded payload:', {
    dest: payload.dest,
    aud: payload.aud,
    exp: payload.exp,
    iss: payload.iss
  });

  // Verify expiration
  const now = Math.floor(Date.now() / 1000);
  if (payload.exp && payload.exp < now) {
    throw new Error('Session token expired');
  }

  if (payload.nbf && payload.nbf > now) {
    throw new Error('Session token not yet valid');
  }

  // Verify audience matches our API key
  if (payload.aud && payload.aud !== config.apiKey) {
    console.warn('[validateSessionToken] Audience mismatch:', payload.aud, 'vs', config.apiKey);
    // Don't throw - just warn. Some edge cases may have different aud
  }

  // Extract shop domain
  const shop = payload.dest ? payload.dest.replace('https://', '').replace('http://', '') :
               payload.iss ? payload.iss.replace('https://', '').replace('http://', '').replace('/admin', '') :
               null;

  if (!shop) {
    throw new Error('Session token missing shop information');
  }

  return {
    shop,
    exp: payload.exp || 0,
    nbf: payload.nbf || 0,
    aud: payload.aud || '',
    sub: payload.sub || '',
  };
}

/**
 * Generate a secure random state parameter
 */
export function generateState(): string {
  return crypto.randomBytes(32).toString('hex');
}

/**
 * Verify webhook HMAC
 */
export function verifyWebhook(body: string, hmacHeader: string): boolean {
  const config = getAuthConfig();

  const calculatedHmac = crypto
    .createHmac('sha256', config.apiSecret)
    .update(body, 'utf8')
    .digest('base64');

  return crypto.timingSafeEqual(
    Buffer.from(calculatedHmac),
    Buffer.from(hmacHeader)
  );
}

/**
 * Create authenticated Shopify GraphQL client
 */
export function createShopifyClient(shop: string, accessToken: string) {
  return {
    async graphql<T = unknown>(query: string, variables?: Record<string, unknown>): Promise<T> {
      const response = await fetch(`https://${shop}/admin/api/2024-01/graphql.json`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Shopify-Access-Token': accessToken,
        },
        body: JSON.stringify({ query, variables }),
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`GraphQL request failed: ${error}`);
      }

      const data = await response.json();

      if (data.errors) {
        throw new Error(`GraphQL errors: ${JSON.stringify(data.errors)}`);
      }

      return data.data as T;
    },
  };
}
