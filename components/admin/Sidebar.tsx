/**
 * Admin Sidebar Navigation
 * Clean, minimal design with cosmic accents
 */

'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  HomeIcon,
  ProductIcon,
  AnalyticsIcon,
  SettingsIcon,
} from '@shopify/polaris-icons';

interface SidebarProps {
  isOpen: boolean;
  onToggle: () => void;
}

interface NavItem {
  label: string;
  href: string;
  icon: any;
}

const NAV_ITEMS: NavItem[] = [
  {
    label: 'Dashboard',
    href: '/dashboard',
    icon: HomeIcon,
  },
  {
    label: 'Products',
    href: '/products',
    icon: ProductIcon,
  },
  {
    label: 'Analytics',
    href: '/analytics',
    icon: AnalyticsIcon,
  },
  {
    label: 'Settings',
    href: '/settings',
    icon: SettingsIcon,
  },
];

export default function AdminSidebar({ isOpen, onToggle }: SidebarProps) {
  const pathname = usePathname();

  return (
    <>
      <aside className={`sidebar ${isOpen ? 'open' : 'closed'}`}>
        {/* Logo */}
        <div className="sidebar-header">
          <div className="logo">
            <div className="logo-icon">
              <div className="logo-gradient">TC</div>
            </div>
            {isOpen && (
              <div className="logo-text">
                <h1 className="logo-title">TurboCart</h1>
                <p className="logo-subtitle">AI Cart Upsells</p>
              </div>
            )}
          </div>
        </div>

        {/* Navigation */}
        <nav className="sidebar-nav">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive = pathname?.startsWith(item.href);

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`nav-item ${isActive ? 'active' : ''}`}
              >
                <div className="nav-icon">
                  <Icon />
                </div>
                {isOpen && <span className="nav-label">{item.label}</span>}
                {isActive && <div className="nav-indicator" />}
              </Link>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="sidebar-footer">
          {isOpen && (
            <div className="sidebar-footer-content">
              <p className="footer-text">Version 1.0.0</p>
              <a href="mailto:support@turbocart.app" className="footer-link">
                Support
              </a>
            </div>
          )}
        </div>
      </aside>

      <style jsx>{`
        .sidebar {
          position: fixed;
          left: 0;
          top: 0;
          bottom: 0;
          width: 280px;
          background: var(--bg-primary);
          border-right: 1px solid var(--border-color);
          display: flex;
          flex-direction: column;
          transition: all 0.3s ease;
          z-index: 50;
        }

        .sidebar.closed {
          width: 80px;
        }

        .sidebar.closed .logo-text,
        .sidebar.closed .nav-label,
        .sidebar.closed .sidebar-footer-content {
          opacity: 0;
          width: 0;
          overflow: hidden;
        }

        /* Logo */
        .sidebar-header {
          padding: var(--spacing-lg);
          border-bottom: 1px solid var(--border-color);
        }

        .logo {
          display: flex;
          align-items: center;
          gap: var(--spacing-md);
        }

        .logo-icon {
          width: 48px;
          height: 48px;
          flex-shrink: 0;
        }

        .logo-gradient {
          width: 100%;
          height: 100%;
          background: var(--cosmic-gradient);
          border-radius: var(--radius-lg);
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          font-weight: 700;
          font-size: 20px;
          box-shadow: var(--shadow-cosmic);
        }

        .logo-text {
          flex: 1;
          transition: opacity 0.3s ease;
        }

        .logo-title {
          font-size: 18px;
          font-weight: 700;
          color: var(--text-primary);
          margin: 0;
        }

        .logo-subtitle {
          font-size: 12px;
          color: var(--text-secondary);
          margin: 0;
        }

        /* Navigation */
        .sidebar-nav {
          flex: 1;
          padding: var(--spacing-lg) 0;
          overflow-y: auto;
        }

        .nav-item {
          display: flex;
          align-items: center;
          gap: var(--spacing-md);
          padding: var(--spacing-md) var(--spacing-lg);
          color: var(--text-secondary);
          text-decoration: none;
          transition: all 0.2s ease;
          position: relative;
          cursor: pointer;
        }

        .nav-item:hover {
          background: var(--bg-secondary);
          color: var(--text-primary);
        }

        .nav-item.active {
          background: linear-gradient(90deg, rgba(102, 126, 234, 0.1) 0%, transparent 100%);
          color: var(--cosmic-from);
          font-weight: 600;
        }

        .nav-icon {
          width: 20px;
          height: 20px;
          flex-shrink: 0;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .nav-icon :global(svg) {
          width: 20px;
          height: 20px;
        }

        .nav-label {
          flex: 1;
          font-size: 14px;
          transition: opacity 0.3s ease;
        }

        .nav-indicator {
          position: absolute;
          left: 0;
          top: 0;
          bottom: 0;
          width: 4px;
          background: var(--cosmic-gradient);
          border-radius: 0 var(--radius-sm) var(--radius-sm) 0;
        }

        /* Footer */
        .sidebar-footer {
          padding: var(--spacing-lg);
          border-top: 1px solid var(--border-color);
        }

        .sidebar-footer-content {
          transition: opacity 0.3s ease;
        }

        .footer-text {
          font-size: 12px;
          color: var(--text-tertiary);
          margin: 0 0 var(--spacing-xs) 0;
        }

        .footer-link {
          font-size: 12px;
          color: var(--cosmic-from);
          text-decoration: none;
          font-weight: 600;
        }

        .footer-link:hover {
          text-decoration: underline;
        }

        /* Mobile */
        @media (max-width: 768px) {
          .sidebar {
            transform: translateX(-100%);
          }

          .sidebar.open {
            transform: translateX(0);
          }
        }
      `}</style>
    </>
  );
}
