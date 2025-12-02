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
import DisplayStylePreview from '@/components/DisplayStylePreview';

// Types
type OnboardingStep = 1 | 2 | 3 | 4 | 5 | 6;

interface DisplayStyleConfig {
  id: string;
  enabled: boolean;
  priority: number;
}

interface SelectedProduct {
  id: string;
  title: string;
  handle?: string;
  productType?: string;
  vendor?: string;
  price: number;
  image: string | null;
  variantId?: string;
  collections?: Array<{ id: string; title?: string }>;
}

interface OnboardingData {
  displayStyles: DisplayStyleConfig[];
  selectedProducts: SelectedProduct[];
  settings: {
    cartType: 'page' | 'drawer';
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
    cartType: 'drawer',
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

// LocalStorage key for persisting onboarding data
const ONBOARDING_STORAGE_KEY = 'turbocart_onboarding_data';

function saveToStorage(data: OnboardingData, step: OnboardingStep) {
  try {
    localStorage.setItem(ONBOARDING_STORAGE_KEY, JSON.stringify({ data, step }));
  } catch (e) {
    console.error('Failed to save onboarding data:', e);
  }
}

function loadFromStorage(): { data: OnboardingData; step: OnboardingStep } | null {
  try {
    const saved = localStorage.getItem(ONBOARDING_STORAGE_KEY);
    if (saved) {
      return JSON.parse(saved);
    }
  } catch (e) {
    console.error('Failed to load onboarding data:', e);
  }
  return null;
}

function clearStorage() {
  try {
    localStorage.removeItem(ONBOARDING_STORAGE_KEY);
  } catch (e) {
    console.error('Failed to clear onboarding data:', e);
  }
}

export default function OnboardingPage() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState<OnboardingStep>(1);
  const [data, setData] = useState<OnboardingData>(INITIAL_DATA);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Load saved data on mount, but first check if this is a reinstall
  useEffect(() => {
    const checkAndLoad = async () => {
      try {
        // Check if this is a reinstall - if so, clear localStorage
        const response = await authenticatedFetch('/api/admin/shop/onboarding-status');
        if (response.ok) {
          const statusData = await response.json();
          if (statusData.wasReinstalled) {
            // App reinstalled - clearing localStorage for fresh start
            clearStorage();
            localStorage.removeItem('turbocart_onboarding_complete');
            localStorage.removeItem('turbocart_selected_products');
            localStorage.removeItem('turbocart_display_settings');
            // Clear any other TurboCart-related localStorage items
            Object.keys(localStorage).forEach(key => {
              if (key.startsWith('turbocart_')) {
                localStorage.removeItem(key);
              }
            });
            // Start fresh - don't load from localStorage
            setLoading(false);
            return;
          }
        }
      } catch (error) {
        console.error('Error checking reinstall status:', error);
      }

      // Not a reinstall - load saved data normally
      const saved = loadFromStorage();
      if (saved) {
        setData(saved.data);
        setCurrentStep(saved.step);
      }
      setLoading(false);
    };

    checkAndLoad();
  }, []);

  // Save data whenever it changes
  useEffect(() => {
    if (!loading) {
      saveToStorage(data, currentStep);
    }
  }, [data, currentStep, loading]);

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

      // Save settings using authenticated fetch
      const settingsResponse = await authenticatedFetch('/api/admin/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          settings: {
            enabled_display_styles: data.displayStyles
              .filter(s => s.enabled)
              .sort((a, b) => a.priority - b.priority)
              .map(s => s.id),
            display_style: data.displayStyles.find(s => s.enabled)?.id || 'minimal-strip',
            cart_type: data.settings.cartType,
            max_upsells: data.settings.maxProducts,
            enable_ab_testing: data.settings.mlEnabled,
            theme_enabled: data.themeEnabled,
          },
        }),
      });

      if (!settingsResponse.ok) {
        const errorData = await settingsResponse.json().catch(() => ({}));
        console.error('Settings save error:', errorData);
        throw new Error(errorData.error || 'Failed to save settings');
      }

      // Save selected products using authenticated fetch
      const productsResponse = await authenticatedFetch('/api/admin/products/selected', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          products: data.selectedProducts,
        }),
      });

      if (!productsResponse.ok) {
        const errorData = await productsResponse.json().catch(() => ({}));
        console.error('Products save error:', errorData);
        throw new Error(errorData.error || 'Failed to save products');
      }

      // Mark onboarding complete via API
      await authenticatedFetch('/api/admin/shop/onboarding-status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });

      // Clear onboarding progress data
      clearStorage();

      // Mark onboarding complete locally
      localStorage.setItem('turbocart_onboarding_complete', 'true');

      // Redirect to dashboard
      setTimeout(() => {
        router.push('/dashboard?welcome=true');
      }, 2000);
    } catch (error) {
      console.error('Error completing onboarding:', error);
      alert(`Failed to save: ${error instanceof Error ? error.message : 'Unknown error'}. Please try again.`);
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

  if (loading) {
    return (
      <div className="loading-screen">
        <div className="loading-content">
          {/* Premium loading animation */}
          <div className="loading-logo">
            <svg width="64" height="64" viewBox="0 0 64 64" fill="none">
              <defs>
                <linearGradient id="loadingGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#667eea" />
                  <stop offset="100%" stopColor="#764ba2" />
                </linearGradient>
              </defs>
              <circle cx="32" cy="32" r="28" stroke="url(#loadingGradient)" strokeWidth="3" fill="none" strokeLinecap="round" className="loading-circle" />
              <path d="M32 12L36 24L48 28L36 32L32 44L28 32L16 28L28 24L32 12Z" fill="url(#loadingGradient)" className="loading-star" />
            </svg>
          </div>

          {/* Skeleton preview of what's coming */}
          <div className="skeleton-preview">
            <div className="skeleton-title" />
            <div className="skeleton-subtitle" />
            <div className="skeleton-button" />
          </div>

          <p className="loading-text">Preparing your experience...</p>
        </div>

        <style jsx>{`
          .loading-screen {
            min-height: 100vh;
            background: linear-gradient(180deg, #000 0%, #0a0a0a 100%);
            display: flex;
            align-items: center;
            justify-content: center;
            -webkit-font-smoothing: antialiased;
          }

          .loading-content {
            text-align: center;
          }

          .loading-logo {
            margin-bottom: 40px;
            animation: logoFloat 2s ease-in-out infinite;
          }

          .loading-logo :global(.loading-circle) {
            stroke-dasharray: 175;
            stroke-dashoffset: 175;
            animation: drawCircle 1.5s ease-in-out infinite;
          }

          .loading-logo :global(.loading-star) {
            transform-origin: center;
            animation: starPulse 1.5s ease-in-out infinite;
          }

          @keyframes logoFloat {
            0%, 100% { transform: translateY(0); }
            50% { transform: translateY(-10px); }
          }

          @keyframes drawCircle {
            0% { stroke-dashoffset: 175; }
            50% { stroke-dashoffset: 0; }
            100% { stroke-dashoffset: -175; }
          }

          @keyframes starPulse {
            0%, 100% { transform: scale(1); opacity: 1; }
            50% { transform: scale(1.1); opacity: 0.8; }
          }

          .skeleton-preview {
            margin-bottom: 32px;
          }

          .skeleton-title {
            width: 280px;
            height: 32px;
            background: linear-gradient(90deg, rgba(255,255,255,0.05) 25%, rgba(255,255,255,0.1) 50%, rgba(255,255,255,0.05) 75%);
            background-size: 200% 100%;
            border-radius: 8px;
            margin: 0 auto 16px;
            animation: shimmer 1.5s infinite;
          }

          .skeleton-subtitle {
            width: 200px;
            height: 20px;
            background: linear-gradient(90deg, rgba(255,255,255,0.05) 25%, rgba(255,255,255,0.1) 50%, rgba(255,255,255,0.05) 75%);
            background-size: 200% 100%;
            border-radius: 6px;
            margin: 0 auto 24px;
            animation: shimmer 1.5s infinite 0.2s;
          }

          .skeleton-button {
            width: 160px;
            height: 48px;
            background: linear-gradient(90deg, rgba(255,255,255,0.05) 25%, rgba(255,255,255,0.1) 50%, rgba(255,255,255,0.05) 75%);
            background-size: 200% 100%;
            border-radius: 12px;
            margin: 0 auto;
            animation: shimmer 1.5s infinite 0.4s;
          }

          @keyframes shimmer {
            0% { background-position: 200% 0; }
            100% { background-position: -200% 0; }
          }

          .loading-text {
            font-size: 14px;
            color: rgba(255, 255, 255, 0.4);
            letter-spacing: 0.5px;
            animation: fadeInOut 2s ease-in-out infinite;
          }

          @keyframes fadeInOut {
            0%, 100% { opacity: 0.4; }
            50% { opacity: 0.8; }
          }
        `}</style>
      </div>
    );
  }

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
            themeEnabled={data.themeEnabled}
            onThemeEnabledChange={(enabled) => updateData({ themeEnabled: enabled })}
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
          padding: 16px 24px;
          position: sticky;
          top: 0;
          z-index: 100;
        }

        .progress-content {
          max-width: 800px;
          margin: 0 auto;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 24px;
        }

        .progress-info {
          text-align: left;
        }

        .step-indicator {
          font-size: 11px;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          color: #86868b;
          margin-bottom: 2px;
        }

        .step-title {
          font-size: 18px;
          font-weight: 700;
          color: #1d1d1f;
          margin: 0;
          letter-spacing: -0.3px;
        }

        .step-subtitle {
          display: none;
        }

        .progress-bar-container {
          flex: 1;
          max-width: 300px;
        }

        .progress-bar {
          height: 4px;
          background: #e5e5ea;
          border-radius: 2px;
          overflow: hidden;
          margin-bottom: 8px;
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
          background: #000;
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
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
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
 * Clean SVG Icons - Solid White, Consistent Style
 */
const CleanBrainIcon = () => (
  <svg width="56" height="56" viewBox="0 0 56 56" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M28 8C22 8 17 12 16 18C12 19 9 23 9 28C9 33 12 37 16 38C17 44 22 48 28 48C34 48 39 44 40 38C44 37 47 33 47 28C47 23 44 19 40 18C39 12 34 8 28 8Z"
      stroke="white" strokeWidth="2" fill="none" />
    <path d="M28 18V38" stroke="white" strokeWidth="1.5" strokeDasharray="3 3" />
    <circle cx="22" cy="24" r="2" fill="white" />
    <circle cx="34" cy="24" r="2" fill="white" />
    <circle cx="22" cy="32" r="2" fill="white" />
    <circle cx="34" cy="32" r="2" fill="white" />
    <circle cx="28" cy="28" r="2.5" fill="white" />
  </svg>
);

const CleanChartIcon = () => (
  <svg width="56" height="56" viewBox="0 0 56 56" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M8 44L18 32L28 38L48 14" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M40 14H48V22" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
    <rect x="12" y="38" width="6" height="8" rx="1" fill="white" opacity="0.4" />
    <rect x="24" y="34" width="6" height="12" rx="1" fill="white" opacity="0.6" />
    <rect x="36" y="28" width="6" height="18" rx="1" fill="white" opacity="0.8" />
  </svg>
);

const CleanBoltIcon = () => (
  <svg width="56" height="56" viewBox="0 0 56 56" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M32 6L14 30H26L22 50L42 24H28L32 6Z" fill="white" />
  </svg>
);

const CleanSparkleIcon = () => (
  <svg width="56" height="56" viewBox="0 0 56 56" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M28 4L32 22L50 26L32 30L28 48L24 30L6 26L24 22L28 4Z" fill="white" />
    <path d="M44 10L46 16L52 18L46 20L44 26L42 20L36 18L42 16L44 10Z" fill="white" opacity="0.5" />
    <path d="M12 36L14 40L18 42L14 44L12 48L10 44L6 42L10 40L12 36Z" fill="white" opacity="0.5" />
  </svg>
);

/**
 * Step 1: Welcome - Clean Dark Design
 */
function WelcomeStep({ onNext }: { onNext: () => void }) {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [slideDirection, setSlideDirection] = useState<'next' | 'prev'>('next');

  const slides = [
    {
      icon: 'sparkle',
      title: 'The World\'s Most Advanced Algorithm.',
      subtitle: 'Now In Your Hands.',
      description: null,
      stats: null,
    },
    {
      icon: 'brain',
      title: 'AI That Actually Learns',
      subtitle: null,
      description: 'Our algorithm analyzes every cart, every click, every purchase. Then optimizes automatically.',
      stats: [
        { value: '50M+', label: 'Data Points Analyzed' },
        { value: '24/7', label: 'Real-time Learning' },
      ],
    },
    {
      icon: 'chart',
      title: '+32% Average Order Value',
      subtitle: null,
      description: 'Real results from real stores. No gimmicks. Just math.',
      stats: [
        { value: '10K+', label: 'Stores Trust Us' },
        { value: '$2.4B', label: 'Revenue Generated' },
      ],
    },
    {
      icon: 'bolt',
      title: 'Set It. Forget It.',
      subtitle: null,
      description: '5 minutes to setup. Then we handle everything.',
      stats: [
        { value: '5 min', label: 'Setup Time' },
        { value: '0', label: 'Maintenance Needed' },
      ],
    },
  ];

  const isLastSlide = currentSlide === slides.length - 1;
  const slide = slides[currentSlide]!;

  const handleNext = () => {
    if (isTransitioning) return;

    if (isLastSlide) {
      onNext();
    } else {
      setIsTransitioning(true);
      setSlideDirection('next');
      setTimeout(() => {
        setCurrentSlide(prev => prev + 1);
        setIsTransitioning(false);
      }, 300);
    }
  };

  const handleSlideChange = (index: number) => {
    if (isTransitioning || index === currentSlide) return;

    setIsTransitioning(true);
    setSlideDirection(index > currentSlide ? 'next' : 'prev');
    setTimeout(() => {
      setCurrentSlide(index);
      setIsTransitioning(false);
    }, 300);
  };

  const renderIcon = () => {
    switch (slide.icon) {
      case 'brain': return <CleanBrainIcon />;
      case 'chart': return <CleanChartIcon />;
      case 'bolt': return <CleanBoltIcon />;
      default: return <CleanSparkleIcon />;
    }
  };

  return (
    <div className="welcome-step-dark">
      <div className="dark-container">
        {/* Content */}
        <div className={`slide-content ${isTransitioning ? `transitioning-${slideDirection}` : ''}`} key={currentSlide}>
          <div className="slide-icon-wrapper">
            {renderIcon()}
          </div>

          <h1 className="slide-title">{slide.title}</h1>

          {slide.subtitle && (
            <p className="slide-subtitle">{slide.subtitle}</p>
          )}

          {slide.description && (
            <p className="slide-description">{slide.description}</p>
          )}

          {/* Stats row */}
          {slide.stats && (
            <div className="stats-row">
              {slide.stats.map((stat, i) => (
                <div key={i} className="stat-item">
                  <span className="stat-value">{stat.value}</span>
                  <span className="stat-label">{stat.label}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Progress bar */}
        <div className="progress-track">
          <div className="progress-fill" style={{ width: `${((currentSlide + 1) / slides.length) * 100}%` }} />
        </div>

        {/* Slide indicators */}
        <div className="slide-indicators">
          {slides.map((_, i) => (
            <button
              key={i}
              className={`indicator ${i === currentSlide ? 'active' : ''} ${i < currentSlide ? 'completed' : ''}`}
              onClick={() => handleSlideChange(i)}
            >
              <span className="indicator-inner" />
            </button>
          ))}
        </div>

        {/* CTA Button */}
        <button className="cta-button-dark" onClick={handleNext}>
          {isLastSlide ? 'Let\'s Begin' : 'Continue'}
          <svg width="18" height="18" viewBox="0 0 20 20" fill="none">
            <path d="M4 10H16M16 10L11 5M16 10L11 15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>

        {currentSlide === 0 && (
          <p className="trust-note">Trusted by 10,000+ Shopify stores worldwide</p>
        )}
      </div>

      <style jsx>{`
        .welcome-step-dark {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          z-index: 1000;
        }

        .dark-container {
          background: #000000;
          min-height: 100vh;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 60px 24px;
          position: relative;
          -webkit-font-smoothing: antialiased;
          -moz-osx-font-smoothing: grayscale;
          text-rendering: optimizeLegibility;
        }

        /* Slide content with smooth transitions */
        .slide-content {
          text-align: center;
          max-width: 600px;
          width: 100%;
          padding: 0 20px;
        }

        .slide-content.transitioning-next {
          animation: fadeOut 0.2s ease-out forwards;
        }

        .slide-content.transitioning-prev {
          animation: fadeOut 0.2s ease-out forwards;
        }

        @keyframes fadeOut {
          to {
            opacity: 0;
          }
        }

        .slide-icon-wrapper {
          width: 80px;
          height: 80px;
          margin: 0 auto 48px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .slide-title {
          font-size: 40px;
          font-weight: 600;
          color: #FFFFFF;
          margin: 0 0 16px 0;
          letter-spacing: -1px;
          line-height: 1.2;
        }

        .slide-subtitle {
          font-size: 24px;
          color: rgba(255, 255, 255, 0.8);
          margin: 0 0 24px 0;
          font-weight: 400;
        }

        .slide-description {
          font-size: 17px;
          color: rgba(255, 255, 255, 0.5);
          margin: 0 auto 40px;
          line-height: 1.6;
          max-width: 440px;
        }

        /* Stats row */
        .stats-row {
          display: flex;
          justify-content: center;
          gap: 64px;
          margin-top: 48px;
        }

        .stat-item {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 8px;
        }

        .stat-value {
          font-size: 28px;
          font-weight: 600;
          color: rgba(255, 255, 255, 0.9);
        }

        .stat-label {
          font-size: 11px;
          color: rgba(255, 255, 255, 0.4);
          text-transform: uppercase;
          letter-spacing: 1.5px;
        }

        /* Progress bar */
        .progress-track {
          width: 200px;
          height: 2px;
          background: rgba(255, 255, 255, 0.1);
          border-radius: 1px;
          margin-top: 56px;
          overflow: hidden;
        }

        .progress-fill {
          height: 100%;
          background: rgba(255, 255, 255, 0.6);
          border-radius: 1px;
          transition: width 0.3s ease;
        }

        /* Slide indicators */
        .slide-indicators {
          display: flex;
          gap: 12px;
          margin-top: 24px;
        }

        .indicator {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: rgba(255, 255, 255, 0.2);
          border: none;
          cursor: pointer;
          transition: all 0.2s ease;
          padding: 0;
          position: relative;
        }

        .indicator-inner {
          display: none;
        }

        .indicator.active {
          background: #FFFFFF;
        }

        .indicator.completed {
          background: rgba(255, 255, 255, 0.5);
        }

        .indicator:hover {
          background: rgba(255, 255, 255, 0.4);
        }

        /* CTA Button */
        .cta-button-dark {
          background: #FFFFFF;
          color: #000000;
          border: none;
          padding: 16px 48px;
          border-radius: 8px;
          font-size: 16px;
          font-weight: 600;
          cursor: pointer;
          display: inline-flex;
          align-items: center;
          gap: 10px;
          margin-top: 40px;
          transition: opacity 0.2s ease;
        }

        .cta-button-dark:hover {
          opacity: 0.9;
        }

        /* Trust note */
        .trust-note {
          font-size: 13px;
          color: rgba(255, 255, 255, 0.3);
          margin-top: 48px;
          letter-spacing: 0.3px;
        }

        @media (max-width: 768px) {
          .slide-title {
            font-size: 32px;
          }

          .slide-subtitle {
            font-size: 20px;
          }

          .slide-description {
            font-size: 15px;
          }

          .stats-row {
            gap: 40px;
          }

          .stat-value {
            font-size: 24px;
          }
        }

        @media (max-width: 375px) {
          .dark-container {
            padding: 40px 20px;
          }

          .slide-title {
            font-size: 26px;
          }

          .stats-row {
            gap: 32px;
          }

          .stat-value {
            font-size: 20px;
          }

          .cta-button-dark {
            padding: 14px 36px;
            font-size: 15px;
          }
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
    description: 'Bundle-style Add Both display',
    recommended: true,
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
  {
    id: 'masonry-grid',
    name: 'Masonry Grid',
    description: 'Pinterest-style dynamic layout with varying heights',
    recommended: false,
    preview: '/previews/masonry-grid.png',
  },
  {
    id: 'vertical-scroll',
    name: 'Vertical Scroll',
    description: 'Tall gallery with large product images',
    recommended: false,
    preview: '/previews/vertical-scroll.png',
  },
  {
    id: 'sticky-tabs',
    name: 'Category Tabs',
    description: 'Tabbed interface for browsing by type',
    recommended: false,
    preview: '/previews/sticky-tabs.png',
  },
  {
    id: 'comparison-table',
    name: 'Comparison Table',
    description: 'Side-by-side product comparison',
    recommended: false,
    preview: '/previews/comparison-table.png',
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
  const [showMaxWarning, setShowMaxWarning] = useState(false);

  const toggleStyle = (id: string) => {
    const existing = displayStyles.find(s => s.id === id);
    if (existing) {
      onUpdate(displayStyles.filter(s => s.id !== id));
      setShowMaxWarning(false);
    } else {
      const enabledCount = displayStyles.filter(s => s.enabled).length;
      if (enabledCount < 3) {
        onUpdate([
          ...displayStyles,
          { id, enabled: true, priority: enabledCount + 1 },
        ]);
        setShowMaxWarning(false);
      } else {
        // Show warning when trying to select more than 3
        setShowMaxWarning(true);
        setTimeout(() => setShowMaxWarning(false), 3000);
      }
    }
  };

  const isSelected = (id: string) => displayStyles.some(s => s.id === id);
  const selectedCount = displayStyles.length;
  const isMaxSelected = selectedCount >= 3;

  return (
    <div className="display-styles-step">
      <div className="step-intro">
        <p>Select 1-3 display styles. The Machine Learning engine will automatically A/B test them to find what converts best for your store.</p>
      </div>

      <div className="selection-counter">
        <span className={`counter-badge ${selectedCount >= 3 ? 'max' : selectedCount >= 1 ? 'valid' : ''}`}>
          {selectedCount}/3 Selected
        </span>
        {selectedCount < 1 && <span className="hint">Select at least 1</span>}
        {selectedCount >= 3 && <span className="max-hint">Maximum reached</span>}
      </div>

      {showMaxWarning && (
        <div className="max-warning-toast">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <circle cx="8" cy="8" r="7" stroke="currentColor" strokeWidth="1.5"/>
            <path d="M8 5V8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
            <circle cx="8" cy="10.5" r="0.75" fill="currentColor"/>
          </svg>
          <span>You can only select up to 3 display styles. Deselect one to choose another.</span>
        </div>
      )}

      <div className="styles-grid">
        {DISPLAY_STYLES.map((style) => (
          <div
            key={style.id}
            className={`style-card ${isSelected(style.id) ? 'selected' : ''} ${isMaxSelected && !isSelected(style.id) ? 'disabled' : ''}`}
            onClick={() => toggleStyle(style.id)}
          >
            <div className="style-preview">
              <DisplayStylePreview style={style.id as 'minimal-strip' | 'list' | 'banner' | 'cards' | 'frequently-bought' | 'masonry-grid' | 'vertical-scroll' | 'sticky-tabs' | 'comparison-table'} />
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
          <strong>Pro tip:</strong> Select 2-3 styles to let the Machine Learning engine find the optimal combination for different cart types.
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

        .counter-badge {
          font-size: 14px;
          font-weight: 600;
          padding: 6px 16px;
          border-radius: 20px;
          background: #f5f5f7;
          color: #86868b;
        }

        .counter-badge.valid {
          background: rgba(102, 126, 234, 0.1);
          color: #667eea;
        }

        .counter-badge.max {
          background: #000;
          color: #fff;
        }

        .selection-counter .hint {
          color: #ff6b6b;
          font-size: 13px;
        }

        .selection-counter .max-hint {
          color: #86868b;
          font-size: 13px;
          font-style: italic;
        }

        .max-warning-toast {
          display: flex;
          align-items: center;
          gap: 10px;
          background: #fef2f2;
          border: 1px solid #fecaca;
          color: #dc2626;
          padding: 12px 16px;
          border-radius: 10px;
          margin-bottom: 16px;
          animation: shake 0.5s ease-in-out;
        }

        .max-warning-toast svg {
          flex-shrink: 0;
        }

        .max-warning-toast span {
          font-size: 14px;
          font-weight: 500;
        }

        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          10%, 30%, 50%, 70%, 90% { transform: translateX(-4px); }
          20%, 40%, 60%, 80% { transform: translateX(4px); }
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
          padding: 16px;
          display: grid;
          grid-template-columns: 220px 1fr 32px;
          gap: 16px;
          align-items: center;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .style-card:hover {
          border-color: #000;
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
        }

        .style-card.selected {
          border-color: #000;
          background: #f5f5f7;
        }

        .style-card.disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .style-card.disabled:hover {
          border-color: rgba(0, 0, 0, 0.06);
          transform: none;
          box-shadow: none;
        }

        .style-preview {
          width: 220px;
          height: 160px;
          border-radius: 10px;
          overflow: hidden;
          background: #fafafa;
          border: 1px solid #e5e5ea;
          flex-shrink: 0;
          position: relative;
        }

        .style-preview :global(.preview-wrapper) {
          transform: scale(0.55);
          transform-origin: top left;
          width: 400px;
          height: 290px;
        }

        .style-info {
          flex: 1;
          min-width: 0;
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
          background: #000;
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
  selectedProducts: SelectedProduct[];
  onUpdate: (products: SelectedProduct[]) => void;
  onNext: () => void;
  onBack: () => void;
}) {
  const [products, setProducts] = useState<Array<{
    id: string;
    title: string;
    handle: string;
    productType: string;
    vendor: string;
    price: number;
    image: string | null;
    inventory: number;
    variantId: string;
    collections: Array<{ id: string; title: string }>;
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

  const isSelected = (id: string) => selectedProducts.some(p => p.id === id);

  const toggleProduct = (product: typeof products[0]) => {
    if (isSelected(product.id)) {
      onUpdate(selectedProducts.filter(p => p.id !== product.id));
    } else if (selectedProducts.length < 25) {
      onUpdate([...selectedProducts, {
        id: product.id,
        title: product.title,
        handle: product.handle,
        productType: product.productType,
        vendor: product.vendor,
        price: product.price,
        image: product.image,
        variantId: product.variantId,
        collections: product.collections,
      }]);
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
          {/* Skeleton product grid */}
          <div className="skeleton-grid">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="skeleton-card" style={{ animationDelay: `${i * 0.1}s` }}>
                <div className="skeleton-image" />
                <div className="skeleton-info">
                  <div className="skeleton-name" />
                  <div className="skeleton-price" />
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="products-grid">
          {filteredProducts.map((product) => (
            <div
              key={product.id}
              className={`product-card ${isSelected(product.id) ? 'selected' : ''}`}
              onClick={() => toggleProduct(product)}
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
                <p>${product.price.toFixed(2)}</p>
              </div>
              <div className="checkbox">
                {isSelected(product.id) && (
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
          padding: 20px 0;
        }

        .skeleton-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
          gap: 16px;
        }

        .skeleton-card {
          background: #fff;
          border: 2px solid rgba(0, 0, 0, 0.04);
          border-radius: 12px;
          overflow: hidden;
          animation: skeletonFadeIn 0.5s ease-out backwards;
        }

        @keyframes skeletonFadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }

        .skeleton-image {
          width: 100%;
          height: 140px;
          background: linear-gradient(90deg, #f0f0f5 25%, #fafafa 50%, #f0f0f5 75%);
          background-size: 200% 100%;
          animation: shimmer 1.5s infinite;
        }

        .skeleton-info {
          padding: 12px;
        }

        .skeleton-name {
          width: 80%;
          height: 16px;
          background: linear-gradient(90deg, #f0f0f5 25%, #fafafa 50%, #f0f0f5 75%);
          background-size: 200% 100%;
          border-radius: 4px;
          margin-bottom: 8px;
          animation: shimmer 1.5s infinite;
        }

        .skeleton-price {
          width: 40%;
          height: 14px;
          background: linear-gradient(90deg, #f0f0f5 25%, #fafafa 50%, #f0f0f5 75%);
          background-size: 200% 100%;
          border-radius: 4px;
          animation: shimmer 1.5s infinite 0.2s;
        }

        @keyframes shimmer {
          0% { background-position: 200% 0; }
          100% { background-position: -200% 0; }
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
          background: #000;
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
        {/* Cart Type Setting */}
        <div className="setting-card">
          <div className="setting-header">
            <h3>Cart Type</h3>
            <p>Where do customers see their cart?</p>
          </div>
          <div className="cart-type-options">
            <button
              className={`cart-type-option ${settings.cartType === 'drawer' ? 'selected' : ''}`}
              onClick={() => onUpdate({ ...settings, cartType: 'drawer' })}
            >
              <div className="cart-type-icon">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="14" y="2" width="8" height="20" rx="1"/>
                  <line x1="2" y1="6" x2="10" y2="6"/>
                  <line x1="2" y1="10" x2="8" y2="10"/>
                  <line x1="2" y1="14" x2="6" y2="14"/>
                </svg>
              </div>
              <div className="cart-type-text">
                <strong>Cart Drawer</strong>
                <span>Slide-out drawer</span>
              </div>
            </button>
            <button
              className={`cart-type-option ${settings.cartType === 'page' ? 'selected' : ''}`}
              onClick={() => onUpdate({ ...settings, cartType: 'page' })}
            >
              <div className="cart-type-icon">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="3" y="3" width="18" height="18" rx="2"/>
                  <line x1="7" y1="8" x2="17" y2="8"/>
                  <line x1="7" y1="12" x2="15" y2="12"/>
                  <line x1="7" y1="16" x2="13" y2="16"/>
                </svg>
              </div>
              <div className="cart-type-text">
                <strong>Cart Page</strong>
                <span>Full cart page</span>
              </div>
            </button>
          </div>
        </div>

        {/* Max Products Setting */}
        <div className="setting-card">
          <div className="setting-header">
            <h3>Products to Show</h3>
            <p>Maximum products displayed at once</p>
          </div>
          <div className="slider-control">
            <input
              type="range"
              min="1"
              max="25"
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

        {/* Machine Learning Settings */}
        <div className="setting-card highlight">
          <div className="setting-header">
            <div className="header-with-badge">
              <h3>Machine Learning Optimization</h3>
              <span className="pro-badge">Recommended</span>
            </div>
            <p>Let AI automatically optimize your upsells</p>
          </div>

          <div className="toggle-row">
            <div>
              <h4>Auto-Optimize Products</h4>
              <p>Machine Learning selects best products for each cart</p>
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
          background: #000;
          color: #fff;
          font-size: 11px;
          font-weight: 600;
          padding: 4px 10px;
          border-radius: 10px;
        }

        .cart-type-options {
          display: flex;
          gap: 12px;
        }

        .cart-type-option {
          flex: 1;
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 16px;
          background: #fff;
          border: 2px solid #e5e5ea;
          border-radius: 12px;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .cart-type-option:hover {
          border-color: #000;
        }

        .cart-type-option.selected {
          border-color: #000;
          background: #f5f5f7;
        }

        .cart-type-icon {
          color: #86868b;
        }

        .cart-type-option.selected .cart-type-icon {
          color: #000;
        }

        .cart-type-text {
          display: flex;
          flex-direction: column;
          text-align: left;
        }

        .cart-type-text strong {
          font-size: 14px;
          font-weight: 600;
          color: #1d1d1f;
        }

        .cart-type-text span {
          font-size: 12px;
          color: #86868b;
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
          background: #000;
          border-radius: 50%;
          cursor: pointer;
        }

        .slider-value {
          font-size: 15px;
          font-weight: 600;
          color: #1d1d1f;
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
          background: #000;
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
  themeEnabled,
  onThemeEnabledChange,
  onNext,
  onBack,
  onSkip,
}: {
  themeEnabled: boolean;
  onThemeEnabledChange: (enabled: boolean) => void;
  onNext: () => void;
  onBack: () => void;
  onSkip: () => void;
}) {

  // Get shop domain for theme editor link - opens directly to App Embeds
  const getThemeEditorUrl = () => {
    // Try to get shop from URL params
    const urlParams = new URLSearchParams(window.location.search);
    const shop = urlParams.get('shop');

    if (shop) {
      // Open directly to App Embeds section
      return `https://${shop}/admin/themes/current/editor?context=apps`;
    }

    // Try from App Bridge config
    if (typeof window !== 'undefined' && (window as { shopify?: { config?: { shop?: string } } }).shopify?.config?.shop) {
      const shopDomain = (window as { shopify?: { config?: { shop?: string } } }).shopify!.config!.shop;
      return `https://${shopDomain}/admin/themes/current/editor?context=apps`;
    }

    // Fallback
    return 'https://admin.shopify.com/store/themes/current/editor?context=apps';
  };

  const handleOpenThemeEditor = () => {
    const url = getThemeEditorUrl();
    // Always open in a new tab
    window.open(url, '_blank', 'noopener,noreferrer');
  };

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
            <p>Click &quot;Add section&quot; → Apps → TurboCart Upsells</p>
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
        <button
          onClick={handleOpenThemeEditor}
          className="action-button primary"
        >
          Open Theme Editor
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M6 3H3V13H13V10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
            <path d="M9 3H13V7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M13 3L7 9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
          </svg>
        </button>
      </div>

      <div className="verification-box">
        <label className="checkbox-label">
          <input
            type="checkbox"
            checked={themeEnabled}
            onChange={(e) => onThemeEnabledChange(e.target.checked)}
          />
          <span className="checkmark" />
          <span>I&apos;ve added TurboCart to my theme</span>
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
          background: #000;
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
          background: #000;
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
 * Step 6: Live! - Clean Success Screen
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
      {/* Clean success icon - black circle with gradient checkmark */}
      <div className="success-icon">
        <svg width="80" height="80" viewBox="0 0 80 80" fill="none">
          <circle cx="40" cy="40" r="40" fill="#000000" />
          <defs>
            <linearGradient id="checkGradient" x1="20" y1="40" x2="60" y2="40">
              <stop offset="0%" stopColor="#667eea" />
              <stop offset="100%" stopColor="#764ba2" />
            </linearGradient>
          </defs>
          <path
            d="M24 40L35 51L56 28"
            stroke="url(#checkGradient)"
            strokeWidth="4"
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
          />
        </svg>
      </div>

      <h2 className="live-title">You&apos;re All Set!</h2>
      <p className="live-subtitle">
        TurboCart is now configured and ready to boost your revenue.
      </p>

      <div className="summary-card">
        <div className="summary-header">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M8 1L9.5 6L14.5 7L9.5 8L8 13L6.5 8L1.5 7L6.5 6L8 1Z" fill="#667eea" />
          </svg>
          <span>Your Setup Summary</span>
        </div>
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
            <span className={`summary-value ${data.settings.mlEnabled ? 'enabled' : ''}`}>
              {data.settings.mlEnabled ? 'ON' : 'OFF'}
            </span>
            <span className="summary-label">Machine Learning</span>
          </div>
        </div>
      </div>

      <div className="whats-next">
        <h3>What Happens Now?</h3>
        <ul>
          <li>
            <span className="bullet">1</span>
            <span>Machine Learning starts learning from customer behavior</span>
          </li>
          <li>
            <span className="bullet">2</span>
            <span>Display styles are A/B tested to find the best performer</span>
          </li>
          <li>
            <span className="bullet">3</span>
            <span>Revenue analytics update in real-time on your dashboard</span>
          </li>
        </ul>
      </div>

      <button
        className="complete-button"
        onClick={onComplete}
        disabled={saving}
      >
        {saving ? 'Setting up...' : 'Go to Dashboard'}
        <svg width="18" height="18" viewBox="0 0 20 20" fill="none">
          <path d="M4 10H16M16 10L11 5M16 10L11 15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </button>

      <style jsx>{`
        .live-step {
          text-align: center;
          max-width: 500px;
          margin: 0 auto;
        }

        .success-icon {
          margin: 0 auto 32px;
        }

        .live-title {
          font-size: 28px;
          font-weight: 600;
          color: #1d1d1f;
          margin: 0 0 8px 0;
        }

        .live-subtitle {
          font-size: 16px;
          color: #86868b;
          margin: 0 0 32px 0;
        }

        .summary-card {
          background: #fff;
          border: 1px solid rgba(0, 0, 0, 0.08);
          border-radius: 16px;
          padding: 24px;
          margin-bottom: 24px;
        }

        .summary-header {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          margin-bottom: 20px;
          font-size: 12px;
          font-weight: 600;
          color: #86868b;
          text-transform: uppercase;
          letter-spacing: 1px;
        }

        .summary-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 16px;
        }

        .summary-item {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 8px;
          padding: 16px 8px;
          background: #f8f8fa;
          border-radius: 12px;
        }

        .summary-value {
          font-size: 24px;
          font-weight: 600;
          color: #667eea;
        }

        .summary-value.enabled {
          color: #10b981;
        }

        .summary-label {
          font-size: 11px;
          color: #86868b;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          text-align: center;
          line-height: 1.3;
        }

        .whats-next {
          background: #f8f8fa;
          border-radius: 16px;
          padding: 24px;
          margin-bottom: 32px;
          text-align: left;
        }

        .whats-next h3 {
          font-size: 15px;
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
          padding: 8px 0;
          font-size: 14px;
          color: #1d1d1f;
          line-height: 1.4;
        }

        .bullet {
          width: 22px;
          height: 22px;
          background: #000;
          color: #fff;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 11px;
          font-weight: 600;
          flex-shrink: 0;
        }

        .complete-button {
          background: #000;
          color: #fff;
          border: none;
          padding: 14px 32px;
          border-radius: 12px;
          font-size: 16px;
          font-weight: 600;
          cursor: pointer;
          display: inline-flex;
          align-items: center;
          gap: 10px;
          transition: opacity 0.2s ease;
        }

        .complete-button:hover:not(:disabled) {
          opacity: 0.9;
        }

        .complete-button:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        @media (max-width: 480px) {
          .summary-grid {
            grid-template-columns: 1fr;
            gap: 12px;
          }

          .summary-item {
            flex-direction: row;
            justify-content: space-between;
            padding: 14px 16px;
          }

          .summary-value {
            font-size: 20px;
          }
        }
      `}</style>
    </div>
  );
}
