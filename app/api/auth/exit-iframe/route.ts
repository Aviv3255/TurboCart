import { NextRequest, NextResponse } from 'next/server';

/**
 * ExitIframe Route
 * Special route to break out of Shopify's embedded iframe for OAuth
 * This is the recommended Shopify pattern for OAuth in embedded apps
 */
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const shop = searchParams.get('shop');
  const host = searchParams.get('host');

  if (!shop) {
    return NextResponse.json(
      { error: 'Missing shop parameter' },
      { status: 400 }
    );
  }

  console.log('[ExitIframe] Breaking out of iframe for shop:', shop);
  console.log('[ExitIframe] Host parameter:', host || 'not provided');

  // Create the OAuth URL
  const authUrl = new URL('/api/auth', request.url);
  authUrl.searchParams.set('shop', shop);

  // Return HTML page that breaks out of iframe
  const html = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Redirecting to Shopify...</title>
      <style>
        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
          display: flex;
          align-items: center;
          justify-content: center;
          min-height: 100vh;
          margin: 0;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        }
        .container {
          text-align: center;
          color: white;
        }
        .spinner {
          border: 3px solid rgba(255, 255, 255, 0.3);
          border-top: 3px solid white;
          border-radius: 50%;
          width: 40px;
          height: 40px;
          animation: spin 1s linear infinite;
          margin: 0 auto 20px;
        }
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        h1 {
          font-size: 24px;
          margin: 0 0 10px 0;
        }
        p {
          font-size: 14px;
          opacity: 0.9;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="spinner"></div>
        <h1>TurboCart</h1>
        <p>Redirecting to Shopify for authentication...</p>
        <p style="font-size: 12px; margin-top: 20px;">If you are not redirected, <a href="${authUrl.toString()}" style="color: white; text-decoration: underline;">click here</a>.</p>
      </div>
      <script src="https://cdn.shopify.com/shopifycloud/app-bridge.js"></script>
      <script>
        (function() {
          console.log('[ExitIframe] Attempting to break out of iframe...');
          console.log('[ExitIframe] Target URL:', '${authUrl.toString()}');

          // Method 1: Try Shopify App Bridge (most reliable for embedded apps)
          if (window.shopify && typeof window.shopify === 'object') {
            try {
              console.log('[ExitIframe] Using Shopify App Bridge Redirect...');
              var createApp = window['app-bridge'].createApp || window.shopify.createApp;
              if (createApp) {
                var app = createApp({
                  apiKey: '${process.env.NEXT_PUBLIC_SHOPIFY_API_KEY || ''}',
                  host: new URLSearchParams(window.location.search).get('host') || '',
                });
                var Redirect = window['app-bridge'].Redirect || window.shopify.Redirect;
                if (Redirect) {
                  Redirect.create(app).dispatch(Redirect.Action.REMOTE, {
                    url: '${authUrl.toString()}',
                    newContext: true
                  });
                  console.log('[ExitIframe] App Bridge redirect dispatched');
                  return;
                }
              }
            } catch (error) {
              console.error('[ExitIframe] App Bridge redirect failed:', error);
            }
          }

          // Method 2: Try to redirect parent window
          if (window.top && window.top !== window.self) {
            console.log('[ExitIframe] Detected iframe, trying parent redirect...');
            try {
              window.top.location.href = '${authUrl.toString()}';
              console.log('[ExitIframe] Parent redirect successful');
              return;
            } catch (error) {
              console.error('[ExitIframe] Failed to redirect parent:', error);
            }

            // Method 3: Try using window.open with _top
            try {
              console.log('[ExitIframe] Trying window.open with _top...');
              window.open('${authUrl.toString()}', '_top');
              console.log('[ExitIframe] window.open dispatched');
              return;
            } catch (e) {
              console.error('[ExitIframe] window.open failed:', e);
            }

            // Method 4: Try meta refresh as last resort
            try {
              console.log('[ExitIframe] Using meta refresh as fallback...');
              var meta = document.createElement('meta');
              meta.httpEquiv = 'refresh';
              meta.content = '0; url=${authUrl.toString()}';
              document.getElementsByTagName('head')[0].appendChild(meta);
            } catch (metaError) {
              console.error('[ExitIframe] Meta refresh failed:', metaError);
            }
          } else {
            // Not in iframe, just redirect normally
            console.log('[ExitIframe] Not in iframe, redirecting normally...');
            window.location.href = '${authUrl.toString()}';
          }
        })();
      </script>
    </body>
    </html>
  `;

  return new NextResponse(html, {
    headers: {
      'Content-Type': 'text/html',
      'X-Frame-Options': 'ALLOW-FROM https://admin.shopify.com',
      'Content-Security-Policy': "frame-ancestors 'self' https://admin.shopify.com https://*.myshopify.com",
    },
  });
}
