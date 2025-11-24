/**
 * Admin Dashboard Layout
 * Uses Shopify Polaris for consistent UI and App Bridge for embedded app functionality
 */

'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
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
  const searchParams = useSearchParams();
  const router = useRouter();

  // Get shop and host from URL for App Bridge
  const shop = searchParams.get('shop') || '';
  const host = searchParams.get('host') || '';

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

  // App Bridge configuration
  const appBridgeConfig = {
    apiKey: process.env.NEXT_PUBLIC_SHOPIFY_API_KEY || '',
    host: host,
    forceRedirect: true,
  };

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
      {/* Polaris handles all styling - no custom CSS needed */}
      {children}
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
