/**
 * Admin Dashboard Layout
 * Provides Polaris UI framework and handles onboarding redirect
 * Navigation is handled by root layout via App Bridge NavMenu
 */

'use client';

import { useEffect, useState, Suspense } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { AppProvider } from '@shopify/polaris';
import '@shopify/polaris/build/esm/styles.css';
import { authenticatedFetch } from '@/lib/shopify/authenticated-fetch';

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

// Theme warning banner component
function ThemeWarningBanner({ onOpenThemeEditor }: { onOpenThemeEditor: () => void }) {
  return (
    <div className="theme-warning-banner">
      <div className="warning-content">
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
          <path d="M10 2L2 18H18L10 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M10 8V11" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
          <circle cx="10" cy="14" r="1" fill="currentColor"/>
        </svg>
        <span>TurboCart is not enabled in your theme. Upsells won&apos;t appear until you enable the app block.</span>
        <button onClick={onOpenThemeEditor} className="enable-btn">
          Enable Now
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <path d="M5 3H3V11H11V9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
            <path d="M7 3H11V7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M11 3L6 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
          </svg>
        </button>
      </div>
      <style jsx>{`
        .theme-warning-banner {
          background: linear-gradient(90deg, #dc2626 0%, #b91c1c 100%);
          color: #fff;
          padding: 12px 20px;
          position: sticky;
          top: 0;
          z-index: 1000;
        }
        .warning-content {
          max-width: 1200px;
          margin: 0 auto;
          display: flex;
          align-items: center;
          gap: 12px;
          font-size: 14px;
          font-weight: 500;
        }
        .warning-content svg {
          flex-shrink: 0;
        }
        .warning-content span {
          flex: 1;
        }
        .enable-btn {
          display: flex;
          align-items: center;
          gap: 6px;
          background: #fff;
          color: #dc2626;
          border: none;
          padding: 8px 16px;
          border-radius: 6px;
          font-size: 13px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s ease;
          white-space: nowrap;
        }
        .enable-btn:hover {
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
        }
      `}</style>
    </div>
  );
}

function AdminLayoutContent({
  children,
}: {
  children: React.ReactNode;
}) {
  const [onboardingChecked, setOnboardingChecked] = useState(false);
  const [isNewUser, setIsNewUser] = useState(false);
  const [themeEnabled, setThemeEnabled] = useState(true); // Assume enabled until checked
  const [shopDomain, setShopDomain] = useState<string | null>(null);
  const router = useRouter();
  const pathname = usePathname();

  // Get theme editor URL
  const getThemeEditorUrl = () => {
    const urlParams = new URLSearchParams(window.location.search);
    const shop = urlParams.get('shop');
    if (shop) {
      return `https://${shop}/admin/themes/current/editor?context=apps`;
    }
    if (typeof window !== 'undefined' && (window as { shopify?: { config?: { shop?: string } } }).shopify?.config?.shop) {
      const shopDomain = (window as { shopify?: { config?: { shop?: string } } }).shopify!.config!.shop;
      return `https://${shopDomain}/admin/themes/current/editor?context=apps`;
    }
    return 'https://admin.shopify.com/store/themes/current/editor?context=apps';
  };

  const handleOpenThemeEditor = () => {
    window.open(getThemeEditorUrl(), '_blank', 'noopener,noreferrer');
  };

  // Check if user needs onboarding and theme status
  useEffect(() => {
    const checkOnboarding = async () => {
      // Check for fresh install cookie (set by OAuth callback)
      const freshInstallCookie = document.cookie
        .split('; ')
        .find(row => row.startsWith('turbocart_fresh_install='));

      if (freshInstallCookie) {
        console.log('[TurboCart] Fresh install detected - clearing ALL localStorage');
        // Clear ALL TurboCart localStorage items
        Object.keys(localStorage).forEach(key => {
          if (key.startsWith('turbocart_')) {
            localStorage.removeItem(key);
          }
        });
        // Delete the cookie so this only runs once
        document.cookie = 'turbocart_fresh_install=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
      }

      // Skip API check if already on onboarding page
      if (pathname === '/onboarding') {
        setOnboardingChecked(true);
        return;
      }

      try {
        const response = await authenticatedFetch('/api/admin/shop/onboarding-status');
        if (response.ok) {
          const data = await response.json();

          // If app was reinstalled (detected by API), also clear localStorage
          if (data.wasReinstalled) {
            console.log('[TurboCart] App reinstalled (API) - clearing localStorage for fresh start');
            Object.keys(localStorage).forEach(key => {
              if (key.startsWith('turbocart_')) {
                localStorage.removeItem(key);
              }
            });
          }

          if (!data.onboardingComplete) {
            setIsNewUser(true);
            router.push('/onboarding');
          }
          // Check theme enabled status
          setThemeEnabled(data.themeEnabled !== false);

          // Get shop domain for embed status polling
          const urlParams = new URLSearchParams(window.location.search);
          const shop = urlParams.get('shop') || (window as { shopify?: { config?: { shop?: string } } }).shopify?.config?.shop;
          if (shop) {
            setShopDomain(shop);
          }
        }
      } catch (error) {
        console.error('Error checking onboarding status:', error);
      }
      setOnboardingChecked(true);
    };

    checkOnboarding();
  }, [pathname, router]);

  // Poll for embed status when banner is shown
  useEffect(() => {
    if (themeEnabled || !shopDomain || pathname === '/onboarding') return;

    const checkEmbedStatus = async () => {
      try {
        const response = await fetch(`/api/storefront/ping?shop=${encodeURIComponent(shopDomain)}`);
        if (response.ok) {
          const data = await response.json();
          if (data.active) {
            console.log('[TurboCart] Embed is active, hiding warning banner');
            setThemeEnabled(true);
          }
        }
      } catch (error) {
        console.error('Error checking embed status:', error);
      }
    };

    // Check immediately
    checkEmbedStatus();

    // Poll every 5 seconds
    const interval = setInterval(checkEmbedStatus, 5000);

    return () => clearInterval(interval);
  }, [themeEnabled, shopDomain, pathname]);

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

  // Render with Polaris provider
  return (
    <AppProvider i18n={POLARIS_I18N}>
      {!themeEnabled && pathname !== '/onboarding' && (
        <ThemeWarningBanner onOpenThemeEditor={handleOpenThemeEditor} />
      )}
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
