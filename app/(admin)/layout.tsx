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

function AdminLayoutContent({
  children,
}: {
  children: React.ReactNode;
}) {
  const [onboardingChecked, setOnboardingChecked] = useState(false);
  const [isNewUser, setIsNewUser] = useState(false);
  const router = useRouter();
  const pathname = usePathname();

  // Check if user needs onboarding
  useEffect(() => {
    const checkOnboarding = async () => {
      // Skip check if already on onboarding page
      if (pathname === '/onboarding') {
        setOnboardingChecked(true);
        return;
      }

      try {
        const response = await authenticatedFetch('/api/admin/shop/onboarding-status');
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

  // Render with Polaris provider
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
