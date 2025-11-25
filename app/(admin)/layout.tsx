/**
 * Admin Dashboard Layout
 * Uses Shopify Polaris for consistent UI and App Bridge for embedded app functionality
 * Includes sidebar navigation and onboarding redirect
 */

'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import { AppProvider } from '@shopify/polaris';
import { Provider as AppBridgeProvider } from '@shopify/app-bridge-react';
import '@shopify/polaris/build/esm/styles.css';
import AdminSidebar from '@/components/admin/Sidebar';
import AdminHeader from '@/components/admin/Header';

function AdminLayoutContent({
  children,
}: {
  children: React.ReactNode;
}) {
  const [sidebarOpen, setSidebarOpen] = useState(true);
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

  // Handle responsive sidebar
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 768) {
        setSidebarOpen(false);
      } else {
        setSidebarOpen(true);
      }
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

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
            background: #fafafa;
          }
          .loading-spinner {
            width: 40px;
            height: 40px;
            border: 3px solid #e5e5e5;
            border-top-color: #667eea;
            border-radius: 50%;
            animation: spin 1s linear infinite;
          }
          @keyframes spin {
            to { transform: rotate(360deg); }
          }
          p {
            margin-top: 16px;
            color: #666;
            font-size: 14px;
          }
        `}</style>
      </div>
    );
  }

  // Hide sidebar on onboarding page
  const showSidebar = pathname !== '/onboarding';

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
        {showSidebar && (
          <AdminSidebar isOpen={sidebarOpen} onToggle={toggleSidebar} />
        )}
        <div className={`admin-main ${showSidebar ? (sidebarOpen ? 'with-sidebar' : 'with-sidebar-collapsed') : ''}`}>
          {showSidebar && (
            <AdminHeader onMenuToggle={toggleSidebar} sidebarOpen={sidebarOpen} />
          )}
          <main className="admin-content">
            {children}
          </main>
        </div>
      </div>
      <style jsx>{`
        .admin-layout {
          display: flex;
          min-height: 100vh;
          background: var(--bg-secondary, #fafafa);
        }
        .admin-main {
          flex: 1;
          display: flex;
          flex-direction: column;
          transition: margin-left 0.3s ease;
        }
        .admin-main.with-sidebar {
          margin-left: 280px;
        }
        .admin-main.with-sidebar-collapsed {
          margin-left: 80px;
        }
        .admin-content {
          flex: 1;
          padding: 24px;
        }
        @media (max-width: 768px) {
          .admin-main.with-sidebar,
          .admin-main.with-sidebar-collapsed {
            margin-left: 0;
          }
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
