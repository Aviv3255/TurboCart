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
  const appUrl = process.env.SHOPIFY_APP_URL;

  if (!apiKey || !apiSecret || !scopes || !appUrl) {
    throw new Error('Missing required Shopify configuration');
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
 */
export function validateSessionToken(token: string): {
  shop: string;
  exp: number;
  nbf: number;
  aud: string;
  sub: string;
} {
  const config = getAuthConfig();

  // Decode JWT (simplified - in production use a proper JWT library)
  const [headerB64, payloadB64, signatureB64] = token.split('.');

  if (!headerB64 || !payloadB64 || !signatureB64) {
    throw new Error('Invalid session token format');
  }

  // Verify signature
  const data = `${headerB64}.${payloadB64}`;
  const signature = crypto
    .createHmac('sha256', config.apiSecret)
    .update(data)
    .digest('base64url');

  if (signature !== signatureB64) {
    throw new Error('Invalid session token signature');
  }

  // Decode payload
  const payload = JSON.parse(Buffer.from(payloadB64, 'base64url').toString());

  // Verify expiration
  const now = Math.floor(Date.now() / 1000);
  if (payload.exp < now) {
    throw new Error('Session token expired');
  }

  if (payload.nbf > now) {
    throw new Error('Session token not yet valid');
  }

  // Verify audience
  if (payload.aud !== config.apiKey) {
    throw new Error('Invalid session token audience');
  }

  return {
    shop: payload.dest.replace('https://', ''),
    exp: payload.exp,
    nbf: payload.nbf,
    aud: payload.aud,
    sub: payload.sub,
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
