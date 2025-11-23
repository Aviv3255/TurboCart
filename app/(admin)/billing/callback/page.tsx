/**
 * Billing Callback Page
 * Handles redirect after merchant approves subscription
 */

'use client';

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Page, Banner, Spinner } from '@shopify/polaris';

function BillingCallbackContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    handleCallback();
  }, []);

  const handleCallback = async () => {
    try {
      const charge_id = searchParams.get('charge_id');

      if (!charge_id) {
        setError('Missing charge_id parameter');
        return;
      }

      // Wait a moment for Shopify to process the charge
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Redirect to dashboard
      router.push('/dashboard?billing=success');
    } catch (err) {
      console.error('Billing callback error:', err);
      setError('Failed to activate subscription. Please contact support.');
    }
  };

  if (error) {
    return (
      <Page title="Billing">
        <Banner tone="critical" title="Subscription Error">
          <p>{error}</p>
        </Banner>
      </Page>
    );
  }

  return (
    <Page title="Activating Subscription">
      <div style={{ padding: '60px', textAlign: 'center' }}>
        <Spinner size="large" />
        <p style={{ marginTop: '16px' }}>Activating your subscription...</p>
      </div>
    </Page>
  );
}

export default function BillingCallbackPage() {
  return (
    <Suspense fallback={
      <Page title="Loading">
        <div style={{ padding: '60px', textAlign: 'center' }}>
          <Spinner size="large" />
        </div>
      </Page>
    }>
      <BillingCallbackContent />
    </Suspense>
  );
}
