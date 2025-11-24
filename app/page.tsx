'use client';

import { useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';

function HomeContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const shop = searchParams.get('shop');
  const error = searchParams.get('error');
  const errorMessage = searchParams.get('message');

  useEffect(() => {
    // If accessed with shop parameter, check session via API
    if (shop && !error) {
      console.log('[Home] Shop parameter detected:', shop);
      console.log('[Home] Full URL params:', {
        shop,
        host: searchParams.get('host'),
        embedded: searchParams.get('embedded'),
        isInIframe: window.self !== window.top
      });

      // Check session via API call instead of cookies (more reliable)
      fetch(`/api/auth/check-session?shop=${shop}`)
        .then(res => {
          console.log('[Home] Session check response status:', res.status);
          if (!res.ok) {
            throw new Error(`HTTP ${res.status}`);
          }
          return res.json();
        })
        .then(data => {
          console.log('[Home] Session check result:', data);

          if (data.hasSession) {
            console.log('[Home] ✅ Session exists! Redirecting to dashboard');

            // Build dashboard URL with all necessary parameters
            const dashboardUrl = new URL('/dashboard', window.location.origin);
            dashboardUrl.searchParams.set('shop', shop);

            const host = searchParams.get('host');
            if (host) {
              dashboardUrl.searchParams.set('host', host);
            }

            console.log('[Home] Dashboard URL:', dashboardUrl.toString());
            window.location.href = dashboardUrl.toString();
          } else {
            console.log('[Home] ❌ No session found, starting OAuth flow');

            // Check if we're embedded in an iframe
            const isEmbedded = searchParams.get('embedded') === '1' || window.self !== window.top;

            if (isEmbedded) {
              console.log('[Home] Detected embedded app, using ExitIframe route');
              const exitIframeUrl = new URL('/api/auth/exit-iframe', window.location.origin);
              exitIframeUrl.searchParams.set('shop', shop);

              const host = searchParams.get('host');
              if (host) {
                exitIframeUrl.searchParams.set('host', host);
              }

              console.log('[Home] Redirecting to ExitIframe:', exitIframeUrl.toString());
              window.location.href = exitIframeUrl.toString();
            } else {
              console.log('[Home] Not embedded, redirecting directly to OAuth');
              window.location.href = `/api/auth?shop=${shop}`;
            }
          }
        })
        .catch(error => {
          console.error('[Home] ⚠️ Session check failed with error:', error);
          console.error('[Home] Error details:', {
            message: error.message,
            stack: error.stack
          });

          // On error, assume no session and try OAuth
          console.log('[Home] Falling back to OAuth due to error');
          window.location.href = `/api/auth?shop=${shop}`;
        });
    }
  }, [shop, error, searchParams]);

  // Show error if present
  if (error) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center p-24 bg-gradient-to-br from-red-50 to-orange-50">
        <div className="max-w-2xl text-center">
          <div className="mb-8">
            <div className="text-6xl mb-4">⚠️</div>
            <h1 className="text-4xl font-bold mb-4 text-red-600">
              Authentication Failed
            </h1>
            <p className="text-xl text-gray-700 mb-4">
              We encountered an error while trying to authenticate your store.
            </p>
            {errorMessage && (
              <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
                <p className="text-sm">{errorMessage}</p>
              </div>
            )}
          </div>

          <div className="bg-white rounded-2xl shadow-xl p-8 mb-6">
            <h2 className="text-xl font-semibold mb-4 text-gray-800">
              What to do next:
            </h2>
            <ol className="text-left space-y-3 text-gray-600">
              <li className="flex items-start">
                <span className="font-bold mr-2">1.</span>
                <span>Make sure you're installing from your Shopify Partners dashboard</span>
              </li>
              <li className="flex items-start">
                <span className="font-bold mr-2">2.</span>
                <span>Check that your store URL is correct (e.g., yourstore.myshopify.com)</span>
              </li>
              <li className="flex items-start">
                <span className="font-bold mr-2">3.</span>
                <span>Try the installation again by clicking the button below</span>
              </li>
            </ol>
          </div>

          <button
            onClick={() => router.push('/')}
            className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-8 py-3 rounded-lg font-semibold hover:shadow-lg transition-shadow"
          >
            Try Again
          </button>
        </div>
      </main>
    );
  }

  // If no shop parameter and no session, show install instructions
  if (!shop) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center p-24 bg-gradient-to-br from-blue-50 to-purple-50">
        <div className="max-w-2xl text-center">
          <div className="mb-8">
            <h1 className="text-6xl font-bold mb-4 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              TurboCart
            </h1>
            <p className="text-2xl text-gray-700 mb-2">
              AI-Powered Cart Upsells for Shopify
            </p>
            <p className="text-gray-500">
              Boost your revenue with intelligent product recommendations
            </p>
          </div>

          <div className="bg-white rounded-2xl shadow-xl p-8 mb-6">
            <h2 className="text-xl font-semibold mb-4 text-gray-800">
              📦 How to Install
            </h2>
            <ol className="text-left space-y-3 text-gray-600">
              <li className="flex items-start">
                <span className="font-bold mr-2">1.</span>
                <span>Go to your Shopify Partners dashboard</span>
              </li>
              <li className="flex items-start">
                <span className="font-bold mr-2">2.</span>
                <span>Navigate to Apps → TurboCart</span>
              </li>
              <li className="flex items-start">
                <span className="font-bold mr-2">3.</span>
                <span>Click "Install app" on your development store</span>
              </li>
            </ol>
          </div>

          <div className="text-sm text-gray-500">
            Or install via URL: <code className="bg-gray-100 px-2 py-1 rounded">https://turbocart.onrender.com/api/auth?shop=YOUR-STORE.myshopify.com</code>
          </div>
        </div>
      </main>
    );
  }

  // Loading state while redirecting
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24">
      <div className="text-center">
        <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
          TurboCart
        </h1>
        <p className="text-xl text-gray-600">
          AI-Powered Cart Upsells for Shopify
        </p>
        <div className="mt-8">
          <div className="spinner-cosmic mx-auto"></div>
          <p className="mt-4 text-sm text-gray-500">Redirecting to Shopify...</p>
        </div>
      </div>
    </main>
  );
}

export default function Home() {
  return (
    <Suspense fallback={
      <main className="flex min-h-screen flex-col items-center justify-center p-24">
        <div className="text-center">
          <div className="spinner-cosmic mx-auto"></div>
          <p className="mt-4 text-sm text-gray-500">Loading...</p>
        </div>
      </main>
    }>
      <HomeContent />
    </Suspense>
  );
}
