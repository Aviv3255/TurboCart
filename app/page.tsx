'use client';

import { useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';

function HomeContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const shop = searchParams.get('shop');

  useEffect(() => {
    // If accessed with shop parameter, initiate OAuth
    if (shop) {
      window.location.href = `/api/auth?shop=${shop}`;
    }
  }, [shop]);

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
