import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { ShopifyNavigation } from '@/components/ShopifyNavigation';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'TurboCart - AI Cart Upsells',
  description: 'AI-Powered Upsells That Convert',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        {/* App Bridge v4: Meta tag MUST come before script */}
        <meta
          name="shopify-api-key"
          content={process.env.NEXT_PUBLIC_SHOPIFY_API_KEY || ''}
        />
        {/* App Bridge v4: Synchronous script load */}
        <script src="https://cdn.shopify.com/shopifycloud/app-bridge.js" />
      </head>
      <body className={inter.className}>
        {/* Shopify sidebar navigation */}
        <ShopifyNavigation />
        {children}
      </body>
    </html>
  );
}
