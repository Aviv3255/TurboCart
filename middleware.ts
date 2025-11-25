import { NextRequest, NextResponse } from 'next/server';

/**
 * Global middleware for route protection and authentication
 */
export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Skip middleware for public routes
  const publicRoutes = [
    '/',
    '/api/auth',
    '/api/auth/callback',
    '/api/webhooks',
    '/api/storefront',
    '/_next',
    '/favicon.ico',
  ];

  // Check if route is public
  const isPublicRoute = publicRoutes.some(route =>
    pathname === route || pathname.startsWith(`${route}/`)
  );

  if (isPublicRoute) {
    return NextResponse.next();
  }

  // For admin routes, check authentication
  if (pathname.startsWith('/dashboard') ||
      pathname.startsWith('/analytics') ||
      pathname.startsWith('/products') ||
      pathname.startsWith('/settings') ||
      pathname.startsWith('/billing') ||
      pathname.startsWith('/onboarding')) {

    const sessionCookie = request.cookies.get('shopify_session')?.value;

    // If no session, redirect to install page
    if (!sessionCookie) {
      const url = new URL('/', request.url);
      return NextResponse.redirect(url);
    }

    // Add shop parameter to URL if not present
    try {
      const session = JSON.parse(sessionCookie);
      const url = request.nextUrl.clone();

      if (!url.searchParams.has('shop')) {
        url.searchParams.set('shop', session.shop);
      }

      // Add host parameter if available (needed for App Bridge)
      const host = request.headers.get('x-shopify-shop-domain');
      if (host && !url.searchParams.has('host')) {
        // Encode host as base64 (Shopify's convention)
        const hostParam = Buffer.from(`${session.shop}/admin`).toString('base64');
        url.searchParams.set('host', hostParam);
      }

      return NextResponse.rewrite(url);
    } catch (error) {
      // Invalid session cookie, redirect to install
      const url = new URL('/', request.url);
      const response = NextResponse.redirect(url);
      response.cookies.delete('shopify_session');
      return response;
    }
  }

  // For API routes that require auth
  if (pathname.startsWith('/api/admin')) {
    const sessionCookie = request.cookies.get('shopify_session')?.value;
    const authHeader = request.headers.get('authorization');

    if (!sessionCookie && !authHeader) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};
