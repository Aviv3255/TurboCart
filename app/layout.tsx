import type { Metadata } from 'next';
import './globals.css';

// Use system font stack for reliable builds (avoids Google Fonts network dependency)
const fontClass = 'font-sans';

export const metadata: Metadata = {
  title: 'TurboCart - Cart Upsells',
  description: 'Premium Cart Upsells for Shopify',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const apiKey = process.env.NEXT_PUBLIC_SHOPIFY_API_KEY || '';

  return (
    <html lang="en">
      <head>
        {/* App Bridge v4: Meta tag MUST come before script */}
        <meta name="shopify-api-key" content={apiKey} />
        {/* App Bridge v4: Synchronous script load required - no async/defer */}
        {/* eslint-disable-next-line @next/next/no-sync-scripts */}
        <script src="https://cdn.shopify.com/shopifycloud/app-bridge.js"></script>
      </head>
      <body className={fontClass}>
        {/*
          ui-nav-menu Web Component - Shopify's native sidebar navigation
          - First link with rel="home" defines app home (not displayed as link)
          - Other links appear in Shopify's admin sidebar under app name
          - Must be rendered on every page
        */}
        <ui-nav-menu>
          <a href="/" rel="home">TurboCart</a>
          <a href="/dashboard">Dashboard</a>
          <a href="/products">Products</a>
          <a href="/analytics">Analytics</a>
          <a href="/billing">Billing</a>
          <a href="/settings">Settings</a>
        </ui-nav-menu>

        {children}
      </body>
    </html>
  );
}

// Declare the web component for TypeScript
declare global {
  namespace JSX {
    interface IntrinsicElements {
      'ui-nav-menu': React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement>;
    }
  }
}
