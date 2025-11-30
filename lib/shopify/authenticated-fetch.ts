/**
 * Authenticated Fetch Utility for App Bridge v4
 *
 * Uses the global `window.shopify` object (loaded via App Bridge CDN)
 * to get the session token and include it in API requests.
 *
 * Also extracts shop domain from URL params as fallback authentication.
 */

declare global {
  interface Window {
    shopify?: {
      idToken: () => Promise<string>;
      environment?: {
        embedded?: boolean;
        mobile?: boolean;
      };
      config?: {
        shop?: string;
      };
    };
  }
}

/**
 * Get shop domain from URL params or App Bridge
 */
function getShopDomain(): string | null {
  if (typeof window === 'undefined') {
    return null;
  }

  // Try URL params first (Shopify always adds these for embedded apps)
  const urlParams = new URLSearchParams(window.location.search);
  const shopFromUrl = urlParams.get('shop');
  if (shopFromUrl) {
    console.log('[authenticatedFetch] Shop from URL params:', shopFromUrl);
    return shopFromUrl;
  }

  // Try App Bridge config
  if (window.shopify?.config?.shop) {
    console.log('[authenticatedFetch] Shop from App Bridge config:', window.shopify.config.shop);
    return window.shopify.config.shop;
  }

  // Try to extract from document referrer (for embedded apps)
  try {
    const referrer = document.referrer;
    if (referrer) {
      const match = referrer.match(/([^./]+\.myshopify\.com)/);
      if (match && match[1]) {
        console.log('[authenticatedFetch] Shop from referrer:', match[1]);
        return match[1];
      }
    }
  } catch (e) {
    // Cross-origin access denied, skip
  }

  console.warn('[authenticatedFetch] Could not determine shop domain');
  return null;
}

/**
 * Get session token from App Bridge
 */
async function getSessionToken(): Promise<string | null> {
  if (typeof window === 'undefined') {
    return null;
  }

  // Wait for shopify object to be available (max 3 seconds)
  let attempts = 0;
  while (!window.shopify && attempts < 30) {
    await new Promise(resolve => setTimeout(resolve, 100));
    attempts++;
  }

  if (!window.shopify?.idToken) {
    console.warn('[authenticatedFetch] App Bridge idToken not available');
    return null;
  }

  try {
    const token = await window.shopify.idToken();
    console.log('[authenticatedFetch] Got session token from App Bridge');
    return token;
  } catch (error) {
    console.error('[authenticatedFetch] Failed to get session token:', error);
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
  const shopDomain = getShopDomain();

  const headers = new Headers(init?.headers);

  // Add Authorization header if we have a token
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  // Ensure Content-Type is set for POST/PUT requests with body
  if (init?.body && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  // Add shop domain to URL if available (fallback auth method)
  let url = typeof input === 'string' ? input : input.toString();
  if (shopDomain && !url.includes('shop=')) {
    const separator = url.includes('?') ? '&' : '?';
    url = `${url}${separator}shop=${encodeURIComponent(shopDomain)}`;
  }

  console.log('[authenticatedFetch] Request:', {
    url,
    hasToken: !!token,
    shopDomain,
    method: init?.method || 'GET'
  });

  return fetch(url, {
    ...init,
    headers,
    credentials: 'include', // Include cookies for session-based auth
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
