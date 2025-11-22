/**
 * Admin Header
 * Clean header with shop info and menu toggle
 */

'use client';

import { useState } from 'react';
import { MenuIcon } from '@shopify/polaris-icons';

interface HeaderProps {
  onMenuToggle: () => void;
}

export default function AdminHeader({ onMenuToggle }: HeaderProps) {
  const [shopName] = useState('Demo Store'); // Will be dynamic

  return (
    <>
      <header className="header">
        <div className="header-left">
          <button
            className="menu-toggle md:hidden"
            onClick={onMenuToggle}
            aria-label="Toggle menu"
          >
            <MenuIcon />
          </button>

          <div className="header-title">
            <h2 className="page-title">Dashboard</h2>
            <p className="shop-name">{shopName}</p>
          </div>
        </div>

        <div className="header-right">
          <div className="trial-badge">
            <span className="trial-badge-text">14 days trial</span>
          </div>

          <div className="user-menu">
            <div className="user-avatar">
              <span>DS</span>
            </div>
          </div>
        </div>
      </header>

      <style jsx>{`
        .header {
          height: 72px;
          background: var(--bg-primary);
          border-bottom: 1px solid var(--border-color);
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0 var(--spacing-lg);
          position: sticky;
          top: 0;
          z-index: 30;
        }

        .header-left {
          display: flex;
          align-items: center;
          gap: var(--spacing-md);
        }

        .menu-toggle {
          width: 40px;
          height: 40px;
          border: none;
          background: transparent;
          border-radius: var(--radius-md);
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          color: var(--text-primary);
          transition: all 0.2s ease;
        }

        .menu-toggle:hover {
          background: var(--bg-secondary);
        }

        .menu-toggle :global(svg) {
          width: 20px;
          height: 20px;
        }

        .header-title {
          flex: 1;
        }

        .page-title {
          font-size: 20px;
          font-weight: 700;
          color: var(--text-primary);
          margin: 0;
        }

        .shop-name {
          font-size: 12px;
          color: var(--text-secondary);
          margin: 0;
        }

        .header-right {
          display: flex;
          align-items: center;
          gap: var(--spacing-md);
        }

        .trial-badge {
          padding: 6px 12px;
          background: var(--cosmic-gradient);
          border-radius: var(--radius-lg);
          box-shadow: var(--shadow-cosmic);
        }

        .trial-badge-text {
          font-size: 12px;
          font-weight: 600;
          color: white;
          letter-spacing: 0.5px;
          text-transform: uppercase;
        }

        .user-menu {
          position: relative;
        }

        .user-avatar {
          width: 40px;
          height: 40px;
          border-radius: 50%;
          background: var(--cosmic-gradient);
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          font-weight: 700;
          font-size: 14px;
          cursor: pointer;
          transition: all 0.2s ease;
          box-shadow: var(--shadow-cosmic);
        }

        .user-avatar:hover {
          box-shadow: var(--shadow-cosmic-glow);
          transform: scale(1.05);
        }

        @media (max-width: 768px) {
          .header {
            padding: 0 var(--spacing-md);
          }

          .page-title {
            font-size: 18px;
          }

          .trial-badge {
            display: none;
          }
        }
      `}</style>
    </>
  );
}
