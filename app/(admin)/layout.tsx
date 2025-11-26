/**
 * Admin Dashboard Layout
 * Native Shopify embedded app style with App Bridge v4 navigation
 * Navigation appears in Shopify's sidebar under app name
 */

'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import Script from 'next/script';
import { AppProvider } from '@shopify/polaris';
import { NavMenu } from '@shopify/app-bridge-react';
import '@shopify/polaris/build/esm/styles.css';

// Polaris i18n config
const POLARIS_I18N = {
  Polaris: {
    Avatar: {
      label: 'Avatar',
      labelWithInitials: 'Avatar with initials {initials}',
    },
    ContextualSaveBar: {
      save: 'Save',
      discard: 'Discard',
    },
    TextField: {
      characterCount: '{count} characters',
    },
    TopBar: {
      toggleMenuLabel: 'Toggle menu',
    },
    Modal: {
      iFrameTitle: 'body markup',
    },
    Frame: {
      skipToContent: 'Skip to content',
      navigationLabel: 'Navigation',
    },
  },
};

// Content wrapper with styles
function AppContent({ children }: { children: React.ReactNode }) {
  return (
    <>
      <div className="shopify-app-content">
        {children}
      </div>
      <style jsx>{`
        .shopify-app-content {
          min-height: 100vh;
          background: #f6f6f7;
        }
      `}</style>
    </>
  );
}

function AdminLayoutContent({
  children,
}: {
  children: React.ReactNode;
}) {
  const [onboardingChecked, setOnboardingChecked] = useState(false);
  const [isNewUser, setIsNewUser] = useState(false);
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  // Get shop and host from URL for App Bridge
  const shop = searchParams.get('shop') || '';
  const host = searchParams.get('host') || '';

  // Check if we have App Bridge context (running inside Shopify admin)
  const hasAppBridge = Boolean(shop && host && process.env.NEXT_PUBLIC_SHOPIFY_API_KEY);

  // Check if user needs onboarding
  useEffect(() => {
    const checkOnboarding = async () => {
      // Skip check if already on onboarding page
      if (pathname === '/onboarding') {
        setOnboardingChecked(true);
        return;
      }

      try {
        const response = await fetch('/api/admin/shop/onboarding-status');
        if (response.ok) {
          const data = await response.json();
          if (!data.onboardingComplete) {
            setIsNewUser(true);
            router.push('/onboarding');
          }
        }
      } catch (error) {
        console.error('Error checking onboarding status:', error);
      }
      setOnboardingChecked(true);
    };

    checkOnboarding();
  }, [pathname, router]);

  // Don't render until onboarding check is complete
  if (!onboardingChecked || isNewUser) {
    return (
      <div className="admin-loading">
        <div className="loading-spinner" />
        <p>Loading...</p>
        <style jsx>{`
          .admin-loading {
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            min-height: 400px;
            background: #f6f6f7;
          }
          .loading-spinner {
            width: 32px;
            height: 32px;
            border: 3px solid #e4e5e7;
            border-top-color: #5c6ac4;
            border-radius: 50%;
            animation: spin 0.8s linear infinite;
          }
          @keyframes spin {
            to { transform: rotate(360deg); }
          }
          p {
            margin-top: 12px;
            color: #6d7175;
            font-size: 14px;
          }
        `}</style>
      </div>
    );
  }

  // If we have App Bridge context (running inside Shopify admin)
  if (hasAppBridge) {
    return (
      <>
        {/* App Bridge v4 requires script tag with API key meta tag */}
        <Script
          id="shopify-app-bridge"
          src="https://cdn.shopify.com/shopifycloud/app-bridge.js"
          strategy="beforeInteractive"
        />
        <meta name="shopify-api-key" content={process.env.NEXT_PUBLIC_SHOPIFY_API_KEY || ''} />

        <AppProvider i18n={POLARIS_I18N}>
          {/* NavMenu registers links in Shopify's native sidebar */}
          {/* First link with rel="home" is the app home, not shown in menu */}
          <NavMenu>
            <a href="/dashboard" rel="home">Dashboard</a>
            <a href="/products">Products</a>
            <a href="/analytics">Analytics</a>
            <a href="/settings">Settings</a>
          </NavMenu>
          <AppContent>{children}</AppContent>
        </AppProvider>
      </>
    );
  }

  // Without App Bridge - just Polaris provider (for development/testing)
  return (
    <AppProvider i18n={POLARIS_I18N}>
      <AppContent>{children}</AppContent>
    </AppProvider>
  );
}

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <Suspense fallback={
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        background: '#f5f5f5'
      }}>
        <div style={{ textAlign: 'center' }}>
          <div className="spinner-cosmic" style={{ margin: '0 auto' }}></div>
          <p style={{ marginTop: '1rem', color: '#666' }}>Loading...</p>
        </div>
      </div>
    }>
      <AdminLayoutContent>{children}</AdminLayoutContent>
    </Suspense>
  );
}
