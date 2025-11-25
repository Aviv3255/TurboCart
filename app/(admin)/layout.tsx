/**
 * Admin Dashboard Layout
 * Clean native-style layout for Shopify embedded app
 * No sidebar - uses header navigation for cleaner integration
 */

'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { AppProvider } from '@shopify/polaris';
import { Provider as AppBridgeProvider } from '@shopify/app-bridge-react';
import '@shopify/polaris/build/esm/styles.css';

// Navigation items - clean header nav instead of sidebar
const NAV_ITEMS = [
  { label: 'Dashboard', href: '/dashboard' },
  { label: 'Products', href: '/products' },
  { label: 'Analytics', href: '/analytics' },
  { label: 'Settings', href: '/settings' },
];

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

  // App Bridge configuration
  const appBridgeConfig = {
    apiKey: process.env.NEXT_PUBLIC_SHOPIFY_API_KEY || '',
    host: host,
    forceRedirect: true,
  };

  // Don't render until onboarding check is complete
  if (!onboardingChecked || isNewUser) {
    return (
      <div className="admin-loading">
        <div className="loading-spinner" />
        <p>Loading TurboCart...</p>
        <style jsx>{`
          .admin-loading {
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            min-height: 100vh;
            background: #fff;
          }
          .loading-spinner {
            width: 40px;
            height: 40px;
            border: 3px solid #f0f0f0;
            border-top-color: #1d1d1f;
            border-radius: 50%;
            animation: spin 0.8s linear infinite;
          }
          @keyframes spin {
            to { transform: rotate(360deg); }
          }
          p {
            margin-top: 16px;
            color: #1d1d1f;
            font-size: 14px;
          }
        `}</style>
      </div>
    );
  }

  // Hide header nav on onboarding page
  const showNav = pathname !== '/onboarding';

  // Wrap with App Bridge Provider if we have shop and host
  const content = (
    <AppProvider
      i18n={{
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
      }}
    >
      <div className="admin-layout">
        {showNav && (
          <header className="admin-header">
            <div className="header-brand">
              <span className="brand-icon">TC</span>
              <span className="brand-name">TurboCart</span>
            </div>
            <nav className="header-nav">
              {NAV_ITEMS.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`nav-link ${pathname?.startsWith(item.href) ? 'active' : ''}`}
                >
                  {item.label}
                </Link>
              ))}
            </nav>
            <div className="header-actions">
              <span className="trial-badge">14 days trial</span>
            </div>
          </header>
        )}
        <main className="admin-content">
          {children}
        </main>
      </div>
      <style jsx>{`
        .admin-layout {
          min-height: 100vh;
          background: #fff;
        }
        .admin-header {
          height: 56px;
          background: #fff;
          border-bottom: 1px solid #e5e5e5;
          display: flex;
          align-items: center;
          padding: 0 24px;
          gap: 32px;
        }
        .header-brand {
          display: flex;
          align-items: center;
          gap: 10px;
        }
        .brand-icon {
          width: 32px;
          height: 32px;
          background: #1d1d1f;
          border-radius: 8px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #fff;
          font-weight: 700;
          font-size: 12px;
        }
        .brand-name {
          font-size: 16px;
          font-weight: 600;
          color: #1d1d1f;
        }
        .header-nav {
          display: flex;
          align-items: center;
          gap: 4px;
          flex: 1;
        }
        .nav-link {
          padding: 8px 16px;
          font-size: 14px;
          font-weight: 500;
          color: #6b7280;
          text-decoration: none;
          border-radius: 8px;
          transition: all 0.15s ease;
        }
        .nav-link:hover {
          color: #1d1d1f;
          background: #f5f5f5;
        }
        .nav-link.active {
          color: #1d1d1f;
          background: #f5f5f5;
        }
        .header-actions {
          display: flex;
          align-items: center;
          gap: 12px;
        }
        .trial-badge {
          padding: 6px 12px;
          background: #1d1d1f;
          color: #fff;
          font-size: 12px;
          font-weight: 600;
          border-radius: 6px;
        }
        .admin-content {
          padding: 0;
        }
      `}</style>
    </AppProvider>
  );

  // If we have shop and host, wrap with App Bridge Provider
  if (shop && host && appBridgeConfig.apiKey) {
    return (
      <AppBridgeProvider config={appBridgeConfig}>
        {content}
      </AppBridgeProvider>
    );
  }

  // Otherwise just return the content
  return content;
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
