/**
 * TurboCart - Premium Cart Enhancement Suite
 * Version 2.0 - Simplified & Feature-Rich
 *
 * Features:
 * - Upsell Carousel
 * - Rewards Progress Bar
 * - Switch Add-Ons
 * - Urgency Timer
 * - Announcement Bar
 */

(function() {
  'use strict';

  console.log('[TurboCart] Loading...');

  // ============================================
  // CONFIGURATION
  // ============================================

  function getShopDomain() {
    if (window.TurboCartConfig?.shopDomain) return window.TurboCartConfig.shopDomain;
    if (window.Shopify?.shop) return window.Shopify.shop;
    const meta = document.querySelector('meta[name="shopify-shop-domain"]')?.content;
    if (meta) return meta;
    if (window.location.hostname.includes('myshopify.com')) return window.location.hostname;
    return null;
  }

  const SHOP_DOMAIN = getShopDomain();
  if (!SHOP_DOMAIN) {
    console.error('[TurboCart] Could not determine shop domain');
    return;
  }

  const API_URL = window.TurboCartConfig?.apiUrl || 'https://turbocart.onrender.com';
  const SESSION_ID = 'tc_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);

  let config = null;
  let currentCart = null;
  let timerInterval = null;
  let timerSeconds = 0;
  let addedAddons = new Set();

  // ============================================
  // STYLES
  // ============================================

  const STYLES = `
    .tc-container {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      padding: 16px;
      margin: 12px 0;
    }

    /* Announcement Bar */
    .tc-announcement {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      padding: 12px 16px;
      border-radius: 8px;
      display: flex;
      align-items: center;
      gap: 10px;
      margin-bottom: 12px;
      font-size: 14px;
      font-weight: 500;
    }
    .tc-announcement svg {
      width: 18px;
      height: 18px;
      flex-shrink: 0;
    }

    /* Timer Bar */
    .tc-timer {
      background: #FEF3C7;
      border: 1px solid #F59E0B;
      color: #92400E;
      padding: 10px 16px;
      border-radius: 8px;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      margin-bottom: 12px;
      font-size: 14px;
      font-weight: 500;
    }
    .tc-timer svg {
      width: 16px;
      height: 16px;
    }
    .tc-timer-time {
      font-weight: 700;
      font-variant-numeric: tabular-nums;
    }

    /* Rewards Progress */
    .tc-rewards {
      background: #F9FAFB;
      border: 1px solid #E5E7EB;
      border-radius: 12px;
      padding: 16px;
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
    .tc-rewards-progress {
      height: 8px;
      background: #E5E7EB;
      border-radius: 4px;
      overflow: hidden;
      margin-bottom: 12px;
    }
    .tc-rewards-progress-bar {
      height: 100%;
      background: linear-gradient(90deg, #10B981, #059669);
      border-radius: 4px;
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
    }
    .tc-milestone.achieved {
      opacity: 1;
    }
    .tc-milestone-icon {
      width: 32px;
      height: 32px;
      border-radius: 50%;
      background: #E5E7EB;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .tc-milestone.achieved .tc-milestone-icon {
      background: #10B981;
      color: white;
    }
    .tc-milestone-icon svg {
      width: 16px;
      height: 16px;
    }
    .tc-milestone-label {
      font-size: 11px;
      color: #6B7280;
      text-align: center;
    }
    .tc-milestone.achieved .tc-milestone-label {
      color: #059669;
      font-weight: 500;
    }

    /* Upsells Carousel */
    .tc-upsells {
      margin-bottom: 16px;
    }
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
    .tc-upsells-grid::-webkit-scrollbar {
      height: 4px;
    }
    .tc-upsells-grid::-webkit-scrollbar-track {
      background: #E5E7EB;
      border-radius: 2px;
    }
    .tc-upsells-grid::-webkit-scrollbar-thumb {
      background: #9CA3AF;
      border-radius: 2px;
    }
    .tc-product {
      flex: 0 0 140px;
      scroll-snap-align: start;
      background: white;
      border: 1px solid #E5E7EB;
      border-radius: 12px;
      padding: 12px;
      text-align: center;
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
    .tc-product-btn:hover {
      background: #374151;
    }
    .tc-product-btn:disabled {
      background: #9CA3AF;
      cursor: not-allowed;
    }

    /* Switch Add-Ons */
    .tc-addons {
      margin-bottom: 16px;
    }
    .tc-addon {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 12px 16px;
      background: #F9FAFB;
      border: 1px solid #E5E7EB;
      border-radius: 10px;
      margin-bottom: 8px;
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
    .tc-addon-icon svg {
      width: 20px;
      height: 20px;
      color: #6B7280;
    }
    .tc-addon-text {
      display: flex;
      flex-direction: column;
    }
    .tc-addon-name {
      font-size: 14px;
      font-weight: 500;
      color: #111827;
    }
    .tc-addon-price {
      font-size: 13px;
      color: #6B7280;
    }
    .tc-toggle {
      position: relative;
      width: 48px;
      height: 26px;
    }
    .tc-toggle input {
      opacity: 0;
      width: 0;
      height: 0;
    }
    .tc-toggle-slider {
      position: absolute;
      cursor: pointer;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background-color: #D1D5DB;
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
      background-color: #10B981;
    }
    .tc-toggle input:checked + .tc-toggle-slider:before {
      transform: translateX(22px);
    }
  `;

  // ============================================
  // ICONS
  // ============================================

  const ICONS = {
    clock: '<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>',
    info: '<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>',
    truck: '<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 17a2 2 0 100-4 2 2 0 000 4zm8 0a2 2 0 100-4 2 2 0 000 4zM3 9h1l1.5 9h11l2-9H5"/></svg>',
    tag: '<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 7h.01M7 3h5l7 7-5 5-7-7V3z"/></svg>',
    gift: '<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v13m0-13V6a4 4 0 00-4-4c-1.333 0-4 1-4 4h8zm0 0V6a4 4 0 014-4c1.333 0 4 1 4 4h-8zM5 8h14v4H5V8z"/></svg>',
    star: '<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"/></svg>',
    shield: '<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"/></svg>',
    alert: '<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/></svg>',
  };

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

  async function addToCart(variantId) {
    try {
      const response = await fetch('/cart/add.js', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: variantId, quantity: 1 })
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

  function renderAnnouncement() {
    if (!config?.announcement?.text) return '';
    const icon = ICONS[config.announcement.icon] || ICONS.info;
    return `
      <div class="tc-announcement">
        ${icon}
        <span>${escapeHtml(config.announcement.text)}</span>
      </div>
    `;
  }

  function renderTimer() {
    if (!config?.timer) return '';
    return `
      <div class="tc-timer">
        ${ICONS.clock}
        <span>${config.timer.message.replace('{time}', '<span class="tc-timer-time">' + formatTime(timerSeconds) + '</span>')}</span>
      </div>
    `;
  }

  function renderRewards() {
    if (!config?.rewards?.length || !currentCart) return '';

    const cartTotal = currentCart.total_price / 100;
    const maxThreshold = Math.max(...config.rewards.map(r => r.threshold));
    const progress = Math.min((cartTotal / maxThreshold) * 100, 100);

    // Find next reward
    const nextReward = config.rewards.find(r => r.threshold > cartTotal);
    const amountNeeded = nextReward ? (nextReward.threshold - cartTotal).toFixed(2) : 0;
    const message = nextReward
      ? `You're $${amountNeeded} away from ${nextReward.label || 'your next reward'}!`
      : 'Congratulations! You\'ve unlocked all rewards!';

    const milestones = config.rewards.map(r => {
      const achieved = cartTotal >= r.threshold;
      const icon = ICONS[r.icon] || ICONS.star;
      return `
        <div class="tc-milestone ${achieved ? 'achieved' : ''}">
          <div class="tc-milestone-icon">${icon}</div>
          <span class="tc-milestone-label">${escapeHtml(r.label || '$' + r.threshold)}</span>
        </div>
      `;
    }).join('');

    return `
      <div class="tc-rewards">
        <div class="tc-rewards-header">
          <span class="tc-rewards-message">${escapeHtml(message)}</span>
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
    if (!config?.upsells?.length) return '';

    // Filter out products already in cart
    const cartProductIds = (currentCart?.items || []).map(item => item.product_id);
    const availableUpsells = config.upsells.filter(p => !cartProductIds.includes(p.id));

    if (!availableUpsells.length) return '';

    const products = availableUpsells.slice(0, 6).map(p => `
      <div class="tc-product">
        ${p.image ? `<img src="${p.image}" alt="${escapeHtml(p.title)}" class="tc-product-image">` : ''}
        <div class="tc-product-title">${escapeHtml(p.title)}</div>
        <div class="tc-product-price">${formatMoney(p.price)}</div>
        <button class="tc-product-btn" data-variant-id="${p.variant_id || p.id}" data-product-id="${p.id}">Add</button>
      </div>
    `).join('');

    return `
      <div class="tc-upsells">
        <div class="tc-upsells-title">You may also like</div>
        <div class="tc-upsells-grid">
          ${products}
        </div>
      </div>
    `;
  }

  function renderAddons() {
    if (!config?.addons?.length) return '';

    const addons = config.addons.map(a => {
      const icon = ICONS[a.icon] || ICONS.shield;
      const isChecked = addedAddons.has(a.id) || a.default_enabled;
      return `
        <div class="tc-addon">
          <div class="tc-addon-info">
            <div class="tc-addon-icon">${icon}</div>
            <div class="tc-addon-text">
              <span class="tc-addon-name">${escapeHtml(a.name)}</span>
              <span class="tc-addon-price">${formatMoney(a.price * 100)}</span>
            </div>
          </div>
          <label class="tc-toggle">
            <input type="checkbox" data-addon-id="${a.id}" data-variant-id="${a.variant_id}" ${isChecked ? 'checked' : ''}>
            <span class="tc-toggle-slider"></span>
          </label>
        </div>
      `;
    }).join('');

    return `
      <div class="tc-addons">
        ${addons}
      </div>
    `;
  }

  function render() {
    if (!config || !currentCart) return;

    // Find cart container
    const cartSelectors = [
      'cart-drawer', '.cart-drawer', '#cart-drawer', '[data-cart-drawer]',
      'cart-notification', '.cart-notification', '.mini-cart', '.side-cart',
      '#CartDrawer', '.cart__items', '#cart-items', 'form[action="/cart"]'
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

    // Build HTML
    let html = '<div id="turbocart-container" class="tc-container">';
    html += renderAnnouncement();
    html += renderTimer();
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
    document.querySelectorAll('.tc-product-btn').forEach(btn => {
      btn.addEventListener('click', async (e) => {
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

    // Addon toggles
    document.querySelectorAll('.tc-toggle input').forEach(input => {
      input.addEventListener('change', async (e) => {
        const addonId = e.target.dataset.addonId;
        const variantId = e.target.dataset.variantId;

        if (e.target.checked) {
          addedAddons.add(addonId);
          if (variantId) await addToCart(variantId);
        } else {
          addedAddons.delete(addonId);
          // Note: removing items would require cart update logic
        }
      });
    });
  }

  // ============================================
  // TIMER
  // ============================================

  function startTimer() {
    if (!config?.timer || timerInterval) return;

    timerSeconds = config.timer.duration * 60;

    timerInterval = setInterval(() => {
      timerSeconds--;
      if (timerSeconds <= 0) {
        clearInterval(timerInterval);
        timerInterval = null;
        return;
      }

      const timerEl = document.querySelector('.tc-timer-time');
      if (timerEl) {
        timerEl.textContent = formatTime(timerSeconds);
      }
    }, 1000);
  }

  // ============================================
  // INITIALIZATION
  // ============================================

  async function init() {
    console.log('[TurboCart] Initializing for shop:', SHOP_DOMAIN);

    // Inject styles
    const style = document.createElement('style');
    style.textContent = STYLES;
    document.head.appendChild(style);

    // Fetch configuration
    config = await fetchConfig();
    if (!config) {
      console.error('[TurboCart] Failed to load configuration');
      return;
    }

    console.log('[TurboCart] Config loaded:', config);

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
