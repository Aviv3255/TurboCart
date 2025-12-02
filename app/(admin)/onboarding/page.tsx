/**
 * TurboCart Onboarding - Build Your Perfect Cart
 *
 * Modern block-based setup:
 * 1. Welcome - See all available cart features
 * 2. Choose Features - Select which blocks to enable
 * 3. Quick Setup - Basic configuration for enabled features
 * 4. Enable Theme - Install app block
 * 5. Done - Start selling!
 */

'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { authenticatedFetch } from '@/lib/shopify/authenticated-fetch';

type Step = 'welcome' | 'features' | 'setup' | 'theme' | 'done';

interface FeatureBlock {
  id: string;
  name: string;
  description: string;
  icon: string;
  enabled: boolean;
  color: string;
}

const FEATURE_BLOCKS: FeatureBlock[] = [
  {
    id: 'upsells',
    name: 'Cart Upsells',
    description: 'Show recommended products in the cart to increase order value',
    icon: '🛒',
    enabled: true,
    color: '#6366f1',
  },
  {
    id: 'rewards',
    name: 'Rewards Progress',
    description: 'Motivate customers with free shipping & discount goals',
    icon: '🎁',
    enabled: false,
    color: '#10b981',
  },
  {
    id: 'addons',
    name: 'Quick Add-Ons',
    description: 'One-click add-ons like shipping protection, gift wrap',
    icon: '⚡',
    enabled: false,
    color: '#f59e0b',
  },
  {
    id: 'timer',
    name: 'Urgency Timer',
    description: 'Create urgency with a countdown timer in the cart',
    icon: '⏱️',
    enabled: false,
    color: '#ef4444',
  },
  {
    id: 'announcement',
    name: 'Announcement Bar',
    description: 'Display custom messages and promotions in the cart',
    icon: '📢',
    enabled: false,
    color: '#8b5cf6',
  },
];

const DISPLAY_STYLES = [
  { id: 'carousel', name: 'Carousel', description: 'Swipeable product cards', maxProducts: 10, icon: '↔️' },
  { id: 'grid', name: 'Grid', description: '2-column product grid', maxProducts: 6, icon: '⊞' },
  { id: 'list', name: 'List', description: 'Vertical product list', maxProducts: 5, icon: '☰' },
  { id: 'minimal', name: 'Minimal', description: 'Single featured product', maxProducts: 1, icon: '◻️' },
  { id: 'bundle', name: 'Bundle', description: 'Frequently bought together', maxProducts: 3, icon: '📦' },
];

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>('welcome');
  const [features, setFeatures] = useState<FeatureBlock[]>(FEATURE_BLOCKS);
  const [displayStyle, setDisplayStyle] = useState('carousel');
  const [saving, setSaving] = useState(false);
  const [animating, setAnimating] = useState(false);

  // Check if already onboarded
  useEffect(() => {
    const checkStatus = async () => {
      try {
        const res = await authenticatedFetch('/api/admin/shop/onboarding-status');
        if (res.ok) {
          const data = await res.json();
          if (data.onboardingComplete) {
            router.push('/dashboard');
          }
        }
      } catch (e) {
        console.error('Error checking onboarding status:', e);
      }
    };
    checkStatus();
  }, [router]);

  const toggleFeature = (id: string) => {
    setFeatures(prev => prev.map(f =>
      f.id === id ? { ...f, enabled: !f.enabled } : f
    ));
  };

  const goToStep = (nextStep: Step) => {
    setAnimating(true);
    setTimeout(() => {
      setStep(nextStep);
      setAnimating(false);
    }, 300);
  };

  const completeOnboarding = async () => {
    setSaving(true);
    try {
      // Save feature settings
      const enabledFeatures = features.reduce((acc, f) => {
        acc[f.id] = f.enabled;
        return acc;
      }, {} as Record<string, boolean>);

      await authenticatedFetch('/api/admin/cart-features', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          settings: {
            features: enabledFeatures,
            display_style: displayStyle,
          },
        }),
      });

      // Mark onboarding complete
      await authenticatedFetch('/api/admin/shop/complete-onboarding', {
        method: 'POST',
      });

      goToStep('done');
    } catch (e) {
      console.error('Error completing onboarding:', e);
    } finally {
      setSaving(false);
    }
  };

  const goToDashboard = () => {
    router.push('/dashboard');
  };

  return (
    <div className="onboarding">
      <div className={`onboarding-content ${animating ? 'fade-out' : 'fade-in'}`}>

        {/* Step 1: Welcome */}
        {step === 'welcome' && (
          <div className="step-welcome">
            <div className="welcome-header">
              <div className="logo-badge">TC</div>
              <h1>Welcome to TurboCart</h1>
              <p>Build your perfect converting cart in minutes</p>
            </div>

            <div className="feature-preview">
              <h2>Everything you need to boost cart value</h2>
              <div className="preview-grid">
                {FEATURE_BLOCKS.map(feature => (
                  <div key={feature.id} className="preview-card" style={{ borderColor: feature.color }}>
                    <span className="preview-icon">{feature.icon}</span>
                    <h3>{feature.name}</h3>
                    <p>{feature.description}</p>
                  </div>
                ))}
              </div>
            </div>

            <button className="btn-primary" onClick={() => goToStep('features')}>
              Let&apos;s Get Started
              <span className="arrow">→</span>
            </button>
          </div>
        )}

        {/* Step 2: Choose Features */}
        {step === 'features' && (
          <div className="step-features">
            <div className="step-header">
              <span className="step-number">1</span>
              <div>
                <h1>Choose Your Cart Features</h1>
                <p>Select the features you want to add to your cart</p>
              </div>
            </div>

            <div className="features-grid">
              {features.map(feature => (
                <button
                  key={feature.id}
                  className={`feature-card ${feature.enabled ? 'enabled' : ''}`}
                  onClick={() => toggleFeature(feature.id)}
                  style={{
                    '--feature-color': feature.color,
                    borderColor: feature.enabled ? feature.color : 'transparent',
                  } as React.CSSProperties}
                >
                  <div className="feature-toggle">
                    <div className={`toggle ${feature.enabled ? 'on' : 'off'}`}>
                      {feature.enabled && <span>✓</span>}
                    </div>
                  </div>
                  <span className="feature-icon">{feature.icon}</span>
                  <h3>{feature.name}</h3>
                  <p>{feature.description}</p>
                </button>
              ))}
            </div>

            <div className="step-actions">
              <button className="btn-secondary" onClick={() => goToStep('welcome')}>
                ← Back
              </button>
              <button className="btn-primary" onClick={() => goToStep('setup')}>
                Continue
                <span className="arrow">→</span>
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Quick Setup */}
        {step === 'setup' && (
          <div className="step-setup">
            <div className="step-header">
              <span className="step-number">2</span>
              <div>
                <h1>Quick Setup</h1>
                <p>Choose how upsells appear in your cart</p>
              </div>
            </div>

            <div className="setup-section">
              <h2>Display Style</h2>
              <p className="section-desc">How should product recommendations look?</p>

              <div className="styles-grid">
                {DISPLAY_STYLES.map(style => (
                  <button
                    key={style.id}
                    className={`style-card ${displayStyle === style.id ? 'selected' : ''}`}
                    onClick={() => setDisplayStyle(style.id)}
                  >
                    <span className="style-icon">{style.icon}</span>
                    <h3>{style.name}</h3>
                    <p>{style.description}</p>
                    <span className="max-products">Up to {style.maxProducts} products</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="setup-note">
              <span className="note-icon">💡</span>
              <p>You can configure each feature in detail after setup. Don&apos;t worry about getting everything perfect now!</p>
            </div>

            <div className="step-actions">
              <button className="btn-secondary" onClick={() => goToStep('features')}>
                ← Back
              </button>
              <button className="btn-primary" onClick={() => goToStep('theme')}>
                Continue
                <span className="arrow">→</span>
              </button>
            </div>
          </div>
        )}

        {/* Step 4: Enable Theme */}
        {step === 'theme' && (
          <div className="step-theme">
            <div className="step-header">
              <span className="step-number">3</span>
              <div>
                <h1>Enable in Your Theme</h1>
                <p>One final step to go live</p>
              </div>
            </div>

            <div className="theme-instructions">
              <div className="instruction-card">
                <div className="instruction-number">1</div>
                <div className="instruction-content">
                  <h3>Open Theme Editor</h3>
                  <p>Click the button below to open your theme customizer</p>
                </div>
              </div>

              <div className="instruction-card">
                <div className="instruction-number">2</div>
                <div className="instruction-content">
                  <h3>Go to Cart Page/Drawer</h3>
                  <p>Navigate to your cart template in the theme editor</p>
                </div>
              </div>

              <div className="instruction-card">
                <div className="instruction-number">3</div>
                <div className="instruction-content">
                  <h3>Add TurboCart Block</h3>
                  <p>Click &quot;Add block&quot; and select &quot;TurboCart Upsells&quot;</p>
                </div>
              </div>

              <div className="instruction-card">
                <div className="instruction-number">4</div>
                <div className="instruction-content">
                  <h3>Save Changes</h3>
                  <p>Click Save in the theme editor</p>
                </div>
              </div>
            </div>

            <a
              href={`https://admin.shopify.com/store/themes/current/editor?context=apps`}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-theme-editor"
            >
              Open Theme Editor
              <span className="external-icon">↗</span>
            </a>

            <div className="step-actions">
              <button className="btn-secondary" onClick={() => goToStep('setup')}>
                ← Back
              </button>
              <button
                className="btn-primary"
                onClick={completeOnboarding}
                disabled={saving}
              >
                {saving ? 'Saving...' : 'Complete Setup'}
                {!saving && <span className="arrow">→</span>}
              </button>
            </div>
          </div>
        )}

        {/* Step 5: Done */}
        {step === 'done' && (
          <div className="step-done">
            <div className="success-animation">
              <div className="success-circle">
                <span className="checkmark">✓</span>
              </div>
            </div>

            <h1>You&apos;re All Set! 🎉</h1>
            <p>TurboCart is now active on your store</p>

            <div className="next-steps">
              <h2>What&apos;s Next?</h2>
              <div className="next-steps-grid">
                <div className="next-step-card">
                  <span className="next-icon">🛒</span>
                  <h3>Add Upsell Products</h3>
                  <p>Select which products to recommend in the cart</p>
                </div>
                <div className="next-step-card">
                  <span className="next-icon">⚙️</span>
                  <h3>Customize Features</h3>
                  <p>Fine-tune each feature from the dashboard</p>
                </div>
                <div className="next-step-card">
                  <span className="next-icon">📊</span>
                  <h3>Track Performance</h3>
                  <p>Monitor conversions and revenue impact</p>
                </div>
              </div>
            </div>

            <button className="btn-primary large" onClick={goToDashboard}>
              Go to Dashboard
              <span className="arrow">→</span>
            </button>
          </div>
        )}
      </div>

      <style jsx>{`
        .onboarding {
          min-height: 100vh;
          background: linear-gradient(135deg, #0f0f1a 0%, #1a1a2e 50%, #16213e 100%);
          padding: 40px 20px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .onboarding-content {
          max-width: 900px;
          width: 100%;
          transition: opacity 0.3s ease, transform 0.3s ease;
        }

        .fade-out {
          opacity: 0;
          transform: translateY(10px);
        }

        .fade-in {
          opacity: 1;
          transform: translateY(0);
        }

        /* Welcome Step */
        .step-welcome {
          text-align: center;
        }

        .welcome-header {
          margin-bottom: 48px;
        }

        .logo-badge {
          width: 80px;
          height: 80px;
          background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
          border-radius: 20px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 32px;
          font-weight: 700;
          color: white;
          margin: 0 auto 24px;
          box-shadow: 0 20px 40px rgba(99, 102, 241, 0.3);
        }

        .welcome-header h1 {
          font-size: 42px;
          font-weight: 700;
          color: white;
          margin: 0 0 12px;
        }

        .welcome-header p {
          font-size: 18px;
          color: rgba(255, 255, 255, 0.6);
          margin: 0;
        }

        .feature-preview h2 {
          font-size: 20px;
          font-weight: 600;
          color: rgba(255, 255, 255, 0.8);
          margin: 0 0 24px;
        }

        .preview-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
          gap: 16px;
          margin-bottom: 40px;
        }

        .preview-card {
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 16px;
          padding: 20px;
          text-align: center;
          border-left: 3px solid;
        }

        .preview-icon {
          font-size: 32px;
          display: block;
          margin-bottom: 12px;
        }

        .preview-card h3 {
          font-size: 14px;
          font-weight: 600;
          color: white;
          margin: 0 0 6px;
        }

        .preview-card p {
          font-size: 12px;
          color: rgba(255, 255, 255, 0.5);
          margin: 0;
          line-height: 1.4;
        }

        /* Features Step */
        .step-header {
          display: flex;
          align-items: center;
          gap: 16px;
          margin-bottom: 32px;
        }

        .step-number {
          width: 48px;
          height: 48px;
          background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 20px;
          font-weight: 700;
          color: white;
        }

        .step-header h1 {
          font-size: 28px;
          font-weight: 700;
          color: white;
          margin: 0 0 4px;
        }

        .step-header p {
          font-size: 15px;
          color: rgba(255, 255, 255, 0.6);
          margin: 0;
        }

        .features-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
          gap: 16px;
          margin-bottom: 32px;
        }

        .feature-card {
          background: rgba(255, 255, 255, 0.03);
          border: 2px solid rgba(255, 255, 255, 0.1);
          border-radius: 16px;
          padding: 24px;
          text-align: left;
          cursor: pointer;
          transition: all 0.2s ease;
          position: relative;
        }

        .feature-card:hover {
          background: rgba(255, 255, 255, 0.06);
          transform: translateY(-2px);
        }

        .feature-card.enabled {
          background: rgba(var(--feature-color), 0.1);
        }

        .feature-toggle {
          position: absolute;
          top: 16px;
          right: 16px;
        }

        .toggle {
          width: 24px;
          height: 24px;
          border: 2px solid rgba(255, 255, 255, 0.3);
          border-radius: 6px;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.2s ease;
        }

        .toggle.on {
          background: #10b981;
          border-color: #10b981;
          color: white;
          font-size: 14px;
        }

        .feature-icon {
          font-size: 36px;
          display: block;
          margin-bottom: 12px;
        }

        .feature-card h3 {
          font-size: 16px;
          font-weight: 600;
          color: white;
          margin: 0 0 8px;
        }

        .feature-card p {
          font-size: 13px;
          color: rgba(255, 255, 255, 0.5);
          margin: 0;
          line-height: 1.5;
        }

        /* Setup Step */
        .setup-section {
          margin-bottom: 32px;
        }

        .setup-section h2 {
          font-size: 18px;
          font-weight: 600;
          color: white;
          margin: 0 0 4px;
        }

        .section-desc {
          font-size: 14px;
          color: rgba(255, 255, 255, 0.5);
          margin: 0 0 20px;
        }

        .styles-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
          gap: 12px;
        }

        .style-card {
          background: rgba(255, 255, 255, 0.03);
          border: 2px solid rgba(255, 255, 255, 0.1);
          border-radius: 12px;
          padding: 20px 16px;
          text-align: center;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .style-card:hover {
          background: rgba(255, 255, 255, 0.06);
        }

        .style-card.selected {
          border-color: #6366f1;
          background: rgba(99, 102, 241, 0.1);
        }

        .style-icon {
          font-size: 28px;
          display: block;
          margin-bottom: 8px;
        }

        .style-card h3 {
          font-size: 14px;
          font-weight: 600;
          color: white;
          margin: 0 0 4px;
        }

        .style-card p {
          font-size: 12px;
          color: rgba(255, 255, 255, 0.5);
          margin: 0 0 8px;
        }

        .max-products {
          font-size: 11px;
          color: rgba(255, 255, 255, 0.4);
          background: rgba(255, 255, 255, 0.1);
          padding: 4px 8px;
          border-radius: 4px;
        }

        .setup-note {
          display: flex;
          align-items: flex-start;
          gap: 12px;
          background: rgba(99, 102, 241, 0.1);
          border: 1px solid rgba(99, 102, 241, 0.2);
          border-radius: 12px;
          padding: 16px;
          margin-bottom: 32px;
        }

        .note-icon {
          font-size: 20px;
        }

        .setup-note p {
          font-size: 13px;
          color: rgba(255, 255, 255, 0.7);
          margin: 0;
          line-height: 1.5;
        }

        /* Theme Step */
        .theme-instructions {
          margin-bottom: 24px;
        }

        .instruction-card {
          display: flex;
          align-items: flex-start;
          gap: 16px;
          background: rgba(255, 255, 255, 0.03);
          border-radius: 12px;
          padding: 20px;
          margin-bottom: 12px;
        }

        .instruction-number {
          width: 32px;
          height: 32px;
          background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 14px;
          font-weight: 700;
          color: white;
          flex-shrink: 0;
        }

        .instruction-content h3 {
          font-size: 15px;
          font-weight: 600;
          color: white;
          margin: 0 0 4px;
        }

        .instruction-content p {
          font-size: 13px;
          color: rgba(255, 255, 255, 0.5);
          margin: 0;
        }

        .btn-theme-editor {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          background: white;
          color: #1a1a2e;
          padding: 14px 28px;
          border-radius: 12px;
          font-size: 15px;
          font-weight: 600;
          text-decoration: none;
          margin-bottom: 24px;
          transition: all 0.2s ease;
        }

        .btn-theme-editor:hover {
          transform: translateY(-2px);
          box-shadow: 0 10px 30px rgba(255, 255, 255, 0.2);
        }

        .external-icon {
          font-size: 18px;
        }

        /* Done Step */
        .step-done {
          text-align: center;
        }

        .success-animation {
          margin-bottom: 32px;
        }

        .success-circle {
          width: 100px;
          height: 100px;
          background: linear-gradient(135deg, #10b981 0%, #059669 100%);
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          margin: 0 auto;
          animation: scaleIn 0.5s ease;
          box-shadow: 0 20px 40px rgba(16, 185, 129, 0.3);
        }

        @keyframes scaleIn {
          0% { transform: scale(0); }
          50% { transform: scale(1.1); }
          100% { transform: scale(1); }
        }

        .checkmark {
          font-size: 48px;
          color: white;
        }

        .step-done h1 {
          font-size: 36px;
          font-weight: 700;
          color: white;
          margin: 0 0 8px;
        }

        .step-done > p {
          font-size: 16px;
          color: rgba(255, 255, 255, 0.6);
          margin: 0 0 40px;
        }

        .next-steps h2 {
          font-size: 18px;
          font-weight: 600;
          color: rgba(255, 255, 255, 0.8);
          margin: 0 0 20px;
        }

        .next-steps-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 16px;
          margin-bottom: 40px;
        }

        .next-step-card {
          background: rgba(255, 255, 255, 0.05);
          border-radius: 16px;
          padding: 24px 20px;
        }

        .next-icon {
          font-size: 32px;
          display: block;
          margin-bottom: 12px;
        }

        .next-step-card h3 {
          font-size: 14px;
          font-weight: 600;
          color: white;
          margin: 0 0 6px;
        }

        .next-step-card p {
          font-size: 12px;
          color: rgba(255, 255, 255, 0.5);
          margin: 0;
        }

        /* Buttons */
        .step-actions {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .btn-primary {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
          color: white;
          padding: 14px 28px;
          border: none;
          border-radius: 12px;
          font-size: 15px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .btn-primary:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 10px 30px rgba(99, 102, 241, 0.3);
        }

        .btn-primary:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .btn-primary.large {
          padding: 18px 40px;
          font-size: 17px;
        }

        .btn-secondary {
          background: transparent;
          color: rgba(255, 255, 255, 0.6);
          padding: 14px 24px;
          border: 1px solid rgba(255, 255, 255, 0.2);
          border-radius: 12px;
          font-size: 15px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .btn-secondary:hover {
          background: rgba(255, 255, 255, 0.05);
          color: white;
        }

        .arrow {
          font-size: 18px;
        }

        /* Responsive */
        @media (max-width: 640px) {
          .welcome-header h1 {
            font-size: 32px;
          }

          .preview-grid {
            grid-template-columns: 1fr 1fr;
          }

          .next-steps-grid {
            grid-template-columns: 1fr;
          }

          .step-actions {
            flex-direction: column-reverse;
            gap: 12px;
          }

          .btn-secondary, .btn-primary {
            width: 100%;
            justify-content: center;
          }
        }
      `}</style>
    </div>
  );
}
