/**
 * Inject.js - Serves the TurboCart script
 * Redirects to the public JS file for better caching and reliability
 */

import { NextRequest, NextResponse } from 'next/server';
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    // Try multiple paths where the script might be located
    const possiblePaths = [
      join(process.cwd(), 'public', 'js', 'turbocart.js'),
      join(process.cwd(), 'extensions', 'turbocart-upsells', 'assets', 'turbocart.js'),
      join(process.cwd(), '.next', 'static', 'js', 'turbocart.js'),
    ];

    let jsContent = null;
    for (const path of possiblePaths) {
      try {
        if (existsSync(path)) {
          jsContent = readFileSync(path, 'utf-8');
          console.log('[inject.js] Loaded script from:', path);
          break;
        }
      } catch (e) {
        continue;
      }
    }

    if (jsContent) {
      return new NextResponse(jsContent, {
        headers: {
          'Content-Type': 'application/javascript; charset=utf-8',
          'Cache-Control': 'public, max-age=60, stale-while-revalidate=300',
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, OPTIONS',
        },
      });
    }

    // If no file found, return embedded fallback script
    console.error('[inject.js] No script file found, returning fallback');
    return new NextResponse(getFallbackScript(), {
      headers: {
        'Content-Type': 'application/javascript; charset=utf-8',
        'Access-Control-Allow-Origin': '*',
      },
    });
  } catch (error) {
    console.error('[inject.js] Error:', error);
    return new NextResponse(getFallbackScript(), {
      headers: {
        'Content-Type': 'application/javascript; charset=utf-8',
        'Access-Control-Allow-Origin': '*',
      },
    });
  }
}

function getFallbackScript() {
  return `
(function() {
  'use strict';
  console.log('[TurboCart] Loading fallback script...');

  const API_URL = 'https://turbocart.onrender.com';

  function getShopDomain() {
    if (window.TurboCartConfig?.shopDomain) return window.TurboCartConfig.shopDomain;
    if (window.Shopify?.shop) return window.Shopify.shop;
    const hostname = window.location.hostname;
    if (hostname.includes('myshopify.com')) return hostname;
    return hostname;
  }

  const SHOP = getShopDomain();
  if (!SHOP) {
    console.error('[TurboCart] No shop domain found');
    return;
  }

  let config = null;
  let cart = null;

  async function fetchConfig() {
    try {
      const res = await fetch(API_URL + '/api/storefront/config?shop=' + encodeURIComponent(SHOP));
      if (!res.ok) throw new Error('Config failed');
      return await res.json();
    } catch (e) {
      console.error('[TurboCart] Config error:', e);
      return null;
    }
  }

  async function fetchCart() {
    try {
      const res = await fetch('/cart.js');
      return await res.json();
    } catch (e) {
      return null;
    }
  }

  function formatMoney(cents) {
    return '$' + (cents / 100).toFixed(2);
  }

  function render() {
    if (!config || !cart || cart.item_count === 0) return;
    if (!config.upsells || !config.upsells.length) return;

    const selectors = ['cart-drawer', '.cart-drawer', '#cart-drawer', '.mini-cart', '.side-cart', '#CartDrawer', 'form[action="/cart"]'];
    let container = null;
    for (const sel of selectors) {
      try {
        const el = document.querySelector(sel);
        if (el && el.offsetParent !== null) { container = el; break; }
      } catch(e) {}
    }

    if (!container) {
      console.log('[TurboCart] No cart container');
      return;
    }

    const existing = document.getElementById('tc-fallback');
    if (existing) existing.remove();

    const cartIds = cart.items.map(i => i.product_id);
    const upsells = config.upsells.filter(p => !cartIds.includes(p.id)).slice(0, 4);
    if (!upsells.length) return;

    const html = '<div id="tc-fallback" style="padding:16px;margin:12px 0;background:#f9fafb;border-radius:12px;">' +
      '<div style="font-weight:600;margin-bottom:12px;">You may also like</div>' +
      '<div style="display:flex;gap:12px;overflow-x:auto;">' +
      upsells.map(p =>
        '<div style="flex:0 0 130px;background:#fff;border:1px solid #e5e7eb;border-radius:10px;padding:12px;text-align:center;">' +
        (p.image ? '<img src="' + p.image + '" style="width:70px;height:70px;object-fit:cover;border-radius:8px;margin-bottom:8px;">' : '') +
        '<div style="font-size:12px;font-weight:500;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;margin-bottom:4px;">' + p.title + '</div>' +
        '<div style="font-size:12px;color:#6b7280;margin-bottom:8px;">' + formatMoney(p.price) + '</div>' +
        '<button onclick="tcAdd(' + (p.variant_id || p.id) + ')" style="width:100%;padding:8px;background:#111;color:#fff;border:none;border-radius:6px;font-size:12px;cursor:pointer;">Add</button>' +
        '</div>'
      ).join('') +
      '</div></div>';

    container.insertAdjacentHTML('afterbegin', html);
    console.log('[TurboCart] Fallback rendered');
  }

  window.tcAdd = async function(variantId) {
    try {
      await fetch('/cart/add.js', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: parseInt(variantId), quantity: 1 })
      });
      cart = await fetchCart();
      render();
    } catch (e) {
      console.error('[TurboCart] Add error:', e);
    }
  };

  async function init() {
    console.log('[TurboCart] Fallback init for:', SHOP);
    config = await fetchConfig();
    cart = await fetchCart();
    if (config && cart && cart.item_count > 0) render();

    const observer = new MutationObserver(() => {
      setTimeout(async () => {
        const newCart = await fetchCart();
        if (newCart && JSON.stringify(newCart) !== JSON.stringify(cart)) {
          cart = newCart;
          if (cart.item_count > 0) render();
        }
      }, 500);
    });
    observer.observe(document.body, { childList: true, subtree: true });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
`;
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}
