/**
 * TurboCart Dashboard
 * Feature list with annotated cart drawer mockup
 */

'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { authenticatedFetch } from '@/lib/shopify/authenticated-fetch';

// SVG Icons
const Icons = {
  cart: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/></svg>,
  gift: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 12 20 22 4 22 4 12"/><rect x="2" y="7" width="20" height="5"/><line x1="12" y1="22" x2="12" y2="7"/><path d="M12 7H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7z"/><path d="M12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7z"/></svg>,
  shield: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>,
  clock: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>,
  megaphone: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M3 11l18-5v12L3 14v-3z"/><path d="M11.6 16.8a3 3 0 1 1-5.8-1.6"/></svg>,
  award: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="8" r="7"/><polyline points="8.21 13.89 7 23 12 20 17 23 15.79 13.88"/></svg>,
  toggle: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect x="1" y="5" width="22" height="14" rx="7" ry="7"/><circle cx="16" cy="12" r="3"/></svg>,
  badgeCheck: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M3.85 8.62a4 4 0 0 1 4.78-4.77 4 4 0 0 1 6.74 0 4 4 0 0 1 4.78 4.78 4 4 0 0 1 0 6.74 4 4 0 0 1-4.77 4.78 4 4 0 0 1-6.75 0 4 4 0 0 1-4.78-4.77 4 4 0 0 1 0-6.76Z"/><path d="m9 12 2 2 4-4"/></svg>,
  settings: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>,
  externalLink: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>,
  truck: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="1" y="3" width="15" height="13"/><polygon points="16 8 20 8 23 11 23 16 16 16 16 8"/><circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/></svg>,
  check: <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>,
  lock: <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>,
  star: <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" stroke="none"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>,
};

interface FeatureStatus {
  upsells: boolean;
  rewards: boolean;
  addons: boolean;
  timer: boolean;
  announcement: boolean;
  trust_badges: boolean;
}

const FEATURES = [
  { id: 'announcement' as const, icon: Icons.megaphone, title: 'Announcement Bar', description: 'Custom messages and promotions', href: '/announcement', color: '#8b5cf6' },
  { id: 'timer' as const, icon: Icons.clock, title: 'Urgency Timer', description: 'Countdown timer to encourage checkout', href: '/timer', color: '#f59e0b' },
  { id: 'upsells' as const, icon: Icons.cart, title: 'Cart Upsells', description: 'Product recommendations to increase order value', href: '/products', color: '#3b82f6' },
  { id: 'rewards' as const, icon: Icons.award, title: 'Rewards Progress', description: 'Free shipping and discount progress bars', href: '/rewards', color: '#10b981' },
  { id: 'addons' as const, icon: Icons.toggle, title: 'Quick Add-Ons', description: 'One-click extras like shipping protection', href: '/addons', color: '#ec4899' },
  { id: 'trust_badges' as const, icon: Icons.badgeCheck, title: 'Trust Badges', description: 'Security badges to build customer confidence', href: '/trust-badges', color: '#06b6d4' },
];

// Annotated Cart Mockup Component
const AnnotatedCartMockup = ({ features }: { features: FeatureStatus }) => (
  <div className="mockup-container">
    <div className="phone-frame">
      <div className="phone-notch"></div>
      <div className="cart-drawer">
        {/* Header */}
        <div className="drawer-header">
          <span className="drawer-title">Your Cart (2)</span>
          <span className="drawer-close">×</span>
        </div>

        {/* Announcement - Feature 1 */}
        <div className={`drawer-section announcement ${features.announcement ? 'active' : 'dimmed'}`}>
          <div className="announcement-bar">
            <span className="ann-icon">{Icons.truck}</span>
            <span>Free shipping over $50!</span>
          </div>
        </div>
        <div className={`annotation annotation-1 ${features.announcement ? 'active' : ''}`}>
          <div className="annotation-line"></div>
          <div className="annotation-label" style={{ background: '#8b5cf6' }}>Announcement Bar</div>
        </div>

        {/* Timer - Feature 2 */}
        <div className={`drawer-section timer ${features.timer ? 'active' : 'dimmed'}`}>
          <div className="timer-bar">
            <span className="timer-icon">{Icons.clock}</span>
            <span>Items reserved for <strong>09:45</strong></span>
          </div>
        </div>
        <div className={`annotation annotation-2 ${features.timer ? 'active' : ''}`}>
          <div className="annotation-line"></div>
          <div className="annotation-label" style={{ background: '#f59e0b' }}>Urgency Timer</div>
        </div>

        {/* Cart Item */}
        <div className="drawer-section cart-items">
          <div className="cart-item">
            <div className="item-image"></div>
            <div className="item-details">
              <span className="item-name">Premium Headphones</span>
              <span className="item-variant">Black • Qty: 1</span>
              <span className="item-price">$89.00</span>
            </div>
          </div>
          <div className="cart-item">
            <div className="item-image"></div>
            <div className="item-details">
              <span className="item-name">Wireless Charger</span>
              <span className="item-variant">White • Qty: 1</span>
              <span className="item-price">$29.00</span>
            </div>
          </div>
        </div>

        {/* Upsells - Feature 3 */}
        <div className={`drawer-section upsells ${features.upsells ? 'active' : 'dimmed'}`}>
          <div className="upsell-title">You may also like</div>
          <div className="upsell-scroll">
            <div className="upsell-card">
              <div className="upsell-img"></div>
              <span className="upsell-name">Cable</span>
              <span className="upsell-price">$12</span>
              <button className="upsell-btn">+</button>
            </div>
            <div className="upsell-card">
              <div className="upsell-img"></div>
              <span className="upsell-name">Case</span>
              <span className="upsell-price">$19</span>
              <button className="upsell-btn">+</button>
            </div>
          </div>
        </div>
        <div className={`annotation annotation-3 ${features.upsells ? 'active' : ''}`}>
          <div className="annotation-line"></div>
          <div className="annotation-label" style={{ background: '#3b82f6' }}>Cart Upsells</div>
        </div>

        {/* Rewards - Feature 4 */}
        <div className={`drawer-section rewards ${features.rewards ? 'active' : 'dimmed'}`}>
          <div className="rewards-msg">Add $12 for FREE SHIPPING</div>
          <div className="progress-bar">
            <div className="progress-fill"></div>
          </div>
          <div className="milestones">
            <div className="milestone done">{Icons.truck}</div>
            <div className="milestone">{Icons.gift}</div>
            <div className="milestone">{Icons.star}</div>
          </div>
        </div>
        <div className={`annotation annotation-4 ${features.rewards ? 'active' : ''}`}>
          <div className="annotation-line"></div>
          <div className="annotation-label" style={{ background: '#10b981' }}>Rewards Progress</div>
        </div>

        {/* Addons - Feature 5 */}
        <div className={`drawer-section addons ${features.addons ? 'active' : 'dimmed'}`}>
          <div className="addon-row">
            <div className="addon-toggle on"></div>
            <span className="addon-icon">{Icons.shield}</span>
            <span className="addon-name">Shipping Protection</span>
            <span className="addon-price">$4.99</span>
          </div>
          <div className="addon-row">
            <div className="addon-toggle"></div>
            <span className="addon-icon">{Icons.gift}</span>
            <span className="addon-name">Gift Wrap</span>
            <span className="addon-price">$5.99</span>
          </div>
        </div>
        <div className={`annotation annotation-5 ${features.addons ? 'active' : ''}`}>
          <div className="annotation-line"></div>
          <div className="annotation-label" style={{ background: '#ec4899' }}>Quick Add-Ons</div>
        </div>

        {/* Subtotal & Checkout */}
        <div className="drawer-section checkout-section">
          <div className="subtotal-row">
            <span>Subtotal</span>
            <span className="subtotal-price">$122.99</span>
          </div>
          <button className="checkout-btn">Checkout</button>
        </div>

        {/* Trust Badges - Feature 6 */}
        <div className={`drawer-section trust-badges ${features.trust_badges ? 'active' : 'dimmed'}`}>
          <div className="badges-row">
            <div className="badge">{Icons.lock}<span>Secure</span></div>
            <div className="badge">{Icons.check}<span>Verified</span></div>
            <div className="badge">{Icons.truck}<span>Fast</span></div>
          </div>
        </div>
        <div className={`annotation annotation-6 ${features.trust_badges ? 'active' : ''}`}>
          <div className="annotation-line"></div>
          <div className="annotation-label" style={{ background: '#06b6d4' }}>Trust Badges</div>
        </div>
      </div>
    </div>

    <style jsx>{`
      .mockup-container {
        position: relative;
        padding: 20px 100px 20px 20px;
      }

      .phone-frame {
        width: 280px;
        background: #fff;
        border-radius: 32px;
        box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.15), 0 0 0 1px rgba(0, 0, 0, 0.05);
        padding: 12px;
        position: relative;
      }

      .phone-notch {
        width: 100px;
        height: 24px;
        background: #1a1a1a;
        border-radius: 0 0 16px 16px;
        position: absolute;
        top: 0;
        left: 50%;
        transform: translateX(-50%);
        z-index: 10;
      }

      .cart-drawer {
        background: #f9fafb;
        border-radius: 20px;
        overflow: hidden;
        font-size: 11px;
      }

      .drawer-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 16px 14px 12px;
        background: #fff;
        border-bottom: 1px solid #e5e7eb;
      }

      .drawer-title {
        font-weight: 600;
        font-size: 14px;
        color: #111827;
      }

      .drawer-close {
        width: 24px;
        height: 24px;
        display: flex;
        align-items: center;
        justify-content: center;
        color: #9ca3af;
        font-size: 18px;
      }

      .drawer-section {
        padding: 8px 10px;
        transition: opacity 0.3s;
      }

      .drawer-section.dimmed {
        opacity: 0.3;
      }

      /* Announcement */
      .announcement-bar {
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 6px;
        padding: 8px;
        background: linear-gradient(90deg, #8b5cf6, #a78bfa);
        border-radius: 6px;
        color: white;
        font-weight: 500;
      }

      .ann-icon { display: flex; }

      /* Timer */
      .timer-bar {
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 6px;
        padding: 8px;
        background: #f3f4f6;
        border-radius: 6px;
        color: #374151;
      }

      .timer-icon { color: #6b7280; }

      /* Cart Items */
      .cart-items {
        background: #fff;
        border-radius: 8px;
        margin: 4px 0;
      }

      .cart-item {
        display: flex;
        gap: 10px;
        padding: 10px;
        border-bottom: 1px solid #f3f4f6;
      }

      .cart-item:last-child { border-bottom: none; }

      .item-image {
        width: 48px;
        height: 48px;
        background: linear-gradient(135deg, #e5e7eb, #d1d5db);
        border-radius: 6px;
      }

      .item-details {
        display: flex;
        flex-direction: column;
        justify-content: center;
        gap: 2px;
      }

      .item-name { font-weight: 500; color: #111827; }
      .item-variant { font-size: 10px; color: #9ca3af; }
      .item-price { font-weight: 600; color: #111827; }

      /* Upsells */
      .upsell-title {
        font-weight: 600;
        color: #374151;
        margin-bottom: 8px;
      }

      .upsell-scroll {
        display: flex;
        gap: 8px;
      }

      .upsell-card {
        flex: 1;
        background: #fff;
        border-radius: 8px;
        padding: 8px;
        text-align: center;
      }

      .upsell-img {
        width: 100%;
        height: 36px;
        background: linear-gradient(135deg, #e5e7eb, #d1d5db);
        border-radius: 4px;
        margin-bottom: 6px;
      }

      .upsell-name { display: block; color: #6b7280; font-size: 10px; }
      .upsell-price { display: block; font-weight: 600; color: #111827; }
      .upsell-btn {
        width: 100%;
        margin-top: 6px;
        padding: 4px;
        background: #111827;
        color: white;
        border: none;
        border-radius: 4px;
        font-size: 10px;
        font-weight: 600;
      }

      /* Rewards */
      .rewards-msg {
        text-align: center;
        font-weight: 500;
        color: #059669;
        margin-bottom: 6px;
      }

      .progress-bar {
        height: 6px;
        background: #e5e7eb;
        border-radius: 3px;
        overflow: hidden;
        margin-bottom: 8px;
      }

      .progress-fill {
        width: 65%;
        height: 100%;
        background: linear-gradient(90deg, #10b981, #34d399);
      }

      .milestones {
        display: flex;
        justify-content: space-between;
        padding: 0 10px;
      }

      .milestone {
        width: 22px;
        height: 22px;
        background: #e5e7eb;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        color: #9ca3af;
      }

      .milestone.done {
        background: #10b981;
        color: white;
      }

      /* Addons */
      .addon-row {
        display: flex;
        align-items: center;
        gap: 8px;
        padding: 8px;
        background: #fff;
        border-radius: 6px;
        margin-bottom: 4px;
      }

      .addon-toggle {
        width: 28px;
        height: 16px;
        background: #d1d5db;
        border-radius: 8px;
        position: relative;
      }

      .addon-toggle::after {
        content: '';
        position: absolute;
        width: 12px;
        height: 12px;
        background: white;
        border-radius: 50%;
        top: 2px;
        left: 2px;
        transition: 0.2s;
      }

      .addon-toggle.on { background: #10b981; }
      .addon-toggle.on::after { left: 14px; }

      .addon-icon { color: #6b7280; }
      .addon-name { flex: 1; color: #374151; }
      .addon-price { font-weight: 600; color: #6b7280; }

      /* Checkout */
      .checkout-section {
        background: #fff;
        border-radius: 8px;
        margin-top: 4px;
      }

      .subtotal-row {
        display: flex;
        justify-content: space-between;
        padding: 10px;
        border-bottom: 1px solid #f3f4f6;
        font-weight: 500;
        color: #374151;
      }

      .subtotal-price { font-weight: 700; color: #111827; }

      .checkout-btn {
        width: calc(100% - 20px);
        margin: 10px;
        padding: 12px;
        background: #111827;
        color: white;
        border: none;
        border-radius: 8px;
        font-weight: 600;
        font-size: 13px;
      }

      /* Trust Badges */
      .badges-row {
        display: flex;
        justify-content: center;
        gap: 12px;
        padding: 8px 0;
      }

      .badge {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 2px;
        color: #6b7280;
        font-size: 9px;
      }

      /* Annotations */
      .annotation {
        position: absolute;
        display: flex;
        align-items: center;
        opacity: 0.4;
        transition: opacity 0.3s;
      }

      .annotation.active { opacity: 1; }

      .annotation-line {
        width: 40px;
        height: 2px;
        background: currentColor;
      }

      .annotation-label {
        padding: 4px 10px;
        color: white;
        font-size: 10px;
        font-weight: 600;
        border-radius: 4px;
        white-space: nowrap;
      }

      .annotation-1 { top: 78px; right: 20px; color: #8b5cf6; }
      .annotation-2 { top: 120px; right: 20px; color: #f59e0b; }
      .annotation-3 { top: 290px; right: 20px; color: #3b82f6; }
      .annotation-4 { top: 380px; right: 20px; color: #10b981; }
      .annotation-5 { top: 465px; right: 20px; color: #ec4899; }
      .annotation-6 { top: 620px; right: 20px; color: #06b6d4; }
    `}</style>
  </div>
);

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

  if (loading) {
    return (
      <div className="loading">
        <div className="spinner" />
        <style jsx>{`
          .loading { display: flex; align-items: center; justify-content: center; min-height: 400px; }
          .spinner { width: 32px; height: 32px; border: 2px solid #e5e7eb; border-top-color: #000; border-radius: 50%; animation: spin 0.7s linear infinite; }
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
        <a href="https://admin.shopify.com/store/themes/current/editor?context=apps" target="_blank" rel="noopener noreferrer" className="theme-btn">
          <span>Open Theme Editor</span>
          {Icons.externalLink}
        </a>
      </header>

      <div className="main-layout">
        <div className="features-column">
          {FEATURES.map(feature => (
            <div key={feature.id} className={`feature-card ${features[feature.id] ? 'enabled' : ''}`}>
              <div className="feature-icon" style={{ background: features[feature.id] ? `${feature.color}15` : '#f3f4f6', color: features[feature.id] ? feature.color : '#9ca3af' }}>
                {feature.icon}
              </div>
              <div className="feature-info">
                <h3>{feature.title}</h3>
                <p>{feature.description}</p>
              </div>
              <label className="toggle">
                <input type="checkbox" checked={features[feature.id]} onChange={() => toggleFeature(feature.id)} />
                <span className="toggle-track" style={{ background: features[feature.id] ? feature.color : '#d1d5db' }}>
                  <span className="toggle-thumb" />
                </span>
              </label>
              <button className="config-btn" onClick={() => router.push(feature.href)}>
                {Icons.settings}
              </button>
            </div>
          ))}
        </div>

        <div className="mockup-column">
          <div className="mockup-header">
            <h2>Cart Preview</h2>
            <p>See how features appear in your cart drawer</p>
          </div>
          <AnnotatedCartMockup features={features} />
        </div>
      </div>

      <style jsx>{`
        .dashboard {
          padding: 24px;
          max-width: 1400px;
          margin: 0 auto;
          min-height: 100vh;
          background: #f6f6f7;
        }

        .header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 24px;
          padding-bottom: 20px;
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

        .theme-btn:hover { background: #1f2937; }

        .main-layout {
          display: flex;
          gap: 32px;
          align-items: flex-start;
        }

        .features-column {
          flex: 1;
          max-width: 480px;
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .feature-card {
          display: flex;
          align-items: center;
          gap: 14px;
          padding: 16px;
          background: white;
          border: 1px solid #e5e7eb;
          border-radius: 12px;
          transition: all 0.2s ease;
        }

        .feature-card.enabled {
          border-color: #d1d5db;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
        }

        .feature-icon {
          width: 44px;
          height: 44px;
          border-radius: 10px;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          transition: all 0.2s;
        }

        .feature-info {
          flex: 1;
          min-width: 0;
        }

        .feature-info h3 {
          font-size: 14px;
          font-weight: 600;
          color: #111827;
          margin: 0 0 2px;
        }

        .feature-info p {
          font-size: 12px;
          color: #6b7280;
          margin: 0;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .toggle {
          position: relative;
          cursor: pointer;
          flex-shrink: 0;
        }

        .toggle input {
          position: absolute;
          opacity: 0;
          width: 0;
          height: 0;
        }

        .toggle-track {
          display: block;
          width: 40px;
          height: 22px;
          border-radius: 11px;
          transition: background 0.2s ease;
        }

        .toggle-thumb {
          position: absolute;
          top: 2px;
          left: 2px;
          width: 18px;
          height: 18px;
          background: white;
          border-radius: 50%;
          box-shadow: 0 1px 3px rgba(0,0,0,0.15);
          transition: transform 0.2s ease;
        }

        .toggle input:checked ~ .toggle-track .toggle-thumb {
          transform: translateX(18px);
        }

        .config-btn {
          width: 36px;
          height: 36px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: #f9fafb;
          border: 1px solid #e5e7eb;
          border-radius: 8px;
          color: #6b7280;
          cursor: pointer;
          transition: all 0.15s ease;
          flex-shrink: 0;
        }

        .config-btn:hover {
          background: #f3f4f6;
          color: #374151;
        }

        .mockup-column {
          flex-shrink: 0;
          position: sticky;
          top: 24px;
        }

        .mockup-header {
          margin-bottom: 16px;
        }

        .mockup-header h2 {
          font-size: 16px;
          font-weight: 600;
          color: #111827;
          margin: 0 0 4px;
        }

        .mockup-header p {
          font-size: 13px;
          color: #6b7280;
          margin: 0;
        }

        @media (max-width: 1100px) {
          .main-layout {
            flex-direction: column-reverse;
            align-items: center;
          }

          .features-column {
            max-width: 100%;
            width: 100%;
          }

          .mockup-column {
            position: static;
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
