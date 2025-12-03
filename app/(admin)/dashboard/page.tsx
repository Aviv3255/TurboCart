/**
 * TurboCart Dashboard
 * Feature cards with preview + compact annotated cart mockup
 */

'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { authenticatedFetch } from '@/lib/shopify/authenticated-fetch';

// SVG Icons
const Icons = {
  cart: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/></svg>,
  gift: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 12 20 22 4 22 4 12"/><rect x="2" y="7" width="20" height="5"/><line x1="12" y1="22" x2="12" y2="7"/><path d="M12 7H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7z"/><path d="M12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7z"/></svg>,
  shield: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>,
  clock: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>,
  megaphone: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M3 11l18-5v12L3 14v-3z"/><path d="M11.6 16.8a3 3 0 1 1-5.8-1.6"/></svg>,
  award: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="8" r="7"/><polyline points="8.21 13.89 7 23 12 20 17 23 15.79 13.88"/></svg>,
  toggle: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect x="1" y="5" width="22" height="14" rx="7" ry="7"/><circle cx="16" cy="12" r="3"/></svg>,
  badgeCheck: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M3.85 8.62a4 4 0 0 1 4.78-4.77 4 4 0 0 1 6.74 0 4 4 0 0 1 4.78 4.78 4 4 0 0 1 0 6.74 4 4 0 0 1-4.77 4.78 4 4 0 0 1-6.75 0 4 4 0 0 1-4.78-4.77 4 4 0 0 1 0-6.76Z"/><path d="m9 12 2 2 4-4"/></svg>,
  settings: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>,
  externalLink: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>,
  truck: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="1" y="3" width="15" height="13"/><polygon points="16 8 20 8 23 11 23 16 16 16 16 8"/><circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/></svg>,
  check: <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>,
  lock: <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>,
  star: <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor" stroke="none"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>,
  chevronRight: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"/></svg>,
};

interface FeatureStatus {
  upsells: boolean;
  rewards: boolean;
  addons: boolean;
  timer: boolean;
  announcement: boolean;
  trust_badges: boolean;
}

interface Product {
  id: string;
  title: string;
  price: string;
  image?: string;
}

interface StoreData {
  products: Product[];
  timerMinutes: number;
  rewardThreshold: number;
  announcementText: string;
}

const FEATURE_COLORS = {
  announcement: '#8b5cf6',
  timer: '#f59e0b',
  upsells: '#3b82f6',
  rewards: '#10b981',
  addons: '#ec4899',
  trust_badges: '#06b6d4',
};

export default function DashboardPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [features, setFeatures] = useState<FeatureStatus>({
    upsells: true,
    rewards: true,
    addons: true,
    timer: true,
    announcement: true,
    trust_badges: true,
  });
  const [storeData, setStoreData] = useState<StoreData>({
    products: [
      { id: '1', title: 'Premium Headphones', price: '$89.00' },
      { id: '2', title: 'Wireless Charger', price: '$29.00' },
      { id: '3', title: 'Phone Case', price: '$19.00' },
    ],
    timerMinutes: 10,
    rewardThreshold: 50,
    announcementText: 'Free shipping on orders over $50!',
  });
  const [countdown, setCountdown] = useState({ minutes: 9, seconds: 45 });

  useEffect(() => {
    fetchAllData();
    // Countdown timer
    const interval = setInterval(() => {
      setCountdown(prev => {
        if (prev.seconds > 0) return { ...prev, seconds: prev.seconds - 1 };
        if (prev.minutes > 0) return { minutes: prev.minutes - 1, seconds: 59 };
        return { minutes: storeData.timerMinutes, seconds: 0 };
      });
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const fetchAllData = async () => {
    try {
      const [featuresRes, productsRes, timerRes, rewardsRes, announcementRes] = await Promise.all([
        authenticatedFetch('/api/admin/cart-features').catch(() => null),
        authenticatedFetch('/api/products').catch(() => null),
        authenticatedFetch('/api/admin/timer').catch(() => null),
        authenticatedFetch('/api/admin/rewards').catch(() => null),
        authenticatedFetch('/api/admin/announcement').catch(() => null),
      ]);

      if (featuresRes?.ok) {
        const data = await featuresRes.json();
        if (data.settings?.features) {
          setFeatures(prev => ({ ...prev, ...data.settings.features }));
        }
      }

      if (productsRes?.ok) {
        const data = await productsRes.json();
        if (data.products?.length > 0) {
          setStoreData(prev => ({
            ...prev,
            products: data.products.slice(0, 3).map((p: any) => ({
              id: p.id,
              title: p.title,
              price: `$${parseFloat(p.variants?.[0]?.price || p.price || '0').toFixed(2)}`,
              image: p.images?.[0]?.src || p.image?.src || null,
            })),
          }));
        }
      }

      if (timerRes?.ok) {
        const data = await timerRes.json();
        if (data.settings?.duration_minutes) {
          setStoreData(prev => ({ ...prev, timerMinutes: data.settings.duration_minutes }));
          setCountdown({ minutes: data.settings.duration_minutes - 1, seconds: 45 });
        }
      }

      if (rewardsRes?.ok) {
        const data = await rewardsRes.json();
        if (data.settings?.tiers?.[0]?.threshold) {
          setStoreData(prev => ({ ...prev, rewardThreshold: data.settings.tiers[0].threshold }));
        }
      }

      if (announcementRes?.ok) {
        const data = await announcementRes.json();
        if (data.settings?.message) {
          setStoreData(prev => ({ ...prev, announcementText: data.settings.message }));
        }
      }
    } catch (error) {
      console.error('Error fetching data:', error);
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
        body: JSON.stringify({ settings: { features: { [featureId]: newValue } } }),
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

  const cartSubtotal = 118;
  const remainingForFreeShipping = Math.max(0, storeData.rewardThreshold - cartSubtotal);
  const progressPercent = Math.min(100, (cartSubtotal / storeData.rewardThreshold) * 100);

  return (
    <div className="dashboard">
      <header className="header">
        <div className="header-content">
          <h1>TurboCart</h1>
          <p>Configure your cart drawer features</p>
        </div>
        <a href="https://admin.shopify.com/store/themes/current/editor?context=apps" target="_blank" rel="noopener noreferrer" className="theme-btn">
          <span>Open Theme Editor</span>
          {Icons.externalLink}
        </a>
      </header>

      <div className="main-layout">
        {/* Feature Cards */}
        <div className="features-column">
          {/* Announcement Bar */}
          <div className={`feature-card ${features.announcement ? 'enabled' : ''}`}>
            <div className="feature-header">
              <div className="feature-icon" style={{ background: features.announcement ? '#8b5cf615' : '#f3f4f6', color: features.announcement ? '#8b5cf6' : '#9ca3af' }}>
                {Icons.megaphone}
              </div>
              <div className="feature-info">
                <h3>Announcement Bar</h3>
                <p>Custom messages and promotions</p>
              </div>
              <label className="toggle">
                <input type="checkbox" checked={features.announcement} onChange={() => toggleFeature('announcement')} />
                <span className="toggle-track" style={{ background: features.announcement ? '#8b5cf6' : '#d1d5db' }}><span className="toggle-thumb" /></span>
              </label>
              <button className="config-btn" onClick={() => router.push('/announcement')}>{Icons.settings}</button>
            </div>
            {features.announcement && (
              <div className="feature-preview">
                <div className="preview-announcement">{Icons.truck}<span>{storeData.announcementText}</span></div>
              </div>
            )}
          </div>

          {/* Urgency Timer */}
          <div className={`feature-card ${features.timer ? 'enabled' : ''}`}>
            <div className="feature-header">
              <div className="feature-icon" style={{ background: features.timer ? '#f59e0b15' : '#f3f4f6', color: features.timer ? '#f59e0b' : '#9ca3af' }}>
                {Icons.clock}
              </div>
              <div className="feature-info">
                <h3>Urgency Timer</h3>
                <p>Countdown timer to encourage checkout</p>
              </div>
              <label className="toggle">
                <input type="checkbox" checked={features.timer} onChange={() => toggleFeature('timer')} />
                <span className="toggle-track" style={{ background: features.timer ? '#f59e0b' : '#d1d5db' }}><span className="toggle-thumb" /></span>
              </label>
              <button className="config-btn" onClick={() => router.push('/timer')}>{Icons.settings}</button>
            </div>
            {features.timer && (
              <div className="feature-preview">
                <div className="preview-timer">
                  {Icons.clock}
                  <span>Items reserved for <strong>{String(countdown.minutes).padStart(2, '0')}:{String(countdown.seconds).padStart(2, '0')}</strong></span>
                </div>
              </div>
            )}
          </div>

          {/* Cart Upsells */}
          <div className={`feature-card ${features.upsells ? 'enabled' : ''}`}>
            <div className="feature-header">
              <div className="feature-icon" style={{ background: features.upsells ? '#3b82f615' : '#f3f4f6', color: features.upsells ? '#3b82f6' : '#9ca3af' }}>
                {Icons.cart}
              </div>
              <div className="feature-info">
                <h3>Cart Upsells</h3>
                <p>Product recommendations to increase AOV</p>
              </div>
              <label className="toggle">
                <input type="checkbox" checked={features.upsells} onChange={() => toggleFeature('upsells')} />
                <span className="toggle-track" style={{ background: features.upsells ? '#3b82f6' : '#d1d5db' }}><span className="toggle-thumb" /></span>
              </label>
              <button className="config-btn" onClick={() => router.push('/products')}>{Icons.settings}</button>
            </div>
            {features.upsells && (
              <div className="feature-preview">
                <div className="preview-upsells">
                  {storeData.products.slice(0, 2).map((product, i) => (
                    <div key={i} className="upsell-mini">
                      <div className="upsell-mini-img" style={product.image ? { backgroundImage: `url(${product.image})` } : {}} />
                      <span className="upsell-mini-title">{product.title.split(' ')[0]}</span>
                      <span className="upsell-mini-price">{product.price}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Rewards Progress */}
          <div className={`feature-card ${features.rewards ? 'enabled' : ''}`}>
            <div className="feature-header">
              <div className="feature-icon" style={{ background: features.rewards ? '#10b98115' : '#f3f4f6', color: features.rewards ? '#10b981' : '#9ca3af' }}>
                {Icons.award}
              </div>
              <div className="feature-info">
                <h3>Rewards Progress</h3>
                <p>Free shipping and discount goals</p>
              </div>
              <label className="toggle">
                <input type="checkbox" checked={features.rewards} onChange={() => toggleFeature('rewards')} />
                <span className="toggle-track" style={{ background: features.rewards ? '#10b981' : '#d1d5db' }}><span className="toggle-thumb" /></span>
              </label>
              <button className="config-btn" onClick={() => router.push('/rewards')}>{Icons.settings}</button>
            </div>
            {features.rewards && (
              <div className="feature-preview">
                <div className="preview-rewards">
                  <span className="rewards-text">{remainingForFreeShipping > 0 ? `Add $${remainingForFreeShipping} for FREE SHIPPING` : 'Free shipping unlocked!'}</span>
                  <div className="rewards-bar"><div className="rewards-fill" style={{ width: `${progressPercent}%` }} /></div>
                </div>
              </div>
            )}
          </div>

          {/* Quick Add-Ons */}
          <div className={`feature-card ${features.addons ? 'enabled' : ''}`}>
            <div className="feature-header">
              <div className="feature-icon" style={{ background: features.addons ? '#ec489915' : '#f3f4f6', color: features.addons ? '#ec4899' : '#9ca3af' }}>
                {Icons.toggle}
              </div>
              <div className="feature-info">
                <h3>Quick Add-Ons</h3>
                <p>One-click extras like shipping protection</p>
              </div>
              <label className="toggle">
                <input type="checkbox" checked={features.addons} onChange={() => toggleFeature('addons')} />
                <span className="toggle-track" style={{ background: features.addons ? '#ec4899' : '#d1d5db' }}><span className="toggle-thumb" /></span>
              </label>
              <button className="config-btn" onClick={() => router.push('/addons')}>{Icons.settings}</button>
            </div>
            {features.addons && (
              <div className="feature-preview">
                <div className="preview-addon">
                  <div className="addon-toggle-mini on" />
                  <span>{Icons.shield}</span>
                  <span className="addon-text">Shipping Protection</span>
                  <span className="addon-price">$4.99</span>
                </div>
              </div>
            )}
          </div>

          {/* Trust Badges */}
          <div className={`feature-card ${features.trust_badges ? 'enabled' : ''}`}>
            <div className="feature-header">
              <div className="feature-icon" style={{ background: features.trust_badges ? '#06b6d415' : '#f3f4f6', color: features.trust_badges ? '#06b6d4' : '#9ca3af' }}>
                {Icons.badgeCheck}
              </div>
              <div className="feature-info">
                <h3>Trust Badges</h3>
                <p>Security badges for customer confidence</p>
              </div>
              <label className="toggle">
                <input type="checkbox" checked={features.trust_badges} onChange={() => toggleFeature('trust_badges')} />
                <span className="toggle-track" style={{ background: features.trust_badges ? '#06b6d4' : '#d1d5db' }}><span className="toggle-thumb" /></span>
              </label>
              <button className="config-btn" onClick={() => router.push('/trust-badges')}>{Icons.settings}</button>
            </div>
            {features.trust_badges && (
              <div className="feature-preview">
                <div className="preview-badges">
                  <div className="badge-mini">{Icons.lock}<span>Secure</span></div>
                  <div className="badge-mini">{Icons.check}<span>Verified</span></div>
                  <div className="badge-mini">{Icons.truck}<span>Fast</span></div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Cart Mockup */}
        <div className="mockup-column">
          <div className="mockup-wrapper">
            {/* Annotations on the left of phone */}
            <div className="annotations-left">
              <div className={`annotation ${features.announcement ? 'active' : ''}`} style={{ top: '52px' }}>
                <span className="annotation-label" style={{ background: '#8b5cf6' }}>Announcement</span>
                <span className="annotation-line" style={{ background: '#8b5cf6' }} />
              </div>
              <div className={`annotation ${features.timer ? 'active' : ''}`} style={{ top: '88px' }}>
                <span className="annotation-label" style={{ background: '#f59e0b' }}>Timer</span>
                <span className="annotation-line" style={{ background: '#f59e0b' }} />
              </div>
              <div className={`annotation ${features.upsells ? 'active' : ''}`} style={{ top: '224px' }}>
                <span className="annotation-label" style={{ background: '#3b82f6' }}>Upsells</span>
                <span className="annotation-line" style={{ background: '#3b82f6' }} />
              </div>
              <div className={`annotation ${features.rewards ? 'active' : ''}`} style={{ top: '304px' }}>
                <span className="annotation-label" style={{ background: '#10b981' }}>Rewards</span>
                <span className="annotation-line" style={{ background: '#10b981' }} />
              </div>
              <div className={`annotation ${features.addons ? 'active' : ''}`} style={{ top: '374px' }}>
                <span className="annotation-label" style={{ background: '#ec4899' }}>Add-Ons</span>
                <span className="annotation-line" style={{ background: '#ec4899' }} />
              </div>
              <div className={`annotation ${features.trust_badges ? 'active' : ''}`} style={{ top: '498px' }}>
                <span className="annotation-label" style={{ background: '#06b6d4' }}>Trust Badges</span>
                <span className="annotation-line" style={{ background: '#06b6d4' }} />
              </div>
            </div>

            {/* Phone Frame */}
            <div className="phone-frame">
              <div className="phone-notch" />
              <div className="cart-drawer">
                {/* Header */}
                <div className="drawer-header">
                  <span className="drawer-title">Your Cart (2)</span>
                  <span className="drawer-close">×</span>
                </div>

                {/* Announcement */}
                <div className={`drawer-section ${features.announcement ? '' : 'dimmed'}`}>
                  <div className="mock-announcement">{Icons.truck}<span>{storeData.announcementText.substring(0, 30)}...</span></div>
                </div>

                {/* Timer */}
                <div className={`drawer-section ${features.timer ? '' : 'dimmed'}`}>
                  <div className="mock-timer">{Icons.clock}<span>Reserved for <strong>{String(countdown.minutes).padStart(2, '0')}:{String(countdown.seconds).padStart(2, '0')}</strong></span></div>
                </div>

                {/* Cart Items */}
                <div className="drawer-section cart-items">
                  <div className="cart-item">
                    <div className="item-img" style={storeData.products[0]?.image ? { backgroundImage: `url(${storeData.products[0].image})` } : {}} />
                    <div className="item-info">
                      <span className="item-name">{storeData.products[0]?.title || 'Product'}</span>
                      <span className="item-meta">Qty: 1</span>
                      <span className="item-price">{storeData.products[0]?.price || '$0.00'}</span>
                    </div>
                  </div>
                  <div className="cart-item">
                    <div className="item-img" style={storeData.products[1]?.image ? { backgroundImage: `url(${storeData.products[1].image})` } : {}} />
                    <div className="item-info">
                      <span className="item-name">{storeData.products[1]?.title || 'Product'}</span>
                      <span className="item-meta">Qty: 1</span>
                      <span className="item-price">{storeData.products[1]?.price || '$0.00'}</span>
                    </div>
                  </div>
                </div>

                {/* Upsells */}
                <div className={`drawer-section ${features.upsells ? '' : 'dimmed'}`}>
                  <div className="mock-upsells">
                    <span className="upsells-title">You may also like</span>
                    <div className="upsells-row">
                      {storeData.products.slice(0, 2).map((p, i) => (
                        <div key={i} className="upsell-item">
                          <div className="upsell-img" style={p.image ? { backgroundImage: `url(${p.image})` } : {}} />
                          <span className="upsell-name">{p.title.split(' ')[0]}</span>
                          <span className="upsell-price">{p.price}</span>
                          <div className="upsell-btn">+</div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Rewards */}
                <div className={`drawer-section ${features.rewards ? '' : 'dimmed'}`}>
                  <div className="mock-rewards">
                    <span className="rewards-msg">{remainingForFreeShipping > 0 ? `Add $${remainingForFreeShipping} for FREE SHIPPING` : 'Free shipping unlocked!'}</span>
                    <div className="progress"><div className="progress-fill" style={{ width: `${progressPercent}%` }} /></div>
                    <div className="milestones">
                      <div className="ms done">{Icons.truck}</div>
                      <div className="ms">{Icons.gift}</div>
                      <div className="ms">{Icons.star}</div>
                    </div>
                  </div>
                </div>

                {/* Addons */}
                <div className={`drawer-section ${features.addons ? '' : 'dimmed'}`}>
                  <div className="mock-addon">
                    <div className="addon-toggle on" />
                    <span className="addon-icon">{Icons.shield}</span>
                    <span className="addon-name">Shipping Protection</span>
                    <span className="addon-price">$4.99</span>
                  </div>
                  <div className="mock-addon">
                    <div className="addon-toggle" />
                    <span className="addon-icon">{Icons.gift}</span>
                    <span className="addon-name">Gift Wrap</span>
                    <span className="addon-price">$5.99</span>
                  </div>
                </div>

                {/* Checkout */}
                <div className="drawer-section checkout">
                  <div className="subtotal"><span>Subtotal</span><span className="total">${cartSubtotal}.00</span></div>
                  <div className="checkout-btn">Checkout</div>
                </div>

                {/* Trust Badges */}
                <div className={`drawer-section ${features.trust_badges ? '' : 'dimmed'}`}>
                  <div className="mock-badges">
                    <div className="trust-badge">{Icons.lock}<span>Secure</span></div>
                    <div className="trust-badge">{Icons.check}<span>Verified</span></div>
                    <div className="trust-badge">{Icons.truck}<span>Fast</span></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        .dashboard {
          padding: 20px 24px;
          max-width: 1200px;
          margin: 0 auto;
          background: #f6f6f7;
          min-height: 100vh;
        }

        .header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 20px;
          padding-bottom: 16px;
          border-bottom: 1px solid #e5e7eb;
        }

        .header-content h1 { font-size: 22px; font-weight: 700; color: #111827; margin: 0 0 2px; }
        .header-content p { font-size: 13px; color: #6b7280; margin: 0; }

        .theme-btn {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 8px 14px;
          background: #111827;
          color: white;
          border-radius: 8px;
          font-size: 13px;
          font-weight: 500;
          text-decoration: none;
        }

        .theme-btn:hover { background: #1f2937; }

        .main-layout {
          display: flex;
          gap: 24px;
          align-items: flex-start;
        }

        /* Feature Cards */
        .features-column {
          flex: 1;
          display: flex;
          flex-direction: column;
          gap: 10px;
          max-width: 520px;
        }

        .feature-card {
          background: white;
          border: 1px solid #e5e7eb;
          border-radius: 10px;
          overflow: hidden;
          transition: all 0.2s;
        }

        .feature-card.enabled {
          border-color: #d1d5db;
          box-shadow: 0 1px 2px rgba(0,0,0,0.04);
        }

        .feature-header {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 12px 14px;
        }

        .feature-icon {
          width: 40px;
          height: 40px;
          border-radius: 8px;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }

        .feature-info { flex: 1; min-width: 0; }
        .feature-info h3 { font-size: 13px; font-weight: 600; color: #111827; margin: 0 0 1px; }
        .feature-info p { font-size: 11px; color: #6b7280; margin: 0; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }

        .toggle { position: relative; cursor: pointer; flex-shrink: 0; }
        .toggle input { position: absolute; opacity: 0; width: 0; height: 0; }
        .toggle-track { display: block; width: 36px; height: 20px; border-radius: 10px; transition: background 0.2s; }
        .toggle-thumb { position: absolute; top: 2px; left: 2px; width: 16px; height: 16px; background: white; border-radius: 50%; box-shadow: 0 1px 2px rgba(0,0,0,0.15); transition: transform 0.2s; }
        .toggle input:checked ~ .toggle-track .toggle-thumb { transform: translateX(16px); }

        .config-btn {
          width: 32px;
          height: 32px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: #f9fafb;
          border: 1px solid #e5e7eb;
          border-radius: 6px;
          color: #6b7280;
          cursor: pointer;
          flex-shrink: 0;
        }

        .config-btn:hover { background: #f3f4f6; color: #374151; }

        /* Feature Previews */
        .feature-preview {
          padding: 10px 14px;
          background: #f9fafb;
          border-top: 1px solid #f3f4f6;
        }

        .preview-announcement {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
          padding: 8px 12px;
          background: linear-gradient(90deg, #8b5cf6, #a78bfa);
          border-radius: 6px;
          color: white;
          font-size: 11px;
          font-weight: 500;
        }

        .preview-timer {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
          padding: 8px 12px;
          background: #f3f4f6;
          border-radius: 6px;
          color: #374151;
          font-size: 11px;
        }

        .preview-upsells {
          display: flex;
          gap: 8px;
        }

        .upsell-mini {
          flex: 1;
          background: white;
          border-radius: 6px;
          padding: 8px;
          text-align: center;
          border: 1px solid #e5e7eb;
        }

        .upsell-mini-img {
          width: 100%;
          height: 32px;
          background: linear-gradient(135deg, #e5e7eb, #d1d5db);
          background-size: cover;
          background-position: center;
          border-radius: 4px;
          margin-bottom: 4px;
        }

        .upsell-mini-title { display: block; font-size: 10px; color: #6b7280; }
        .upsell-mini-price { display: block; font-size: 11px; font-weight: 600; color: #111827; }

        .preview-rewards {
          text-align: center;
        }

        .rewards-text { font-size: 11px; font-weight: 500; color: #059669; }
        .rewards-bar { height: 4px; background: #e5e7eb; border-radius: 2px; margin-top: 6px; overflow: hidden; }
        .rewards-fill { height: 100%; background: linear-gradient(90deg, #10b981, #34d399); }

        .preview-addon {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 6px 10px;
          background: white;
          border-radius: 6px;
          border: 1px solid #e5e7eb;
          font-size: 11px;
        }

        .addon-toggle-mini {
          width: 24px;
          height: 14px;
          background: #d1d5db;
          border-radius: 7px;
          position: relative;
        }

        .addon-toggle-mini::after {
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

        .addon-toggle-mini.on { background: #10b981; }
        .addon-toggle-mini.on::after { left: 12px; }

        .addon-text { flex: 1; color: #374151; }
        .addon-price { font-weight: 600; color: #6b7280; }

        .preview-badges {
          display: flex;
          justify-content: center;
          gap: 16px;
        }

        .badge-mini {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 2px;
          color: #6b7280;
          font-size: 9px;
        }

        /* Mockup Column */
        .mockup-column {
          flex-shrink: 0;
          position: sticky;
          top: 20px;
        }

        .mockup-wrapper {
          display: flex;
          align-items: flex-start;
        }

        /* Annotations */
        .annotations-left {
          position: relative;
          width: 90px;
          height: 520px;
          margin-right: 8px;
        }

        .annotation {
          position: absolute;
          display: flex;
          align-items: center;
          gap: 4px;
          opacity: 0.35;
          transition: opacity 0.3s;
        }

        .annotation.active { opacity: 1; }

        .annotation-label {
          padding: 3px 8px;
          color: white;
          font-size: 9px;
          font-weight: 600;
          border-radius: 4px;
          white-space: nowrap;
        }

        .annotation-line {
          width: 20px;
          height: 2px;
        }

        /* Phone Frame */
        .phone-frame {
          width: 220px;
          background: #fff;
          border-radius: 24px;
          box-shadow: 0 20px 40px -12px rgba(0, 0, 0, 0.12), 0 0 0 1px rgba(0, 0, 0, 0.05);
          padding: 8px;
          position: relative;
        }

        .phone-notch {
          width: 70px;
          height: 18px;
          background: #1a1a1a;
          border-radius: 0 0 12px 12px;
          position: absolute;
          top: 0;
          left: 50%;
          transform: translateX(-50%);
          z-index: 10;
        }

        .cart-drawer {
          background: #f9fafb;
          border-radius: 16px;
          overflow: hidden;
          font-size: 9px;
        }

        .drawer-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 12px 10px 8px;
          background: #fff;
          border-bottom: 1px solid #e5e7eb;
        }

        .drawer-title { font-weight: 600; font-size: 12px; color: #111827; }
        .drawer-close { width: 18px; height: 18px; display: flex; align-items: center; justify-content: center; color: #9ca3af; font-size: 14px; }

        .drawer-section {
          padding: 6px 8px;
          transition: opacity 0.3s;
        }

        .drawer-section.dimmed { opacity: 0.25; }

        /* Mock Elements */
        .mock-announcement {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 4px;
          padding: 6px;
          background: linear-gradient(90deg, #8b5cf6, #a78bfa);
          border-radius: 4px;
          color: white;
          font-weight: 500;
          font-size: 8px;
        }

        .mock-timer {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 4px;
          padding: 6px;
          background: #f3f4f6;
          border-radius: 4px;
          color: #374151;
          font-size: 8px;
        }

        .cart-items {
          background: #fff;
          border-radius: 6px;
          margin: 4px 0;
        }

        .cart-item {
          display: flex;
          gap: 8px;
          padding: 8px;
          border-bottom: 1px solid #f3f4f6;
        }

        .cart-item:last-child { border-bottom: none; }

        .item-img {
          width: 36px;
          height: 36px;
          background: linear-gradient(135deg, #e5e7eb, #d1d5db);
          background-size: cover;
          background-position: center;
          border-radius: 4px;
          flex-shrink: 0;
        }

        .item-info { display: flex; flex-direction: column; justify-content: center; gap: 1px; }
        .item-name { font-weight: 500; color: #111827; font-size: 9px; }
        .item-meta { font-size: 8px; color: #9ca3af; }
        .item-price { font-weight: 600; color: #111827; font-size: 9px; }

        .mock-upsells { }
        .upsells-title { font-weight: 600; color: #374151; font-size: 9px; display: block; margin-bottom: 6px; }
        .upsells-row { display: flex; gap: 6px; }

        .upsell-item {
          flex: 1;
          background: #fff;
          border-radius: 6px;
          padding: 6px;
          text-align: center;
        }

        .upsell-img {
          width: 100%;
          height: 28px;
          background: linear-gradient(135deg, #e5e7eb, #d1d5db);
          background-size: cover;
          background-position: center;
          border-radius: 3px;
          margin-bottom: 4px;
        }

        .upsell-name { display: block; color: #6b7280; font-size: 8px; }
        .upsell-price { display: block; font-weight: 600; color: #111827; font-size: 9px; }
        .upsell-btn {
          margin-top: 4px;
          padding: 3px;
          background: #111827;
          color: white;
          border-radius: 3px;
          font-size: 9px;
          font-weight: 600;
        }

        .mock-rewards { text-align: center; }
        .rewards-msg { font-size: 9px; font-weight: 500; color: #059669; }
        .progress { height: 4px; background: #e5e7eb; border-radius: 2px; margin: 4px 0; overflow: hidden; }
        .progress-fill { height: 100%; background: linear-gradient(90deg, #10b981, #34d399); }
        .milestones { display: flex; justify-content: space-between; padding: 0 8px; }
        .ms { width: 16px; height: 16px; background: #e5e7eb; border-radius: 50%; display: flex; align-items: center; justify-content: center; color: #9ca3af; }
        .ms.done { background: #10b981; color: white; }

        .mock-addon {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 6px;
          background: #fff;
          border-radius: 4px;
          margin-bottom: 3px;
        }

        .mock-addon:last-child { margin-bottom: 0; }

        .addon-toggle {
          width: 22px;
          height: 12px;
          background: #d1d5db;
          border-radius: 6px;
          position: relative;
        }

        .addon-toggle::after {
          content: '';
          position: absolute;
          width: 8px;
          height: 8px;
          background: white;
          border-radius: 50%;
          top: 2px;
          left: 2px;
          transition: 0.2s;
        }

        .addon-toggle.on { background: #10b981; }
        .addon-toggle.on::after { left: 12px; }

        .addon-icon { color: #6b7280; }
        .addon-name { flex: 1; color: #374151; font-size: 8px; }
        .addon-price { font-weight: 600; color: #6b7280; font-size: 8px; }

        .checkout {
          background: #fff;
          border-radius: 6px;
          margin-top: 4px;
        }

        .subtotal {
          display: flex;
          justify-content: space-between;
          padding: 8px;
          border-bottom: 1px solid #f3f4f6;
          font-weight: 500;
          color: #374151;
          font-size: 9px;
        }

        .total { font-weight: 700; color: #111827; }

        .checkout-btn {
          margin: 6px;
          padding: 8px;
          background: #111827;
          color: white;
          border-radius: 6px;
          font-weight: 600;
          font-size: 10px;
          text-align: center;
        }

        .mock-badges {
          display: flex;
          justify-content: center;
          gap: 10px;
          padding: 4px 0;
        }

        .trust-badge {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 1px;
          color: #6b7280;
          font-size: 7px;
        }

        @media (max-width: 900px) {
          .main-layout {
            flex-direction: column;
            align-items: center;
          }

          .features-column {
            max-width: 100%;
            width: 100%;
          }

          .mockup-column {
            position: static;
            margin-top: 24px;
          }
        }
      `}</style>
    </div>
  );
}
