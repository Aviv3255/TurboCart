/**
 * TurboCart Onboarding Flow
 *
 * 6-Step Professional Setup Wizard:
 * 1. Welcome - Introduction to TurboCart
 * 2. Select Display Styles - Choose 1-3 display styles for A/B testing
 * 3. Select Products - Choose 1-25 upsell products
 * 4. Configure Settings - Fine-tune behavior
 * 5. Enable in Theme - Theme app block installation
 * 6. Live! - Success confirmation & redirect
 *
 * Clean, simple, one step at a time. Apple-style design.
 */

'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { authenticatedFetch } from '@/lib/shopify/authenticated-fetch';

// Types
type OnboardingStep = 1 | 2 | 3 | 4 | 5 | 6;

interface DisplayStyleConfig {
  id: string;
  enabled: boolean;
  priority: number;
}

interface OnboardingData {
  displayStyles: DisplayStyleConfig[];
  selectedProducts: string[];
  settings: {
    position: 'above_cart' | 'below_cart' | 'popup';
    maxProducts: number;
    showPrices: boolean;
    showCompareAt: boolean;
    autoOptimize: boolean;
    mlEnabled: boolean;
  };
  themeEnabled: boolean;
}

const INITIAL_DATA: OnboardingData = {
  displayStyles: [],
  selectedProducts: [],
  settings: {
    position: 'above_cart',
    maxProducts: 3,
    showPrices: true,
    showCompareAt: true,
    autoOptimize: true,
    mlEnabled: true,
  },
  themeEnabled: false,
};

const STEP_CONFIG = [
  { title: 'Welcome', subtitle: 'Let\'s boost your revenue' },
  { title: 'Display Styles', subtitle: 'Choose how upsells appear' },
  { title: 'Select Products', subtitle: 'Pick your best sellers' },
  { title: 'Settings', subtitle: 'Fine-tune your setup' },
  { title: 'Enable in Theme', subtitle: 'Final installation step' },
  { title: 'You\'re Live!', subtitle: 'Start earning more' },
];

export default function OnboardingPage() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState<OnboardingStep>(1);
  const [data, setData] = useState<OnboardingData>(INITIAL_DATA);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const progress = (currentStep / 6) * 100;

  const handleNext = useCallback(() => {
    if (currentStep < 6) {
      setCurrentStep((prev) => (prev + 1) as OnboardingStep);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [currentStep]);

  const handleBack = useCallback(() => {
    if (currentStep > 1) {
      setCurrentStep((prev) => (prev - 1) as OnboardingStep);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [currentStep]);

  const updateData = useCallback((updates: Partial<OnboardingData>) => {
    setData((prev) => ({ ...prev, ...updates }));
  }, []);

  const handleComplete = async () => {
    try {
      setSaving(true);

      // Save all settings
      const responses = await Promise.all([
        fetch('/api/admin/settings', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            settings: {
              enabled_display_styles: data.displayStyles
                .filter(s => s.enabled)
                .sort((a, b) => a.priority - b.priority)
                .map(s => s.id),
              position: data.settings.position,
              max_products: data.settings.maxProducts,
              show_prices: data.settings.showPrices,
              show_compare_at: data.settings.showCompareAt,
              ml_enabled: data.settings.mlEnabled,
              auto_optimize: data.settings.autoOptimize,
              onboarding_complete: true,
            },
          }),
        }),
        fetch('/api/admin/products/selected', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            products: data.selectedProducts,
          }),
        }),
      ]);

      // Check for errors
      for (const response of responses) {
        if (!response.ok) {
          throw new Error('Failed to save settings');
        }
      }

      // Mark onboarding complete
      localStorage.setItem('turbocart_onboarding_complete', 'true');

      // Redirect to dashboard
      setTimeout(() => {
        router.push('/dashboard?welcome=true');
      }, 2000);
    } catch (error) {
      console.error('Error completing onboarding:', error);
      alert('Failed to save settings. Please try again.');
      setSaving(false);
    }
  };

  const canProceed = (): boolean => {
    switch (currentStep) {
      case 1:
        return true;
      case 2:
        return data.displayStyles.filter(s => s.enabled).length >= 1;
      case 3:
        return data.selectedProducts.length >= 1 && data.selectedProducts.length <= 25;
      case 4:
        return true;
      case 5:
        return true;
      case 6:
        return true;
      default:
        return false;
    }
  };

  return (
    <div className="onboarding-container">
      {/* Progress Header */}
      <div className="progress-header">
        <div className="progress-content">
          <div className="progress-info">
            <div className="step-indicator">
              Step {currentStep} of 6
            </div>
            <h1 className="step-title">{STEP_CONFIG[currentStep - 1]?.title}</h1>
            <p className="step-subtitle">{STEP_CONFIG[currentStep - 1]?.subtitle}</p>
          </div>
          <div className="progress-bar-container">
            <div className="progress-bar">
              <div className="progress-fill" style={{ width: `${progress}%` }} />
            </div>
            <div className="progress-steps">
              {[1, 2, 3, 4, 5, 6].map((step) => (
                <div
                  key={step}
                  className={`progress-dot ${step <= currentStep ? 'active' : ''} ${step === currentStep ? 'current' : ''}`}
                />
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Step Content */}
      <div className="step-content">
        {currentStep === 1 && (
          <WelcomeStep onNext={handleNext} />
        )}

        {currentStep === 2 && (
          <DisplayStylesStep
            displayStyles={data.displayStyles}
            onUpdate={(styles) => updateData({ displayStyles: styles })}
            onNext={handleNext}
            onBack={handleBack}
          />
        )}

        {currentStep === 3 && (
          <ProductSelectionStep
            selectedProducts={data.selectedProducts}
            onUpdate={(products) => updateData({ selectedProducts: products })}
            onNext={handleNext}
            onBack={handleBack}
          />
        )}

        {currentStep === 4 && (
          <SettingsStep
            settings={data.settings}
            onUpdate={(settings) => updateData({ settings })}
            onNext={handleNext}
            onBack={handleBack}
          />
        )}

        {currentStep === 5 && (
          <ThemeEnableStep
            onNext={handleNext}
            onBack={handleBack}
            onSkip={handleNext}
          />
        )}

        {currentStep === 6 && (
          <LiveStep
            data={data}
            onComplete={handleComplete}
            saving={saving}
          />
        )}
      </div>

      {/* Navigation Footer */}
      {currentStep >= 2 && currentStep <= 5 && (
        <div className="nav-footer">
          <button className="btn-secondary" onClick={handleBack}>
            Back
          </button>
          <div className="nav-right">
            {currentStep === 5 && (
              <button className="btn-text" onClick={handleNext}>
                Skip for Now
              </button>
            )}
            <button
              className="btn-primary"
              onClick={handleNext}
              disabled={!canProceed()}
            >
              {currentStep === 5 ? 'Continue' : 'Next'}
            </button>
          </div>
        </div>
      )}

      <style jsx>{`
        .onboarding-container {
          min-height: 100vh;
          background: linear-gradient(180deg, #fafafa 0%, #f5f5f7 100%);
        }

        .progress-header {
          background: #fff;
          border-bottom: 1px solid rgba(0, 0, 0, 0.06);
          padding: 32px 24px;
          position: sticky;
          top: 0;
          z-index: 100;
        }

        .progress-content {
          max-width: 800px;
          margin: 0 auto;
        }

        .progress-info {
          text-align: center;
          margin-bottom: 24px;
        }

        .step-indicator {
          font-size: 12px;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 1px;
          color: #667eea;
          margin-bottom: 8px;
        }

        .step-title {
          font-size: 28px;
          font-weight: 700;
          color: #1d1d1f;
          margin: 0 0 4px 0;
          letter-spacing: -0.5px;
        }

        .step-subtitle {
          font-size: 17px;
          color: #86868b;
          margin: 0;
        }

        .progress-bar-container {
          max-width: 400px;
          margin: 0 auto;
        }

        .progress-bar {
          height: 4px;
          background: #e5e5ea;
          border-radius: 2px;
          overflow: hidden;
          margin-bottom: 12px;
        }

        .progress-fill {
          height: 100%;
          background: linear-gradient(90deg, #667eea 0%, #764ba2 100%);
          border-radius: 2px;
          transition: width 0.4s cubic-bezier(0.4, 0, 0.2, 1);
        }

        .progress-steps {
          display: flex;
          justify-content: space-between;
          padding: 0 4px;
        }

        .progress-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: #e5e5ea;
          transition: all 0.3s ease;
        }

        .progress-dot.active {
          background: #667eea;
        }

        .progress-dot.current {
          width: 12px;
          height: 12px;
          margin-top: -2px;
          box-shadow: 0 0 0 4px rgba(102, 126, 234, 0.2);
        }

        .step-content {
          max-width: 800px;
          margin: 0 auto;
          padding: 40px 24px 120px;
        }

        .nav-footer {
          position: fixed;
          bottom: 0;
          left: 0;
          right: 0;
          background: #fff;
          border-top: 1px solid rgba(0, 0, 0, 0.06);
          padding: 16px 24px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          z-index: 100;
        }

        .nav-right {
          display: flex;
          gap: 12px;
          align-items: center;
        }

        .btn-primary {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: #fff;
          border: none;
          padding: 12px 32px;
          border-radius: 12px;
          font-size: 15px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .btn-primary:hover:not(:disabled) {
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
        }

        .btn-primary:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .btn-secondary {
          background: #f5f5f7;
          color: #1d1d1f;
          border: none;
          padding: 12px 24px;
          border-radius: 12px;
          font-size: 15px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .btn-secondary:hover {
          background: #e5e5ea;
        }

        .btn-text {
          background: none;
          border: none;
          color: #86868b;
          font-size: 15px;
          cursor: pointer;
          padding: 12px;
        }

        .btn-text:hover {
          color: #1d1d1f;
        }
      `}</style>
    </div>
  );
}

// ============================================================================
// STEP COMPONENTS
// ============================================================================

/**
 * Step 1: Welcome
 */
function WelcomeStep({ onNext }: { onNext: () => void }) {
  return (
    <div className="welcome-step">
      <div className="logo-container">
        <div className="logo">
          <span className="logo-icon">TC</span>
        </div>
        <div className="logo-glow" />
      </div>

      <h2 className="welcome-title">Welcome to TurboCart</h2>
      <p className="welcome-subtitle">
        The AI-powered upsell engine that automatically increases your average order value.
      </p>

      <div className="features-grid">
        <div className="feature-card">
          <div className="feature-icon">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <path d="M12 2L2 7L12 12L22 7L12 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M2 17L12 22L22 17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M2 12L12 17L22 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <h3>ML Optimization</h3>
          <p>Thompson Sampling algorithm learns what converts best for each cart type</p>
        </div>

        <div className="feature-card">
          <div className="feature-icon">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <path d="M3 9L12 2L21 9V20C21 21.1 20.1 22 19 22H5C3.9 22 3 21.1 3 20V9Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M9 22V12H15V22" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <h3>5+ Display Styles</h3>
          <p>Choose from minimal strips, cards, banners, and more beautiful layouts</p>
        </div>

        <div className="feature-card">
          <div className="feature-icon">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <path d="M18 20V10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M12 20V4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M6 20V14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <h3>Advanced Analytics</h3>
          <p>Track revenue per order, conversion rates, and A/B test results in real-time</p>
        </div>

        <div className="feature-card">
          <div className="feature-icon">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/>
              <path d="M12 6V12L16 14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <h3>5-Minute Setup</h3>
          <p>No code required. Just select products and display styles, then enable</p>
        </div>
      </div>

      <div className="cta-section">
        <button className="cta-button" onClick={onNext}>
          Let's Get Started
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
            <path d="M4 10H16M16 10L11 5M16 10L11 15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
        <p className="cta-note">14-day free trial included</p>
      </div>

      <style jsx>{`
        .welcome-step {
          text-align: center;
        }

        .logo-container {
          position: relative;
          width: 100px;
          height: 100px;
          margin: 0 auto 32px;
        }

        .logo {
          width: 100px;
          height: 100px;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          border-radius: 24px;
          display: flex;
          align-items: center;
          justify-content: center;
          position: relative;
          z-index: 2;
        }

        .logo-icon {
          color: #fff;
          font-size: 36px;
          font-weight: 700;
          letter-spacing: -1px;
        }

        .logo-glow {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          width: 120px;
          height: 120px;
          background: linear-gradient(135deg, rgba(102, 126, 234, 0.3) 0%, rgba(118, 75, 162, 0.3) 100%);
          border-radius: 32px;
          filter: blur(20px);
          z-index: 1;
        }

        .welcome-title {
          font-size: 36px;
          font-weight: 700;
          color: #1d1d1f;
          margin: 0 0 12px 0;
          letter-spacing: -0.5px;
        }

        .welcome-subtitle {
          font-size: 19px;
          color: #86868b;
          margin: 0 auto 48px;
          max-width: 500px;
          line-height: 1.5;
        }

        .features-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 20px;
          margin-bottom: 48px;
        }

        @media (max-width: 640px) {
          .features-grid {
            grid-template-columns: 1fr;
          }
        }

        .feature-card {
          background: #fff;
          border-radius: 16px;
          padding: 24px;
          text-align: left;
          border: 1px solid rgba(0, 0, 0, 0.06);
          transition: all 0.2s ease;
        }

        .feature-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 24px rgba(0, 0, 0, 0.08);
        }

        .feature-icon {
          width: 48px;
          height: 48px;
          background: linear-gradient(135deg, rgba(102, 126, 234, 0.1) 0%, rgba(118, 75, 162, 0.1) 100%);
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #667eea;
          margin-bottom: 16px;
        }

        .feature-card h3 {
          font-size: 17px;
          font-weight: 600;
          color: #1d1d1f;
          margin: 0 0 8px 0;
        }

        .feature-card p {
          font-size: 14px;
          color: #86868b;
          margin: 0;
          line-height: 1.5;
        }

        .cta-section {
          margin-top: 32px;
        }

        .cta-button {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: #fff;
          border: none;
          padding: 16px 40px;
          border-radius: 14px;
          font-size: 17px;
          font-weight: 600;
          cursor: pointer;
          display: inline-flex;
          align-items: center;
          gap: 12px;
          transition: all 0.2s ease;
        }

        .cta-button:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 24px rgba(102, 126, 234, 0.4);
        }

        .cta-note {
          font-size: 13px;
          color: #86868b;
          margin-top: 16px;
        }
      `}</style>
    </div>
  );
}

/**
 * Step 2: Display Styles Selection
 */
interface DisplayStyleConfig {
  id: string;
  enabled: boolean;
  priority: number;
}

const DISPLAY_STYLES = [
  {
    id: 'minimal-strip',
    name: 'Minimal Strip',
    description: 'Clean horizontal row with subtle design',
    recommended: true,
    preview: '/previews/minimal-strip.png',
  },
  {
    id: 'cards',
    name: 'Product Cards',
    description: 'Image-first cards in a scrollable grid',
    recommended: true,
    preview: '/previews/cards.png',
  },
  {
    id: 'frequently-bought',
    name: 'Frequently Bought',
    description: 'Bundle-style "Add both" display',
    recommended: false,
    preview: '/previews/frequently-bought.png',
  },
  {
    id: 'banner',
    name: 'Urgency Banner',
    description: 'High-visibility single product banner',
    recommended: false,
    preview: '/previews/banner.png',
  },
  {
    id: 'list',
    name: 'Simple List',
    description: 'Compact checklist with quick add',
    recommended: false,
    preview: '/previews/list.png',
  },
];

function DisplayStylesStep({
  displayStyles,
  onUpdate,
  onNext,
  onBack,
}: {
  displayStyles: DisplayStyleConfig[];
  onUpdate: (styles: DisplayStyleConfig[]) => void;
  onNext: () => void;
  onBack: () => void;
}) {
  const toggleStyle = (id: string) => {
    const existing = displayStyles.find(s => s.id === id);
    if (existing) {
      onUpdate(displayStyles.filter(s => s.id !== id));
    } else {
      const enabledCount = displayStyles.filter(s => s.enabled).length;
      if (enabledCount < 3) {
        onUpdate([
          ...displayStyles,
          { id, enabled: true, priority: enabledCount + 1 },
        ]);
      }
    }
  };

  const isSelected = (id: string) => displayStyles.some(s => s.id === id);
  const selectedCount = displayStyles.length;

  return (
    <div className="display-styles-step">
      <div className="step-intro">
        <p>Select 1-3 display styles. The ML engine will automatically A/B test them to find what converts best for your store.</p>
      </div>

      <div className="selection-counter">
        <span className={selectedCount >= 1 ? 'valid' : ''}>
          {selectedCount} of 3 selected
        </span>
        {selectedCount < 1 && <span className="hint">Select at least 1</span>}
      </div>

      <div className="styles-grid">
        {DISPLAY_STYLES.map((style) => (
          <div
            key={style.id}
            className={`style-card ${isSelected(style.id) ? 'selected' : ''}`}
            onClick={() => toggleStyle(style.id)}
          >
            <div className="style-preview">
              <div className="preview-placeholder">
                <span>{style.name}</span>
              </div>
            </div>
            <div className="style-info">
              <div className="style-header">
                <h3>{style.name}</h3>
                {style.recommended && <span className="badge">Recommended</span>}
              </div>
              <p>{style.description}</p>
            </div>
            <div className="checkbox">
              {isSelected(style.id) && (
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <path d="M13.3 4L6 11.3L2.7 8" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              )}
            </div>
          </div>
        ))}
      </div>

      <div className="tip-box">
        <div className="tip-icon">
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
            <circle cx="10" cy="10" r="9" stroke="currentColor" strokeWidth="1.5"/>
            <path d="M10 6V10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
            <circle cx="10" cy="13" r="1" fill="currentColor"/>
          </svg>
        </div>
        <div>
          <strong>Pro tip:</strong> Select 2-3 styles to let the ML engine find the optimal combination for different cart types.
        </div>
      </div>

      <style jsx>{`
        .display-styles-step {
        }

        .step-intro {
          text-align: center;
          margin-bottom: 32px;
        }

        .step-intro p {
          font-size: 17px;
          color: #86868b;
          margin: 0;
        }

        .selection-counter {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 12px;
          margin-bottom: 24px;
        }

        .selection-counter span {
          font-size: 14px;
          color: #86868b;
        }

        .selection-counter span.valid {
          color: #667eea;
          font-weight: 600;
        }

        .selection-counter .hint {
          color: #ff6b6b;
          font-size: 13px;
        }

        .styles-grid {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .style-card {
          background: #fff;
          border: 2px solid rgba(0, 0, 0, 0.06);
          border-radius: 16px;
          padding: 20px;
          display: grid;
          grid-template-columns: 120px 1fr 40px;
          gap: 20px;
          align-items: center;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .style-card:hover {
          border-color: rgba(102, 126, 234, 0.3);
          transform: translateY(-1px);
        }

        .style-card.selected {
          border-color: #667eea;
          background: linear-gradient(135deg, rgba(102, 126, 234, 0.04) 0%, rgba(118, 75, 162, 0.04) 100%);
        }

        .style-preview {
          width: 120px;
          height: 80px;
          border-radius: 8px;
          overflow: hidden;
          background: #f5f5f7;
        }

        .preview-placeholder {
          width: 100%;
          height: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 12px;
          color: #86868b;
          font-weight: 500;
        }

        .style-info {
          flex: 1;
        }

        .style-header {
          display: flex;
          align-items: center;
          gap: 10px;
          margin-bottom: 4px;
        }

        .style-info h3 {
          font-size: 16px;
          font-weight: 600;
          color: #1d1d1f;
          margin: 0;
        }

        .style-info p {
          font-size: 14px;
          color: #86868b;
          margin: 0;
        }

        .badge {
          background: #000;
          color: #fff;
          font-size: 11px;
          font-weight: 600;
          padding: 4px 10px;
          border-radius: 10px;
        }

        .checkbox {
          width: 24px;
          height: 24px;
          border-radius: 8px;
          border: 2px solid #e5e5ea;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.2s ease;
        }

        .style-card.selected .checkbox {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          border-color: transparent;
        }

        .tip-box {
          display: flex;
          gap: 12px;
          background: rgba(102, 126, 234, 0.06);
          border-radius: 12px;
          padding: 16px;
          margin-top: 24px;
        }

        .tip-icon {
          color: #667eea;
          flex-shrink: 0;
        }

        .tip-box div {
          font-size: 14px;
          color: #1d1d1f;
          line-height: 1.5;
        }

        .tip-box strong {
          color: #667eea;
        }
      `}</style>
    </div>
  );
}

/**
 * Step 3: Product Selection
 */
function ProductSelectionStep({
  selectedProducts,
  onUpdate,
  onNext,
  onBack,
}: {
  selectedProducts: string[];
  onUpdate: (products: string[]) => void;
  onNext: () => void;
  onBack: () => void;
}) {
  const [products, setProducts] = useState<Array<{
    id: string;
    title: string;
    price: number;
    image: string | null;
    inventory: number;
  }>>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      const response = await authenticatedFetch('/api/admin/products');
      if (response.ok) {
        const data = await response.json();
        setProducts(data.products || []);
      }
    } catch (error) {
      console.error('Error fetching products:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleProduct = (id: string) => {
    if (selectedProducts.includes(id)) {
      onUpdate(selectedProducts.filter(p => p !== id));
    } else if (selectedProducts.length < 25) {
      onUpdate([...selectedProducts, id]);
    }
  };

  const filteredProducts = products.filter(p =>
    p.title.toLowerCase().includes(search.toLowerCase())
  );

  const selectedCount = selectedProducts.length;

  return (
    <div className="product-selection-step">
      <div className="step-intro">
        <p>Select 1-25 products to use as upsells. Choose your best sellers and complementary items.</p>
      </div>

      <div className="selection-header">
        <div className="selection-counter">
          <span className={selectedCount >= 1 && selectedCount <= 25 ? 'valid' : ''}>
            {selectedCount} of 25 selected
          </span>
          {selectedCount < 1 && <span className="hint">Select at least 1</span>}
        </div>

        <div className="search-box">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <circle cx="7" cy="7" r="5.5" stroke="currentColor" strokeWidth="1.5"/>
            <path d="M11 11L14 14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
          </svg>
          <input
            type="text"
            placeholder="Search products..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {loading ? (
        <div className="loading-state">
          <div className="spinner" />
          <p>Loading products...</p>
        </div>
      ) : (
        <div className="products-grid">
          {filteredProducts.map((product) => (
            <div
              key={product.id}
              className={`product-card ${selectedProducts.includes(product.id) ? 'selected' : ''}`}
              onClick={() => toggleProduct(product.id)}
            >
              <div className="product-image">
                {product.image ? (
                  <img src={product.image} alt={product.title} />
                ) : (
                  <div className="no-image">No Image</div>
                )}
              </div>
              <div className="product-info">
                <h4>{product.title}</h4>
                <p>${(product.price / 100).toFixed(2)}</p>
              </div>
              <div className="checkbox">
                {selectedProducts.includes(product.id) && (
                  <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                    <path d="M10 3L4.5 8.5L2 6" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      <style jsx>{`
        .product-selection-step {
        }

        .step-intro {
          text-align: center;
          margin-bottom: 24px;
        }

        .step-intro p {
          font-size: 17px;
          color: #86868b;
          margin: 0;
        }

        .selection-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 24px;
          gap: 16px;
          flex-wrap: wrap;
        }

        .selection-counter {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .selection-counter span {
          font-size: 14px;
          color: #86868b;
        }

        .selection-counter span.valid {
          color: #667eea;
          font-weight: 600;
        }

        .selection-counter .hint {
          color: #ff6b6b;
          font-size: 13px;
        }

        .search-box {
          display: flex;
          align-items: center;
          gap: 10px;
          background: #f5f5f7;
          border-radius: 10px;
          padding: 10px 16px;
          color: #86868b;
        }

        .search-box input {
          border: none;
          background: none;
          outline: none;
          font-size: 15px;
          width: 200px;
        }

        .loading-state {
          text-align: center;
          padding: 60px;
        }

        .spinner {
          width: 40px;
          height: 40px;
          border: 3px solid #e5e5ea;
          border-top-color: #667eea;
          border-radius: 50%;
          animation: spin 0.8s linear infinite;
          margin: 0 auto 16px;
        }

        @keyframes spin {
          to { transform: rotate(360deg); }
        }

        .products-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
          gap: 16px;
        }

        .product-card {
          background: #fff;
          border: 2px solid rgba(0, 0, 0, 0.06);
          border-radius: 12px;
          overflow: hidden;
          cursor: pointer;
          transition: all 0.2s ease;
          position: relative;
        }

        .product-card:hover {
          border-color: rgba(102, 126, 234, 0.3);
          transform: translateY(-2px);
        }

        .product-card.selected {
          border-color: #667eea;
        }

        .product-image {
          width: 100%;
          height: 140px;
          background: #f5f5f7;
          overflow: hidden;
        }

        .product-image img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .no-image {
          width: 100%;
          height: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #86868b;
          font-size: 13px;
        }

        .product-info {
          padding: 12px;
        }

        .product-info h4 {
          font-size: 14px;
          font-weight: 600;
          color: #1d1d1f;
          margin: 0 0 4px 0;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .product-info p {
          font-size: 13px;
          color: #667eea;
          font-weight: 600;
          margin: 0;
        }

        .checkbox {
          position: absolute;
          top: 10px;
          right: 10px;
          width: 24px;
          height: 24px;
          border-radius: 8px;
          background: rgba(255, 255, 255, 0.9);
          border: 2px solid #e5e5ea;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.2s ease;
        }

        .product-card.selected .checkbox {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          border-color: transparent;
        }
      `}</style>
    </div>
  );
}

/**
 * Step 4: Settings Configuration
 */
function SettingsStep({
  settings,
  onUpdate,
  onNext,
  onBack,
}: {
  settings: OnboardingData['settings'];
  onUpdate: (settings: OnboardingData['settings']) => void;
  onNext: () => void;
  onBack: () => void;
}) {
  return (
    <div className="settings-step">
      <div className="step-intro">
        <p>Configure how TurboCart behaves. These settings can be changed anytime.</p>
      </div>

      <div className="settings-grid">
        {/* Position Setting */}
        <div className="setting-card">
          <div className="setting-header">
            <h3>Display Position</h3>
            <p>Where upsells appear on the cart page</p>
          </div>
          <div className="position-options">
            {[
              { value: 'above_cart', label: 'Above Cart', icon: '⬆️' },
              { value: 'below_cart', label: 'Below Cart', icon: '⬇️' },
              { value: 'popup', label: 'Popup Modal', icon: '📱' },
            ].map((option) => (
              <button
                key={option.value}
                className={`position-option ${settings.position === option.value ? 'selected' : ''}`}
                onClick={() => onUpdate({ ...settings, position: option.value as typeof settings.position })}
              >
                <span className="option-icon">{option.icon}</span>
                <span>{option.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Max Products Setting */}
        <div className="setting-card">
          <div className="setting-header">
            <h3>Products to Show</h3>
            <p>Maximum upsells displayed at once</p>
          </div>
          <div className="slider-control">
            <input
              type="range"
              min="1"
              max="6"
              value={settings.maxProducts}
              onChange={(e) => onUpdate({ ...settings, maxProducts: parseInt(e.target.value) })}
            />
            <span className="slider-value">{settings.maxProducts} products</span>
          </div>
        </div>

        {/* Toggle Settings */}
        <div className="setting-card">
          <div className="toggle-row">
            <div>
              <h4>Show Prices</h4>
              <p>Display product prices in upsells</p>
            </div>
            <label className="toggle">
              <input
                type="checkbox"
                checked={settings.showPrices}
                onChange={(e) => onUpdate({ ...settings, showPrices: e.target.checked })}
              />
              <span className="toggle-slider" />
            </label>
          </div>

          <div className="toggle-row">
            <div>
              <h4>Compare-at Prices</h4>
              <p>Show sale indicators when available</p>
            </div>
            <label className="toggle">
              <input
                type="checkbox"
                checked={settings.showCompareAt}
                onChange={(e) => onUpdate({ ...settings, showCompareAt: e.target.checked })}
              />
              <span className="toggle-slider" />
            </label>
          </div>
        </div>

        {/* ML Settings */}
        <div className="setting-card highlight">
          <div className="setting-header">
            <div className="header-with-badge">
              <h3>ML Optimization</h3>
              <span className="pro-badge">Recommended</span>
            </div>
            <p>Let AI automatically optimize your upsells</p>
          </div>

          <div className="toggle-row">
            <div>
              <h4>Auto-Optimize Products</h4>
              <p>ML selects best products for each cart</p>
            </div>
            <label className="toggle">
              <input
                type="checkbox"
                checked={settings.autoOptimize}
                onChange={(e) => onUpdate({ ...settings, autoOptimize: e.target.checked })}
              />
              <span className="toggle-slider" />
            </label>
          </div>

          <div className="toggle-row">
            <div>
              <h4>Enable Thompson Sampling</h4>
              <p>A/B test display styles automatically</p>
            </div>
            <label className="toggle">
              <input
                type="checkbox"
                checked={settings.mlEnabled}
                onChange={(e) => onUpdate({ ...settings, mlEnabled: e.target.checked })}
              />
              <span className="toggle-slider" />
            </label>
          </div>
        </div>
      </div>

      <style jsx>{`
        .settings-step {
        }

        .step-intro {
          text-align: center;
          margin-bottom: 32px;
        }

        .step-intro p {
          font-size: 17px;
          color: #86868b;
          margin: 0;
        }

        .settings-grid {
          display: flex;
          flex-direction: column;
          gap: 20px;
        }

        .setting-card {
          background: #fff;
          border: 1px solid rgba(0, 0, 0, 0.06);
          border-radius: 16px;
          padding: 24px;
        }

        .setting-card.highlight {
          border: 2px solid rgba(102, 126, 234, 0.3);
          background: linear-gradient(135deg, rgba(102, 126, 234, 0.02) 0%, rgba(118, 75, 162, 0.02) 100%);
        }

        .setting-header {
          margin-bottom: 20px;
        }

        .header-with-badge {
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .setting-header h3 {
          font-size: 17px;
          font-weight: 600;
          color: #1d1d1f;
          margin: 0 0 4px 0;
        }

        .setting-header p {
          font-size: 14px;
          color: #86868b;
          margin: 0;
        }

        .pro-badge {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: #fff;
          font-size: 11px;
          font-weight: 600;
          padding: 4px 10px;
          border-radius: 10px;
        }

        .position-options {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 12px;
        }

        .position-option {
          background: #f5f5f7;
          border: 2px solid transparent;
          border-radius: 12px;
          padding: 16px;
          cursor: pointer;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 8px;
          transition: all 0.2s ease;
        }

        .position-option:hover {
          background: #e5e5ea;
        }

        .position-option.selected {
          border-color: #667eea;
          background: rgba(102, 126, 234, 0.1);
        }

        .option-icon {
          font-size: 24px;
        }

        .slider-control {
          display: flex;
          align-items: center;
          gap: 16px;
        }

        .slider-control input[type="range"] {
          flex: 1;
          height: 4px;
          appearance: none;
          background: #e5e5ea;
          border-radius: 2px;
          outline: none;
        }

        .slider-control input[type="range"]::-webkit-slider-thumb {
          appearance: none;
          width: 20px;
          height: 20px;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          border-radius: 50%;
          cursor: pointer;
        }

        .slider-value {
          font-size: 15px;
          font-weight: 600;
          color: #667eea;
          min-width: 100px;
        }

        .toggle-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 16px 0;
          border-bottom: 1px solid rgba(0, 0, 0, 0.06);
        }

        .toggle-row:last-child {
          border-bottom: none;
          padding-bottom: 0;
        }

        .toggle-row:first-child {
          padding-top: 0;
        }

        .toggle-row h4 {
          font-size: 15px;
          font-weight: 600;
          color: #1d1d1f;
          margin: 0 0 2px 0;
        }

        .toggle-row p {
          font-size: 13px;
          color: #86868b;
          margin: 0;
        }

        .toggle {
          position: relative;
          width: 50px;
          height: 28px;
          cursor: pointer;
        }

        .toggle input {
          opacity: 0;
          width: 0;
          height: 0;
        }

        .toggle-slider {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: #e5e5ea;
          border-radius: 14px;
          transition: all 0.3s ease;
        }

        .toggle-slider:before {
          content: '';
          position: absolute;
          width: 22px;
          height: 22px;
          left: 3px;
          top: 3px;
          background: #fff;
          border-radius: 50%;
          transition: all 0.3s ease;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
        }

        .toggle input:checked + .toggle-slider {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        }

        .toggle input:checked + .toggle-slider:before {
          transform: translateX(22px);
        }
      `}</style>
    </div>
  );
}

/**
 * Step 5: Enable in Theme
 */
function ThemeEnableStep({
  onNext,
  onBack,
  onSkip,
}: {
  onNext: () => void;
  onBack: () => void;
  onSkip: () => void;
}) {
  const [enabled, setEnabled] = useState(false);

  return (
    <div className="theme-enable-step">
      <div className="step-intro">
        <p>Add TurboCart to your theme to start showing upsells. This takes less than 60 seconds.</p>
      </div>

      <div className="instructions-card">
        <div className="instruction-step">
          <div className="step-number">1</div>
          <div className="step-content">
            <h4>Open Theme Editor</h4>
            <p>Go to Online Store → Themes → Customize</p>
          </div>
        </div>

        <div className="instruction-step">
          <div className="step-number">2</div>
          <div className="step-content">
            <h4>Navigate to Cart Page</h4>
            <p>Use the page selector dropdown to switch to Cart</p>
          </div>
        </div>

        <div className="instruction-step">
          <div className="step-number">3</div>
          <div className="step-content">
            <h4>Add TurboCart Block</h4>
            <p>Click "Add section" → Apps → TurboCart Upsells</p>
          </div>
        </div>

        <div className="instruction-step">
          <div className="step-number">4</div>
          <div className="step-content">
            <h4>Save Changes</h4>
            <p>Click Save in the top right corner</p>
          </div>
        </div>
      </div>

      <div className="quick-actions">
        <a
          href="/admin/themes/current/editor?template=cart"
          target="_blank"
          className="action-button primary"
        >
          Open Theme Editor
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M6 3H3V13H13V10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
            <path d="M9 3H13V7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M13 3L7 9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
          </svg>
        </a>
      </div>

      <div className="verification-box">
        <label className="checkbox-label">
          <input
            type="checkbox"
            checked={enabled}
            onChange={(e) => setEnabled(e.target.checked)}
          />
          <span className="checkmark" />
          <span>I've added TurboCart to my theme</span>
        </label>
      </div>

      <style jsx>{`
        .theme-enable-step {
        }

        .step-intro {
          text-align: center;
          margin-bottom: 32px;
        }

        .step-intro p {
          font-size: 17px;
          color: #86868b;
          margin: 0;
        }

        .instructions-card {
          background: #fff;
          border: 1px solid rgba(0, 0, 0, 0.06);
          border-radius: 16px;
          padding: 8px;
        }

        .instruction-step {
          display: flex;
          gap: 16px;
          padding: 20px;
          border-radius: 12px;
          transition: background 0.2s ease;
        }

        .instruction-step:hover {
          background: #f5f5f7;
        }

        .step-number {
          width: 32px;
          height: 32px;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: #fff;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 14px;
          font-weight: 700;
          flex-shrink: 0;
        }

        .step-content h4 {
          font-size: 16px;
          font-weight: 600;
          color: #1d1d1f;
          margin: 0 0 4px 0;
        }

        .step-content p {
          font-size: 14px;
          color: #86868b;
          margin: 0;
        }

        .quick-actions {
          display: flex;
          justify-content: center;
          margin-top: 32px;
        }

        .action-button {
          display: inline-flex;
          align-items: center;
          gap: 10px;
          padding: 14px 28px;
          border-radius: 12px;
          font-size: 15px;
          font-weight: 600;
          text-decoration: none;
          transition: all 0.2s ease;
        }

        .action-button.primary {
          background: #1d1d1f;
          color: #fff;
        }

        .action-button.primary:hover {
          background: #000;
          transform: translateY(-1px);
        }

        .verification-box {
          margin-top: 32px;
          padding: 20px;
          background: #f5f5f7;
          border-radius: 12px;
        }

        .checkbox-label {
          display: flex;
          align-items: center;
          gap: 12px;
          cursor: pointer;
          font-size: 15px;
          color: #1d1d1f;
        }

        .checkbox-label input {
          display: none;
        }

        .checkmark {
          width: 22px;
          height: 22px;
          border: 2px solid #e5e5ea;
          border-radius: 6px;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.2s ease;
        }

        .checkbox-label input:checked + .checkmark {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          border-color: transparent;
        }

        .checkbox-label input:checked + .checkmark:after {
          content: '';
          width: 6px;
          height: 10px;
          border: solid #fff;
          border-width: 0 2px 2px 0;
          transform: rotate(45deg);
        }
      `}</style>
    </div>
  );
}

/**
 * Step 6: Live!
 */
function LiveStep({
  data,
  onComplete,
  saving,
}: {
  data: OnboardingData;
  onComplete: () => void;
  saving: boolean;
}) {
  const selectedStyleCount = data.displayStyles.length;
  const selectedProductCount = data.selectedProducts.length;

  return (
    <div className="live-step">
      <div className="success-animation">
        <div className="success-circle">
          <svg width="64" height="64" viewBox="0 0 64 64" fill="none">
            <path
              d="M16 32L28 44L48 20"
              stroke="currentColor"
              strokeWidth="4"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>
        <div className="success-rings">
          <div className="ring ring-1" />
          <div className="ring ring-2" />
          <div className="ring ring-3" />
        </div>
      </div>

      <h2 className="live-title">You're All Set!</h2>
      <p className="live-subtitle">
        TurboCart is now configured and ready to boost your revenue.
      </p>

      <div className="summary-card">
        <h3>Your Setup Summary</h3>
        <div className="summary-grid">
          <div className="summary-item">
            <span className="summary-value">{selectedStyleCount}</span>
            <span className="summary-label">Display Styles</span>
          </div>
          <div className="summary-item">
            <span className="summary-value">{selectedProductCount}</span>
            <span className="summary-label">Upsell Products</span>
          </div>
          <div className="summary-item">
            <span className="summary-value">{data.settings.mlEnabled ? 'ON' : 'OFF'}</span>
            <span className="summary-label">ML Optimization</span>
          </div>
        </div>
      </div>

      <div className="whats-next">
        <h3>What Happens Now?</h3>
        <ul>
          <li>
            <span className="bullet">1</span>
            ML engine starts learning from customer behavior immediately
          </li>
          <li>
            <span className="bullet">2</span>
            Display styles are A/B tested to find the best performer
          </li>
          <li>
            <span className="bullet">3</span>
            Revenue analytics update in real-time on your dashboard
          </li>
        </ul>
      </div>

      <button
        className="complete-button"
        onClick={onComplete}
        disabled={saving}
      >
        {saving ? (
          <>
            <span className="spinner-small" />
            Setting up...
          </>
        ) : (
          <>
            Go to Dashboard
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <path d="M4 10H16M16 10L11 5M16 10L11 15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </>
        )}
      </button>

      <style jsx>{`
        .live-step {
          text-align: center;
        }

        .success-animation {
          position: relative;
          width: 120px;
          height: 120px;
          margin: 0 auto 32px;
        }

        .success-circle {
          width: 100px;
          height: 100px;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #fff;
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          z-index: 2;
          animation: scaleIn 0.5s ease-out;
        }

        @keyframes scaleIn {
          from {
            transform: translate(-50%, -50%) scale(0);
          }
          to {
            transform: translate(-50%, -50%) scale(1);
          }
        }

        .success-rings {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
        }

        .ring {
          position: absolute;
          border: 2px solid rgba(102, 126, 234, 0.3);
          border-radius: 50%;
          animation: ripple 2s ease-out infinite;
        }

        .ring-1 {
          width: 100px;
          height: 100px;
          top: -50px;
          left: -50px;
        }

        .ring-2 {
          width: 130px;
          height: 130px;
          top: -65px;
          left: -65px;
          animation-delay: 0.3s;
        }

        .ring-3 {
          width: 160px;
          height: 160px;
          top: -80px;
          left: -80px;
          animation-delay: 0.6s;
        }

        @keyframes ripple {
          0% {
            transform: scale(0.8);
            opacity: 1;
          }
          100% {
            transform: scale(1.5);
            opacity: 0;
          }
        }

        .live-title {
          font-size: 32px;
          font-weight: 700;
          color: #1d1d1f;
          margin: 0 0 8px 0;
        }

        .live-subtitle {
          font-size: 17px;
          color: #86868b;
          margin: 0 0 40px 0;
        }

        .summary-card {
          background: #fff;
          border: 1px solid rgba(0, 0, 0, 0.06);
          border-radius: 16px;
          padding: 24px;
          margin-bottom: 32px;
        }

        .summary-card h3 {
          font-size: 15px;
          font-weight: 600;
          color: #86868b;
          margin: 0 0 20px 0;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .summary-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 20px;
        }

        .summary-item {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 4px;
        }

        .summary-value {
          font-size: 28px;
          font-weight: 700;
          color: #667eea;
        }

        .summary-label {
          font-size: 13px;
          color: #86868b;
        }

        .whats-next {
          background: linear-gradient(135deg, rgba(102, 126, 234, 0.06) 0%, rgba(118, 75, 162, 0.06) 100%);
          border-radius: 16px;
          padding: 24px;
          margin-bottom: 40px;
          text-align: left;
        }

        .whats-next h3 {
          font-size: 16px;
          font-weight: 600;
          color: #1d1d1f;
          margin: 0 0 16px 0;
        }

        .whats-next ul {
          list-style: none;
          padding: 0;
          margin: 0;
        }

        .whats-next li {
          display: flex;
          align-items: flex-start;
          gap: 12px;
          padding: 10px 0;
          font-size: 15px;
          color: #1d1d1f;
          line-height: 1.5;
        }

        .bullet {
          width: 24px;
          height: 24px;
          background: #667eea;
          color: #fff;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 12px;
          font-weight: 700;
          flex-shrink: 0;
        }

        .complete-button {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: #fff;
          border: none;
          padding: 16px 40px;
          border-radius: 14px;
          font-size: 17px;
          font-weight: 600;
          cursor: pointer;
          display: inline-flex;
          align-items: center;
          gap: 12px;
          transition: all 0.2s ease;
        }

        .complete-button:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 8px 24px rgba(102, 126, 234, 0.4);
        }

        .complete-button:disabled {
          opacity: 0.8;
          cursor: wait;
        }

        .spinner-small {
          width: 20px;
          height: 20px;
          border: 2px solid rgba(255, 255, 255, 0.3);
          border-top-color: #fff;
          border-radius: 50%;
          animation: spin 0.8s linear infinite;
        }
      `}</style>
    </div>
  );
}
