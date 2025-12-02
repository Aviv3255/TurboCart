/**
 * Inject.js - Dynamic script loader for TurboCart
 * This is loaded via ScriptTag API as a backup to App Embed
 *
 * Returns JavaScript that:
 * 1. Gets shop domain from Shopify globals
 * 2. Sets up TurboCartConfig
 * 3. Loads the main functionality
 */

import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

const INJECT_SCRIPT = `
(function() {
  'use strict';

  console.log('[TurboCart] 🚀 Inject.js loaded via ScriptTag');

  // Get shop domain from Shopify globals
  function getShopDomain() {
    // Method 1: Shopify global (most reliable)
    if (window.Shopify && window.Shopify.shop) {
      return window.Shopify.shop;
    }

    // Method 2: Check meta tags
    var metaShop = document.querySelector('meta[name="shopify-shop-domain"]');
    if (metaShop && metaShop.content) {
      return metaShop.content;
    }

    // Method 3: URL if on myshopify.com
    if (window.location.hostname.includes('myshopify.com')) {
      return window.location.hostname;
    }

    // Method 4: Try to extract from Shopify script tags
    var scripts = document.querySelectorAll('script[src*="shopify"]');
    for (var i = 0; i < scripts.length; i++) {
      var match = scripts[i].src.match(/\\/\\/([^\\/]+\\.myshopify\\.com)/);
      if (match) return match[1];
    }

    console.error('[TurboCart] Could not determine shop domain');
    return null;
  }

  var shopDomain = getShopDomain();
  console.log('[TurboCart] Shop domain:', shopDomain);

  if (!shopDomain) {
    console.error('[TurboCart] Cannot initialize - no shop domain');
    return;
  }

  // Set up TurboCartConfig if not already set by App Embed
  if (!window.TurboCartConfig) {
    window.TurboCartConfig = {
      apiUrl: 'https://turbocart.onrender.com',
      shopDomain: shopDomain,
      shopId: (window.Shopify && window.Shopify.shop_id) || null,
      enabled: true,
      maxProducts: 3,
      displayStyle: 'minimal-strip',
      position: 'top',
      debug: true,
      version: '2.0.0-inject'
    };
    console.log('[TurboCart] Config set:', window.TurboCartConfig);
  }

  // Now initialize the upsell functionality inline
  var CONFIG = {
    apiUrl: window.TurboCartConfig.apiUrl,
    shopDomain: window.TurboCartConfig.shopDomain,
    debug: true,
    displayStyle: window.TurboCartConfig.displayStyle || 'minimal-strip',
    position: window.TurboCartConfig.position || 'top',
    maxProducts: window.TurboCartConfig.maxProducts || 3,
    enabled: true
  };

  var currentCart = null;
  var upsellProducts = [];
  var sessionId = 'tc_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
  var upsellContainer = null;
  var isInjected = false;

  // Cart drawer selectors
  var CART_SELECTORS = [
    'cart-drawer', 'cart-drawer-items', '#cart-drawer', '.cart-drawer',
    '[data-cart-drawer]', '.mini-cart', '.side-cart', '#CartDrawer',
    'cart-notification', '.cart-notification', '.cart-items', '.cart__items',
    '#cart-items', 'form[action="/cart"]', '.cart-form', '#main-cart-items'
  ];

  function log() {
    if (CONFIG.debug) {
      var args = ['[TurboCart]'].concat(Array.prototype.slice.call(arguments));
      console.log.apply(console, args);
    }
  }

  function fetchCart() {
    return fetch('/cart.js')
      .then(function(r) { return r.json(); })
      .catch(function(e) { log('Cart fetch error:', e); return null; });
  }

  function loadUpsells() {
    if (!currentCart || !currentCart.items || currentCart.items.length === 0) {
      log('Cart empty, skipping upsells');
      return Promise.resolve();
    }

    var url = CONFIG.apiUrl + '/api/storefront/upsells?shop=' + encodeURIComponent(CONFIG.shopDomain);
    log('Loading upsells from:', url);

    return fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        cart_items: currentCart.items,
        session_id: sessionId,
        shop: CONFIG.shopDomain
      })
    })
    .then(function(r) {
      log('API response status:', r.status);
      if (!r.ok) throw new Error('HTTP ' + r.status);
      return r.json();
    })
    .then(function(data) {
      log('Upsells received:', data);
      upsellProducts = data.upsells || [];
      if (upsellProducts.length > 0) {
        renderUpsells();
      }
    })
    .catch(function(e) {
      log('Upsell load error:', e.message);
    });
  }

  function formatMoney(cents) {
    var currency = (window.Shopify && window.Shopify.currency && window.Shopify.currency.active) || 'USD';
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: currency }).format(cents / 100);
  }

  function escapeHtml(text) {
    var div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  function findCartContainer() {
    for (var i = 0; i < CART_SELECTORS.length; i++) {
      try {
        var el = document.querySelector(CART_SELECTORS[i]);
        if (el && el.offsetParent !== null) {
          log('Found cart container:', CART_SELECTORS[i]);
          return el;
        }
      } catch (e) {}
    }
    return null;
  }

  function renderUpsells() {
    if (!upsellProducts.length) return;

    var cart = findCartContainer();
    if (!cart) {
      log('No cart container found');
      return;
    }

    // Remove existing
    var existing = document.getElementById('turbocart-upsells-inject');
    if (existing) existing.remove();

    // Create container
    var container = document.createElement('div');
    container.id = 'turbocart-upsells-inject';
    container.style.cssText = 'padding:16px;margin:16px 0;border:1px solid #e5e5e5;border-radius:12px;background:#fafafa;';

    var html = '<div style="font-weight:600;margin-bottom:12px;font-size:14px;">You might also like</div>';
    html += '<div style="display:flex;gap:12px;overflow-x:auto;">';

    upsellProducts.slice(0, 3).forEach(function(p) {
      html += '<div style="min-width:100px;text-align:center;flex-shrink:0;">';
      if (p.image) {
        html += '<img src="' + p.image + '" alt="' + escapeHtml(p.title) + '" style="width:80px;height:80px;object-fit:cover;border-radius:8px;margin-bottom:8px;">';
      }
      html += '<div style="font-size:12px;font-weight:500;margin-bottom:4px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:100px;">' + escapeHtml(p.title) + '</div>';
      html += '<div style="font-size:12px;color:#666;margin-bottom:8px;">' + formatMoney(p.price) + '</div>';
      html += '<button onclick="window.TurboCartAddToCart(' + p.variant_id + ')" style="background:#000;color:#fff;border:none;padding:6px 12px;border-radius:6px;font-size:11px;cursor:pointer;">Add</button>';
      html += '</div>';
    });

    html += '</div>';
    container.innerHTML = html;

    if (CONFIG.position === 'top') {
      cart.insertBefore(container, cart.firstChild);
    } else {
      cart.appendChild(container);
    }

    log('Upsells rendered');
  }

  // Global add to cart function
  window.TurboCartAddToCart = function(variantId) {
    fetch('/cart/add.js', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: variantId, quantity: 1 })
    })
    .then(function() {
      log('Added to cart:', variantId);
      fetchCart().then(function(c) { currentCart = c; });
    })
    .catch(function(e) { log('Add error:', e); });
  };

  // Initialize
  function init() {
    log('Initializing...');

    fetchCart().then(function(cart) {
      currentCart = cart;
      log('Cart loaded:', cart ? cart.item_count + ' items' : 'empty');

      if (cart && cart.items && cart.items.length > 0) {
        loadUpsells();
      }
    });

    // Watch for cart updates
    var observer = new MutationObserver(function() {
      setTimeout(function() {
        var cart = findCartContainer();
        if (cart && !document.getElementById('turbocart-upsells-inject') && upsellProducts.length > 0) {
          renderUpsells();
        }
      }, 200);
    });

    observer.observe(document.body, { childList: true, subtree: true });

    // Intercept cart adds
    var origFetch = window.fetch;
    window.fetch = function() {
      var result = origFetch.apply(this, arguments);
      var url = arguments[0];
      if (typeof url === 'string' && url.includes('/cart/add')) {
        result.then(function() {
          setTimeout(function() {
            fetchCart().then(function(c) {
              currentCart = c;
              loadUpsells();
            });
          }, 500);
        });
      }
      return result;
    };

    log('Initialized successfully');
  }

  // Start
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
`;

export async function GET(request: NextRequest) {
  return new NextResponse(INJECT_SCRIPT, {
    headers: {
      'Content-Type': 'application/javascript',
      'Cache-Control': 'public, max-age=3600',
      'Access-Control-Allow-Origin': '*',
    },
  });
}
