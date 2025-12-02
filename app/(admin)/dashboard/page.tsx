/**
 * TurboCart Dashboard
 * Clean feature blocks with cart drawer mockup previews
 */

'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { authenticatedFetch } from '@/lib/shopify/authenticated-fetch';

// SVG Icons - Clean minimalist style
const Icons = {
  cart: (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/>
      <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/>
    </svg>
  ),
  gift: (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 12 20 22 4 22 4 12"/><rect x="2" y="7" width="20" height="5"/>
      <line x1="12" y1="22" x2="12" y2="7"/><path d="M12 7H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7z"/>
      <path d="M12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7z"/>
    </svg>
  ),
  shield: (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
    </svg>
  ),
  clock: (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
    </svg>
  ),
  megaphone: (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 11l18-5v12L3 14v-3z"/><path d="M11.6 16.8a3 3 0 1 1-5.8-1.6"/>
    </svg>
  ),
  award: (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="8" r="7"/><polyline points="8.21 13.89 7 23 12 20 17 23 15.79 13.88"/>
    </svg>
  ),
  toggle: (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <rect x="1" y="5" width="22" height="14" rx="7" ry="7"/><circle cx="16" cy="12" r="3"/>
    </svg>
  ),
  badgeCheck: (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3.85 8.62a4 4 0 0 1 4.78-4.77 4 4 0 0 1 6.74 0 4 4 0 0 1 4.78 4.78 4 4 0 0 1 0 6.74 4 4 0 0 1-4.77 4.78 4 4 0 0 1-6.75 0 4 4 0 0 1-4.78-4.77 4 4 0 0 1 0-6.76Z"/>
      <path d="m9 12 2 2 4-4"/>
    </svg>
  ),
  settings: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/>
    </svg>
  ),
  externalLink: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/>
    </svg>
  ),
  truck: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="1" y="3" width="15" height="13"/><polygon points="16 8 20 8 23 11 23 16 16 16 16 8"/>
      <circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/>
    </svg>
  ),
  check: (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12"/>
    </svg>
  ),
  lock: (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
    </svg>
  ),
  creditCard: (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="1" y="4" width="22" height="16" rx="2" ry="2"/><line x1="1" y1="10" x2="23" y2="10"/>
    </svg>
  ),
  star: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" stroke="none">
      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
    </svg>
  ),
};

interface FeatureStatus {
  upsells: boolean;
  rewards: boolean;
  addons: boolean;
  timer: boolean;
  announcement: boolean;
  trust_badges: boolean;
}

interface FeatureConfig {
  id: keyof FeatureStatus;
  icon: JSX.Element;
  title: string;
  description: string;
  href: string;
  preview: JSX.Element;
}

// Cart Drawer Mockup Component
const CartDrawerMockup = ({ children, title = "Your Cart" }: { children: React.ReactNode; title?: string }) => (
  <div className="cart-mockup">
    <div className="cart-mockup-header">
      <span className="cart-mockup-title">{title}</span>
      <span className="cart-mockup-close">×</span>
    </div>
    <div className="cart-mockup-content">
      {children}
    </div>
    <style jsx>{`
      .cart-mockup {
        width: 100%;
        max-width: 200px;
        background: white;
        border-radius: 8px;
        box-shadow: 0 4px 20px rgba(0,0,0,0.08);
        overflow: hidden;
        font-size: 10px;
      }
      .cart-mockup-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 8px 10px;
        background: #f9fafb;
        border-bottom: 1px solid #e5e7eb;
      }
      .cart-mockup-title {
        font-weight: 600;
        color: #111827;
      }
      .cart-mockup-close {
        color: #9ca3af;
        font-size: 14px;
        cursor: default;
      }
      .cart-mockup-content {
        padding: 8px;
      }
    `}</style>
  </div>
);

// Preview Components for each feature
const UpsellPreview = () => (
  <CartDrawerMockup>
    <div className="upsell-preview">
      <div className="upsell-title">You may also like</div>
      <div className="upsell-items">
        <div className="upsell-item">
          <div className="upsell-img"></div>
          <div className="upsell-info">
            <span>Product</span>
            <span className="price">$29</span>
          </div>
          <button>+</button>
        </div>
        <div className="upsell-item">
          <div className="upsell-img"></div>
          <div className="upsell-info">
            <span>Product</span>
            <span className="price">$19</span>
          </div>
          <button>+</button>
        </div>
      </div>
    </div>
    <style jsx>{`
      .upsell-preview { font-size: 9px; }
      .upsell-title { font-weight: 600; color: #374151; margin-bottom: 6px; }
      .upsell-items { display: flex; gap: 6px; }
      .upsell-item {
        flex: 1;
        background: #f9fafb;
        border-radius: 4px;
        padding: 6px;
        text-align: center;
      }
      .upsell-img {
        width: 100%;
        height: 32px;
        background: linear-gradient(135deg, #e5e7eb 0%, #d1d5db 100%);
        border-radius: 3px;
        margin-bottom: 4px;
      }
      .upsell-info { display: flex; flex-direction: column; gap: 2px; }
      .upsell-info span { color: #6b7280; }
      .price { font-weight: 600; color: #111827 !important; }
      button {
        margin-top: 4px;
        width: 100%;
        padding: 3px;
        background: #111827;
        color: white;
        border: none;
        border-radius: 3px;
        font-size: 8px;
        cursor: default;
      }
    `}</style>
  </CartDrawerMockup>
);

const RewardsPreview = () => (
  <CartDrawerMockup>
    <div className="rewards-preview">
      <div className="rewards-msg">Add $12 for FREE SHIPPING</div>
      <div className="progress-bar">
        <div className="progress-fill" style={{ width: '65%' }}></div>
      </div>
      <div className="milestones">
        <div className="milestone achieved">{Icons.truck}</div>
        <div className="milestone">{Icons.gift}</div>
        <div className="milestone">{Icons.star}</div>
      </div>
    </div>
    <style jsx>{`
      .rewards-preview { font-size: 9px; }
      .rewards-msg {
        font-weight: 500;
        color: #059669;
        text-align: center;
        margin-bottom: 6px;
      }
      .progress-bar {
        height: 6px;
        background: #e5e7eb;
        border-radius: 3px;
        overflow: hidden;
        margin-bottom: 6px;
      }
      .progress-fill {
        height: 100%;
        background: linear-gradient(90deg, #10b981, #34d399);
        border-radius: 3px;
      }
      .milestones { display: flex; justify-content: space-between; }
      .milestone {
        width: 20px;
        height: 20px;
        background: #e5e7eb;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        color: #9ca3af;
      }
      .milestone.achieved { background: #10b981; color: white; }
    `}</style>
  </CartDrawerMockup>
);

const AddonsPreview = () => (
  <CartDrawerMockup>
    <div className="addons-preview">
      <div className="addon-item active">
        <div className="addon-toggle on"></div>
        <div className="addon-icon">{Icons.shield}</div>
        <div className="addon-info">
          <span>Shipping Protection</span>
          <span className="addon-price">$4.99</span>
        </div>
      </div>
      <div className="addon-item">
        <div className="addon-toggle"></div>
        <div className="addon-icon">{Icons.gift}</div>
        <div className="addon-info">
          <span>Gift Wrap</span>
          <span className="addon-price">$5.99</span>
        </div>
      </div>
    </div>
    <style jsx>{`
      .addons-preview { font-size: 9px; display: flex; flex-direction: column; gap: 6px; }
      .addon-item {
        display: flex;
        align-items: center;
        gap: 6px;
        padding: 6px;
        background: #f9fafb;
        border-radius: 4px;
        border: 1px solid #e5e7eb;
      }
      .addon-item.active {
        background: #f0fdf4;
        border-color: #10b981;
      }
      .addon-toggle {
        width: 24px;
        height: 14px;
        background: #d1d5db;
        border-radius: 7px;
        position: relative;
      }
      .addon-toggle::after {
        content: '';
        position: absolute;
        width: 10px;
        height: 10px;
        background: white;
        border-radius: 50%;
        top: 2px;
        left: 2px;
        transition: 0.2s;
      }
      .addon-toggle.on { background: #10b981; }
      .addon-toggle.on::after { left: 12px; }
      .addon-icon { color: #6b7280; }
      .addon-info { flex: 1; display: flex; justify-content: space-between; }
      .addon-info span { color: #374151; }
      .addon-price { font-weight: 600; color: #6b7280 !important; }
    `}</style>
  </CartDrawerMockup>
);

const TimerPreview = () => (
  <CartDrawerMockup>
    <div className="timer-preview">
      <div className="timer-bar">
        <span className="timer-icon">{Icons.clock}</span>
        <span className="timer-text">Cart expires in <strong>09:45</strong></span>
      </div>
      <div className="cart-item-placeholder">
        <div className="item-img"></div>
        <div className="item-info">
          <span>Sample Product</span>
          <span>$49.00</span>
        </div>
      </div>
    </div>
    <style jsx>{`
      .timer-preview { font-size: 9px; }
      .timer-bar {
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 4px;
        padding: 6px;
        background: linear-gradient(90deg, #fef3c7, #fde68a);
        border-radius: 4px;
        margin-bottom: 8px;
      }
      .timer-icon { color: #92400e; }
      .timer-text { color: #92400e; }
      .timer-text strong { font-weight: 700; }
      .cart-item-placeholder {
        display: flex;
        gap: 6px;
        padding: 6px;
        background: #f9fafb;
        border-radius: 4px;
      }
      .item-img { width: 32px; height: 32px; background: #e5e7eb; border-radius: 3px; }
      .item-info { display: flex; flex-direction: column; justify-content: center; }
      .item-info span:first-child { color: #374151; font-weight: 500; }
      .item-info span:last-child { color: #6b7280; }
    `}</style>
  </CartDrawerMockup>
);

const AnnouncementPreview = () => (
  <CartDrawerMockup>
    <div className="announcement-preview">
      <div className="announcement-bar">
        <span className="ann-icon">{Icons.truck}</span>
        <span>Free shipping over $50!</span>
      </div>
      <div className="cart-item-placeholder">
        <div className="item-img"></div>
        <div className="item-info">
          <span>Sample Product</span>
          <span>$49.00</span>
        </div>
      </div>
    </div>
    <style jsx>{`
      .announcement-preview { font-size: 9px; }
      .announcement-bar {
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 4px;
        padding: 6px;
        background: linear-gradient(90deg, #667eea, #764ba2);
        border-radius: 4px;
        margin-bottom: 8px;
        color: white;
        font-weight: 500;
      }
      .ann-icon { display: flex; }
      .cart-item-placeholder {
        display: flex;
        gap: 6px;
        padding: 6px;
        background: #f9fafb;
        border-radius: 4px;
      }
      .item-img { width: 32px; height: 32px; background: #e5e7eb; border-radius: 3px; }
      .item-info { display: flex; flex-direction: column; justify-content: center; }
      .item-info span:first-child { color: #374151; font-weight: 500; }
      .item-info span:last-child { color: #6b7280; }
    `}</style>
  </CartDrawerMockup>
);

const TrustBadgesPreview = () => (
  <CartDrawerMockup>
    <div className="badges-preview">
      <div className="cart-item-placeholder">
        <div className="item-img"></div>
        <div className="item-info">
          <span>Sample Product</span>
          <span>$49.00</span>
        </div>
      </div>
      <div className="badges-row">
        <div className="badge">
          <span className="badge-icon">{Icons.lock}</span>
          <span>Secure</span>
        </div>
        <div className="badge">
          <span className="badge-icon">{Icons.check}</span>
          <span>Verified</span>
        </div>
        <div className="badge">
          <span className="badge-icon">{Icons.creditCard}</span>
          <span>Safe Pay</span>
        </div>
      </div>
    </div>
    <style jsx>{`
      .badges-preview { font-size: 9px; }
      .cart-item-placeholder {
        display: flex;
        gap: 6px;
        padding: 6px;
        background: #f9fafb;
        border-radius: 4px;
        margin-bottom: 8px;
      }
      .item-img { width: 32px; height: 32px; background: #e5e7eb; border-radius: 3px; }
      .item-info { display: flex; flex-direction: column; justify-content: center; }
      .item-info span:first-child { color: #374151; font-weight: 500; }
      .item-info span:last-child { color: #6b7280; }
      .badges-row { display: flex; gap: 4px; justify-content: center; }
      .badge {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 2px;
        padding: 4px 6px;
        background: #f0fdf4;
        border: 1px solid #bbf7d0;
        border-radius: 4px;
        font-size: 7px;
        color: #059669;
      }
      .badge-icon { display: flex; }
    `}</style>
  </CartDrawerMockup>
);

const FEATURES: FeatureConfig[] = [
  {
    id: 'upsells',
    icon: Icons.cart,
    title: 'Cart Upsells',
    description: 'Product recommendations to increase order value',
    href: '/products',
    preview: <UpsellPreview />,
  },
  {
    id: 'rewards',
    icon: Icons.award,
    title: 'Rewards Progress',
    description: 'Free shipping and discount progress bars',
    href: '/rewards',
    preview: <RewardsPreview />,
  },
  {
    id: 'addons',
    icon: Icons.toggle,
    title: 'Quick Add-Ons',
    description: 'One-click extras like shipping protection',
    href: '/addons',
    preview: <AddonsPreview />,
  },
  {
    id: 'timer',
    icon: Icons.clock,
    title: 'Urgency Timer',
    description: 'Countdown timer to encourage checkout',
    href: '/timer',
    preview: <TimerPreview />,
  },
  {
    id: 'announcement',
    icon: Icons.megaphone,
    title: 'Announcement Bar',
    description: 'Custom messages and promotions',
    href: '/announcement',
    preview: <AnnouncementPreview />,
  },
  {
    id: 'trust_badges',
    icon: Icons.badgeCheck,
    title: 'Trust Badges',
    description: 'Security badges to build customer confidence',
    href: '/trust-badges',
    preview: <TrustBadgesPreview />,
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
    trust_badges: false,
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
          setFeatures(prev => ({ ...prev, ...data.settings.features }));
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
            <div className="feature-main">
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

            <div className="feature-preview">
              {feature.preview}
            </div>
          </div>
        ))}
      </div>

      <style jsx>{`
        .dashboard {
          padding: 24px;
          max-width: 1200px;
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
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(480px, 1fr));
          gap: 20px;
        }

        .feature-block {
          display: flex;
          background: white;
          border: 1px solid #e5e7eb;
          border-radius: 16px;
          overflow: hidden;
          transition: all 0.2s ease;
        }

        .feature-block.enabled {
          border-color: #6366f1;
          box-shadow: 0 0 0 1px #6366f1;
        }

        .feature-block.disabled .feature-preview {
          opacity: 0.4;
        }

        .feature-main {
          flex: 1;
          padding: 24px;
          display: flex;
          flex-direction: column;
        }

        .feature-preview {
          width: 220px;
          background: #f9fafb;
          padding: 16px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-left: 1px solid #e5e7eb;
          transition: opacity 0.2s;
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
          border-radius: 12px;
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
          flex: 1;
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
          border-radius: 8px;
          font-size: 13px;
          font-weight: 500;
          color: #374151;
          cursor: pointer;
          transition: all 0.15s ease;
          width: fit-content;
        }

        .configure-btn:hover {
          background: #f3f4f6;
          border-color: #d1d5db;
        }

        /* Responsive */
        @media (max-width: 900px) {
          .features-grid {
            grid-template-columns: 1fr;
          }

          .feature-block {
            flex-direction: column;
          }

          .feature-preview {
            width: 100%;
            border-left: none;
            border-top: 1px solid #e5e7eb;
            padding: 20px;
          }
        }

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
