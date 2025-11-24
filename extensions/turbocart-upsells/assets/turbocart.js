/**
 * TurboCart - Theme App Extension JavaScript
 * Handles all storefront upsell functionality
 */

(function() {
  'use strict';

  // Configuration
  const CONFIG = {
    apiUrl: window.TurboCartConfig?.apiUrl || '',
    debug: window.TurboCartConfig?.debug || false,
  };

  // State
  let currentCart = null;
  let upsellProducts = [];
  let sessionId = generateSessionId();

  /**
   * Initialize TurboCart
   */
  function init() {
    log('TurboCart initializing...');

    // Get current cart
    fetchCart().then(cart => {
      currentCart = cart;
      loadUpsells();
    });

    // Listen for cart updates
    document.addEventListener('cart:updated', handleCartUpdate);

    // Initialize all upsell blocks
    initializeBlocks();
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
   * Load upsell recommendations
   */
  async function loadUpsells() {
    if (!currentCart || !currentCart.items.length) {
      log('Cart is empty, no upsells to show');
      return;
    }

    try {
      const response = await fetch(`${CONFIG.apiUrl}/api/storefront/upsells`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          cart_items: currentCart.items,
          session_id: sessionId,
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      upsellProducts = data.upsells || [];

      log('Loaded upsells:', upsellProducts);

      // Track impressions
      trackImpressions();

      // Render upsells in all blocks
      renderAllBlocks();

    } catch (error) {
      log('Error loading upsells:', error);
    }
  }

  /**
   * Render upsells in all blocks
   */
  function renderAllBlocks() {
    const containers = document.querySelectorAll('[data-turbocart-upsells]');
    containers.forEach(container => {
      const block = container.closest('[data-turbocart-block]');
      const type = block?.dataset.turbocartBlock;

      switch(type) {
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
      }
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
    // Map to range 25-65% (reasonable social proof range)
    const percentage = 25 + (Math.abs(hash) % 41);
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
    if (!CONFIG.apiUrl) return;

    fetch(`${CONFIG.apiUrl}/api/storefront/track`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        event_type: eventType,
        product_id: productId,
        session_id: sessionId,
        cart_token: currentCart?.token,
      }),
    }).catch(error => {
      log('Error tracking event:', error);
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

  function generateSessionId() {
    return 'tc_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
  }

  function showNotification(message, type = 'success') {
    // Simple notification (can be enhanced)
    log(`Notification [${type}]:`, message);
  }

  function log(...args) {
    if (CONFIG.debug) {
      console.log('[TurboCart]', ...args);
    }
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
