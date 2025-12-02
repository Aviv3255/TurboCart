/**
 * TurboCart Dashboard
 * Clean feature blocks with toggles - native Shopify styling
 */

'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { authenticatedFetch } from '@/lib/shopify/authenticated-fetch';

// SVG Icons
const Icons = {
  cart: (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/>
      <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/>
    </svg>
  ),
  gift: (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 12 20 22 4 22 4 12"/><rect x="2" y="7" width="20" height="5"/>
      <line x1="12" y1="22" x2="12" y2="7"/><path d="M12 7H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7z"/>
      <path d="M12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7z"/>
    </svg>
  ),
  zap: (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
    </svg>
  ),
  clock: (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
    </svg>
  ),
  megaphone: (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 11l18-5v12L3 14v-3z"/><path d="M11.6 16.8a3 3 0 1 1-5.8-1.6"/>
    </svg>
  ),
  settings: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/>
    </svg>
  ),
  externalLink: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/>
    </svg>
  ),
};

interface FeatureStatus {
  upsells: boolean;
  rewards: boolean;
  addons: boolean;
  timer: boolean;
  announcement: boolean;
}

interface FeatureConfig {
  id: keyof FeatureStatus;
  icon: JSX.Element;
  title: string;
  description: string;
  href: string;
}

const FEATURES: FeatureConfig[] = [
  {
    id: 'upsells',
    icon: Icons.cart,
    title: 'Cart Upsells',
    description: 'Product recommendations to increase order value',
    href: '/products',
  },
  {
    id: 'rewards',
    icon: Icons.gift,
    title: 'Rewards Progress',
    description: 'Free shipping and discount progress bars',
    href: '/cart-features',
  },
  {
    id: 'addons',
    icon: Icons.zap,
    title: 'Quick Add-Ons',
    description: 'One-click extras like shipping protection',
    href: '/cart-features',
  },
  {
    id: 'timer',
    icon: Icons.clock,
    title: 'Urgency Timer',
    description: 'Countdown timer to encourage checkout',
    href: '/cart-features',
  },
  {
    id: 'announcement',
    icon: Icons.megaphone,
    title: 'Announcement Bar',
    description: 'Custom messages and promotions',
    href: '/cart-features',
  },
];

export default function DashboardPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [features, setFeatures] = useState<FeatureStatus>({
    upsells: true,
    rewards: false,
    addons: false,
    timer: false,
    announcement: false,
  });

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const res = await authenticatedFetch('/api/admin/cart-features');
      if (res.ok) {
        const data = await res.json();
        if (data.settings?.features) {
          setFeatures(data.settings.features);
        }
      }
    } catch (error) {
      console.error('Error fetching settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleFeature = async (featureId: keyof FeatureStatus) => {
    const newValue = !features[featureId];
    setFeatures(prev => ({ ...prev, [featureId]: newValue }));

    try {
      await authenticatedFetch('/api/admin/cart-features', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          settings: {
            features: { [featureId]: newValue },
          },
        }),
      });
    } catch (error) {
      console.error('Error updating feature:', error);
      setFeatures(prev => ({ ...prev, [featureId]: !newValue }));
    }
  };

  const navigateTo = (href: string) => {
    router.push(href);
  };

  if (loading) {
    return (
      <div className="loading">
        <div className="spinner" />
        <style jsx>{`
          .loading {
            display: flex;
            align-items: center;
            justify-content: center;
            min-height: 400px;
          }
          .spinner {
            width: 32px;
            height: 32px;
            border: 2px solid #e5e7eb;
            border-top-color: #6366f1;
            border-radius: 50%;
            animation: spin 0.7s linear infinite;
          }
          @keyframes spin { to { transform: rotate(360deg); } }
        `}</style>
      </div>
    );
  }

  return (
    <div className="dashboard">
      <header className="header">
        <div className="header-content">
          <h1>TurboCart</h1>
          <p>Configure your cart features</p>
        </div>
        <a
          href="https://admin.shopify.com/store/themes/current/editor?context=apps"
          target="_blank"
          rel="noopener noreferrer"
          className="theme-btn"
        >
          <span>Open Theme Editor</span>
          {Icons.externalLink}
        </a>
      </header>

      <div className="features-grid">
        {FEATURES.map(feature => (
          <div
            key={feature.id}
            className={`feature-block ${features[feature.id] ? 'enabled' : 'disabled'}`}
          >
            <div className="feature-header">
              <div className="feature-icon">{feature.icon}</div>
              <label className="toggle">
                <input
                  type="checkbox"
                  checked={features[feature.id]}
                  onChange={() => toggleFeature(feature.id)}
                />
                <span className="toggle-track">
                  <span className="toggle-thumb" />
                </span>
              </label>
            </div>

            <div className="feature-body">
              <h3>{feature.title}</h3>
              <p>{feature.description}</p>
            </div>

            <button
              className="configure-btn"
              onClick={() => navigateTo(feature.href)}
            >
              {Icons.settings}
              <span>Configure</span>
            </button>
          </div>
        ))}
      </div>

      <style jsx>{`
        .dashboard {
          padding: 24px;
          max-width: 960px;
          margin: 0 auto;
        }

        .header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 32px;
          padding-bottom: 24px;
          border-bottom: 1px solid #e5e7eb;
        }

        .header-content h1 {
          font-size: 24px;
          font-weight: 700;
          color: #111827;
          margin: 0 0 4px;
        }

        .header-content p {
          font-size: 14px;
          color: #6b7280;
          margin: 0;
        }

        .theme-btn {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 10px 16px;
          background: #111827;
          color: white;
          border-radius: 8px;
          font-size: 13px;
          font-weight: 500;
          text-decoration: none;
          transition: all 0.2s ease;
        }

        .theme-btn:hover {
          background: #1f2937;
        }

        .features-grid {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .feature-block {
          background: white;
          border: 1px solid #e5e7eb;
          border-radius: 12px;
          padding: 24px;
          transition: all 0.2s ease;
        }

        .feature-block.enabled {
          border-color: #6366f1;
          box-shadow: 0 0 0 1px #6366f1;
        }

        .feature-block.disabled {
          opacity: 0.7;
        }

        .feature-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 16px;
        }

        .feature-icon {
          width: 48px;
          height: 48px;
          background: #f3f4f6;
          border-radius: 10px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #6366f1;
        }

        .feature-block.enabled .feature-icon {
          background: rgba(99, 102, 241, 0.1);
        }

        /* Toggle Switch */
        .toggle {
          position: relative;
          cursor: pointer;
        }

        .toggle input {
          position: absolute;
          opacity: 0;
          width: 0;
          height: 0;
        }

        .toggle-track {
          display: block;
          width: 44px;
          height: 24px;
          background: #d1d5db;
          border-radius: 12px;
          transition: background 0.2s ease;
        }

        .toggle input:checked + .toggle-track {
          background: #6366f1;
        }

        .toggle-thumb {
          position: absolute;
          top: 2px;
          left: 2px;
          width: 20px;
          height: 20px;
          background: white;
          border-radius: 50%;
          box-shadow: 0 1px 3px rgba(0,0,0,0.15);
          transition: transform 0.2s ease;
        }

        .toggle input:checked ~ .toggle-track .toggle-thumb {
          transform: translateX(20px);
        }

        .feature-body {
          margin-bottom: 16px;
        }

        .feature-body h3 {
          font-size: 16px;
          font-weight: 600;
          color: #111827;
          margin: 0 0 4px;
        }

        .feature-body p {
          font-size: 14px;
          color: #6b7280;
          margin: 0;
          line-height: 1.4;
        }

        .configure-btn {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 8px 14px;
          background: #f9fafb;
          border: 1px solid #e5e7eb;
          border-radius: 6px;
          font-size: 13px;
          font-weight: 500;
          color: #374151;
          cursor: pointer;
          transition: all 0.15s ease;
        }

        .configure-btn:hover {
          background: #f3f4f6;
          border-color: #d1d5db;
        }

        /* Responsive */
        @media (max-width: 640px) {
          .header {
            flex-direction: column;
            gap: 16px;
          }

          .theme-btn {
            width: 100%;
            justify-content: center;
          }
        }
      `}</style>
    </div>
  );
}
