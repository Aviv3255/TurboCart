/**
 * Onboarding Step 1: Welcome
 */

'use client';

import { Card, Button, Text } from '@shopify/polaris';

interface WelcomeStepProps {
  onNext: () => void;
}

export default function WelcomeStep({ onNext }: WelcomeStepProps) {
  return (
    <Card>
      <div style={{ padding: '40px', textAlign: 'center' }}>
        {/* Logo */}
        <div style={{ marginBottom: '24px' }}>
          <div
            style={{
              width: '80px',
              height: '80px',
              margin: '0 auto',
              background: 'var(--cosmic-gradient)',
              borderRadius: '16px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'white',
              fontSize: '32px',
              fontWeight: '700',
              boxShadow: 'var(--shadow-cosmic)',
            }}
          >
            TC
          </div>
        </div>

        {/* Welcome Message */}
        <h1 style={{ fontSize: '32px', fontWeight: '700', marginBottom: '16px', color: 'var(--text-primary)' }}>
          Welcome to TurboCart!
        </h1>

        <p style={{ fontSize: '18px', color: 'var(--text-secondary)', marginBottom: '32px', maxWidth: '600px', margin: '0 auto 32px' }}>
          Boost your revenue with AI-powered cart upsells. Let's get you set up in just a few minutes.
        </p>

        {/* Features */}
        <div style={{ maxWidth: '700px', margin: '40px auto', textAlign: 'left' }}>
          <div className="feature-grid">
            <div className="feature-item">
              <div className="feature-icon">🤖</div>
              <div>
                <h3 className="feature-title">AI Recommendations</h3>
                <p className="feature-description">
                  Smart product suggestions based on cart contents and purchase history
                </p>
              </div>
            </div>

            <div className="feature-item">
              <div className="feature-icon">📊</div>
              <div>
                <h3 className="feature-title">Advanced Analytics</h3>
                <p className="feature-description">
                  Track performance, revenue, and conversion rates in real-time
                </p>
              </div>
            </div>

            <div className="feature-item">
              <div className="feature-icon">🎨</div>
              <div>
                <h3 className="feature-title">5 Display Styles</h3>
                <p className="feature-description">
                  Choose from carousel, list, banner, cards, or frequently-bought layouts
                </p>
              </div>
            </div>

            <div className="feature-item">
              <div className="feature-icon">🧪</div>
              <div>
                <h3 className="feature-title">A/B Testing</h3>
                <p className="feature-description">
                  Automatically optimize product combinations for maximum revenue
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* CTA */}
        <div style={{ marginTop: '40px' }}>
          <Button variant="primary" size="large" onClick={onNext}>
            Get Started
          </Button>
        </div>

        <p style={{ fontSize: '13px', color: 'var(--text-tertiary)', marginTop: '24px' }}>
          Setup takes less than 5 minutes • 14-day free trial included
        </p>
      </div>

      <style jsx>{`
        .feature-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 24px;
        }

        .feature-item {
          display: flex;
          gap: 16px;
          text-align: left;
        }

        .feature-icon {
          font-size: 32px;
          flex-shrink: 0;
        }

        .feature-title {
          font-size: 16px;
          font-weight: 600;
          color: var(--text-primary);
          margin: 0 0 4px 0;
        }

        .feature-description {
          font-size: 14px;
          color: var(--text-secondary);
          margin: 0;
          line-height: 1.5;
        }

        @media (max-width: 768px) {
          .feature-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </Card>
  );
}
