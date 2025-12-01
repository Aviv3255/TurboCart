/**
 * Onboarding Step 5: Setup Complete
 */

'use client';

import { Card, Button } from '@shopify/polaris';

interface CompleteStepProps {
  data: {
    selectedProducts: string[];
    displayStyle: string;
    maxUpsells: number;
    selectedPlan: string | null;
  };
  onComplete: () => void;
  loading: boolean;
}

export default function CompleteStep({ data, onComplete, loading }: CompleteStepProps) {
  return (
    <Card>
      <div style={{ padding: '60px 40px', textAlign: 'center' }}>
        {/* Success Icon */}
        <div style={{ marginBottom: '24px' }}>
          <div
            style={{
              width: '80px',
              height: '80px',
              margin: '0 auto',
              background: 'var(--cosmic-gradient)',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '40px',
              boxShadow: 'var(--shadow-cosmic)',
            }}
          >
            ✓
          </div>
        </div>

        {/* Title */}
        <h1 style={{ fontSize: '28px', fontWeight: '700', marginBottom: '12px', color: 'var(--text-primary)' }}>
          You&apos;re All Set!
        </h1>

        <p style={{ fontSize: '16px', color: 'var(--text-secondary)', marginBottom: '32px', maxWidth: '500px', margin: '0 auto 32px' }}>
          Your TurboCart is configured and ready to boost your sales with AI-powered upsells.
        </p>

        {/* Setup Summary */}
        <div style={{ maxWidth: '600px', margin: '0 auto 40px', textAlign: 'left' }}>
          <div className="setup-summary">
            <div className="summary-item">
              <div className="summary-icon">📦</div>
              <div>
                <div className="summary-label">Products Selected</div>
                <div className="summary-value">{data.selectedProducts.length} products</div>
              </div>
            </div>

            <div className="summary-item">
              <div className="summary-icon">🎨</div>
              <div>
                <div className="summary-label">Display Style</div>
                <div className="summary-value">
                  {data.displayStyle.charAt(0).toUpperCase() + data.displayStyle.slice(1)}
                </div>
              </div>
            </div>

            <div className="summary-item">
              <div className="summary-icon">📊</div>
              <div>
                <div className="summary-label">Maximum Upsells</div>
                <div className="summary-value">{data.maxUpsells} products</div>
              </div>
            </div>

            {data.selectedPlan && (
              <div className="summary-item">
                <div className="summary-icon">💳</div>
                <div>
                  <div className="summary-label">Plan Selected</div>
                  <div className="summary-value">
                    {data.selectedPlan.charAt(0).toUpperCase() + data.selectedPlan.slice(1)}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Next Steps */}
        <div style={{ maxWidth: '600px', margin: '0 auto 40px', padding: '20px', background: 'var(--bg-secondary)', borderRadius: '12px', textAlign: 'left' }}>
          <h3 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '12px' }}>
            What happens next?
          </h3>
          <ul style={{ paddingLeft: '20px', fontSize: '14px', color: 'var(--text-secondary)', margin: 0, lineHeight: '1.8' }}>
            <li>Your upsells are now live on your cart page</li>
            <li>AI will learn from customer behavior to optimize recommendations</li>
            <li>Track performance in the Analytics dashboard</li>
            <li>Your 14-day free trial starts today</li>
          </ul>
        </div>

        {/* CTA */}
        <Button
          variant="primary"
          size="large"
          onClick={onComplete}
          loading={loading}
        >
          Go to Dashboard
        </Button>

        <p style={{ fontSize: '13px', color: 'var(--text-tertiary)', marginTop: '24px' }}>
          Need help? Check out our documentation or contact support
        </p>
      </div>

      <style jsx>{`
        .setup-summary {
          display: grid;
          gap: 20px;
        }

        .summary-item {
          display: flex;
          gap: 16px;
          align-items: center;
          padding: 16px;
          background: white;
          border: 1px solid var(--border-color);
          border-radius: 8px;
        }

        .summary-icon {
          font-size: 28px;
          flex-shrink: 0;
        }

        .summary-label {
          font-size: 13px;
          color: var(--text-secondary);
          margin-bottom: 2px;
        }

        .summary-value {
          font-size: 16px;
          font-weight: 600;
          color: var(--text-primary);
        }
      `}</style>
    </Card>
  );
}
