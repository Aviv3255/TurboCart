/**
 * TurboCart Dashboard
 * Feature cards with preview + compact annotated cart mockup
 * Includes Display Styles for Cart Upsells with live previews
 */

'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { authenticatedFetch } from '@/lib/shopify/authenticated-fetch';

// SVG Icons
const Icons = {
  cart: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/></svg>,
  gift: <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 12 20 22 4 22 4 12"/><rect x="2" y="7" width="20" height="5"/><line x1="12" y1="22" x2="12" y2="7"/><path d="M12 7H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7z"/><path d="M12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7z"/></svg>,
  shield: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>,
  clock: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>,
  award: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="8" r="7"/><polyline points="8.21 13.89 7 23 12 20 17 23 15.79 13.88"/></svg>,
  toggle: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect x="1" y="5" width="22" height="14" rx="7" ry="7"/><circle cx="16" cy="12" r="3"/></svg>,
  badgeCheck: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M3.85 8.62a4 4 0 0 1 4.78-4.77 4 4 0 0 1 6.74 0 4 4 0 0 1 4.78 4.78 4 4 0 0 1 0 6.74 4 4 0 0 1-4.77 4.78 4 4 0 0 1-6.75 0 4 4 0 0 1-4.78-4.77 4 4 0 0 1 0-6.76Z"/><path d="m9 12 2 2 4-4"/></svg>,
  settings: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>,
  externalLink: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>,
  truck: <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="1" y="3" width="15" height="13"/><polygon points="16 8 20 8 23 11 23 16 16 16 16 8"/><circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/></svg>,
  star: <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor" stroke="none"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>,
  check: <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>,
  // Professional Trust Badge Icons
  lockSecure: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/><circle cx="12" cy="16" r="1"/></svg>,
  shieldCheck: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><path d="m9 12 2 2 4-4"/></svg>,
  creditCard: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="1" y="4" width="22" height="16" rx="2" ry="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg>,
  refresh: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 4 23 10 17 10"/><polyline points="1 20 1 14 7 14"/><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/></svg>,
};

// Display style types
type DisplayStyle = 'minimal-strip' | 'list' | 'banner' | 'cards' | 'frequently-bought';

const DISPLAY_STYLES: { id: DisplayStyle; name: string; description: string }[] = [
  { id: 'minimal-strip', name: 'Minimal Strip', description: 'Horizontal scroll cards' },
  { id: 'cards', name: 'Cards Grid', description: '2-column product cards' },
  { id: 'list', name: 'List', description: 'Vertical list layout' },
  { id: 'frequently-bought', name: 'Frequently Bought', description: 'Social proof badges' },
  { id: 'banner', name: 'Banner', description: 'Featured single product' },
];

interface FeatureStatus {
  upsells: boolean;
  rewards: boolean;
  addons: boolean;
  timer: boolean;
  trust_badges: boolean;
}

interface Product {
  id: string;
  title: string;
  price: string;
  numericPrice: number;
  image?: string;
  compareAtPrice?: string;
}

interface StoreData {
  products: Product[];
  timerMinutes: number;
  rewardThreshold: number;
}

// Section heights for dynamic annotation positioning (in pixels)
// These values are carefully measured to match the actual rendered mockup
const SECTION_HEIGHTS = {
  header: 44,      // drawer-header: padding + title
  rewards: 75,     // rewards progress bar section
  timer: 44,       // timer display section
  cartItems: 118,  // 2 cart items
  upsells: 105,    // upsells display section
  addons: 78,      // 2 add-on toggles
  checkout: 72,    // subtotal + checkout button
  trustBadges: 50, // trust badges row
};

// Offset from top of phone frame to content start
const MOCKUP_TOP_OFFSET = 30; // accounts for phone notch and initial padding

export default function DashboardPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [features, setFeatures] = useState<FeatureStatus>({
    rewards: true,
    timer: true,
    upsells: true,
    addons: true,
    trust_badges: true,
  });
  const [displayStyle, setDisplayStyle] = useState<DisplayStyle>('minimal-strip');
  const [storeData, setStoreData] = useState<StoreData>({
    products: [],
    timerMinutes: 10,
    rewardThreshold: 50,
  });
  const [countdown, setCountdown] = useState({ minutes: 9, seconds: 45 });
  const mockupRef = useRef<HTMLDivElement>(null);

  // Calculate dynamic annotation positions based on enabled features
  // Positions are calculated to point to the vertical center of each section
  const getAnnotationPositions = useCallback(() => {
    let currentTop = MOCKUP_TOP_OFFSET + SECTION_HEIGHTS.header;
    const positions: Record<string, number> = {};

    // Rewards position - at the center of the rewards progress bar
    if (features.rewards) {
      positions.rewards = currentTop + SECTION_HEIGHTS.rewards / 2;
      currentTop += SECTION_HEIGHTS.rewards;
    }

    // Timer position - at the center of the timer display
    if (features.timer) {
      positions.timer = currentTop + SECTION_HEIGHTS.timer / 2;
      currentTop += SECTION_HEIGHTS.timer;
    }

    // Cart items (always visible) - skip, no annotation for cart items
    currentTop += SECTION_HEIGHTS.cartItems;

    // Upsells position - at the center of the upsells section
    if (features.upsells) {
      positions.upsells = currentTop + SECTION_HEIGHTS.upsells / 2;
      currentTop += SECTION_HEIGHTS.upsells;
    }

    // Addons position - at the center of the add-ons section
    if (features.addons) {
      positions.addons = currentTop + SECTION_HEIGHTS.addons / 2;
      currentTop += SECTION_HEIGHTS.addons;
    }

    // Checkout (always visible) - skip, no annotation for checkout
    currentTop += SECTION_HEIGHTS.checkout;

    // Trust badges position - at the center of the badges row
    if (features.trust_badges) {
      positions.trust_badges = currentTop + SECTION_HEIGHTS.trustBadges / 2;
    }

    return positions;
  }, [features]);

  useEffect(() => {
    fetchAllData();
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
      const [featuresRes, productsRes, timerRes, rewardsRes, upsellsRes] = await Promise.all([
        authenticatedFetch('/api/admin/cart-features').catch(() => null),
        authenticatedFetch('/api/products').catch(() => null),
        authenticatedFetch('/api/admin/timer').catch(() => null),
        authenticatedFetch('/api/admin/rewards').catch(() => null),
        authenticatedFetch('/api/admin/upsells').catch(() => null),
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
            products: data.products.slice(0, 6).map((p: any) => {
              const price = parseFloat(p.variants?.[0]?.price || p.price || '0');
              const compareAt = parseFloat(p.variants?.[0]?.compare_at_price || '0');
              return {
                id: p.id,
                title: p.title,
                price: `$${price.toFixed(2)}`,
                numericPrice: price,
                image: p.images?.[0]?.src || p.image?.src || null,
                compareAtPrice: compareAt > price ? `$${compareAt.toFixed(2)}` : undefined,
              };
            }),
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

      if (upsellsRes?.ok) {
        const data = await upsellsRes.json();
        if (data.settings?.displayStyle) {
          setDisplayStyle(data.settings.displayStyle);
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

  const updateDisplayStyle = async (style: DisplayStyle) => {
    setDisplayStyle(style);
    try {
      await authenticatedFetch('/api/admin/upsells', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ settings: { displayStyle: style } }),
      });
    } catch (error) {
      console.error('Error updating display style:', error);
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

  // Use real products or fallback
  const products = storeData.products.length > 0 ? storeData.products : [
    { id: '1', title: 'Premium Headphones', price: '$89.00', numericPrice: 89, image: '' },
    { id: '2', title: 'Wireless Charger', price: '$29.00', numericPrice: 29, image: '' },
    { id: '3', title: 'Phone Case', price: '$19.00', numericPrice: 19, image: '' },
    { id: '4', title: 'USB Cable', price: '$12.00', numericPrice: 12, image: '' },
  ];

  const cartSubtotal = products.slice(0, 2).reduce((sum, p) => sum + p.numericPrice, 0);
  const remainingForFreeShipping = Math.max(0, storeData.rewardThreshold - cartSubtotal);
  const progressPercent = Math.min(100, (cartSubtotal / storeData.rewardThreshold) * 100);
  const annotationPositions = getAnnotationPositions();

  // Render upsells based on display style
  const renderUpsellsPreview = () => {
    const upsellProducts = products.slice(2, 4).length > 0 ? products.slice(2, 4) : products.slice(0, 2);

    switch (displayStyle) {
      case 'minimal-strip':
        return (
          <div className="mock-upsells-strip">
            <span className="upsells-title">You might also like</span>
            <div className="upsells-row">
              {upsellProducts.map((p, i) => (
                <div key={i} className="upsell-item">
                  <div className="upsell-img" style={p.image ? { backgroundImage: `url(${p.image})`, backgroundSize: 'cover', backgroundPosition: 'center' } : {}} />
                  <span className="upsell-name">{p.title.length > 8 ? p.title.substring(0, 8) + '..' : p.title}</span>
                  <span className="upsell-price">{p.price}</span>
                  <div className="upsell-btn">+</div>
                </div>
              ))}
            </div>
          </div>
        );

      case 'cards':
        return (
          <div className="mock-upsells-cards">
            <span className="upsells-title">Recommended for you</span>
            <div className="cards-grid">
              {upsellProducts.map((p, i) => (
                <div key={i} className="card-item">
                  <div className="card-img" style={p.image ? { backgroundImage: `url(${p.image})`, backgroundSize: 'cover', backgroundPosition: 'center' } : {}} />
                  <div className="card-content">
                    <span className="card-name">{p.title.length > 10 ? p.title.substring(0, 10) + '..' : p.title}</span>
                    <div className="card-price-row">
                      {p.compareAtPrice && <span className="card-old">{p.compareAtPrice}</span>}
                      <span className="card-price">{p.price}</span>
                    </div>
                    <div className="card-btn">Add</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );

      case 'list':
        return (
          <div className="mock-upsells-list">
            <span className="upsells-title">Complete your order</span>
            {upsellProducts.map((p, i) => (
              <div key={i} className="list-item">
                <div className="list-img" style={p.image ? { backgroundImage: `url(${p.image})`, backgroundSize: 'cover', backgroundPosition: 'center' } : {}} />
                <div className="list-info">
                  <span className="list-name">{p.title.length > 12 ? p.title.substring(0, 12) + '..' : p.title}</span>
                  <span className="list-price">{p.price}</span>
                </div>
                <div className="list-btn">Add</div>
              </div>
            ))}
          </div>
        );

      case 'frequently-bought':
        return (
          <div className="mock-upsells-fbt">
            {upsellProducts.map((p, i) => (
              <div key={i} className="fbt-item">
                <div className="fbt-img" style={p.image ? { backgroundImage: `url(${p.image})`, backgroundSize: 'cover', backgroundPosition: 'center' } : {}} />
                <div className="fbt-info">
                  <span className="fbt-badge">{57 - i * 8}% added this</span>
                  <span className="fbt-name">{p.title.length > 14 ? p.title.substring(0, 14) + '..' : p.title}</span>
                  <span className="fbt-price">{p.price}</span>
                </div>
                <div className="fbt-btn">Add</div>
              </div>
            ))}
          </div>
        );

      case 'banner':
        const bannerProduct = upsellProducts[0];
        return (
          <div className="mock-upsells-banner">
            <div className="banner-img" style={bannerProduct?.image ? { backgroundImage: `url(${bannerProduct.image})`, backgroundSize: 'cover', backgroundPosition: 'center' } : {}} />
            <div className="banner-content">
              <span className="banner-badge">SELLING FAST</span>
              <span className="banner-name">{bannerProduct?.title}</span>
              <span className="banner-price">{bannerProduct?.price}</span>
            </div>
            <div className="banner-btn">Add</div>
          </div>
        );

      default:
        return null;
    }
  };

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
          {/* 1. Rewards Progress - FIRST */}
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
                  <span className="rewards-text">{remainingForFreeShipping > 0 ? `Add $${remainingForFreeShipping.toFixed(0)} for FREE SHIPPING` : 'Free shipping unlocked!'}</span>
                  <div className="rewards-bar"><div className="rewards-fill" style={{ width: `${progressPercent}%` }} /></div>
                </div>
              </div>
            )}
          </div>

          {/* 2. Urgency Timer */}
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

          {/* 3. Cart Upsells - WITH DISPLAY STYLES */}
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
              <div className="feature-preview upsells-preview">
                {/* Display Style Selector with Live Previews */}
                <div className="display-styles-section">
                  <span className="styles-label">Display Style</span>
                  <div className="styles-grid-visual">
                    {DISPLAY_STYLES.map((style) => (
                      <button
                        key={style.id}
                        className={`style-card ${displayStyle === style.id ? 'selected' : ''}`}
                        onClick={() => updateDisplayStyle(style.id)}
                      >
                        <div className="style-preview-mini">
                          {renderMiniStylePreview(style.id, products)}
                        </div>
                        <div className="style-card-footer">
                          <span className="style-check">{displayStyle === style.id && Icons.check}</span>
                          <span className="style-name">{style.name}</span>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* 4. Quick Add-Ons */}
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

          {/* 5. Trust Badges */}
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
                  <div className="badge-mini">{Icons.lockSecure}<span>SSL Secure</span></div>
                  <div className="badge-mini">{Icons.shieldCheck}<span>Verified</span></div>
                  <div className="badge-mini">{Icons.refresh}<span>Easy Returns</span></div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Cart Mockup - wider and shorter */}
        <div className="mockup-column">
          <div className="mockup-wrapper">
            {/* Dynamic Annotations on the left - black bg with #63F44C text */}
            <div className="annotations-left">
              {features.rewards && (
                <div className="annotation active" style={{ top: `${annotationPositions.rewards}px` }}>
                  <span className="annotation-label">Rewards</span>
                  <span className="annotation-line" />
                </div>
              )}
              {features.timer && (
                <div className="annotation active" style={{ top: `${annotationPositions.timer}px` }}>
                  <span className="annotation-label">Timer</span>
                  <span className="annotation-line" />
                </div>
              )}
              {features.upsells && (
                <div className="annotation active" style={{ top: `${annotationPositions.upsells}px` }}>
                  <span className="annotation-label">Upsells</span>
                  <span className="annotation-line" />
                </div>
              )}
              {features.addons && (
                <div className="annotation active" style={{ top: `${annotationPositions.addons}px` }}>
                  <span className="annotation-label">Add-Ons</span>
                  <span className="annotation-line" />
                </div>
              )}
              {features.trust_badges && (
                <div className="annotation active" style={{ top: `${annotationPositions.trust_badges}px` }}>
                  <span className="annotation-label">Trust Badges</span>
                  <span className="annotation-line" />
                </div>
              )}
            </div>

            {/* Phone Frame - wider, shorter */}
            <div className="phone-frame" ref={mockupRef}>
              <div className="phone-notch" />
              <div className="cart-drawer">
                {/* Header */}
                <div className="drawer-header">
                  <span className="drawer-title">Your Cart (2)</span>
                  <span className="drawer-close">×</span>
                </div>

                {/* 1. Rewards - FIRST in mockup */}
                {features.rewards && (
                  <div className="drawer-section rewards-section">
                    <div className="mock-rewards">
                      <span className="rewards-msg">{remainingForFreeShipping > 0 ? `Add $${remainingForFreeShipping.toFixed(0)} for FREE SHIPPING` : 'Free shipping unlocked!'}</span>
                      <div className="progress"><div className="progress-fill" style={{ width: `${progressPercent}%` }} /></div>
                      <div className="milestones">
                        <div className="ms done">{Icons.truck}</div>
                        <div className="ms">{Icons.gift}</div>
                        <div className="ms">{Icons.star}</div>
                      </div>
                    </div>
                  </div>
                )}

                {/* 2. Timer */}
                {features.timer && (
                  <div className="drawer-section timer-section">
                    <div className="mock-timer">{Icons.clock}<span>Reserved for <strong>{String(countdown.minutes).padStart(2, '0')}:{String(countdown.seconds).padStart(2, '0')}</strong></span></div>
                  </div>
                )}

                {/* Cart Items - with real product images */}
                <div className="drawer-section cart-items">
                  <div className="cart-item">
                    <div className="item-img" style={products[0]?.image ? { backgroundImage: `url(${products[0].image})`, backgroundSize: 'cover', backgroundPosition: 'center' } : {}} />
                    <div className="item-info">
                      <span className="item-name">{products[0]?.title?.substring(0, 16) || 'Product'}...</span>
                      <span className="item-meta">Qty: 1</span>
                      <span className="item-price">{products[0]?.price || '$0.00'}</span>
                    </div>
                  </div>
                  <div className="cart-item">
                    <div className="item-img" style={products[1]?.image ? { backgroundImage: `url(${products[1].image})`, backgroundSize: 'cover', backgroundPosition: 'center' } : {}} />
                    <div className="item-info">
                      <span className="item-name">{products[1]?.title?.substring(0, 16) || 'Product'}...</span>
                      <span className="item-meta">Qty: 1</span>
                      <span className="item-price">{products[1]?.price || '$0.00'}</span>
                    </div>
                  </div>
                </div>

                {/* 3. Upsells - Dynamic based on display style */}
                {features.upsells && (
                  <div className="drawer-section upsells-section">
                    {renderUpsellsPreview()}
                  </div>
                )}

                {/* 4. Addons */}
                {features.addons && (
                  <div className="drawer-section addons-section">
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
                )}

                {/* Checkout */}
                <div className="drawer-section checkout">
                  <div className="subtotal"><span>Subtotal</span><span className="total">${cartSubtotal.toFixed(2)}</span></div>
                  <div className="checkout-btn">Checkout</div>
                </div>

                {/* 5. Trust Badges - professional icons */}
                {features.trust_badges && (
                  <div className="drawer-section badges-section">
                    <div className="mock-badges">
                      <div className="trust-badge">{Icons.lockSecure}<span>SSL Secure</span></div>
                      <div className="trust-badge">{Icons.shieldCheck}<span>Verified</span></div>
                      <div className="trust-badge">{Icons.creditCard}<span>Safe Pay</span></div>
                      <div className="trust-badge">{Icons.refresh}<span>Returns</span></div>
                    </div>
                  </div>
                )}
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
          gap: 32px;
          align-items: flex-start;
        }

        /* Feature Cards */
        .features-column {
          flex: 1;
          display: flex;
          flex-direction: column;
          gap: 10px;
          max-width: 500px;
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
        .feature-info p { font-size: 11px; color: #6b7280; margin: 0; }

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

        .upsells-preview {
          padding: 12px 14px;
        }

        /* Display Styles Section */
        .display-styles-section {
          margin-bottom: 12px;
        }

        .styles-label {
          display: block;
          font-size: 11px;
          font-weight: 600;
          color: #374151;
          margin-bottom: 8px;
        }

        /* Visual Styles Grid with Live Previews */
        .styles-grid-visual {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 8px;
        }

        .style-card {
          display: flex;
          flex-direction: column;
          background: white;
          border: 2px solid #e5e7eb;
          border-radius: 8px;
          overflow: hidden;
          cursor: pointer;
          transition: all 0.2s;
          padding: 0;
        }

        .style-card:hover {
          border-color: #93c5fd;
          box-shadow: 0 2px 8px rgba(59, 130, 246, 0.15);
        }

        .style-card.selected {
          border-color: #3b82f6;
          box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.2);
        }

        .style-preview-mini {
          background: #f3f4f6;
          min-height: 60px;
        }

        .style-card-footer {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 4px;
          padding: 6px 4px;
          background: #fafafa;
          border-top: 1px solid #e5e7eb;
        }

        .style-card.selected .style-card-footer {
          background: #eff6ff;
        }

        .style-check {
          width: 14px;
          height: 14px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #3b82f6;
        }

        .style-name {
          font-size: 10px;
          font-weight: 600;
          color: #374151;
          white-space: nowrap;
        }

        .style-card.selected .style-name {
          color: #1d4ed8;
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
        }

        .addon-toggle-mini.on { background: #10b981; }
        .addon-toggle-mini.on::after { left: 12px; }

        .addon-text { flex: 1; color: #374151; }
        .addon-price { font-weight: 600; color: #6b7280; }

        .preview-badges {
          display: flex;
          justify-content: center;
          gap: 20px;
        }

        .badge-mini {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 3px;
          color: #374151;
          font-size: 9px;
          font-weight: 500;
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

        /* Annotations - Black bg with #63F44C text */
        .annotations-left {
          position: relative;
          width: 110px;
          height: 600px;
          margin-right: 8px;
          flex-shrink: 0;
        }

        .annotation {
          position: absolute;
          display: flex;
          align-items: center;
          gap: 0;
          transition: top 0.3s ease, opacity 0.3s;
          transform: translateY(-50%); /* Center vertically on the position */
        }

        .annotation.active { opacity: 1; }

        .annotation-label {
          padding: 5px 12px;
          background: #111;
          color: #63F44C;
          font-size: 11px;
          font-weight: 600;
          border-radius: 4px;
          white-space: nowrap;
          box-shadow: 0 2px 4px rgba(0,0,0,0.2);
        }

        .annotation-line {
          width: 30px;
          height: 2px;
          background: #111;
          flex-shrink: 0;
        }

        /* Phone Frame - wider and shorter */
        .phone-frame {
          width: 280px;
          background: #fff;
          border-radius: 28px;
          box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.15), 0 0 0 1px rgba(0, 0, 0, 0.05);
          padding: 10px;
          position: relative;
        }

        .phone-notch {
          width: 90px;
          height: 20px;
          background: #1a1a1a;
          border-radius: 0 0 14px 14px;
          position: absolute;
          top: 0;
          left: 50%;
          transform: translateX(-50%);
          z-index: 10;
        }

        .cart-drawer {
          background: #f9fafb;
          border-radius: 18px;
          overflow: hidden;
          font-size: 10px;
        }

        .drawer-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 12px 12px;
          background: #fff;
          border-bottom: 1px solid #e5e7eb;
          height: 44px;
          box-sizing: border-box;
        }

        .drawer-title { font-weight: 600; font-size: 13px; color: #111827; }
        .drawer-close { width: 20px; height: 20px; display: flex; align-items: center; justify-content: center; color: #9ca3af; font-size: 16px; }

        .drawer-section {
          padding: 8px 10px;
        }

        .drawer-section.rewards-section {
          min-height: 75px;
          box-sizing: border-box;
        }

        .drawer-section.timer-section {
          min-height: 44px;
          box-sizing: border-box;
          display: flex;
          align-items: center;
        }

        .drawer-section.upsells-section {
          min-height: 105px;
          box-sizing: border-box;
        }

        .drawer-section.addons-section {
          min-height: 78px;
          box-sizing: border-box;
        }

        .drawer-section.badges-section {
          min-height: 50px;
          box-sizing: border-box;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        /* Mock Elements */
        .mock-timer {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
          padding: 8px;
          background: #f3f4f6;
          border-radius: 6px;
          color: #374151;
          font-size: 10px;
        }

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

        .item-img {
          width: 44px;
          height: 44px;
          background: linear-gradient(135deg, #e5e7eb, #d1d5db);
          border-radius: 6px;
          flex-shrink: 0;
        }

        .item-info { display: flex; flex-direction: column; justify-content: center; gap: 2px; }
        .item-name { font-weight: 500; color: #111827; font-size: 11px; }
        .item-meta { font-size: 9px; color: #9ca3af; }
        .item-price { font-weight: 600; color: #111827; font-size: 11px; }

        /* Upsells Styles - Minimal Strip */
        .mock-upsells-strip { }
        .upsells-title { font-weight: 600; color: #374151; font-size: 10px; display: block; margin-bottom: 8px; }
        .upsells-row { display: flex; gap: 8px; }

        .upsell-item {
          flex: 1;
          background: #fff;
          border-radius: 8px;
          padding: 8px;
          text-align: center;
        }

        .upsell-img {
          width: 100%;
          height: 40px;
          background: linear-gradient(135deg, #e5e7eb, #d1d5db);
          border-radius: 4px;
          margin-bottom: 6px;
        }

        .upsell-name { display: block; color: #6b7280; font-size: 9px; }
        .upsell-price { display: block; font-weight: 600; color: #111827; font-size: 10px; }
        .upsell-btn {
          margin-top: 6px;
          padding: 4px;
          background: #111827;
          color: white;
          border-radius: 4px;
          font-size: 10px;
          font-weight: 600;
        }

        /* Upsells Styles - Cards Grid */
        .mock-upsells-cards { }
        .cards-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 8px;
        }
        .card-item {
          background: #fff;
          border: 1px solid #e5e7eb;
          border-radius: 6px;
          overflow: hidden;
        }
        .card-img {
          width: 100%;
          height: 50px;
          background: linear-gradient(135deg, #e5e7eb, #d1d5db);
        }
        .card-content { padding: 6px; }
        .card-name { display: block; font-size: 9px; font-weight: 600; color: #111827; margin-bottom: 2px; }
        .card-price-row { display: flex; gap: 4px; margin-bottom: 4px; }
        .card-old { font-size: 8px; color: #9ca3af; text-decoration: line-through; }
        .card-price { font-size: 10px; font-weight: 700; color: #111827; }
        .card-btn {
          width: 100%;
          padding: 4px;
          background: #111827;
          color: white;
          border-radius: 4px;
          font-size: 9px;
          font-weight: 600;
          text-align: center;
        }

        /* Upsells Styles - List */
        .mock-upsells-list { }
        .list-item {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 8px;
          background: #fff;
          border: 1px solid #e5e7eb;
          border-radius: 6px;
          margin-bottom: 6px;
        }
        .list-item:last-child { margin-bottom: 0; }
        .list-img {
          width: 36px;
          height: 36px;
          background: linear-gradient(135deg, #e5e7eb, #d1d5db);
          border-radius: 4px;
          flex-shrink: 0;
        }
        .list-info { flex: 1; }
        .list-name { display: block; font-size: 10px; font-weight: 600; color: #111827; }
        .list-price { display: block; font-size: 10px; font-weight: 700; color: #111827; }
        .list-btn {
          padding: 5px 10px;
          background: #111827;
          color: white;
          border-radius: 4px;
          font-size: 9px;
          font-weight: 600;
        }

        /* Upsells Styles - Frequently Bought Together */
        .mock-upsells-fbt { }
        .fbt-item {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 8px;
          background: #fff;
          border: 1px solid #e5e7eb;
          border-radius: 6px;
          margin-bottom: 6px;
        }
        .fbt-item:last-child { margin-bottom: 0; }
        .fbt-img {
          width: 44px;
          height: 44px;
          background: linear-gradient(135deg, #e5e7eb, #d1d5db);
          border-radius: 4px;
          flex-shrink: 0;
        }
        .fbt-info { flex: 1; }
        .fbt-badge {
          display: inline-block;
          padding: 2px 6px;
          background: linear-gradient(135deg, rgba(139, 92, 246, 0.15), rgba(102, 126, 234, 0.15));
          color: #8b5cf6;
          font-size: 8px;
          font-weight: 700;
          border-radius: 3px;
          margin-bottom: 2px;
          text-transform: uppercase;
        }
        .fbt-name { display: block; font-size: 10px; font-weight: 600; color: #111827; }
        .fbt-price { display: block; font-size: 10px; font-weight: 700; color: #111827; }
        .fbt-btn {
          padding: 5px 10px;
          background: #111827;
          color: white;
          border-radius: 4px;
          font-size: 9px;
          font-weight: 600;
        }

        /* Upsells Styles - Banner */
        .mock-upsells-banner {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 10px;
          background: #fff;
          border-radius: 8px;
        }
        .banner-img {
          width: 60px;
          height: 60px;
          background: linear-gradient(135deg, #e5e7eb, #d1d5db);
          border-radius: 6px;
          flex-shrink: 0;
        }
        .banner-content { flex: 1; }
        .banner-badge {
          display: inline-block;
          padding: 2px 6px;
          background: #111827;
          color: white;
          font-size: 7px;
          font-weight: 700;
          border-radius: 10px;
          margin-bottom: 4px;
        }
        .banner-name { display: block; font-size: 11px; font-weight: 600; color: #111827; margin-bottom: 2px; }
        .banner-price { display: block; font-size: 12px; font-weight: 700; color: #111827; }
        .banner-btn {
          padding: 8px 14px;
          background: #111827;
          color: white;
          border-radius: 6px;
          font-size: 10px;
          font-weight: 600;
        }

        .mock-rewards { text-align: center; }
        .rewards-msg { font-size: 10px; font-weight: 500; color: #059669; }
        .progress { height: 5px; background: #e5e7eb; border-radius: 3px; margin: 6px 0; overflow: hidden; }
        .progress-fill { height: 100%; background: linear-gradient(90deg, #10b981, #34d399); }
        .milestones { display: flex; justify-content: space-between; padding: 0 10px; }
        .ms { width: 18px; height: 18px; background: #e5e7eb; border-radius: 50%; display: flex; align-items: center; justify-content: center; color: #9ca3af; }
        .ms.done { background: #10b981; color: white; }

        .mock-addon {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 8px;
          background: #fff;
          border-radius: 6px;
          margin-bottom: 4px;
        }

        .mock-addon:last-child { margin-bottom: 0; }

        .addon-toggle {
          width: 26px;
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
        }

        .addon-toggle.on { background: #10b981; }
        .addon-toggle.on::after { left: 14px; }

        .addon-icon { color: #6b7280; }
        .addon-name { flex: 1; color: #374151; font-size: 10px; }
        .addon-price { font-weight: 600; color: #6b7280; font-size: 10px; }

        .checkout {
          background: #fff;
          border-radius: 8px;
          margin-top: 4px;
        }

        .subtotal {
          display: flex;
          justify-content: space-between;
          padding: 10px;
          border-bottom: 1px solid #f3f4f6;
          font-weight: 500;
          color: #374151;
          font-size: 11px;
        }

        .total { font-weight: 700; color: #111827; }

        .checkout-btn {
          margin: 8px;
          padding: 10px;
          background: #111827;
          color: white;
          border-radius: 8px;
          font-weight: 600;
          font-size: 12px;
          text-align: center;
        }

        .mock-badges {
          display: flex;
          justify-content: center;
          gap: 16px;
          padding: 6px 0;
        }

        .trust-badge {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 2px;
          color: #374151;
          font-size: 8px;
          font-weight: 500;
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

// Render mini style preview for the style selector cards
function renderMiniStylePreview(style: DisplayStyle, products: Product[]) {
  const p = products.slice(0, 2);
  const productImage = (idx: number) => p[idx]?.image
    ? { backgroundImage: `url(${p[idx].image})`, backgroundSize: 'cover', backgroundPosition: 'center' }
    : { background: 'linear-gradient(135deg, #e5e7eb, #d1d5db)' };

  switch (style) {
    case 'minimal-strip':
      return (
        <div style={{ display: 'flex', gap: '4px', padding: '6px' }}>
          {[0, 1].map(i => (
            <div key={i} style={{ flex: 1, background: '#fff', borderRadius: '4px', padding: '4px' }}>
              <div style={{ width: '100%', height: '20px', borderRadius: '2px', marginBottom: '3px', ...productImage(i) }} />
              <div style={{ width: '70%', height: '3px', background: '#e5e7eb', borderRadius: '1px', marginBottom: '2px' }} />
              <div style={{ width: '40%', height: '3px', background: '#111', borderRadius: '1px' }} />
            </div>
          ))}
        </div>
      );

    case 'cards':
      return (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px', padding: '6px' }}>
          {[0, 1].map(i => (
            <div key={i} style={{ background: '#fff', borderRadius: '4px', overflow: 'hidden' }}>
              <div style={{ width: '100%', height: '22px', ...productImage(i) }} />
              <div style={{ padding: '4px' }}>
                <div style={{ width: '70%', height: '3px', background: '#e5e7eb', borderRadius: '1px', marginBottom: '2px' }} />
                <div style={{ width: '50%', height: '6px', background: '#111', borderRadius: '2px' }} />
              </div>
            </div>
          ))}
        </div>
      );

    case 'list':
      return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '3px', padding: '6px' }}>
          {[0, 1].map(i => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '4px', padding: '4px', background: '#fff', borderRadius: '4px' }}>
              <div style={{ width: '16px', height: '16px', borderRadius: '2px', flexShrink: 0, ...productImage(i) }} />
              <div style={{ flex: 1 }}>
                <div style={{ width: '60%', height: '3px', background: '#e5e7eb', borderRadius: '1px', marginBottom: '2px' }} />
                <div style={{ width: '30%', height: '3px', background: '#111', borderRadius: '1px' }} />
              </div>
              <div style={{ width: '16px', height: '10px', background: '#111', borderRadius: '2px' }} />
            </div>
          ))}
        </div>
      );

    case 'frequently-bought':
      return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '3px', padding: '6px' }}>
          {[0, 1].map(i => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '4px', padding: '4px', background: '#fff', borderRadius: '4px' }}>
              <div style={{ width: '18px', height: '18px', borderRadius: '2px', flexShrink: 0, ...productImage(i) }} />
              <div style={{ flex: 1 }}>
                <div style={{ width: '40%', height: '4px', background: 'linear-gradient(90deg, rgba(139,92,246,0.3), rgba(102,126,234,0.3))', borderRadius: '2px', marginBottom: '2px' }} />
                <div style={{ width: '60%', height: '3px', background: '#e5e7eb', borderRadius: '1px' }} />
              </div>
              <div style={{ width: '16px', height: '10px', background: '#111', borderRadius: '2px' }} />
            </div>
          ))}
        </div>
      );

    case 'banner':
      return (
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px', background: '#fff', borderRadius: '4px', margin: '6px' }}>
          <div style={{ width: '28px', height: '28px', borderRadius: '4px', flexShrink: 0, ...productImage(0) }} />
          <div style={{ flex: 1 }}>
            <div style={{ width: '50%', height: '4px', background: '#111', borderRadius: '2px', marginBottom: '3px' }} />
            <div style={{ width: '70%', height: '3px', background: '#e5e7eb', borderRadius: '1px', marginBottom: '2px' }} />
            <div style={{ width: '40%', height: '4px', background: '#059669', borderRadius: '1px' }} />
          </div>
        </div>
      );

    default:
      return null;
  }
}

// Render style preview for the feature card
function renderStylePreview(style: DisplayStyle, products: Product[]) {
  const previewProducts = products.slice(0, 3);

  switch (style) {
    case 'minimal-strip':
      return (
        <div style={{ padding: '12px' }}>
          <div style={{ fontSize: '11px', fontWeight: 600, color: '#374151', marginBottom: '8px' }}>You might also like</div>
          <div style={{ display: 'flex', gap: '8px', overflowX: 'auto' }}>
            {previewProducts.map((p, i) => (
              <div key={i} style={{ flex: '0 0 90px', background: '#fafafa', borderRadius: '6px', overflow: 'hidden' }}>
                <div style={{ width: '100%', height: '70px', background: p.image ? `url(${p.image}) center/cover` : 'linear-gradient(135deg, #e5e7eb, #d1d5db)' }} />
                <div style={{ padding: '8px' }}>
                  <div style={{ fontSize: '9px', fontWeight: 600, color: '#111827', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{p.title}</div>
                  <div style={{ fontSize: '10px', fontWeight: 700, color: '#111827', marginTop: '2px' }}>{p.price}</div>
                  <div style={{ marginTop: '6px', padding: '4px', background: '#111827', color: 'white', borderRadius: '4px', fontSize: '9px', fontWeight: 600, textAlign: 'center' }}>Add</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      );

    case 'cards':
      return (
        <div style={{ padding: '12px' }}>
          <div style={{ fontSize: '11px', fontWeight: 600, color: '#374151', marginBottom: '8px' }}>Recommended for you</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '8px' }}>
            {previewProducts.slice(0, 2).map((p, i) => (
              <div key={i} style={{ border: '1px solid #e5e7eb', borderRadius: '6px', overflow: 'hidden' }}>
                <div style={{ width: '100%', height: '70px', background: p.image ? `url(${p.image}) center/cover` : 'linear-gradient(135deg, #e5e7eb, #d1d5db)' }} />
                <div style={{ padding: '8px' }}>
                  <div style={{ fontSize: '9px', fontWeight: 600, color: '#111827', marginBottom: '4px' }}>{p.title.substring(0, 12)}...</div>
                  <div style={{ display: 'flex', gap: '4px', marginBottom: '6px' }}>
                    {p.compareAtPrice && <span style={{ fontSize: '8px', color: '#9ca3af', textDecoration: 'line-through' }}>{p.compareAtPrice}</span>}
                    <span style={{ fontSize: '10px', fontWeight: 700, color: '#111827' }}>{p.price}</span>
                  </div>
                  <div style={{ padding: '4px', background: '#111827', color: 'white', borderRadius: '4px', fontSize: '9px', fontWeight: 600, textAlign: 'center' }}>Add</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      );

    case 'list':
      return (
        <div style={{ padding: '12px' }}>
          <div style={{ fontSize: '11px', fontWeight: 600, color: '#374151', marginBottom: '8px' }}>Complete your order</div>
          {previewProducts.slice(0, 2).map((p, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px', border: '1px solid #e5e7eb', borderRadius: '6px', marginBottom: '6px' }}>
              <div style={{ width: '40px', height: '40px', borderRadius: '4px', flexShrink: 0, background: p.image ? `url(${p.image}) center/cover` : 'linear-gradient(135deg, #e5e7eb, #d1d5db)' }} />
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: '10px', fontWeight: 600, color: '#111827' }}>{p.title.substring(0, 15)}...</div>
                <div style={{ fontSize: '10px', fontWeight: 700, color: '#111827' }}>{p.price}</div>
              </div>
              <div style={{ padding: '5px 12px', background: '#111827', color: 'white', borderRadius: '4px', fontSize: '9px', fontWeight: 600 }}>Add</div>
            </div>
          ))}
        </div>
      );

    case 'frequently-bought':
      return (
        <div style={{ padding: '12px' }}>
          {previewProducts.slice(0, 2).map((p, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px', border: '1px solid #e5e7eb', borderRadius: '6px', marginBottom: '6px' }}>
              <div style={{ width: '50px', height: '50px', borderRadius: '4px', flexShrink: 0, background: p.image ? `url(${p.image}) center/cover` : 'linear-gradient(135deg, #e5e7eb, #d1d5db)' }} />
              <div style={{ flex: 1 }}>
                <div style={{ display: 'inline-block', padding: '2px 6px', background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.15), rgba(102, 126, 234, 0.15))', color: '#8b5cf6', fontSize: '8px', fontWeight: 700, borderRadius: '3px', marginBottom: '3px' }}>{57 - i * 8}% ADDED THIS</div>
                <div style={{ fontSize: '10px', fontWeight: 600, color: '#111827' }}>{p.title.substring(0, 15)}...</div>
                <div style={{ fontSize: '10px', fontWeight: 700, color: '#111827' }}>{p.price}</div>
              </div>
              <div style={{ padding: '6px 12px', background: '#111827', color: 'white', borderRadius: '4px', fontSize: '9px', fontWeight: 600 }}>Add</div>
            </div>
          ))}
        </div>
      );

    case 'banner':
      const bannerProduct = previewProducts[0];
      return (
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '12px' }}>
          <div style={{ width: '80px', height: '80px', borderRadius: '8px', flexShrink: 0, background: bannerProduct?.image ? `url(${bannerProduct.image}) center/cover` : 'linear-gradient(135deg, #e5e7eb, #d1d5db)' }} />
          <div style={{ flex: 1 }}>
            <div style={{ display: 'inline-block', padding: '2px 8px', background: '#111827', color: 'white', fontSize: '8px', fontWeight: 700, borderRadius: '10px', marginBottom: '4px' }}>SELLING FAST</div>
            <div style={{ fontSize: '12px', fontWeight: 700, color: '#111827', marginBottom: '2px' }}>{bannerProduct?.title}</div>
            <div style={{ fontSize: '14px', fontWeight: 700, color: '#111827' }}>{bannerProduct?.price}</div>
          </div>
          <div style={{ padding: '8px 16px', background: '#111827', color: 'white', borderRadius: '6px', fontSize: '11px', fontWeight: 600 }}>Add</div>
        </div>
      );

    default:
      return null;
  }
}
