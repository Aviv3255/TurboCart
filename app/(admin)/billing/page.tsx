/**
 * Billing Management Page
 * View and manage subscription plans
 */

'use client';

import { useState, useEffect } from 'react';
import { Page, Card, Button, Badge, Text, Banner, Spinner } from '@shopify/polaris';
import { PRICING_TIERS, formatPrice, type PricingTier } from '@/lib/pricing';
import { authenticatedFetch } from '@/lib/shopify/authenticated-fetch';

interface BillingStatus {
  status: string;
  plan: string | null;
  planName: string | null;
  price: number;
  trial: boolean;
  trialDaysRemaining: number;
  billingOn?: string;
  test?: boolean;
}

export default function BillingPage() {
  const [billingStatus, setBillingStatus] = useState<BillingStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [subscribing, setSubscribing] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);

  useEffect(() => {
    fetchBillingStatus();
  }, []);

  const fetchBillingStatus = async () => {
    try {
      setLoading(true);
      const response = await authenticatedFetch('/api/admin/billing');

      if (!response.ok) {
        throw new Error('Failed to fetch billing status');
      }

      const data = await response.json();
      setBillingStatus(data);
    } catch (error) {
      console.error('Error fetching billing status:', error);
      alert('Failed to load billing information');
    } finally {
      setLoading(false);
    }
  };

  const handleSubscribe = async (planId: string, annual: boolean = false) => {
    try {
      setSubscribing(true);
      setSelectedPlan(planId);

      const response = await authenticatedFetch('/api/admin/billing/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ planId, annual }),
      });

      if (!response.ok) {
        throw new Error('Failed to create subscription');
      }

      const data = await response.json();

      // Redirect to Shopify confirmation URL
      if (data.confirmationUrl) {
        window.location.href = data.confirmationUrl;
      }
    } catch (error) {
      console.error('Error creating subscription:', error);
      alert('Failed to create subscription. Please try again.');
      setSubscribing(false);
      setSelectedPlan(null);
    }
  };

  const handleCancelSubscription = async () => {
    if (!confirm('Are you sure you want to cancel your subscription?')) {
      return;
    }

    try {
      const response = await authenticatedFetch('/api/admin/billing/cancel', {
        method: 'POST',
      });

      if (!response.ok) {
        throw new Error('Failed to cancel subscription');
      }

      alert('Subscription cancelled successfully');
      fetchBillingStatus();
    } catch (error) {
      console.error('Error cancelling subscription:', error);
      alert('Failed to cancel subscription. Please try again.');
    }
  };

  if (loading) {
    return (
      <Page title="Billing">
        <div style={{ padding: '60px', textAlign: 'center' }}>
          <Spinner size="large" />
          <p style={{ marginTop: '16px' }}>Loading billing information...</p>
        </div>
      </Page>
    );
  }

  const currentPlan = billingStatus?.plan
    ? PRICING_TIERS.find(t => t.id === billingStatus.plan)
    : null;

  return (
    <Page
      title="Billing & Subscription"
      subtitle="Manage your TurboCart subscription"
    >
      {/* Current Plan Status */}
      {billingStatus?.status !== 'no_subscription' && currentPlan && (
        <div style={{ marginBottom: '20px' }}>
          <Card>
            <div style={{ padding: '24px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <h2 style={{ fontSize: '18px', fontWeight: '700', marginBottom: '8px' }}>
                    Current Plan: {currentPlan.name}
                  </h2>
                  <p style={{ fontSize: '24px', fontWeight: '700', color: 'var(--cosmic-from)', marginTop: '8px' }}>
                    {formatPrice(billingStatus?.price || 0)}/month
                  </p>
                  {billingStatus?.trial && (
                    <div style={{ marginTop: '12px' }}>
                      <Badge tone="info">
                        {`Trial - ${billingStatus?.trialDaysRemaining || 0} days remaining`}
                      </Badge>
                    </div>
                  )}
                  {billingStatus?.test && (
                    <div style={{ marginTop: '8px' }}>
                      <Badge tone="warning">Test Mode</Badge>
                    </div>
                  )}
                </div>
                <Button onClick={handleCancelSubscription} tone="critical">
                  Cancel Subscription
                </Button>
              </div>

              <div style={{ marginTop: '20px', paddingTop: '20px', borderTop: '1px solid var(--border-color)' }}>
                <h3 style={{ fontSize: '14px', fontWeight: '600', marginBottom: '12px' }}>
                  Plan Features
                </h3>
                <ul style={{ paddingLeft: '20px', color: 'var(--text-secondary)' }}>
                  {currentPlan.features.map((feature, idx) => (
                    <li key={idx} style={{ marginBottom: '4px' }}>
                      {feature}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* Trial Banner */}
      {billingStatus?.status === 'no_subscription' && (
        <div style={{ marginBottom: '20px' }}>
          <Banner tone="info" title="Start Your Free Trial">
            <p>Choose a plan below to start your 14-day free trial. No credit card required!</p>
          </Banner>
        </div>
      )}

      {/* Available Plans */}
      <Card>
        <div style={{ padding: '24px' }}>
          <h2 style={{ fontSize: '18px', fontWeight: '700', marginBottom: '16px' }}>
            Available Plans
          </h2>

          <div className="pricing-grid">
            {PRICING_TIERS.map((tier) => {
              const isCurrent = currentPlan?.id === tier.id;
              const isSubscribing = subscribing && selectedPlan === tier.id;

              return (
                <div
                  key={tier.id}
                  className={`pricing-card ${tier.popular ? 'popular' : ''} ${isCurrent ? 'current' : ''}`}
                >
                  {tier.popular && (
                    <div className="popular-badge">
                      <Badge tone="success">Most Popular</Badge>
                    </div>
                  )}

                  <div className="pricing-header">
                    <h3 className="pricing-title">{tier.name}</h3>
                    <p className="pricing-orders">{tier.monthlyOrders} orders/month</p>
                  </div>

                  <div className="pricing-price">
                    <span className="price-amount">{formatPrice(tier.monthlyPrice)}</span>
                    <span className="price-period">/month</span>
                  </div>

                  <div className="pricing-features">
                    <ul>
                      {tier.features.slice(0, 5).map((feature, idx) => (
                        <li key={idx}>{feature}</li>
                      ))}
                    </ul>
                  </div>

                  <div className="pricing-action">
                    {isCurrent ? (
                      <Button fullWidth disabled>
                        Current Plan
                      </Button>
                    ) : (
                      <Button
                        fullWidth
                        variant={tier.popular ? 'primary' : undefined}
                        onClick={() => handleSubscribe(tier.id)}
                        loading={isSubscribing}
                      >
                        {billingStatus?.status === 'no_subscription' ? 'Start Free Trial' : 'Upgrade'}
                      </Button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </Card>

      <style jsx>{`
        .pricing-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
          gap: 20px;
          margin-top: 20px;
        }

        .pricing-card {
          border: 2px solid var(--border-color);
          border-radius: 12px;
          padding: 24px;
          transition: all 0.2s ease;
          position: relative;
        }

        .pricing-card:hover {
          border-color: var(--cosmic-from);
          box-shadow: var(--shadow-cosmic);
        }

        .pricing-card.popular {
          border-color: var(--cosmic-from);
          background: linear-gradient(135deg, rgba(102, 126, 234, 0.05) 0%, transparent 100%);
        }

        .pricing-card.current {
          border-color: var(--cosmic-from);
          background: linear-gradient(135deg, rgba(102, 126, 234, 0.1) 0%, transparent 100%);
        }

        .popular-badge {
          position: absolute;
          top: -12px;
          right: 20px;
        }

        .pricing-header {
          margin-bottom: 16px;
        }

        .pricing-title {
          font-size: 20px;
          font-weight: 700;
          color: var(--text-primary);
          margin: 0 0 4px 0;
        }

        .pricing-orders {
          font-size: 13px;
          color: var(--text-secondary);
          margin: 0;
        }

        .pricing-price {
          margin-bottom: 20px;
          padding-bottom: 20px;
          border-bottom: 1px solid var(--border-color);
        }

        .price-amount {
          font-size: 32px;
          font-weight: 700;
          color: var(--cosmic-from);
        }

        .price-period {
          font-size: 14px;
          color: var(--text-secondary);
        }

        .pricing-features ul {
          list-style: none;
          padding: 0;
          margin: 0 0 20px 0;
        }

        .pricing-features li {
          font-size: 14px;
          color: var(--text-secondary);
          margin-bottom: 8px;
          padding-left: 20px;
          position: relative;
        }

        .pricing-features li:before {
          content: '✓';
          position: absolute;
          left: 0;
          color: var(--cosmic-from);
          font-weight: 700;
        }

        @media (max-width: 768px) {
          .pricing-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </Page>
  );
}
