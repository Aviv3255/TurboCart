/**
 * Admin Dashboard Layout
 * Uses Shopify Polaris for consistent UI
 */

'use client';

import { useEffect, useState } from 'react';
import { AppProvider } from '@shopify/polaris';
import '@shopify/polaris/build/esm/styles.css';
import AdminSidebar from '@/components/admin/Sidebar';
import AdminHeader from '@/components/admin/Header';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [sidebarOpen, setSidebarOpen] = useState(true);

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

  return (
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
        {/* Sidebar */}
        <AdminSidebar isOpen={sidebarOpen} onToggle={() => setSidebarOpen(!sidebarOpen)} />

        {/* Main Content */}
        <div className={`admin-main ${sidebarOpen ? 'sidebar-open' : 'sidebar-closed'}`}>
          {/* Header */}
          <AdminHeader onMenuToggle={() => setSidebarOpen(!sidebarOpen)} />

          {/* Page Content */}
          <main className="admin-content">
            <div className="admin-content-inner">
              {children}
            </div>
          </main>
        </div>

        {/* Mobile Overlay */}
        {sidebarOpen && (
          <div
            className="admin-overlay md:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}
      </div>

      <style jsx>{`
        .admin-layout {
          display: flex;
          min-height: 100vh;
          background: var(--bg-primary);
        }

        .admin-main {
          flex: 1;
          display: flex;
          flex-direction: column;
          transition: margin-left 0.3s ease;
          margin-left: 280px;
        }

        .admin-main.sidebar-closed {
          margin-left: 0;
        }

        .admin-content {
          flex: 1;
          padding: var(--spacing-lg);
          background: var(--bg-secondary);
        }

        .admin-content-inner {
          max-width: 1400px;
          margin: 0 auto;
        }

        .admin-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.5);
          z-index: 40;
          animation: fadeIn 0.2s ease-in-out;
        }

        @media (max-width: 768px) {
          .admin-main {
            margin-left: 0;
          }

          .admin-content {
            padding: var(--spacing-md);
          }
        }

        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
      `}</style>
    </AppProvider>
  );
}
