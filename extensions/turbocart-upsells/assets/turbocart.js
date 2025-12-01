/**
 * TurboCart - Theme App Extension JavaScript
 * Handles all storefront upsell functionality
 * Auto-injects upsells into cart drawer and cart page
 *
 * BULLETPROOF VERSION - handles all edge cases
 */

(function() {
  'use strict';

  // Get shop domain from multiple sources (bulletproof)
  function getShopDomain() {
    // Try multiple sources
    const sources = [
      window.Shopify?.shop,
      window.TurboCartConfig?.shopDomain,
      document.querySelector('meta[name="shopify-shop-domain"]')?.content,
      window.location.hostname,
    ];

    for (const source of sources) {
      if (source && source.includes('.myshopify.com')) {
        return source;
      }
    }

    // Last resort - extract from current URL if on Shopify
    const hostname = window.location.hostname;
    if (hostname.endsWith('.myshopify.com')) {
      return hostname;
    }

    return null;
  }

  // Configuration - with bulletproof defaults
  const SHOP_DOMAIN = getShopDomain();
  const CONFIG = {
    apiUrl: window.TurboCartConfig?.apiUrl || 'https://turbocart.onrender.com',
    shopDomain: SHOP_DOMAIN,
    debug: window.TurboCartConfig?.debug || true, // Enable debug by default for now
    displayStyle: window.TurboCartConfig?.displayStyle || 'minimal-strip',
    position: window.TurboCartConfig?.position || 'top',
    maxProducts: window.TurboCartConfig?.maxProducts || 3,
    enabled: window.TurboCartConfig?.enabled !== false, // Default to enabled
  };

  // State
  let currentCart = null;
  let upsellProducts = [];
  let sessionId = generateSessionId();
  let upsellContainer = null;
  let isInjected = false;
  let loadAttempts = 0;
  const MAX_LOAD_ATTEMPTS = 3;

  // Common cart drawer selectors for various themes (expanded)
  const CART_DRAWER_SELECTORS = [
    // Dawn theme (most common)
    'cart-drawer',
    'cart-drawer-items',
    '#cart-drawer',
    '.cart-drawer',
    '[data-cart-drawer]',
    // Other themes
    '.drawer--is-open .drawer__inner',
    '.drawer[open]',
    '.mini-cart',
    '.side-cart',
    '#CartDrawer',
    '.cart-slide',
    'aside[id*="cart"]',
    'div[id*="cart-drawer"]',
    '.cart__drawer',
    '.js-drawer-open-right',
    '[data-section-type="cart-drawer"]',
    'cart-notification',
    '.cart-notification',
    // Additional selectors
    '#cart-notification',
    '.cart-flyout',
    '.ajax-cart',
    '.slide-cart',
    '#slide-cart',
    '.offcanvas-cart',
  ];

  // Common cart page selectors (expanded)
  const CART_PAGE_SELECTORS = [
    '.cart-items',
    '.cart__items',
    '#cart-items',
    '[data-cart-items]',
    'form[action="/cart"]',
    '.cart-form',
    '#cart',
    '.cart-page',
    '[data-section-type="cart"]',
    'main .cart',
    '#main-cart-items',
    '.cart-container',
    '.cart__content',
    '#CartPageForm',
  ];

  /**
   * Debug log function
   */
  function log(...args) {
    if (CONFIG.debug) {
      console.log('[TurboCart]', ...args);
    }
  }

  /**
   * Error log function (always logs)
   */
  function errorLog(...args) {
    console.error('[TurboCart ERROR]', ...args);
  }

  /**
   * Generate session ID
   */
  function generateSessionId() {
    return 'tc_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
  }

  /**
   * Initialize TurboCart
   */
  function init() {
    log('Initializing TurboCart...', {
      apiUrl: CONFIG.apiUrl,
      shopDomain: CONFIG.shopDomain,
      enabled: CONFIG.enabled,
      displayStyle: CONFIG.displayStyle,
    });

    // Check if enabled
    if (!CONFIG.enabled) {
      log('TurboCart is disabled');
      return;
    }

    // Check shop domain
    if (!CONFIG.shopDomain) {
      errorLog('No shop domain found! TurboCart cannot function.');
      return;
    }

    // Ping server to indicate embed is active
    pingServer();

    // Get current cart and load upsells
    fetchCart().then(cart => {
      currentCart = cart;
      log('Cart fetched:', cart);

      // Detect and inject into cart
      detectAndInjectCart();

      // Load upsells if cart has items
      if (cart && cart.items && cart.items.length > 0) {
        loadUpsells();
      } else {
        log('Cart is empty, waiting for items...');
      }
    }).catch(err => {
      errorLog('Failed to fetch cart:', err);
    });

    // Listen for cart updates
    document.addEventListener('cart:updated', handleCartUpdate);
    document.addEventListener('cart:refresh', handleCartUpdate);

    // Watch for cart drawer opening
    setupCartObserver();

    // Initialize any existing blocks
    initializeBlocks();

    // Also intercept add-to-cart events
    interceptAddToCart();

    log('TurboCart initialized successfully');
  }

  /**
   * Intercept add-to-cart events to refresh upsells
   */
  function interceptAddToCart() {
    // Listen for form submissions
    document.addEventListener('submit', (e) => {
      const form = e.target;
      if (form.action && form.action.includes('/cart/add')) {
        log('Add to cart detected via form');
        setTimeout(() => {
          fetchCart().then(cart => {
            currentCart = cart;
            loadUpsells();
            detectAndInjectCart();
          });
        }, 1000);
      }
    });

    // Also watch for fetch/XHR to cart/add
    const originalFetch = window.fetch;
    window.fetch = function(...args) {
      const result = originalFetch.apply(this, args);
      const url = args[0];
      if (typeof url === 'string' && url.includes('/cart/add')) {
        log('Add to cart detected via fetch');
        result.then(() => {
          setTimeout(() => {
            fetchCart().then(cart => {
              currentCart = cart;
              loadUpsells();
              detectAndInjectCart();
            });
          }, 500);
        });
      }
      return result;
    };
  }

  /**
   * Setup mutation observer to detect cart drawer opening
   */
  function setupCartObserver() {
    // Watch for DOM changes (cart drawer appearing)
    const observer = new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        if (mutation.type === 'childList' || mutation.type === 'attributes') {
          // Check if cart drawer appeared
          setTimeout(() => {
            detectAndInjectCart();
          }, 100);
        }
      }
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['class', 'style', 'open', 'aria-hidden']
    });

    // Also listen for common cart events
    document.addEventListener('cart:open', () => {
      log('Cart open event detected');
      setTimeout(detectAndInjectCart, 100);
    });

    // Check periodically for cart drawer (fallback)
    setInterval(() => {
      if (!isInjected || !document.contains(upsellContainer)) {
        detectAndInjectCart();
      }
    }, 2000);
  }

  /**
   * Detect cart drawer or cart page and inject upsells
   */
  function detectAndInjectCart() {
    // First, try cart drawer
    let cartElement = null;

    for (const selector of CART_DRAWER_SELECTORS) {
      try {
        const el = document.querySelector(selector);
        if (el && isElementVisible(el)) {
          cartElement = el;
          log('Found cart drawer:', selector);
          break;
        }
      } catch (e) {
        // Invalid selector, skip
      }
    }

    // If no drawer, try cart page
    if (!cartElement && window.location.pathname.includes('/cart')) {
      for (const selector of CART_PAGE_SELECTORS) {
        try {
          const el = document.querySelector(selector);
          if (el) {
            cartElement = el;
            log('Found cart page:', selector);
            break;
          }
        } catch (e) {
          // Invalid selector, skip
        }
      }
    }

    if (cartElement) {
      injectUpsellContainer(cartElement);
    }
  }

  /**
   * Check if element is visible
   */
  function isElementVisible(el) {
    const style = window.getComputedStyle(el);
    return style.display !== 'none' &&
           style.visibility !== 'hidden' &&
           style.opacity !== '0' &&
           el.offsetParent !== null;
  }

  /**
   * Inject the upsell container into the cart
   */
  function injectUpsellContainer(cartElement) {
    // Check if already injected
    if (upsellContainer && document.contains(upsellContainer)) {
      log('Upsell container already exists');
      return;
    }

    // Create container
    upsellContainer = document.createElement('div');
    upsellContainer.id = 'turbocart-upsells';
    upsellContainer.className = `turbocart-${CONFIG.displayStyle}`;
    upsellContainer.setAttribute('data-turbocart-block', CONFIG.displayStyle);

    // Create inner structure
    upsellContainer.innerHTML = `
      <div class="turbocart-${CONFIG.displayStyle}__header">
        <h3 class="turbocart-${CONFIG.displayStyle}__title">You might also like</h3>
      </div>
      <div class="turbocart-${CONFIG.displayStyle}__container">
        <div class="turbocart-${CONFIG.displayStyle}__items" data-turbocart-upsells>
          <div class="turbocart-${CONFIG.displayStyle}__loading">
            <div class="turbocart-spinner"></div>
          </div>
        </div>
      </div>
    `;

    // Insert based on position
    if (CONFIG.position === 'top') {
      cartElement.insertBefore(upsellContainer, cartElement.firstChild);
    } else {
      cartElement.appendChild(upsellContainer);
    }

    isInjected = true;
    log('Upsell container injected');

    // If we have products, render them
    if (upsellProducts.length > 0) {
      renderUpsells();
    } else if (currentCart && currentCart.items && currentCart.items.length > 0) {
      loadUpsells();
    }
  }

  /**
   * Render upsells into the injected container
   */
  function renderUpsells() {
    if (!upsellContainer) {
      log('No upsell container to render into');
      return;
    }

    const container = upsellContainer.querySelector('[data-turbocart-upsells]');
    if (!container) {
      log('No upsells container found');
      return;
    }

    if (!upsellProducts.length) {
      container.innerHTML = '<p style="text-align: center; color: #6b7280; padding: 20px;">No recommendations available</p>';
      return;
    }

    log('Rendering', upsellProducts.length, 'upsells');

    // Render based on display style
    switch (CONFIG.displayStyle) {
      case 'minimal-strip':
        renderMinimalStrip(container);
        break;
      case 'cards':
        renderCards(container);
        break;
      case 'list':
        renderList(container);
        break;
      case 'frequently-bought':
        renderFrequentlyBought(container);
        break;
      case 'banner':
        renderBanner(container);
        break;
      default:
        renderMinimalStrip(container);
    }
  }

  /**
   * Ping the server to indicate the embed is active
   */
  function pingServer() {
    if (!CONFIG.apiUrl || !CONFIG.shopDomain) {
      log('Cannot ping - missing apiUrl or shopDomain');
      return;
    }

    fetch(`${CONFIG.apiUrl}/api/storefront/ping`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        shop: CONFIG.shopDomain,
        timestamp: new Date().toISOString(),
      }),
    }).then(response => {
      if (response.ok) {
        log('Ping sent successfully');
      } else {
        log('Ping failed with status:', response.status);
      }
    }).catch(error => {
      log('Ping error:', error.message);
    });
  }

  /**
   * Initialize all upsell blocks on the page
   */
  function initializeBlocks() {
    const blocks = document.querySelectorAll('[data-turbocart-block]');
    blocks.forEach(block => {
      const type = block.dataset.turbocartBlock;
      log(`Initializing ${type} block`);

      switch(type) {
        case 'minimal-strip':
          initMinimalStrip(block);
          break;
        case 'carousel':
          initCarousel(block);
          break;
        case 'list':
          initList(block);
          break;
        case 'banner':
          initBanner(block);
          break;
        case 'cards':
          initCards(block);
          break;
        case 'frequently-bought':
          initFrequentlyBought(block);
          break;
        case 'masonry-grid':
          initMasonryGrid(block);
          break;
        case 'carousel-arrows':
          initCarouselArrows(block);
          break;
        case 'vertical-scroll':
          initVerticalScroll(block);
          break;
        case 'spotlight':
          initSpotlight(block);
          break;
        case 'sticky-tabs':
          initStickyTabs(block);
          break;
        case 'countdown-bundle':
          initCountdownBundle(block);
          break;
        case 'progressive-discount':
          initProgressiveDiscount(block);
          break;
        case 'quiz-match':
          initQuizMatch(block);
          break;
        case 'side-drawer':
          initSideDrawer(block);
          break;
        case 'comparison-table':
          initComparisonTable(block);
          break;
      }
    });
  }

  /**
   * Fetch current cart
   */
  async function fetchCart() {
    try {
      const response = await fetch('/cart.js');
      return await response.json();
    } catch (error) {
      log('Error fetching cart:', error);
      return null;
    }
  }

  /**
   * Load upsell recommendations with retry logic
   */
  async function loadUpsells() {
    if (!currentCart || !currentCart.items || currentCart.items.length === 0) {
      log('Cart is empty, no upsells to show');
      hideAllBlocks();
      return;
    }

    if (!CONFIG.shopDomain) {
      errorLog('No shop domain available - cannot load upsells');
      return;
    }

    log('Loading upsells for shop:', CONFIG.shopDomain, 'Cart items:', currentCart.items.length);

    try {
      const apiUrl = `${CONFIG.apiUrl}/api/storefront/upsells?shop=${encodeURIComponent(CONFIG.shopDomain)}`;
      log('Calling API:', apiUrl);

      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({
          cart_items: currentCart.items,
          session_id: sessionId,
          shop: CONFIG.shopDomain,
        }),
      });

      log('API Response status:', response.status);

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }

      const data = await response.json();
      log('API Response data:', data);

      upsellProducts = data.upsells || [];
      loadAttempts = 0; // Reset on success

      if (upsellProducts.length > 0) {
        log('Loaded', upsellProducts.length, 'upsells');
        trackImpressions();
        renderUpsells();
        renderAllBlocks();
      } else {
        log('No upsells returned from API - check if products are configured');
        // Show helpful message
        if (upsellContainer) {
          const container = upsellContainer.querySelector('[data-turbocart-upsells]');
          if (container) {
            container.innerHTML = '<p style="text-align:center;color:#999;padding:10px;font-size:12px;">No recommendations available</p>';
          }
        }
      }

    } catch (error) {
      errorLog('Error loading upsells:', error.message);
      loadAttempts++;

      // Retry up to MAX_LOAD_ATTEMPTS times
      if (loadAttempts < MAX_LOAD_ATTEMPTS) {
        log(`Retrying in 2 seconds (attempt ${loadAttempts + 1}/${MAX_LOAD_ATTEMPTS})...`);
        setTimeout(loadUpsells, 2000);
      } else {
        errorLog('Max retry attempts reached. Please check:');
        errorLog('1. Is TurboCart app installed and configured?');
        errorLog('2. Are upsell products selected?');
        errorLog('3. Is the API URL correct?', CONFIG.apiUrl);
      }
    }
  }

  /**
   * Hide all upsell blocks when cart is empty
   */
  function hideAllBlocks() {
    const containers = document.querySelectorAll('[data-turbocart-upsells]');
    containers.forEach(container => {
      const block = container.closest('[data-turbocart-block]');
      if (block) {
        block.style.display = 'none';
      }
    });
  }

  /**
   * Show all upsell blocks
   */
  function showAllBlocks() {
    const containers = document.querySelectorAll('[data-turbocart-upsells]');
    containers.forEach(container => {
      const block = container.closest('[data-turbocart-block]');
      if (block) {
        block.style.display = '';
      }
    });
  }

  /**
   * Render upsells in all blocks
   */
  function renderAllBlocks() {
    // Show blocks first (they might have been hidden when cart was empty)
    showAllBlocks();

    const containers = document.querySelectorAll('[data-turbocart-upsells]');
    containers.forEach(container => {
      const block = container.closest('[data-turbocart-block]');
      const type = block?.dataset.turbocartBlock;

      switch(type) {
        case 'minimal-strip':
          renderMinimalStrip(container);
          break;
        case 'carousel':
          renderCarousel(container);
          break;
        case 'list':
          renderList(container);
          break;
        case 'banner':
          renderBanner(container);
          break;
        case 'cards':
          renderCards(container);
          break;
        case 'frequently-bought':
          renderFrequentlyBought(container);
          break;
        case 'masonry-grid':
          renderMasonryGrid(container);
          break;
        case 'carousel-arrows':
          renderCarouselArrows(container);
          break;
        case 'vertical-scroll':
          renderVerticalScroll(container);
          break;
        case 'spotlight':
          renderSpotlight(container);
          break;
        case 'sticky-tabs':
          renderStickyTabs(container);
          break;
        case 'countdown-bundle':
          renderCountdownBundle(container);
          break;
        case 'progressive-discount':
          renderProgressiveDiscount(container);
          break;
        case 'quiz-match':
          renderQuizMatch(container);
          break;
        case 'side-drawer':
          renderSideDrawer(container);
          break;
        case 'comparison-table':
          renderComparisonTable(container);
          break;
      }
    });
  }

  /* ============================================ */
  /* MINIMAL STRIP IMPLEMENTATION */
  /* ============================================ */

  function initMinimalStrip(block) {
    // Minimal strip doesn't require special initialization
    log('Minimal strip block initialized');
  }

  function renderMinimalStrip(container) {
    if (!upsellProducts.length) {
      container.innerHTML = '<p style="text-align: center; color: #6b7280; padding: 20px;">No recommendations available</p>';
      return;
    }

    const html = upsellProducts.slice(0, 4).map(product => `
      <div class="turbocart-minimal-strip__item" data-product-id="${product.id}">
        <img
          src="${product.image}"
          alt="${escapeHtml(product.title)}"
          class="turbocart-minimal-strip__item-image"
          loading="lazy"
        />
        <div class="turbocart-minimal-strip__item-info">
          <h4 class="turbocart-minimal-strip__item-title">${escapeHtml(product.title)}</h4>
          <div class="turbocart-minimal-strip__item-price">${formatMoney(product.price)}</div>
        </div>
        <button
          class="turbocart-btn turbocart-btn--primary turbocart-minimal-strip__item-btn"
          data-turbocart-add="${product.variant_id}"
        >
          Add
        </button>
      </div>
    `).join('');

    container.innerHTML = html;

    // Attach add to cart listeners
    container.querySelectorAll('[data-turbocart-add]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const variantId = e.target.dataset.turbocartAdd;
        const productId = e.target.closest('[data-product-id]').dataset.productId;
        addToCart(variantId, productId);
      });
    });
  }

  /* ============================================ */
  /* CAROUSEL IMPLEMENTATION */
  /* ============================================ */

  function initCarousel(block) {
    const prevBtn = block.querySelector('.turbocart-carousel__nav--prev');
    const nextBtn = block.querySelector('.turbocart-carousel__nav--next');

    let currentIndex = 0;
    const itemsPerView = 3;

    prevBtn?.addEventListener('click', () => {
      if (currentIndex > 0) {
        currentIndex--;
        updateCarousel(block, currentIndex);
      }
    });

    nextBtn?.addEventListener('click', () => {
      const maxIndex = Math.max(0, upsellProducts.length - itemsPerView);
      if (currentIndex < maxIndex) {
        currentIndex++;
        updateCarousel(block, currentIndex);
      }
    });
  }

  function renderCarousel(container) {
    if (!upsellProducts.length) {
      container.innerHTML = '<p style="text-align: center; color: #6b7280;">No recommendations available</p>';
      return;
    }

    const html = upsellProducts.map(product => `
      <div class="turbocart-carousel__item" data-product-id="${product.id}">
        <img
          src="${product.image}"
          alt="${escapeHtml(product.title)}"
          class="turbocart-carousel__item-image"
          loading="lazy"
        />
        <h4 class="turbocart-carousel__item-title">${escapeHtml(product.title)}</h4>
        <div class="turbocart-carousel__item-price">
          <span>${formatMoney(product.price)}</span>
          ${product.compare_at_price ? `<span class="turbocart-carousel__item-compare-price">${formatMoney(product.compare_at_price)}</span>` : ''}
        </div>
        <button
          class="turbocart-btn turbocart-btn--primary"
          data-turbocart-add="${product.variant_id}"
          style="margin-top: auto;"
        >
          Add
        </button>
      </div>
    `).join('');

    container.innerHTML = html;

    // Attach add to cart listeners
    container.querySelectorAll('[data-turbocart-add]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const variantId = e.target.dataset.turbocartAdd;
        const productId = e.target.closest('[data-product-id]').dataset.productId;
        addToCart(variantId, productId);
      });
    });
  }

  function updateCarousel(block, index) {
    const track = block.querySelector('.turbocart-carousel__items');
    const itemWidth = track.querySelector('.turbocart-carousel__item')?.offsetWidth || 0;
    const gap = 12;
    const offset = -(index * (itemWidth + gap));
    track.style.transform = `translateX(${offset}px)`;
  }

  /* ============================================ */
  /* LIST IMPLEMENTATION */
  /* ============================================ */

  function initList(block) {
    // Handle "Add All" button
    const addAllBtn = block.querySelector('[data-turbocart-add-all]');
    addAllBtn?.addEventListener('click', () => {
      const checkboxes = block.querySelectorAll('input[type="checkbox"]:checked');
      checkboxes.forEach(checkbox => {
        const variantId = checkbox.dataset.variantId;
        const productId = checkbox.dataset.productId;
        addToCart(variantId, productId);
      });
    });
  }

  function renderList(container) {
    if (!upsellProducts.length) {
      container.innerHTML = '<p style="text-align: center; color: #6b7280;">No recommendations available</p>';
      return;
    }

    const html = upsellProducts.map(product => `
      <div class="turbocart-list__item" data-product-id="${product.id}">
        <input
          type="checkbox"
          class="turbocart-list__item-checkbox"
          data-variant-id="${product.variant_id}"
          data-product-id="${product.id}"
        />
        <img
          src="${product.image}"
          alt="${escapeHtml(product.title)}"
          class="turbocart-list__item-image"
          loading="lazy"
        />
        <div class="turbocart-list__item-info">
          <h4 class="turbocart-list__item-title">${escapeHtml(product.title)}</h4>
          <div class="turbocart-list__item-price">${formatMoney(product.price)}</div>
        </div>
        <button
          class="turbocart-btn turbocart-btn--primary"
          data-turbocart-add="${product.variant_id}"
        >
          + Add
        </button>
      </div>
    `).join('');

    container.innerHTML = html;

    // Attach add to cart listeners
    container.querySelectorAll('[data-turbocart-add]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const variantId = e.target.dataset.turbocartAdd;
        const productId = e.target.closest('[data-product-id]').dataset.productId;
        addToCart(variantId, productId);
      });
    });
  }

  /* ============================================ */
  /* BANNER IMPLEMENTATION */
  /* ============================================ */

  function initBanner(block) {
    // Banner-specific initialization if needed
  }

  function renderBanner(container) {
    if (!upsellProducts.length) {
      container.innerHTML = '';
      container.closest('.turbocart-banner').style.display = 'none';
      return;
    }

    // Show only the top recommendation
    const product = upsellProducts[0];

    const html = `
      <div class="turbocart-banner__content" data-product-id="${product.id}">
        <img
          src="${product.image}"
          alt="${escapeHtml(product.title)}"
          class="turbocart-banner__image"
          loading="lazy"
        />
        <div class="turbocart-banner__info">
          <div class="turbocart-banner__urgency">SELLING FAST</div>
          <h4 class="turbocart-banner__title">${escapeHtml(product.title)}</h4>
          <div class="turbocart-banner__price">
            ${formatMoney(product.price)}
            ${product.compare_at_price ? `<span style="text-decoration: line-through; opacity: 0.7; margin-left: 8px; font-size: 14px;">${formatMoney(product.compare_at_price)}</span>` : ''}
          </div>
        </div>
        <div class="turbocart-banner__toggle">
          <button
            class="turbocart-btn turbocart-btn--cosmic"
            data-turbocart-add="${product.variant_id}"
            style="padding: 12px 24px;"
          >
            Add
          </button>
        </div>
      </div>
    `;

    container.innerHTML = html;

    // Attach add to cart listener
    container.querySelector('[data-turbocart-add]').addEventListener('click', (e) => {
      const variantId = e.target.dataset.turbocartAdd;
      const productId = e.target.closest('[data-product-id]').dataset.productId;
      addToCart(variantId, productId);
    });
  }

  /* ============================================ */
  /* CARDS IMPLEMENTATION */
  /* ============================================ */

  function initCards(block) {
    // Cards-specific initialization if needed
  }

  function renderCards(container) {
    if (!upsellProducts.length) {
      container.innerHTML = '<p style="text-align: center; color: #6b7280;">No recommendations available</p>';
      return;
    }

    const html = upsellProducts.map(product => `
      <div class="turbocart-cards__item" data-product-id="${product.id}">
        <img
          src="${product.image}"
          alt="${escapeHtml(product.title)}"
          class="turbocart-cards__item-image"
          loading="lazy"
        />
        <h4 class="turbocart-cards__item-title">${escapeHtml(product.title)}</h4>
        <div class="turbocart-cards__item-price">${formatMoney(product.price)}</div>
        <button
          class="turbocart-btn turbocart-btn--primary"
          data-turbocart-add="${product.variant_id}"
          style="width: 100%;"
        >
          +
        </button>
      </div>
    `).join('');

    container.innerHTML = html;

    // Attach add to cart listeners
    container.querySelectorAll('[data-turbocart-add]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const variantId = e.target.dataset.turbocartAdd;
        const productId = e.target.closest('[data-product-id]').dataset.productId;
        addToCart(variantId, productId);
      });
    });
  }

  /* ============================================ */
  /* ADD-ON (FREQUENTLY BOUGHT TOGETHER) */
  /* ============================================ */

  function initFrequentlyBought(block) {
    // Add-on specific initialization if needed
  }

  /**
   * Generate consistent percentage for a product ID
   * Same product ID always returns the same percentage
   */
  function getProductPercentage(productId) {
    // Simple hash function to generate consistent percentage from product ID
    let hash = 0;
    const idStr = String(productId);
    for (let i = 0; i < idStr.length; i++) {
      hash = ((hash << 5) - hash) + idStr.charCodeAt(i);
      hash = hash & hash; // Convert to 32bit integer
    }
    // Map to range 35-75% (reasonable social proof range)
    const percentage = 35 + (Math.abs(hash) % 41);
    return percentage;
  }

  function renderFrequentlyBought(container) {
    if (!upsellProducts.length) {
      container.innerHTML = '';
      container.closest('.turbocart-addon')?.remove();
      return;
    }

    // Show up to 2 add-ons (can be configurable)
    const addons = upsellProducts.slice(0, 2);

    const html = addons.map(product => {
      const percentage = getProductPercentage(product.id);
      const hasSavings = product.compare_at_price && product.compare_at_price > product.price;
      const savings = hasSavings ? product.compare_at_price - product.price : 0;

      // Check if product has variants (we'll show a selector if it does)
      const hasVariants = product.variants && product.variants.length > 1;

      return `
        <div class="turbocart-addon__item" data-product-id="${product.id}">
          <img
            src="${product.image}"
            alt="${escapeHtml(product.title)}"
            class="turbocart-addon__item-image"
            loading="lazy"
          />
          <div class="turbocart-addon__item-info">
            <div class="turbocart-addon__item-badge">${percentage}% ADDED THIS TO ORDER</div>
            <h4 class="turbocart-addon__item-title">${escapeHtml(product.title)}</h4>
            <div class="turbocart-addon__item-price-row">
              <span class="turbocart-addon__item-price">${formatMoney(product.price)}</span>
              ${hasSavings ? `
                <span class="turbocart-addon__item-compare-price">${formatMoney(product.compare_at_price)}</span>
                <span class="turbocart-addon__item-save">Save ${formatMoney(savings)}</span>
              ` : ''}
            </div>
            ${hasVariants ? `
              <div class="turbocart-addon__item-variant">
                <label class="turbocart-addon__item-variant-label">${product.variants[0].option1 ? product.variants[0].option_name || 'Variant' : 'Options'}</label>
                <select class="turbocart-addon__item-variant-select" data-variant-select="${product.id}">
                  ${product.variants.map(variant => `
                    <option value="${variant.id}" ${variant.id === product.variant_id ? 'selected' : ''}>
                      ${variant.title}
                    </option>
                  `).join('')}
                </select>
              </div>
            ` : ''}
          </div>
          <div class="turbocart-addon__item-actions">
            <button
              class="turbocart-btn turbocart-btn--primary"
              data-turbocart-add="${product.variant_id}"
              data-product-id="${product.id}"
              style="padding: 10px 20px;"
            >
              Add
            </button>
          </div>
        </div>
      `;
    }).join('');

    container.innerHTML = html;

    // Attach add to cart listeners
    container.querySelectorAll('[data-turbocart-add]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const button = e.target;
        const productId = button.dataset.productId;
        const itemEl = button.closest('.turbocart-addon__item');
        const variantSelect = itemEl.querySelector('[data-variant-select]');

        // Use selected variant if available, otherwise use default
        const variantId = variantSelect ? variantSelect.value : button.dataset.turbocartAdd;

        addToCart(variantId, productId);
      });
    });

    // Update button variant ID when variant selector changes
    container.querySelectorAll('[data-variant-select]').forEach(select => {
      select.addEventListener('change', (e) => {
        const itemEl = e.target.closest('.turbocart-addon__item');
        const btn = itemEl.querySelector('[data-turbocart-add]');
        btn.dataset.turbocartAdd = e.target.value;
      });
    });
  }

  /* ============================================ */
  /* CART OPERATIONS */
  /* ============================================ */

  /**
   * Add product to cart
   */
  async function addToCart(variantId, productId) {
    try {
      log('Adding to cart:', variantId, productId);

      const response = await fetch('/cart/add.js', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id: variantId,
          quantity: 1,
          properties: {
            '_turbocart_upsell': 'true',
            '_turbocart_product_id': productId,
          },
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to add to cart');
      }

      // Track the add event
      trackEvent('add', productId);

      // Update cart
      const cart = await fetchCart();
      currentCart = cart;

      // Dispatch cart updated event
      document.dispatchEvent(new CustomEvent('cart:updated', { detail: cart }));

      // Show success feedback
      showNotification('Added to cart!', 'success');

    } catch (error) {
      log('Error adding to cart:', error);
      showNotification('Failed to add to cart', 'error');
    }
  }

  /**
   * Handle cart update
   */
  function handleCartUpdate(event) {
    log('Cart updated:', event.detail);
    currentCart = event.detail;
    // Reload upsells based on new cart
    loadUpsells();
  }

  /* ============================================ */
  /* ANALYTICS */
  /* ============================================ */

  function trackImpressions() {
    upsellProducts.forEach(product => {
      trackEvent('impression', product.id);
    });
  }

  function trackEvent(eventType, productId) {
    if (!CONFIG.apiUrl || !CONFIG.shopDomain) return;

    fetch(`${CONFIG.apiUrl}/api/storefront/track?shop=${encodeURIComponent(CONFIG.shopDomain)}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        event_type: eventType,
        product_id: productId,
        session_id: sessionId,
        cart_token: currentCart?.token,
        shop: CONFIG.shopDomain,
        cart_value: currentCart?.total_price || 0,
        cart_item_count: currentCart?.item_count || 0,
      }),
    }).catch(error => {
      log('Error tracking event:', error.message);
    });
  }

  /* ============================================ */
  /* MASONRY GRID IMPLEMENTATION */
  /* ============================================ */

  function initMasonryGrid(block) {
    // Masonry-specific initialization if needed
  }

  function renderMasonryGrid(container) {
    if (!upsellProducts.length) {
      container.innerHTML = '<p style="text-align: center; color: #6b7280;">No recommendations available</p>';
      return;
    }

    const html = upsellProducts.map((product, index) => {
      const isLarge = index % 3 === 0; // Every 3rd item is larger
      return `
        <div class="turbocart-masonry__item ${isLarge ? 'turbocart-masonry__item--large' : ''}" data-product-id="${product.id}">
          <img
            src="${product.image}"
            alt="${escapeHtml(product.title)}"
            class="turbocart-masonry__item-image"
            loading="lazy"
          />
          <div class="turbocart-masonry__item-content">
            <h4 class="turbocart-masonry__item-title">${escapeHtml(product.title)}</h4>
            <div class="turbocart-masonry__item-price">${formatMoney(product.price)}</div>
            <button
              class="turbocart-btn turbocart-btn--primary"
              data-turbocart-add="${product.variant_id}"
              style="width: 100%; margin-top: 8px;"
            >
              Add
            </button>
          </div>
        </div>
      `;
    }).join('');

    container.innerHTML = html;

    // Attach add to cart listeners
    container.querySelectorAll('[data-turbocart-add]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const variantId = e.target.dataset.turbocartAdd;
        const productId = e.target.closest('[data-product-id]').dataset.productId;
        addToCart(variantId, productId);
      });
    });
  }

  /* ============================================ */
  /* CAROUSEL ARROWS IMPLEMENTATION */
  /* ============================================ */

  function initCarouselArrows(block) {
    const prevBtn = block.querySelector('.turbocart-carousel-arrows__nav--prev');
    const nextBtn = block.querySelector('.turbocart-carousel-arrows__nav--next');

    let currentIndex = 0;
    const itemsPerView = 3;

    prevBtn?.addEventListener('click', () => {
      if (currentIndex > 0) {
        currentIndex--;
        updateCarouselArrows(block, currentIndex);
        updateDots(block, currentIndex);
      }
    });

    nextBtn?.addEventListener('click', () => {
      const maxIndex = Math.max(0, upsellProducts.length - itemsPerView);
      if (currentIndex < maxIndex) {
        currentIndex++;
        updateCarouselArrows(block, currentIndex);
        updateDots(block, currentIndex);
      }
    });
  }

  function renderCarouselArrows(container) {
    if (!upsellProducts.length) {
      container.innerHTML = '<p style="text-align: center; color: #6b7280;">No recommendations available</p>';
      return;
    }

    const html = upsellProducts.map(product => `
      <div class="turbocart-carousel-arrows__item" data-product-id="${product.id}">
        <img
          src="${product.image}"
          alt="${escapeHtml(product.title)}"
          class="turbocart-carousel-arrows__item-image"
          loading="lazy"
        />
        <h4 class="turbocart-carousel-arrows__item-title">${escapeHtml(product.title)}</h4>
        <div class="turbocart-carousel-arrows__item-price">${formatMoney(product.price)}</div>
        <button
          class="turbocart-btn turbocart-btn--primary"
          data-turbocart-add="${product.variant_id}"
          style="margin-top: auto;"
        >
          Add
        </button>
      </div>
    `).join('');

    container.innerHTML = html;

    // Render dots
    const dotsContainer = container.closest('.turbocart-carousel-arrows').querySelector('.turbocart-carousel-arrows__dots');
    if (dotsContainer) {
      const numDots = Math.ceil(upsellProducts.length / 3);
      dotsContainer.innerHTML = Array.from({length: numDots}, (_, i) =>
        `<span class="turbocart-carousel-arrows__dot ${i === 0 ? 'active' : ''}" data-index="${i}"></span>`
      ).join('');
    }

    // Attach add to cart listeners
    container.querySelectorAll('[data-turbocart-add]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const variantId = e.target.dataset.turbocartAdd;
        const productId = e.target.closest('[data-product-id]').dataset.productId;
        addToCart(variantId, productId);
      });
    });
  }

  function updateCarouselArrows(block, index) {
    const track = block.querySelector('.turbocart-carousel-arrows__items');
    const itemWidth = track.querySelector('.turbocart-carousel-arrows__item')?.offsetWidth || 0;
    const gap = 16;
    const offset = -(index * (itemWidth + gap));
    track.style.transform = `translateX(${offset}px)`;
  }

  function updateDots(block, index) {
    const dots = block.querySelectorAll('.turbocart-carousel-arrows__dot');
    dots.forEach((dot, i) => {
      dot.classList.toggle('active', i === index);
    });
  }

  /* ============================================ */
  /* VERTICAL SCROLL IMPLEMENTATION */
  /* ============================================ */

  function initVerticalScroll(block) {
    // Vertical scroll specific initialization if needed
  }

  function renderVerticalScroll(container) {
    if (!upsellProducts.length) {
      container.innerHTML = '<p style="text-align: center; color: #6b7280;">No recommendations available</p>';
      return;
    }

    const html = upsellProducts.map(product => `
      <div class="turbocart-vertical-scroll__item" data-product-id="${product.id}">
        <img
          src="${product.image}"
          alt="${escapeHtml(product.title)}"
          class="turbocart-vertical-scroll__item-image"
          loading="lazy"
        />
        <div class="turbocart-vertical-scroll__item-overlay">
          <h4 class="turbocart-vertical-scroll__item-title">${escapeHtml(product.title)}</h4>
          <div class="turbocart-vertical-scroll__item-price">${formatMoney(product.price)}</div>
          <button
            class="turbocart-btn turbocart-btn--primary"
            data-turbocart-add="${product.variant_id}"
          >
            Add to Cart
          </button>
        </div>
      </div>
    `).join('');

    container.innerHTML = html;

    // Attach add to cart listeners
    container.querySelectorAll('[data-turbocart-add]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const variantId = e.target.dataset.turbocartAdd;
        const productId = e.target.closest('[data-product-id]').dataset.productId;
        addToCart(variantId, productId);
      });
    });
  }

  /* ============================================ */
  /* SPOTLIGHT IMPLEMENTATION */
  /* ============================================ */

  function initSpotlight(block) {
    let currentIndex = 0;
    let autoRotateInterval = null;

    function showProduct(index) {
      const items = block.querySelectorAll('.turbocart-spotlight__item');
      items.forEach((item, i) => {
        item.style.display = i === index ? 'block' : 'none';
      });

      // Update indicators
      const indicators = block.querySelectorAll('.turbocart-spotlight__indicator');
      indicators.forEach((ind, i) => {
        ind.classList.toggle('active', i === index);
      });
    }

    function nextProduct() {
      if (!upsellProducts.length) return;
      currentIndex = (currentIndex + 1) % upsellProducts.length;
      showProduct(currentIndex);
    }

    // Auto-rotate every 5 seconds
    autoRotateInterval = setInterval(nextProduct, 5000);

    // Store cleanup function
    block._cleanup = () => {
      if (autoRotateInterval) {
        clearInterval(autoRotateInterval);
      }
    };
  }

  function renderSpotlight(container) {
    if (!upsellProducts.length) {
      container.innerHTML = '<p style="text-align: center; color: #6b7280;">No recommendations available</p>';
      return;
    }

    const html = upsellProducts.map((product, index) => `
      <div class="turbocart-spotlight__item" data-product-id="${product.id}" style="${index === 0 ? '' : 'display: none;'}">
        <img
          src="${product.image}"
          alt="${escapeHtml(product.title)}"
          class="turbocart-spotlight__item-image"
          loading="lazy"
        />
        <div class="turbocart-spotlight__item-content">
          <div class="turbocart-spotlight__badge">★ FEATURED ★</div>
          <h4 class="turbocart-spotlight__item-title">${escapeHtml(product.title)}</h4>
          <div class="turbocart-spotlight__item-price">${formatMoney(product.price)}</div>
          <button
            class="turbocart-btn turbocart-btn--cosmic"
            data-turbocart-add="${product.variant_id}"
          >
            Add to Cart
          </button>
        </div>
      </div>
    `).join('');

    container.innerHTML = html;

    // Render indicators
    const indicatorsContainer = container.closest('.turbocart-spotlight').querySelector('.turbocart-spotlight__indicators');
    if (indicatorsContainer) {
      indicatorsContainer.innerHTML = upsellProducts.map((_, i) =>
        `<span class="turbocart-spotlight__indicator ${i === 0 ? 'active' : ''}"></span>`
      ).join('');
    }

    // Attach add to cart listeners
    container.querySelectorAll('[data-turbocart-add]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const variantId = e.target.dataset.turbocartAdd;
        const productId = e.target.closest('[data-product-id]').dataset.productId;
        addToCart(variantId, productId);
      });
    });
  }

  /* ============================================ */
  /* STICKY TABS IMPLEMENTATION */
  /* ============================================ */

  function initStickyTabs(block) {
    // Tab switching will be handled in render function
  }

  function renderStickyTabs(container) {
    if (!upsellProducts.length) {
      container.innerHTML = '<p style="text-align: center; color: #6b7280;">No recommendations available</p>';
      return;
    }

    // Group products by collection or create default tabs
    const tabs = {
      'All': upsellProducts,
      'Best Sellers': upsellProducts.slice(0, Math.ceil(upsellProducts.length / 2)),
      'New': upsellProducts.slice(Math.ceil(upsellProducts.length / 2))
    };

    // Render tab navigation
    const nav = container.closest('.turbocart-sticky-tabs').querySelector('.turbocart-sticky-tabs__nav');
    nav.innerHTML = Object.keys(tabs).map((tabName, index) =>
      `<button class="turbocart-sticky-tabs__tab ${index === 0 ? 'active' : ''}" data-tab="${tabName}">${tabName}</button>`
    ).join('');

    // Render first tab content
    const firstTabProducts = tabs['All'];
    const html = firstTabProducts.map(product => `
      <div class="turbocart-sticky-tabs__item" data-product-id="${product.id}">
        <img
          src="${product.image}"
          alt="${escapeHtml(product.title)}"
          class="turbocart-sticky-tabs__item-image"
          loading="lazy"
        />
        <h4 class="turbocart-sticky-tabs__item-title">${escapeHtml(product.title)}</h4>
        <div class="turbocart-sticky-tabs__item-price">${formatMoney(product.price)}</div>
        <button
          class="turbocart-btn turbocart-btn--primary"
          data-turbocart-add="${product.variant_id}"
        >
          Add
        </button>
      </div>
    `).join('');

    container.innerHTML = html;

    // Attach tab click listeners
    nav.querySelectorAll('.turbocart-sticky-tabs__tab').forEach(tab => {
      tab.addEventListener('click', (e) => {
        const tabName = e.target.dataset.tab;
        const products = tabs[tabName];

        // Update active tab
        nav.querySelectorAll('.turbocart-sticky-tabs__tab').forEach(t => t.classList.remove('active'));
        e.target.classList.add('active');

        // Render tab products
        const tabHtml = products.map(product => `
          <div class="turbocart-sticky-tabs__item" data-product-id="${product.id}">
            <img src="${product.image}" alt="${escapeHtml(product.title)}" class="turbocart-sticky-tabs__item-image" loading="lazy" />
            <h4 class="turbocart-sticky-tabs__item-title">${escapeHtml(product.title)}</h4>
            <div class="turbocart-sticky-tabs__item-price">${formatMoney(product.price)}</div>
            <button class="turbocart-btn turbocart-btn--primary" data-turbocart-add="${product.variant_id}">Add</button>
          </div>
        `).join('');

        container.innerHTML = tabHtml;

        // Re-attach listeners
        container.querySelectorAll('[data-turbocart-add]').forEach(btn => {
          btn.addEventListener('click', (e) => {
            const variantId = e.target.dataset.turbocartAdd;
            const productId = e.target.closest('[data-product-id]').dataset.productId;
            addToCart(variantId, productId);
          });
        });
      });
    });

    // Attach add to cart listeners
    container.querySelectorAll('[data-turbocart-add]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const variantId = e.target.dataset.turbocartAdd;
        const productId = e.target.closest('[data-product-id]').dataset.productId;
        addToCart(variantId, productId);
      });
    });
  }

  /* ============================================ */
  /* COUNTDOWN BUNDLE IMPLEMENTATION */
  /* ============================================ */

  function initCountdownBundle(block) {
    const timerDisplay = block.querySelector('.turbocart-countdown-bundle__timer-values');
    if (!timerDisplay) return;

    // Set countdown to 15 minutes from now
    const endTime = Date.now() + (15 * 60 * 1000);

    function updateTimer() {
      const now = Date.now();
      const remaining = Math.max(0, endTime - now);

      const hours = Math.floor(remaining / (1000 * 60 * 60));
      const minutes = Math.floor((remaining % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((remaining % (1000 * 60)) / 1000);

      const hoursEl = timerDisplay.querySelector('[data-hours]');
      const minutesEl = timerDisplay.querySelector('[data-minutes]');
      const secondsEl = timerDisplay.querySelector('[data-seconds]');

      if (hoursEl) hoursEl.textContent = String(hours).padStart(2, '0');
      if (minutesEl) minutesEl.textContent = String(minutes).padStart(2, '0');
      if (secondsEl) secondsEl.textContent = String(seconds).padStart(2, '0');

      if (remaining > 0) {
        requestAnimationFrame(updateTimer);
      }
    }

    updateTimer();
  }

  function renderCountdownBundle(container) {
    if (!upsellProducts.length) {
      container.innerHTML = '<p style="text-align: center; color: #6b7280;">No bundle deals available</p>';
      return;
    }

    // Show bundle of products
    const bundleProducts = upsellProducts.slice(0, 2);
    const totalPrice = bundleProducts.reduce((sum, p) => sum + p.price, 0);
    const discountedPrice = Math.round(totalPrice * 0.8); // 20% off

    const html = `
      <div class="turbocart-countdown-bundle__products">
        ${bundleProducts.map(product => `
          <div class="turbocart-countdown-bundle__product" data-product-id="${product.id}">
            <img src="${product.image}" alt="${escapeHtml(product.title)}" class="turbocart-countdown-bundle__product-image" loading="lazy" />
            <h4 class="turbocart-countdown-bundle__product-title">${escapeHtml(product.title)}</h4>
          </div>
        `).join('<div class="turbocart-countdown-bundle__plus">+</div>')}
      </div>
      <div class="turbocart-countdown-bundle__pricing">
        <div class="turbocart-countdown-bundle__total">
          <span class="turbocart-countdown-bundle__original-price">${formatMoney(totalPrice)}</span>
          <span class="turbocart-countdown-bundle__discounted-price">${formatMoney(discountedPrice)}</span>
        </div>
        <div class="turbocart-countdown-bundle__savings">Save ${formatMoney(totalPrice - discountedPrice)} (20% OFF)</div>
      </div>
      <button class="turbocart-btn turbocart-btn--cosmic" data-turbocart-add-bundle style="width: 100%; padding: 14px;">
        Add Bundle to Cart
      </button>
    `;

    container.innerHTML = html;

    // Attach bundle add listener
    container.querySelector('[data-turbocart-add-bundle]')?.addEventListener('click', () => {
      bundleProducts.forEach(product => {
        addToCart(product.variant_id, product.id);
      });
    });
  }

  /* ============================================ */
  /* PROGRESSIVE DISCOUNT IMPLEMENTATION */
  /* ============================================ */

  function initProgressiveDiscount(block) {
    // Progressive discount specific initialization if needed
  }

  function renderProgressiveDiscount(container) {
    if (!upsellProducts.length) {
      container.innerHTML = '<p style="text-align: center; color: #6b7280;">No products available</p>';
      return;
    }

    const html = upsellProducts.map(product => `
      <div class="turbocart-progressive-discount__item" data-product-id="${product.id}">
        <img
          src="${product.image}"
          alt="${escapeHtml(product.title)}"
          class="turbocart-progressive-discount__item-image"
          loading="lazy"
        />
        <div class="turbocart-progressive-discount__item-content">
          <h4 class="turbocart-progressive-discount__item-title">${escapeHtml(product.title)}</h4>
          <div class="turbocart-progressive-discount__item-price">${formatMoney(product.price)}</div>
          <div class="turbocart-progressive-discount__item-quantity">
            <button class="turbocart-progressive-discount__qty-btn" data-action="decrease">-</button>
            <input type="number" class="turbocart-progressive-discount__qty-input" value="1" min="1" />
            <button class="turbocart-progressive-discount__qty-btn" data-action="increase">+</button>
          </div>
          <button
            class="turbocart-btn turbocart-btn--primary"
            data-turbocart-add="${product.variant_id}"
            style="width: 100%;"
          >
            Add to Cart
          </button>
        </div>
      </div>
    `).join('');

    container.innerHTML = html;

    // Attach quantity button listeners
    container.querySelectorAll('.turbocart-progressive-discount__qty-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const action = e.target.dataset.action;
        const input = e.target.closest('.turbocart-progressive-discount__item-quantity').querySelector('input');
        let value = parseInt(input.value) || 1;

        if (action === 'increase') {
          value++;
        } else if (action === 'decrease' && value > 1) {
          value--;
        }

        input.value = value;
      });
    });

    // Attach add to cart listeners
    container.querySelectorAll('[data-turbocart-add]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const variantId = e.target.dataset.turbocartAdd;
        const productId = e.target.closest('[data-product-id]').dataset.productId;
        const quantity = parseInt(e.target.closest('.turbocart-progressive-discount__item-content').querySelector('input').value) || 1;

        // Add multiple quantities
        for (let i = 0; i < quantity; i++) {
          addToCart(variantId, productId);
        }
      });
    });
  }

  /* ============================================ */
  /* QUIZ MATCH IMPLEMENTATION */
  /* ============================================ */

  function initQuizMatch(block) {
    const options = block.querySelectorAll('.turbocart-quiz-match__option');
    const resultsContainer = block.querySelector('.turbocart-quiz-match__results');

    options.forEach(option => {
      option.addEventListener('click', (e) => {
        const preference = e.target.dataset.preference;

        // Hide quiz, show results
        block.querySelector('.turbocart-quiz-match__quiz').style.display = 'none';
        resultsContainer.style.display = 'block';

        // Filter products based on preference (simple implementation)
        renderQuizResults(resultsContainer.querySelector('[data-turbocart-upsells]'), preference);
      });
    });
  }

  function renderQuizMatch(container) {
    // Initially show loading state
    container.innerHTML = `
      <div class="turbocart-quiz-match__loading">
        <div class="turbocart-spinner"></div>
      </div>
    `;
  }

  function renderQuizResults(container, preference) {
    if (!upsellProducts.length) {
      container.innerHTML = '<p style="text-align: center; color: #6b7280;">No matching products found</p>';
      return;
    }

    // Show matched products (simple filtering for demo)
    const matchedProducts = upsellProducts.slice(0, 3);

    const html = `
      <div class="turbocart-quiz-match__match-badge">✨ Perfect Matches for You</div>
      ${matchedProducts.map(product => `
        <div class="turbocart-quiz-match__item" data-product-id="${product.id}">
          <img
            src="${product.image}"
            alt="${escapeHtml(product.title)}"
            class="turbocart-quiz-match__item-image"
            loading="lazy"
          />
          <div class="turbocart-quiz-match__item-content">
            <h4 class="turbocart-quiz-match__item-title">${escapeHtml(product.title)}</h4>
            <div class="turbocart-quiz-match__item-price">${formatMoney(product.price)}</div>
            <button
              class="turbocart-btn turbocart-btn--primary"
              data-turbocart-add="${product.variant_id}"
            >
              Add to Cart
            </button>
          </div>
        </div>
      `).join('')}
    `;

    container.innerHTML = html;

    // Attach add to cart listeners
    container.querySelectorAll('[data-turbocart-add]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const variantId = e.target.dataset.turbocartAdd;
        const productId = e.target.closest('[data-product-id]').dataset.productId;
        addToCart(variantId, productId);
      });
    });
  }

  /* ============================================ */
  /* SIDE DRAWER IMPLEMENTATION */
  /* ============================================ */

  function initSideDrawer(block) {
    const toggle = block.querySelector('.turbocart-side-drawer__toggle');
    const panel = block.querySelector('.turbocart-side-drawer__panel');
    const overlay = block.querySelector('.turbocart-side-drawer__overlay');
    const closeBtn = block.querySelector('.turbocart-side-drawer__close');

    function openDrawer() {
      panel.classList.add('open');
      overlay.classList.add('visible');
      document.body.style.overflow = 'hidden';
    }

    function closeDrawer() {
      panel.classList.remove('open');
      overlay.classList.remove('visible');
      document.body.style.overflow = '';
    }

    toggle?.addEventListener('click', openDrawer);
    closeBtn?.addEventListener('click', closeDrawer);
    overlay?.addEventListener('click', closeDrawer);
  }

  function renderSideDrawer(container) {
    if (!upsellProducts.length) {
      container.innerHTML = '<p style="text-align: center; color: #6b7280;">No add-ons available</p>';
      return;
    }

    const html = upsellProducts.map(product => `
      <div class="turbocart-side-drawer__item" data-product-id="${product.id}">
        <img
          src="${product.image}"
          alt="${escapeHtml(product.title)}"
          class="turbocart-side-drawer__item-image"
          loading="lazy"
        />
        <div class="turbocart-side-drawer__item-content">
          <h4 class="turbocart-side-drawer__item-title">${escapeHtml(product.title)}</h4>
          <div class="turbocart-side-drawer__item-price">${formatMoney(product.price)}</div>
        </div>
        <button
          class="turbocart-btn turbocart-btn--primary"
          data-turbocart-add="${product.variant_id}"
        >
          +
        </button>
      </div>
    `).join('');

    container.innerHTML = html;

    // Attach add to cart listeners
    container.querySelectorAll('[data-turbocart-add]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const variantId = e.target.dataset.turbocartAdd;
        const productId = e.target.closest('[data-product-id]').dataset.productId;
        addToCart(variantId, productId);
      });
    });
  }

  /* ============================================ */
  /* COMPARISON TABLE IMPLEMENTATION */
  /* ============================================ */

  function initComparisonTable(block) {
    // Comparison table specific initialization if needed
  }

  function renderComparisonTable(container) {
    if (!upsellProducts.length) {
      container.innerHTML = '<p style="text-align: center; color: #6b7280;">No products to compare</p>';
      return;
    }

    const productsToCompare = upsellProducts.slice(0, 3);

    const html = `
      <table class="turbocart-comparison-table__table">
        <thead>
          <tr>
            <th>Feature</th>
            ${productsToCompare.map(product => `
              <th>
                <img src="${product.image}" alt="${escapeHtml(product.title)}" style="width: 60px; height: 60px; object-fit: cover; border-radius: 8px;" />
                <div style="margin-top: 8px; font-size: 14px;">${escapeHtml(product.title)}</div>
              </th>
            `).join('')}
          </tr>
        </thead>
        <tbody>
          <tr>
            <td><strong>Price</strong></td>
            ${productsToCompare.map(product => `<td>${formatMoney(product.price)}</td>`).join('')}
          </tr>
          <tr>
            <td><strong>Rating</strong></td>
            ${productsToCompare.map(() => `<td>★★★★☆ 4.5</td>`).join('')}
          </tr>
          <tr>
            <td></td>
            ${productsToCompare.map(product => `
              <td>
                <button
                  class="turbocart-btn turbocart-btn--primary"
                  data-turbocart-add="${product.variant_id}"
                  data-product-id="${product.id}"
                  style="width: 100%;"
                >
                  Select
                </button>
              </td>
            `).join('')}
          </tr>
        </tbody>
      </table>
    `;

    container.innerHTML = html;

    // Attach add to cart listeners
    container.querySelectorAll('[data-turbocart-add]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const variantId = e.target.dataset.turbocartAdd;
        const productId = e.target.dataset.productId;
        addToCart(variantId, productId);
      });
    });
  }

  /* ============================================ */
  /* UTILITIES */
  /* ============================================ */

  function formatMoney(cents) {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: window.Shopify?.currency?.active || 'USD',
    }).format(cents / 100);
  }

  function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  function showNotification(message, type = 'success') {
    // Simple notification (can be enhanced)
    log(`Notification [${type}]:`, message);
  }

  /* ============================================ */
  /* INITIALIZATION */
  /* ============================================ */

  // Initialize when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  // Export for external access if needed
  window.TurboCart = {
    reload: loadUpsells,
    addToCart: addToCart,
  };

})();
