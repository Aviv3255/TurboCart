/**
 * Authenticated Fetch Utility for App Bridge v4
 *
 * Uses the global `window.shopify` object (loaded via App Bridge CDN)
 * to get the session token and include it in API requests.
 */

declare global {
  interface Window {
    shopify?: {
      idToken: () => Promise<string>;
      environment?: {
        embedded?: boolean;
        mobile?: boolean;
      };
    };
  }
}

/**
 * Get session token from App Bridge
 */
async function getSessionToken(): Promise<string | null> {
  if (typeof window === 'undefined') {
    return null;
  }

  // Wait for shopify object to be available (max 5 seconds)
  let attempts = 0;
  while (!window.shopify && attempts < 50) {
    await new Promise(resolve => setTimeout(resolve, 100));
    attempts++;
  }

  if (!window.shopify?.idToken) {
    console.warn('App Bridge not available - running outside Shopify admin');
    return null;
  }

  try {
    const token = await window.shopify.idToken();
    return token;
  } catch (error) {
    console.error('Failed to get session token:', error);
    return null;
  }
}

/**
 * Authenticated fetch wrapper for Shopify embedded apps
 *
 * Usage:
 * ```ts
 * import { authenticatedFetch } from '@/lib/shopify/authenticated-fetch';
 *
 * const response = await authenticatedFetch('/api/admin/products');
 * const data = await response.json();
 * ```
 */
export async function authenticatedFetch(
  input: RequestInfo | URL,
  init?: RequestInit
): Promise<Response> {
  const token = await getSessionToken();

  const headers = new Headers(init?.headers);

  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  // Ensure Content-Type is set for POST/PUT requests with body
  if (init?.body && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  return fetch(input, {
    ...init,
    headers,
  });
}

/**
 * Check if running in embedded Shopify admin
 */
export function isEmbedded(): boolean {
  if (typeof window === 'undefined') {
    return false;
  }
  return window.shopify?.environment?.embedded ?? false;
}

/**
 * Hook-like function to get authenticated fetch
 * Can be used in components that need to make authenticated requests
 */
export function useAuthenticatedFetch() {
  return authenticatedFetch;
}

export default authenticatedFetch;
