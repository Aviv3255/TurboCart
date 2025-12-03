/**
 * TurboCart - Premium Cart Enhancement Suite
 * Version 3.0 - Complete Feature Set
 *
 * Features:
 * - Upsell Carousel/Grid/Banner/Frequently Bought
 * - Rewards Progress Bar with Milestones
 * - Switch Add-Ons with Toggles
 * - Urgency Timer with Multiple Styles
 * - Announcement Bar with Conditions
 * - Trust Badges
 */

(function() {
  'use strict';

  console.log('[TurboCart] Loading v3.0...');

  // ============================================
  // CONFIGURATION
  // ============================================

  function getShopDomain() {
    try {
      if (window.TurboCartConfig?.shopDomain) return window.TurboCartConfig.shopDomain;
      if (window.Shopify?.shop) return window.Shopify.shop;
      const meta = document.querySelector('meta[name="shopify-shop-domain"]')?.content;
      if (meta) return meta;
      if (window.location.hostname.includes('myshopify.com')) return window.location.hostname;
      // Try to extract from current URL
      const hostname = window.location.hostname;
      if (hostname && hostname !== 'localhost' && !hostname.includes('127.0.0.1')) {
        return hostname;
      }
      return null;
    } catch (e) {
      console.error('[TurboCart] Error getting shop domain:', e);
      return null;
    }
  }

  const SHOP_DOMAIN = getShopDomain();
  if (!SHOP_DOMAIN) {
    console.error('[TurboCart] Could not determine shop domain');
    return;
  }

  // Get API URL with fallback
  function getApiUrl() {
    try {
      if (window.TurboCartConfig?.apiUrl) {
        // Validate the URL
        new URL(window.TurboCartConfig.apiUrl);
        return window.TurboCartConfig.apiUrl;
      }
    } catch (e) {
      console.warn('[TurboCart] Invalid API URL in config, using default');
    }
    return 'https://turbocart.onrender.com';
  }

  const API_URL = getApiUrl();
  const SESSION_ID = 'tc_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);

  let config = null;
  let currentCart = null;
  let timerInterval = null;
  let timerSeconds = 0;
  let initialTimerSeconds = 0;
  let addedAddons = new Set();
  let dismissedAnnouncement = false;

  // ============================================
  // ICONS
  // ============================================

  const ICONS = {
    clock: '<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>',
    info: '<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>',
    truck: '<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 17a2 2 0 11-4 0 2 2 0 014 0zM19 17a2 2 0 11-4 0 2 2 0 014 0z"/><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h1m8-1a1 1 0 01-1 1H9m4-1V8a1 1 0 011-1h2.586a1 1 0 01.707.293l3.414 3.414a1 1 0 01.293.707V16a1 1 0 01-1 1h-1m-6-1a1 1 0 001 1h1M5 17a2 2 0 104 0m-4 0a2 2 0 114 0m6 0a2 2 0 104 0m-4 0a2 2 0 114 0"/></svg>',
    tag: '<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z"/></svg>',
    gift: '<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5.5A2.5 2.5 0 109.5 8H12zm-7 4h14M5 12a2 2 0 110-4h14a2 2 0 110 4M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7"/></svg>',
    star: '<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"/></svg>',
    shield: '<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"/></svg>',
    alert: '<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/></svg>',
    percent: '<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 14l6-6m-5.5.5h.01m4.99 5h.01M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16l3.5-2 3.5 2 3.5-2 3.5 2z"/></svg>',
    check: '<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/></svg>',
    lock: '<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"/></svg>',
    creditCard: '<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"/></svg>',
    refresh: '<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/></svg>',
    heart: '<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"/></svg>',
    fire: '<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 18.657A8 8 0 016.343 7.343S7 9 9 10c0-2 .5-5 2.986-7C14 5 16.09 5.777 17.656 7.343A7.975 7.975 0 0120 13a7.975 7.975 0 01-2.343 5.657z"/><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.879 16.121A3 3 0 1012.015 11L11 14H9c0 .768.293 1.536.879 2.121z"/></svg>',
    sparkles: '<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z"/></svg>',
    x: '<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>',
  };

  function getIcon(name) {
    return ICONS[name] || ICONS.star;
  }

  // ============================================
  // UTILITIES
  // ============================================

  function formatMoney(cents) {
    const currency = window.Shopify?.currency?.active || 'USD';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency
    }).format(cents / 100);
  }

  function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  function formatTime(seconds) {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }

  // ============================================
  // STYLES GENERATOR
  // ============================================

  function generateStyles() {
    const timerSettings = config?.timer || {};
    const announcementSettings = config?.announcement || {};
    const rewardsSettings = config?.rewards_settings || {};
    const addonsSettings = config?.addons_settings || {};
    const badgeSettings = config?.trust_badge_settings || {};

    return `
      .tc-container {
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        padding: 16px;
        margin: 12px 0;
      }

      /* ===== ANNOUNCEMENT BAR ===== */
      .tc-announcement {
        background: ${announcementSettings.style === 'gradient'
          ? `linear-gradient(135deg, ${announcementSettings.background_color || '#667eea'} 0%, ${announcementSettings.accent_color || '#764ba2'} 100%)`
          : announcementSettings.background_color || '#667eea'};
        color: ${announcementSettings.text_color || '#ffffff'};
        padding: 12px 16px;
        border-radius: ${announcementSettings.border_radius || 8}px;
        display: flex;
        align-items: center;
        gap: 10px;
        margin-bottom: 12px;
        font-size: 14px;
        font-weight: 500;
        position: relative;
        ${announcementSettings.animation === 'pulse' ? 'animation: tc-pulse 2s infinite;' : ''}
        ${announcementSettings.animation === 'shimmer' ? 'animation: tc-shimmer 2s infinite;' : ''}
      }
      .tc-announcement svg {
        width: 18px;
        height: 18px;
        flex-shrink: 0;
      }
      .tc-announcement-text { flex: 1; }
      .tc-announcement-link {
        color: inherit;
        font-weight: 600;
        text-decoration: underline;
        margin-left: 8px;
      }
      .tc-announcement-dismiss {
        background: none;
        border: none;
        color: inherit;
        cursor: pointer;
        padding: 4px;
        opacity: 0.7;
        transition: opacity 0.2s;
      }
      .tc-announcement-dismiss:hover { opacity: 1; }
      .tc-announcement-dismiss svg { width: 16px; height: 16px; }

      /* ===== TIMER BAR ===== */
      .tc-timer {
        background: ${timerSettings.background_color || '#FEF3C7'};
        border: 1px solid ${timerSettings.accent_color || '#F59E0B'};
        color: ${timerSettings.text_color || '#92400E'};
        padding: 10px 16px;
        border-radius: ${timerSettings.border_radius || 8}px;
        margin-bottom: 12px;
        font-size: 14px;
        font-weight: 500;
        ${timerSettings.pulse_animation ? 'animation: tc-pulse 2s infinite;' : ''}
      }
      .tc-timer-content {
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 8px;
      }
      .tc-timer svg { width: 16px; height: 16px; }
      .tc-timer-time {
        font-weight: 700;
        font-variant-numeric: tabular-nums;
      }
      .tc-timer-urgency {
        background: #FEE2E2 !important;
        border-color: #EF4444 !important;
        color: #B91C1C !important;
        animation: tc-shake 0.5s infinite;
      }
      .tc-timer-expired {
        background: #FEE2E2 !important;
        border-color: #EF4444 !important;
        color: #B91C1C !important;
      }
      .tc-timer-progress {
        height: 4px;
        background: rgba(0,0,0,0.1);
        border-radius: 2px;
        margin-top: 8px;
        overflow: hidden;
      }
      .tc-timer-progress-bar {
        height: 100%;
        background: ${timerSettings.accent_color || '#F59E0B'};
        transition: width 1s linear;
      }
      .tc-timer-floating {
        position: fixed;
        bottom: 20px;
        right: 20px;
        z-index: 9999;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
      }

      /* ===== TRUST BADGES ===== */
      .tc-trust-badges {
        display: flex;
        flex-wrap: ${badgeSettings.layout === 'grid' ? 'wrap' : 'nowrap'};
        gap: ${badgeSettings.spacing || 8}px;
        justify-content: ${badgeSettings.layout === 'centered' ? 'center' : 'flex-start'};
        margin-bottom: 16px;
        ${badgeSettings.layout === 'vertical' ? 'flex-direction: column;' : ''}
      }
      .tc-trust-badge {
        display: flex;
        align-items: center;
        gap: 6px;
        padding: ${badgeSettings.padding || 8}px ${(badgeSettings.padding || 8) + 4}px;
        border-radius: ${badgeSettings.border_radius || 6}px;
        font-size: ${badgeSettings.font_size || 12}px;
        font-weight: 500;
        transition: all 0.2s;
        ${badgeSettings.animation === 'fade' ? 'animation: tc-fade-in 0.5s ease-out;' : ''}
        ${badgeSettings.animation === 'slide' ? 'animation: tc-slide-up 0.5s ease-out;' : ''}
      }
      .tc-trust-badge:hover {
        ${badgeSettings.show_on_hover ? 'transform: translateY(-2px); box-shadow: 0 4px 8px rgba(0,0,0,0.1);' : ''}
      }
      .tc-trust-badge svg {
        width: ${badgeSettings.icon_size || 16}px;
        height: ${badgeSettings.icon_size || 16}px;
        flex-shrink: 0;
      }
      .tc-trust-badge-tooltip {
        position: relative;
      }
      .tc-trust-badge-tooltip:hover::after {
        content: attr(data-tooltip);
        position: absolute;
        bottom: 100%;
        left: 50%;
        transform: translateX(-50%);
        padding: 6px 10px;
        background: #1f2937;
        color: white;
        font-size: 11px;
        border-radius: 4px;
        white-space: nowrap;
        z-index: 10;
        margin-bottom: 6px;
      }

      /* ===== REWARDS PROGRESS ===== */
      .tc-rewards {
        background: ${rewardsSettings.background_color || '#F9FAFB'};
        border: 1px solid ${rewardsSettings.border_color || '#E5E7EB'};
        border-radius: ${rewardsSettings.border_radius || 12}px;
        padding: ${rewardsSettings.padding || 16}px;
        margin-bottom: 16px;
      }
      .tc-rewards-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 12px;
      }
      .tc-rewards-message {
        font-size: 14px;
        font-weight: 500;
        color: #374151;
      }
      .tc-rewards-percentage {
        font-size: 13px;
        font-weight: 600;
        color: ${rewardsSettings.progress_bar_color || '#10B981'};
      }
      .tc-rewards-progress {
        height: ${rewardsSettings.progress_bar_height || 8}px;
        background: ${rewardsSettings.progress_bar_background || '#E5E7EB'};
        border-radius: ${rewardsSettings.progress_bar_border_radius || 4}px;
        overflow: hidden;
        margin-bottom: 12px;
      }
      .tc-rewards-progress-bar {
        height: 100%;
        background: linear-gradient(90deg, ${rewardsSettings.progress_bar_color || '#10B981'}, ${rewardsSettings.progress_bar_gradient_end || '#059669'});
        border-radius: ${rewardsSettings.progress_bar_border_radius || 4}px;
        transition: width 0.5s ease;
      }
      .tc-rewards-milestones {
        display: flex;
        justify-content: space-between;
        gap: 8px;
      }
      .tc-milestone {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 4px;
        flex: 1;
        opacity: 0.5;
        transition: all 0.3s;
      }
      .tc-milestone.achieved {
        opacity: 1;
      }
      .tc-milestone-icon {
        width: ${rewardsSettings.milestone_icon_size || 32}px;
        height: ${rewardsSettings.milestone_icon_size || 32}px;
        border-radius: 50%;
        background: ${rewardsSettings.milestone_icon_background || '#E5E7EB'};
        color: ${rewardsSettings.milestone_icon_color || '#6B7280'};
        display: flex;
        align-items: center;
        justify-content: center;
        transition: all 0.3s;
      }
      .tc-milestone.achieved .tc-milestone-icon {
        background: ${rewardsSettings.milestone_icon_active_background || '#10B981'};
        color: ${rewardsSettings.milestone_icon_active_color || '#ffffff'};
      }
      .tc-milestone-icon svg {
        width: ${(rewardsSettings.milestone_icon_size || 32) * 0.5}px;
        height: ${(rewardsSettings.milestone_icon_size || 32) * 0.5}px;
      }
      .tc-milestone-label {
        font-size: 11px;
        color: #6B7280;
        text-align: center;
      }
      .tc-milestone.achieved .tc-milestone-label {
        color: ${rewardsSettings.milestone_icon_active_background || '#059669'};
        font-weight: 500;
      }
      .tc-milestone-amount {
        font-size: 10px;
        color: #9CA3AF;
      }
      .tc-celebration {
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        background: white;
        padding: 24px;
        border-radius: 16px;
        box-shadow: 0 20px 40px rgba(0,0,0,0.2);
        z-index: 10000;
        text-align: center;
        animation: tc-celebrate 0.5s ease-out;
      }

      /* ===== UPSELLS ===== */
      .tc-upsells { margin-bottom: 16px; }
      .tc-upsells-title {
        font-size: 14px;
        font-weight: 600;
        color: #111827;
        margin-bottom: 12px;
      }
      .tc-upsells-grid {
        display: flex;
        gap: 12px;
        overflow-x: auto;
        padding-bottom: 8px;
        scroll-snap-type: x mandatory;
        -webkit-overflow-scrolling: touch;
      }
      .tc-upsells-grid::-webkit-scrollbar { height: 4px; }
      .tc-upsells-grid::-webkit-scrollbar-track { background: #E5E7EB; border-radius: 2px; }
      .tc-upsells-grid::-webkit-scrollbar-thumb { background: #9CA3AF; border-radius: 2px; }
      .tc-product {
        flex: 0 0 140px;
        scroll-snap-align: start;
        background: white;
        border: 1px solid #E5E7EB;
        border-radius: 12px;
        padding: 12px;
        text-align: center;
        transition: all 0.2s;
      }
      .tc-product:hover {
        border-color: #D1D5DB;
        box-shadow: 0 2px 8px rgba(0,0,0,0.05);
      }
      .tc-product-image {
        width: 80px;
        height: 80px;
        object-fit: cover;
        border-radius: 8px;
        margin-bottom: 8px;
      }
      .tc-product-title {
        font-size: 12px;
        font-weight: 500;
        color: #374151;
        margin-bottom: 4px;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }
      .tc-product-price {
        font-size: 12px;
        color: #6B7280;
        margin-bottom: 8px;
      }
      .tc-product-compare-price {
        text-decoration: line-through;
        color: #9CA3AF;
        margin-right: 4px;
      }
      .tc-product-btn {
        width: 100%;
        padding: 8px 12px;
        background: #111827;
        color: white;
        border: none;
        border-radius: 6px;
        font-size: 12px;
        font-weight: 500;
        cursor: pointer;
        transition: background 0.2s;
      }
      .tc-product-btn:hover { background: #374151; }
      .tc-product-btn:disabled { background: #9CA3AF; cursor: not-allowed; }

      /* Banner style */
      .tc-upsells-banner {
        background: linear-gradient(135deg, #f5f7fa 0%, #e4e8ec 100%);
        border-radius: 12px;
        padding: 20px;
        display: flex;
        gap: 16px;
        align-items: center;
      }
      .tc-banner-image {
        width: 100px;
        height: 100px;
        object-fit: cover;
        border-radius: 10px;
        flex-shrink: 0;
      }
      .tc-banner-content { flex: 1; }
      .tc-banner-title {
        font-size: 16px;
        font-weight: 600;
        color: #111827;
        margin-bottom: 4px;
      }
      .tc-banner-description {
        font-size: 13px;
        color: #6B7280;
        margin-bottom: 8px;
      }
      .tc-banner-price {
        font-size: 18px;
        font-weight: 700;
        color: #059669;
      }
      .tc-banner-btn {
        padding: 10px 20px;
        background: #10B981;
        color: white;
        border: none;
        border-radius: 8px;
        font-size: 14px;
        font-weight: 600;
        cursor: pointer;
        white-space: nowrap;
      }

      /* Frequently bought together */
      .tc-fbt {
        background: #f9fafb;
        border-radius: 12px;
        padding: 16px;
      }
      .tc-fbt-products {
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 8px;
        flex-wrap: wrap;
      }
      .tc-fbt-product {
        text-align: center;
        max-width: 100px;
      }
      .tc-fbt-image {
        width: 70px;
        height: 70px;
        object-fit: cover;
        border-radius: 8px;
        margin-bottom: 4px;
      }
      .tc-fbt-name {
        font-size: 11px;
        color: #374151;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }
      .tc-fbt-plus {
        font-size: 20px;
        color: #9CA3AF;
        font-weight: 300;
      }
      .tc-fbt-total {
        text-align: center;
        margin-top: 12px;
        padding-top: 12px;
        border-top: 1px solid #E5E7EB;
      }
      .tc-fbt-price {
        font-size: 18px;
        font-weight: 700;
        color: #059669;
      }

      /* ===== SWITCH ADD-ONS ===== */
      .tc-addons { margin-bottom: 16px; }
      .tc-addons-header {
        margin-bottom: 12px;
      }
      .tc-addons-title {
        font-size: 14px;
        font-weight: 600;
        color: #111827;
        margin-bottom: 2px;
      }
      .tc-addons-subtitle {
        font-size: 12px;
        color: #6B7280;
      }
      .tc-addons-grid {
        display: grid;
        grid-template-columns: repeat(${addonsSettings.columns || 1}, 1fr);
        gap: 8px;
      }
      .tc-addon {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: ${addonsSettings.item_padding || 12}px;
        background: ${addonsSettings.item_background || '#F9FAFB'};
        border: 1px solid ${addonsSettings.item_border_color || '#E5E7EB'};
        border-radius: ${addonsSettings.item_border_radius || 10}px;
        transition: all 0.2s;
      }
      .tc-addon:hover {
        border-color: ${addonsSettings.toggle_active_color || '#10B981'};
      }
      .tc-addon.active {
        background: ${addonsSettings.toggle_active_color || '#10B981'}10;
        border-color: ${addonsSettings.toggle_active_color || '#10B981'};
      }
      .tc-addon-info {
        display: flex;
        align-items: center;
        gap: 12px;
      }
      .tc-addon-icon {
        width: 40px;
        height: 40px;
        border-radius: 8px;
        background: white;
        border: 1px solid #E5E7EB;
        display: flex;
        align-items: center;
        justify-content: center;
      }
      .tc-addon-icon svg { width: 20px; height: 20px; color: #6B7280; }
      .tc-addon-icon img { width: 24px; height: 24px; object-fit: contain; }
      .tc-addon-text { display: flex; flex-direction: column; }
      .tc-addon-name {
        font-size: 14px;
        font-weight: 500;
        color: #111827;
        display: flex;
        align-items: center;
        gap: 6px;
      }
      .tc-addon-tooltip {
        cursor: help;
        opacity: 0.5;
      }
      .tc-addon-tooltip svg { width: 14px; height: 14px; }
      .tc-addon-price { font-size: 13px; color: #6B7280; }
      .tc-addon-compare-price {
        text-decoration: line-through;
        color: #9CA3AF;
        font-size: 11px;
        margin-right: 4px;
      }
      .tc-addon-savings {
        font-size: 10px;
        color: #059669;
        font-weight: 600;
      }

      /* Toggle switch */
      .tc-toggle {
        position: relative;
        width: 48px;
        height: 26px;
      }
      .tc-toggle input { opacity: 0; width: 0; height: 0; }
      .tc-toggle-slider {
        position: absolute;
        cursor: pointer;
        top: 0; left: 0; right: 0; bottom: 0;
        background-color: ${addonsSettings.toggle_inactive_color || '#D1D5DB'};
        transition: 0.3s;
        border-radius: 26px;
      }
      .tc-toggle-slider:before {
        position: absolute;
        content: "";
        height: 20px;
        width: 20px;
        left: 3px;
        bottom: 3px;
        background-color: white;
        transition: 0.3s;
        border-radius: 50%;
      }
      .tc-toggle input:checked + .tc-toggle-slider {
        background-color: ${addonsSettings.toggle_active_color || '#10B981'};
      }
      .tc-toggle input:checked + .tc-toggle-slider:before {
        transform: translateX(22px);
      }

      /* Checkbox style */
      .tc-checkbox {
        width: 24px;
        height: 24px;
        border: 2px solid ${addonsSettings.toggle_inactive_color || '#D1D5DB'};
        border-radius: 6px;
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        transition: all 0.2s;
      }
      .tc-checkbox.checked {
        background: ${addonsSettings.toggle_active_color || '#10B981'};
        border-color: ${addonsSettings.toggle_active_color || '#10B981'};
      }
      .tc-checkbox svg { width: 14px; height: 14px; color: white; opacity: 0; }
      .tc-checkbox.checked svg { opacity: 1; }

      /* Button style */
      .tc-addon-button {
        padding: 8px 16px;
        background: white;
        border: 1px solid ${addonsSettings.toggle_inactive_color || '#D1D5DB'};
        border-radius: 6px;
        font-size: 12px;
        font-weight: 500;
        cursor: pointer;
        transition: all 0.2s;
      }
      .tc-addon-button.active {
        background: ${addonsSettings.toggle_active_color || '#10B981'};
        border-color: ${addonsSettings.toggle_active_color || '#10B981'};
        color: white;
      }

      /* ===== ANIMATIONS ===== */
      @keyframes tc-pulse {
        0%, 100% { opacity: 1; }
        50% { opacity: 0.8; }
      }
      @keyframes tc-shimmer {
        0% { background-position: -200% 0; }
        100% { background-position: 200% 0; }
      }
      @keyframes tc-shake {
        0%, 100% { transform: translateX(0); }
        25% { transform: translateX(-2px); }
        75% { transform: translateX(2px); }
      }
      @keyframes tc-fade-in {
        from { opacity: 0; }
        to { opacity: 1; }
      }
      @keyframes tc-slide-up {
        from { opacity: 0; transform: translateY(10px); }
        to { opacity: 1; transform: translateY(0); }
      }
      @keyframes tc-celebrate {
        0% { transform: translate(-50%, -50%) scale(0.5); opacity: 0; }
        50% { transform: translate(-50%, -50%) scale(1.1); }
        100% { transform: translate(-50%, -50%) scale(1); opacity: 1; }
      }
    `;
  }

  // ============================================
  // API CALLS
  // ============================================

  async function fetchConfig() {
    try {
      const response = await fetch(`${API_URL}/api/storefront/config?shop=${encodeURIComponent(SHOP_DOMAIN)}`);
      if (!response.ok) throw new Error('Config fetch failed');
      return await response.json();
    } catch (error) {
      console.error('[TurboCart] Config fetch error:', error);
      return null;
    }
  }

  async function fetchCart() {
    try {
      const response = await fetch('/cart.js');
      return await response.json();
    } catch (error) {
      console.error('[TurboCart] Cart fetch error:', error);
      return null;
    }
  }

  async function addToCart(variantId, quantity = 1) {
    try {
      const response = await fetch('/cart/add.js', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: variantId, quantity })
      });
      if (!response.ok) throw new Error('Add to cart failed');
      currentCart = await fetchCart();
      render();
      return true;
    } catch (error) {
      console.error('[TurboCart] Add to cart error:', error);
      return false;
    }
  }

  async function removeFromCart(variantId) {
    try {
      const response = await fetch('/cart/change.js', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: variantId, quantity: 0 })
      });
      if (!response.ok) throw new Error('Remove from cart failed');
      currentCart = await fetchCart();
      render();
      return true;
    } catch (error) {
      console.error('[TurboCart] Remove from cart error:', error);
      return false;
    }
  }

  async function trackEvent(eventType, productId) {
    try {
      await fetch(`${API_URL}/api/storefront/track?shop=${encodeURIComponent(SHOP_DOMAIN)}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          event_type: eventType,
          product_id: productId,
          session_id: SESSION_ID,
          cart_value: currentCart?.total_price || 0,
        })
      });
    } catch (error) {
      // Silently fail tracking
    }
  }

  // ============================================
  // RENDER FUNCTIONS
  // ============================================

  function renderTrustBadges() {
    if (!config?.features?.trust_badges || !config?.trust_badges?.length) return '';

    const settings = config.trust_badge_settings || {};
    const badges = config.trust_badges.map(badge => {
      const icon = badge.icon_url
        ? `<img src="${escapeHtml(badge.icon_url)}" alt="">`
        : getIcon(badge.icon);

      const tooltipAttr = badge.tooltip
        ? `class="tc-trust-badge tc-trust-badge-tooltip" data-tooltip="${escapeHtml(badge.tooltip)}"`
        : 'class="tc-trust-badge"';

      return `
        <div ${tooltipAttr} style="background: ${badge.background_color}; color: ${badge.text_color}; border: 1px solid ${badge.border_color};">
          ${icon}
          <span>${escapeHtml(badge.label)}</span>
        </div>
      `;
    }).join('');

    return `<div class="tc-trust-badges">${badges}</div>`;
  }

  function renderAnnouncement() {
    if (!config?.features?.announcement || !config?.announcement?.message || dismissedAnnouncement) return '';

    const settings = config.announcement;
    const cartTotal = (currentCart?.total_price || 0) / 100;

    // Check cart value conditions
    if (settings.min_cart_value && cartTotal < settings.min_cart_value) return '';
    if (settings.max_cart_value && cartTotal > settings.max_cart_value) return '';

    const icon = getIcon(settings.icon || 'info');
    const linkHtml = settings.link_url && settings.link_text
      ? `<a href="${escapeHtml(settings.link_url)}" class="tc-announcement-link">${escapeHtml(settings.link_text)}</a>`
      : '';
    const dismissBtn = settings.dismissible
      ? `<button class="tc-announcement-dismiss" onclick="window.tcDismissAnnouncement()">${ICONS.x}</button>`
      : '';

    return `
      <div class="tc-announcement">
        ${icon}
        <span class="tc-announcement-text">${escapeHtml(settings.message)}${linkHtml}</span>
        ${dismissBtn}
      </div>
    `;
  }

  function renderTimer() {
    if (!config?.features?.timer || !config?.timer) return '';

    const settings = config.timer;
    const isUrgency = timerSeconds <= (settings.urgency_threshold || 60) && timerSeconds > 0;
    const isExpired = timerSeconds <= 0;

    let message = settings.normal_message || 'Your cart will expire in {time}!';
    let timerClass = 'tc-timer';

    if (isExpired) {
      message = settings.expired_message || 'Your cart has expired.';
      timerClass += ' tc-timer-expired';
    } else if (isUrgency) {
      message = settings.urgency_message || 'Hurry! Only {time} left!';
      timerClass += ' tc-timer-urgency';
    }

    if (settings.style === 'floating') {
      timerClass += ' tc-timer-floating';
    }

    const icon = settings.show_icon !== false ? getIcon(settings.icon || 'clock') : '';
    const timeHtml = `<span class="tc-timer-time">${formatTime(timerSeconds)}</span>`;
    const displayMessage = message.replace('{time}', timeHtml);

    let progressBar = '';
    if (settings.show_progress_bar && initialTimerSeconds > 0) {
      const progress = (timerSeconds / initialTimerSeconds) * 100;
      progressBar = `
        <div class="tc-timer-progress">
          <div class="tc-timer-progress-bar" style="width: ${progress}%"></div>
        </div>
      `;
    }

    return `
      <div class="${timerClass}">
        <div class="tc-timer-content">
          ${icon}
          <span>${displayMessage}</span>
        </div>
        ${progressBar}
      </div>
    `;
  }

  function renderRewards() {
    if (!config?.features?.rewards || !config?.rewards?.length || !currentCart) return '';

    const settings = config.rewards_settings || {};
    const cartTotal = currentCart.total_price / 100;
    const maxThreshold = Math.max(...config.rewards.map(r => r.threshold));
    const progress = Math.min((cartTotal / maxThreshold) * 100, 100);

    // Find next reward
    const nextReward = config.rewards.find(r => r.threshold > cartTotal);
    const amountNeeded = nextReward ? (nextReward.threshold - cartTotal).toFixed(2) : 0;

    let message;
    if (!nextReward) {
      message = settings.completed_message || 'Congratulations! You\'ve unlocked all rewards!';
    } else if (cartTotal === 0) {
      message = settings.empty_cart_message || 'Add items to start earning rewards!';
    } else {
      const template = settings.message_template || 'Add ${amount} more to unlock {reward}!';
      message = template
        .replace('{amount}', `$${amountNeeded}`)
        .replace('{reward}', nextReward.label || 'your next reward');
    }

    const milestones = config.rewards.map(r => {
      const achieved = cartTotal >= r.threshold;
      const iconHtml = r.icon_url
        ? `<img src="${escapeHtml(r.icon_url)}" alt="" style="width: 100%; height: 100%; object-fit: contain;">`
        : getIcon(r.icon || 'star');

      return `
        <div class="tc-milestone ${achieved ? 'achieved' : ''}">
          <div class="tc-milestone-icon">${iconHtml}</div>
          ${settings.show_milestone_labels !== false ? `<span class="tc-milestone-label">${escapeHtml(r.label || r.reward_type)}</span>` : ''}
          ${settings.show_milestone_amounts !== false ? `<span class="tc-milestone-amount">$${r.threshold}</span>` : ''}
        </div>
      `;
    }).join('');

    const percentageHtml = settings.show_percentage
      ? `<span class="tc-rewards-percentage">${Math.round(progress)}%</span>`
      : '';

    return `
      <div class="tc-rewards">
        <div class="tc-rewards-header">
          <span class="tc-rewards-message">${escapeHtml(message)}</span>
          ${percentageHtml}
        </div>
        <div class="tc-rewards-progress">
          <div class="tc-rewards-progress-bar" style="width: ${progress}%"></div>
        </div>
        <div class="tc-rewards-milestones">
          ${milestones}
        </div>
      </div>
    `;
  }

  function renderUpsells() {
    if (!config?.features?.upsells || !config?.upsells?.length) return '';

    // Filter out products already in cart
    const cartProductIds = (currentCart?.items || []).map(item => item.product_id);
    const availableUpsells = config.upsells.filter(p => !cartProductIds.includes(p.id));

    if (!availableUpsells.length) return '';

    const displayStyle = config.display_style || 'carousel';

    // Banner style - single product
    if (displayStyle === 'banner' && availableUpsells[0]) {
      const p = availableUpsells[0];
      return `
        <div class="tc-upsells">
          <div class="tc-upsells-banner">
            ${p.image ? `<img src="${p.image}" alt="${escapeHtml(p.title)}" class="tc-banner-image">` : ''}
            <div class="tc-banner-content">
              <div class="tc-banner-title">${escapeHtml(p.title)}</div>
              <div class="tc-banner-description">Add this to your order</div>
              <div class="tc-banner-price">${formatMoney(p.price)}</div>
            </div>
            <button class="tc-banner-btn" data-variant-id="${p.variant_id || p.id}" data-product-id="${p.id}">Add to Cart</button>
          </div>
        </div>
      `;
    }

    // Frequently bought together
    if (displayStyle === 'frequently-bought' && availableUpsells.length > 0) {
      const products = availableUpsells.slice(0, 3);
      const totalPrice = products.reduce((sum, p) => sum + p.price, 0);

      const productHtml = products.map((p, i) => `
        ${i > 0 ? '<span class="tc-fbt-plus">+</span>' : ''}
        <div class="tc-fbt-product">
          ${p.image ? `<img src="${p.image}" alt="${escapeHtml(p.title)}" class="tc-fbt-image">` : ''}
          <div class="tc-fbt-name">${escapeHtml(p.title)}</div>
        </div>
      `).join('');

      return `
        <div class="tc-upsells">
          <div class="tc-upsells-title">Frequently Bought Together</div>
          <div class="tc-fbt">
            <div class="tc-fbt-products">${productHtml}</div>
            <div class="tc-fbt-total">
              <div class="tc-fbt-price">Bundle Price: ${formatMoney(totalPrice)}</div>
              <button class="tc-product-btn tc-fbt-btn" style="margin-top: 8px; max-width: 200px;" data-bundle-ids="${products.map(p => p.variant_id || p.id).join(',')}">Add All to Cart</button>
            </div>
          </div>
        </div>
      `;
    }

    // Default carousel/grid view
    const products = availableUpsells.slice(0, 6).map(p => {
      const comparePrice = p.compare_at_price && p.compare_at_price > p.price
        ? `<span class="tc-product-compare-price">${formatMoney(p.compare_at_price)}</span>`
        : '';

      return `
        <div class="tc-product">
          ${p.image ? `<img src="${p.image}" alt="${escapeHtml(p.title)}" class="tc-product-image">` : ''}
          <div class="tc-product-title">${escapeHtml(p.title)}</div>
          <div class="tc-product-price">${comparePrice}${formatMoney(p.price)}</div>
          <button class="tc-product-btn" data-variant-id="${p.variant_id || p.id}" data-product-id="${p.id}">Add</button>
        </div>
      `;
    }).join('');

    return `
      <div class="tc-upsells">
        <div class="tc-upsells-title">You may also like</div>
        <div class="tc-upsells-grid">${products}</div>
      </div>
    `;
  }

  function renderAddons() {
    if (!config?.features?.addons || !config?.addons?.length) return '';

    const settings = config.addons_settings || {};
    const toggleStyle = settings.toggle_style || 'switch';

    const headerHtml = settings.show_section_header !== false ? `
      <div class="tc-addons-header">
        <div class="tc-addons-title">${escapeHtml(settings.section_title || 'Protect Your Order')}</div>
        ${settings.section_subtitle ? `<div class="tc-addons-subtitle">${escapeHtml(settings.section_subtitle)}</div>` : ''}
      </div>
    ` : '';

    const addonsHtml = config.addons.map(a => {
      const isChecked = addedAddons.has(a.id) || (a.default_enabled && settings.auto_add_defaults);
      const iconHtml = a.icon_url
        ? `<img src="${escapeHtml(a.icon_url)}" alt="">`
        : getIcon(a.icon || 'shield');

      const tooltipHtml = a.tooltip
        ? `<span class="tc-addon-tooltip" title="${escapeHtml(a.tooltip)}">${ICONS.info}</span>`
        : '';

      const comparePriceHtml = a.compare_price && a.compare_price > a.price
        ? `<span class="tc-addon-compare-price">${formatMoney(a.compare_price * 100)}</span>`
        : '';

      const savingsHtml = settings.show_savings && a.compare_price && a.compare_price > a.price
        ? `<span class="tc-addon-savings">Save ${Math.round((1 - a.price / a.compare_price) * 100)}%</span>`
        : '';

      let toggleHtml;
      if (toggleStyle === 'checkbox') {
        toggleHtml = `
          <div class="tc-checkbox ${isChecked ? 'checked' : ''}" data-addon-id="${a.id}" data-variant-id="${a.variant_id || ''}">
            ${ICONS.check}
          </div>
        `;
      } else if (toggleStyle === 'button') {
        toggleHtml = `
          <button class="tc-addon-button ${isChecked ? 'active' : ''}" data-addon-id="${a.id}" data-variant-id="${a.variant_id || ''}">
            ${isChecked ? 'Added' : 'Add'}
          </button>
        `;
      } else {
        toggleHtml = `
          <label class="tc-toggle">
            <input type="checkbox" data-addon-id="${a.id}" data-variant-id="${a.variant_id || ''}" ${isChecked ? 'checked' : ''}>
            <span class="tc-toggle-slider"></span>
          </label>
        `;
      }

      return `
        <div class="tc-addon ${isChecked ? 'active' : ''}">
          <div class="tc-addon-info">
            <div class="tc-addon-icon">${iconHtml}</div>
            <div class="tc-addon-text">
              <span class="tc-addon-name">${escapeHtml(a.name)}${tooltipHtml}</span>
              <span class="tc-addon-price">${comparePriceHtml}${formatMoney(a.price * 100)}${savingsHtml}</span>
            </div>
          </div>
          ${toggleHtml}
        </div>
      `;
    }).join('');

    return `
      <div class="tc-addons">
        ${headerHtml}
        <div class="tc-addons-grid">${addonsHtml}</div>
      </div>
    `;
  }

  function render() {
    if (!config || !currentCart) return;

    // Find cart container
    const cartSelectors = [
      'cart-drawer', '.cart-drawer', '#cart-drawer', '[data-cart-drawer]',
      'cart-notification', '.cart-notification', '.mini-cart', '.side-cart',
      '#CartDrawer', '.cart__items', '#cart-items', 'form[action="/cart"]',
      '.drawer__inner', '.cart-drawer__inner'
    ];

    let container = null;
    for (const selector of cartSelectors) {
      try {
        const el = document.querySelector(selector);
        if (el && el.offsetParent !== null) {
          container = el;
          break;
        }
      } catch (e) {}
    }

    if (!container) {
      console.log('[TurboCart] No cart container found');
      return;
    }

    // Remove existing TurboCart container
    const existing = document.getElementById('turbocart-container');
    if (existing) existing.remove();

    // Build HTML based on position
    let html = '<div id="turbocart-container" class="tc-container">';

    // Top position elements
    html += renderAnnouncement();
    html += renderTimer();
    html += renderTrustBadges();
    html += renderRewards();
    html += renderUpsells();
    html += renderAddons();

    html += '</div>';

    // Insert at top of cart
    container.insertAdjacentHTML('afterbegin', html);

    // Attach event listeners
    attachListeners();

    console.log('[TurboCart] Rendered successfully');
  }

  function attachListeners() {
    // Upsell add buttons
    document.querySelectorAll('.tc-product-btn, .tc-banner-btn').forEach(btn => {
      btn.addEventListener('click', async (e) => {
        e.preventDefault();
        const variantId = e.target.dataset.variantId;
        const productId = e.target.dataset.productId;

        e.target.disabled = true;
        e.target.textContent = 'Adding...';

        const success = await addToCart(variantId);
        if (success) {
          trackEvent('add', productId);
          e.target.textContent = 'Added!';
          setTimeout(() => { e.target.textContent = 'Add'; e.target.disabled = false; }, 1000);
        } else {
          e.target.textContent = 'Error';
          setTimeout(() => { e.target.textContent = 'Add'; e.target.disabled = false; }, 1000);
        }
      });
    });

    // Frequently bought together bundle button
    document.querySelectorAll('.tc-fbt-btn').forEach(btn => {
      btn.addEventListener('click', async (e) => {
        e.preventDefault();
        const bundleIds = e.target.dataset.bundleIds?.split(',') || [];

        e.target.disabled = true;
        e.target.textContent = 'Adding...';

        for (const id of bundleIds) {
          await addToCart(id);
        }

        e.target.textContent = 'Added!';
        setTimeout(() => { e.target.textContent = 'Add All to Cart'; e.target.disabled = false; }, 1000);
      });
    });

    // Addon toggles (switch style)
    document.querySelectorAll('.tc-toggle input').forEach(input => {
      input.addEventListener('change', async (e) => {
        const addonId = e.target.dataset.addonId;
        const variantId = e.target.dataset.variantId;
        const addonEl = e.target.closest('.tc-addon');

        if (e.target.checked) {
          addedAddons.add(addonId);
          addonEl?.classList.add('active');
          if (variantId) await addToCart(variantId);
        } else {
          addedAddons.delete(addonId);
          addonEl?.classList.remove('active');
          if (variantId) await removeFromCart(variantId);
        }
      });
    });

    // Addon checkboxes
    document.querySelectorAll('.tc-checkbox').forEach(checkbox => {
      checkbox.addEventListener('click', async (e) => {
        const addonId = checkbox.dataset.addonId;
        const variantId = checkbox.dataset.variantId;
        const isChecked = checkbox.classList.contains('checked');
        const addonEl = checkbox.closest('.tc-addon');

        if (isChecked) {
          addedAddons.delete(addonId);
          checkbox.classList.remove('checked');
          addonEl?.classList.remove('active');
          if (variantId) await removeFromCart(variantId);
        } else {
          addedAddons.add(addonId);
          checkbox.classList.add('checked');
          addonEl?.classList.add('active');
          if (variantId) await addToCart(variantId);
        }
      });
    });

    // Addon buttons
    document.querySelectorAll('.tc-addon-button').forEach(button => {
      button.addEventListener('click', async (e) => {
        const addonId = button.dataset.addonId;
        const variantId = button.dataset.variantId;
        const isActive = button.classList.contains('active');
        const addonEl = button.closest('.tc-addon');

        if (isActive) {
          addedAddons.delete(addonId);
          button.classList.remove('active');
          button.textContent = 'Add';
          addonEl?.classList.remove('active');
          if (variantId) await removeFromCart(variantId);
        } else {
          addedAddons.add(addonId);
          button.classList.add('active');
          button.textContent = 'Added';
          addonEl?.classList.add('active');
          if (variantId) await addToCart(variantId);
        }
      });
    });
  }

  // Global function for dismissing announcement
  window.tcDismissAnnouncement = function() {
    dismissedAnnouncement = true;
    render();
  };

  // ============================================
  // TIMER
  // ============================================

  function startTimer() {
    if (!config?.features?.timer || !config?.timer || timerInterval) return;

    timerSeconds = config.timer.duration * 60;
    initialTimerSeconds = timerSeconds;

    timerInterval = setInterval(() => {
      timerSeconds--;
      if (timerSeconds <= 0) {
        clearInterval(timerInterval);
        timerInterval = null;

        // Handle expired action
        if (config.timer.expired_action === 'redirect') {
          window.location.href = '/cart';
        }
        render();
        return;
      }

      // Update timer display
      const timerEl = document.querySelector('.tc-timer-time');
      if (timerEl) {
        timerEl.textContent = formatTime(timerSeconds);
      }

      // Update progress bar
      const progressBar = document.querySelector('.tc-timer-progress-bar');
      if (progressBar && initialTimerSeconds > 0) {
        progressBar.style.width = `${(timerSeconds / initialTimerSeconds) * 100}%`;
      }

      // Update urgency state
      const timerContainer = document.querySelector('.tc-timer');
      if (timerContainer) {
        const isUrgency = timerSeconds <= (config.timer.urgency_threshold || 60);
        if (isUrgency && !timerContainer.classList.contains('tc-timer-urgency')) {
          timerContainer.classList.add('tc-timer-urgency');
          // Update message
          const messageEl = timerContainer.querySelector('.tc-timer-content span:last-child');
          if (messageEl) {
            const urgencyMessage = config.timer.urgency_message || 'Hurry! Only {time} left!';
            messageEl.innerHTML = urgencyMessage.replace('{time}', `<span class="tc-timer-time">${formatTime(timerSeconds)}</span>`);
          }
        }
      }
    }, 1000);
  }

  function resetTimer() {
    if (timerInterval) {
      clearInterval(timerInterval);
      timerInterval = null;
    }
    if (config?.timer?.reset_on_change) {
      startTimer();
    }
  }

  // ============================================
  // INITIALIZATION
  // ============================================

  async function init() {
    console.log('[TurboCart] Initializing for shop:', SHOP_DOMAIN);

    // Fetch configuration
    config = await fetchConfig();
    if (!config) {
      console.error('[TurboCart] Failed to load configuration');
      return;
    }

    console.log('[TurboCart] Config loaded:', config);

    // Inject dynamic styles
    const style = document.createElement('style');
    style.id = 'turbocart-styles';
    style.textContent = generateStyles();
    document.head.appendChild(style);

    // Fetch current cart
    currentCart = await fetchCart();

    // Initial render
    if (currentCart && currentCart.item_count > 0) {
      render();
      startTimer();
    }

    // Watch for cart changes
    const observer = new MutationObserver(() => {
      setTimeout(async () => {
        const newCart = await fetchCart();
        if (newCart && JSON.stringify(newCart) !== JSON.stringify(currentCart)) {
          currentCart = newCart;
          if (currentCart.item_count > 0) {
            render();
            if (config?.timer?.reset_on_change) {
              resetTimer();
            }
          } else {
            // Remove TurboCart if cart is empty
            const existing = document.getElementById('turbocart-container');
            if (existing) existing.remove();
          }
        }
      }, 500);
    });

    observer.observe(document.body, { childList: true, subtree: true });

    // Intercept cart adds
    const origFetch = window.fetch;
    window.fetch = function(...args) {
      const result = origFetch.apply(this, args);
      const url = args[0];
      if (typeof url === 'string' && url.includes('/cart/')) {
        result.then(async () => {
          setTimeout(async () => {
            currentCart = await fetchCart();
            if (currentCart && currentCart.item_count > 0) {
              render();
            }
          }, 500);
        });
      }
      return result;
    };

    console.log('[TurboCart] Initialized successfully');
  }

  // Start
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
