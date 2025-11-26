'use client';

import { NavMenu } from '@shopify/app-bridge-react';

/**
 * Shopify App Bridge Navigation
 *
 * This component registers navigation links in Shopify's admin sidebar.
 * The first link with rel="home" defines the app home and won't be shown.
 * Other links appear in the sidebar under the app name.
 */
export function ShopifyNavigation() {
  return (
    <NavMenu>
      {/* First link with rel="home" is required but not displayed */}
      <a href="/" rel="home">TurboCart</a>
      {/* These links appear in Shopify's sidebar */}
      <a href="/dashboard">Dashboard</a>
      <a href="/products">Products</a>
      <a href="/analytics">Analytics</a>
      <a href="/settings">Settings</a>
    </NavMenu>
  );
}
