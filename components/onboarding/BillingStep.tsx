/**
 * Onboarding Step 4: Billing & Plan Selection
 */

'use client';

import { Card, Button, Badge } from '@shopify/polaris';
import { PRICING_TIERS, formatPrice, type PricingTier } from '@/lib/pricing';

interface BillingStepProps {
  selectedPlan: string | null;
  onSelectPlan: (planId: string | null) => void;
  onNext: () => void;
  onSkip: () => void;
}

export default function BillingStep({
  selectedPlan,
  onSelectPlan,
  onNext,
  onSkip,
}: BillingStepProps) {
  const handlePlanSelect = (planId: string) => {
    onSelectPlan(planId);
  };

  return (
    <div>
      <Card>
        <div style={{ padding: '24px', textAlign: 'center' }}>
          <h2 style={{ fontSize: '20px', fontWeight: '700', marginBottom: '8px' }}>
            Choose Your Plan
          </h2>
          <p style={{ fontSize: '14px', color: 'var(--text-secondary)', marginBottom: '8px' }}>
            Start with a 14-day free trial. No credit card required.
          </p>
          <p style={{ fontSize: '13px', color: 'var(--text-tertiary)' }}>
            You can change or cancel your plan anytime
          </p>
        </div>
      </Card>

      {/* Plans Grid */}
      <div style={{ marginTop: '20px' }}>
        <div className="plans-grid">
          {PRICING_TIERS.slice(0, 3).map((tier) => {
            const isSelected = selectedPlan === tier.id;

            return (
              <Card key={tier.id}>
                <div
                  className={`plan-card ${tier.popular ? 'popular' : ''} ${isSelected ? 'selected' : ''}`}
                  onClick={() => handlePlanSelect(tier.id)}
                >
                  {tier.popular && (
                    <div className="popular-badge">
                      <Badge tone="success">Most Popular</Badge>
                    </div>
                  )}

                  <div className="plan-header">
                    <h3 className="plan-name">{tier.name}</h3>
                    <p className="plan-orders">{tier.monthlyOrders} orders/month</p>
                  </div>

                  <div className="plan-price">
                    <span className="price-amount">{formatPrice(tier.monthlyPrice)}</span>
                    <span className="price-period">/month</span>
                  </div>

                  <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '20px' }}>
                    After 14-day free trial
                  </p>

                  <div className="plan-features">
                    <ul>
                      {tier.features.slice(0, 4).map((feature, idx) => (
                        <li key={idx}>{feature}</li>
                      ))}
                    </ul>
                  </div>

                  <Button
                    fullWidth
                    variant={isSelected ? 'primary' : undefined}
                    onClick={() => handlePlanSelect(tier.id)}
                  >
                    {isSelected ? 'Selected' : 'Select Plan'}
                  </Button>
                </div>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Skip Option */}
      <div style={{ marginTop: '20px' }}>
        <Card>
          <div style={{ padding: '16px', textAlign: 'center' }}>
            <p style={{ fontSize: '14px', color: 'var(--text-secondary)', marginBottom: '12px' }}>
              Not sure yet? You can choose a plan later from the Billing page.
            </p>
            <Button onClick={onSkip}>
              Skip for Now
            </Button>
          </div>
        </Card>
      </div>

      <style jsx>{`
        .plans-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 20px;
        }

        .plan-card {
          padding: 24px;
          cursor: pointer;
          transition: all 0.2s ease;
          position: relative;
          border: 2px solid transparent;
          border-radius: 12px;
        }

        .plan-card:hover {
          border-color: var(--cosmic-from);
          box-shadow: var(--shadow-cosmic);
        }

        .plan-card.popular {
          border-color: var(--cosmic-from);
          background: linear-gradient(135deg, rgba(102, 126, 234, 0.05) 0%, transparent 100%);
        }

        .plan-card.selected {
          border-color: var(--cosmic-from);
          background: linear-gradient(135deg, rgba(102, 126, 234, 0.1) 0%, transparent 100%);
        }

        .popular-badge {
          position: absolute;
          top: -12px;
          left: 50%;
          transform: translateX(-50%);
        }

        .plan-header {
          margin-bottom: 16px;
          text-align: center;
        }

        .plan-name {
          font-size: 20px;
          font-weight: 700;
          color: var(--text-primary);
          margin: 0 0 4px 0;
        }

        .plan-orders {
          font-size: 13px;
          color: var(--text-secondary);
          margin: 0;
        }

        .plan-price {
          text-align: center;
          margin-bottom: 8px;
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

        .plan-features ul {
          list-style: none;
          padding: 0;
          margin: 0 0 20px 0;
          text-align: left;
        }

        .plan-features li {
          font-size: 14px;
          color: var(--text-secondary);
          margin-bottom: 8px;
          padding-left: 20px;
          position: relative;
        }

        .plan-features li:before {
          content: '✓';
          position: absolute;
          left: 0;
          color: var(--cosmic-from);
          font-weight: 700;
        }

        @media (max-width: 768px) {
          .plans-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  );
}
