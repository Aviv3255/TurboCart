/**
 * Admin Dashboard Page
 * Main overview with key metrics and quick actions
 */

'use client';

import { Card } from '@shopify/polaris';

export default function DashboardPage() {
  return (
    <div className="dashboard-page">
      {/* Welcome Section */}
      <div className="welcome-section">
        <h1 className="welcome-title">Welcome to TurboCart</h1>
        <p className="welcome-subtitle">
          Your AI-powered upsell engine is ready to boost your sales
        </p>
      </div>

      {/* Quick Stats */}
      <div className="stats-grid">
        <div className="stat-card card-cosmic">
          <div className="stat-label">Total Revenue</div>
          <div className="stat-value">$0.00</div>
          <div className="stat-change positive">+0% from last month</div>
        </div>

        <div className="stat-card card-cosmic">
          <div className="stat-label">AOV Increase</div>
          <div className="stat-value">0%</div>
          <div className="stat-change">No data yet</div>
        </div>

        <div className="stat-card card-cosmic">
          <div className="stat-label">Acceptance Rate</div>
          <div className="stat-value">0%</div>
          <div className="stat-change">No data yet</div>
        </div>

        <div className="stat-card card-cosmic">
          <div className="stat-label">Active Upsells</div>
          <div className="stat-value">0</div>
          <div className="stat-change">Get started below</div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="actions-section">
        <h2 className="section-title">Quick Start</h2>
        <div className="actions-grid">
          <Card>
            <div className="action-card">
              <div className="action-icon">📦</div>
              <h3 className="action-title">Select Products</h3>
              <p className="action-description">
                Choose 10-50 products to start upselling
              </p>
              <button className="btn-primary action-button">
                Select Products
              </button>
            </div>
          </Card>

          <Card>
            <div className="action-card">
              <div className="action-icon">🎨</div>
              <h3 className="action-title">Choose Display Style</h3>
              <p className="action-description">
                Pick from 5 beautiful upsell designs
              </p>
              <button className="btn-secondary action-button">
                View Styles
              </button>
            </div>
          </Card>

          <Card>
            <div className="action-card">
              <div className="action-icon">📊</div>
              <h3 className="action-title">View Analytics</h3>
              <p className="action-description">
                Track performance and ROI in real-time
              </p>
              <button className="btn-secondary action-button">
                Open Analytics
              </button>
            </div>
          </Card>
        </div>
      </div>

      {/* Getting Started Guide */}
      <div className="guide-section">
        <Card>
          <div className="guide-content">
            <h2 className="guide-title">Getting Started with TurboCart</h2>
            <div className="guide-steps">
              <div className="guide-step">
                <div className="step-number">1</div>
                <div className="step-content">
                  <h3 className="step-title">Select Products</h3>
                  <p className="step-description">
                    Choose 10-50 products from your catalog that you want to upsell
                  </p>
                </div>
              </div>

              <div className="guide-step">
                <div className="step-number">2</div>
                <div className="step-content">
                  <h3 className="step-title">Choose Display Style</h3>
                  <p className="step-description">
                    Select from 5 clean, minimal designs that match your theme
                  </p>
                </div>
              </div>

              <div className="guide-step">
                <div className="step-number">3</div>
                <div className="step-content">
                  <h3 className="step-title">Enable in Theme</h3>
                  <p className="step-description">
                    Add the TurboCart app block to your cart page or drawer
                  </p>
                </div>
              </div>

              <div className="guide-step">
                <div className="step-number">4</div>
                <div className="step-content">
                  <h3 className="step-title">Let AI Optimize</h3>
                  <p className="step-description">
                    Our AI will automatically test and optimize for maximum revenue
                  </p>
                </div>
              </div>
            </div>
          </div>
        </Card>
      </div>

      <style jsx>{`
        .dashboard-page {
          display: flex;
          flex-direction: column;
          gap: var(--spacing-xl);
        }

        /* Welcome Section */
        .welcome-section {
          margin-bottom: var(--spacing-md);
        }

        .welcome-title {
          font-size: 28px;
          font-weight: 700;
          color: var(--text-primary);
          margin: 0 0 var(--spacing-sm) 0;
        }

        .welcome-subtitle {
          font-size: 16px;
          color: var(--text-secondary);
          margin: 0;
        }

        /* Stats Grid */
        .stats-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
          gap: var(--spacing-lg);
        }

        .stat-card {
          background: var(--bg-primary);
          border: 1px solid var(--border-color);
          border-radius: var(--radius-xl);
          padding: var(--spacing-lg);
          position: relative;
          overflow: hidden;
        }

        .stat-card::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          height: 4px;
          background: var(--cosmic-gradient);
        }

        .stat-label {
          font-size: 14px;
          color: var(--text-secondary);
          margin-bottom: var(--spacing-sm);
          font-weight: 600;
        }

        .stat-value {
          font-size: 32px;
          font-weight: 700;
          color: var(--text-primary);
          margin-bottom: var(--spacing-xs);
        }

        .stat-change {
          font-size: 12px;
          color: var(--text-tertiary);
        }

        .stat-change.positive {
          color: var(--success);
        }

        /* Actions Section */
        .section-title {
          font-size: 20px;
          font-weight: 700;
          color: var(--text-primary);
          margin: 0 0 var(--spacing-lg) 0;
        }

        .actions-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
          gap: var(--spacing-lg);
        }

        .action-card {
          padding: var(--spacing-lg);
          text-align: center;
        }

        .action-icon {
          font-size: 48px;
          margin-bottom: var(--spacing-md);
        }

        .action-title {
          font-size: 18px;
          font-weight: 700;
          color: var(--text-primary);
          margin: 0 0 var(--spacing-sm) 0;
        }

        .action-description {
          font-size: 14px;
          color: var(--text-secondary);
          margin: 0 0 var(--spacing-lg) 0;
          line-height: 1.5;
        }

        .action-button {
          width: 100%;
        }

        /* Guide Section */
        .guide-content {
          padding: var(--spacing-lg);
        }

        .guide-title {
          font-size: 20px;
          font-weight: 700;
          color: var(--text-primary);
          margin: 0 0 var(--spacing-xl) 0;
        }

        .guide-steps {
          display: flex;
          flex-direction: column;
          gap: var(--spacing-lg);
        }

        .guide-step {
          display: flex;
          gap: var(--spacing-lg);
          align-items: flex-start;
        }

        .step-number {
          width: 40px;
          height: 40px;
          border-radius: 50%;
          background: var(--cosmic-gradient);
          color: white;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 700;
          flex-shrink: 0;
          box-shadow: var(--shadow-cosmic);
        }

        .step-content {
          flex: 1;
        }

        .step-title {
          font-size: 16px;
          font-weight: 600;
          color: var(--text-primary);
          margin: 0 0 var(--spacing-xs) 0;
        }

        .step-description {
          font-size: 14px;
          color: var(--text-secondary);
          margin: 0;
          line-height: 1.5;
        }

        /* Responsive */
        @media (max-width: 768px) {
          .welcome-title {
            font-size: 24px;
          }

          .stats-grid {
            grid-template-columns: 1fr;
          }

          .actions-grid {
            grid-template-columns: 1fr;
          }

          .stat-value {
            font-size: 28px;
          }
        }
      `}</style>
    </div>
  );
}
