/**
 * Onboarding Flow
 * 5-step wizard to guide new merchants through setup
 */

'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Page, Card, Button, ProgressBar, Banner } from '@shopify/polaris';

// Step Components
import WelcomeStep from '@/components/onboarding/WelcomeStep';
import ProductSelectionStep from '@/components/onboarding/ProductSelectionStep';
import DisplayStyleStep from '@/components/onboarding/DisplayStyleStep';
import BillingStep from '@/components/onboarding/BillingStep';
import CompleteStep from '@/components/onboarding/CompleteStep';

type OnboardingStep = 1 | 2 | 3 | 4 | 5;

interface OnboardingData {
  selectedProducts: string[];
  displayStyle: string;
  maxUpsells: number;
  selectedPlan: string | null;
}

const STEP_TITLES = [
  'Welcome to TurboCart',
  'Select Products',
  'Choose Display Style',
  'Select Plan',
  'Setup Complete',
];

export default function OnboardingPage() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState<OnboardingStep>(1);
  const [data, setData] = useState<OnboardingData>({
    selectedProducts: [],
    displayStyle: 'carousel',
    maxUpsells: 3,
    selectedPlan: null,
  });
  const [loading, setLoading] = useState(false);

  const progress = (currentStep / 5) * 100;

  const handleNext = () => {
    if (currentStep < 5) {
      setCurrentStep((prev) => (prev + 1) as OnboardingStep);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep((prev) => (prev - 1) as OnboardingStep);
    }
  };

  const handleSkipToStep = (step: OnboardingStep) => {
    setCurrentStep(step);
  };

  const handleComplete = async () => {
    try {
      setLoading(true);

      // Save all settings
      await Promise.all([
        // Save product selection
        fetch('/api/admin/products/selected', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            products: data.selectedProducts,
          }),
        }),
        // Save display settings
        fetch('/api/admin/settings', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            settings: {
              display_style: data.displayStyle,
              max_upsells: data.maxUpsells,
            },
          }),
        }),
      ]);

      // Mark onboarding as complete
      localStorage.setItem('turbocart_onboarding_complete', 'true');

      // Redirect to dashboard
      setTimeout(() => {
        router.push('/dashboard?onboarding=complete');
      }, 1500);
    } catch (error) {
      console.error('Error completing onboarding:', error);
      alert('Failed to save settings. Please try again.');
      setLoading(false);
    }
  };

  const updateData = (updates: Partial<OnboardingData>) => {
    setData((prev) => ({ ...prev, ...updates }));
  };

  const canProceed = () => {
    switch (currentStep) {
      case 1:
        return true;
      case 2:
        return data.selectedProducts.length >= 10 && data.selectedProducts.length <= 50;
      case 3:
        return data.displayStyle !== '';
      case 4:
        return true; // Billing is optional during onboarding
      case 5:
        return true;
      default:
        return false;
    }
  };

  return (
    <Page
      title={STEP_TITLES[currentStep - 1]}
      subtitle={`Step ${currentStep} of 5`}
      backAction={currentStep > 1 ? { onAction: handleBack } : undefined}
    >
      {/* Progress Bar */}
      <div style={{ marginBottom: '24px' }}>
        <Card>
          <div style={{ padding: '16px' }}>
            <div style={{ marginBottom: '8px', display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ fontSize: '14px', fontWeight: '600' }}>
                Setup Progress
              </span>
              <span style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>
                {Math.round(progress)}%
              </span>
            </div>
            <ProgressBar progress={progress} size="small" />
          </div>
        </Card>
      </div>

      {/* Step Content */}
      <div className="onboarding-content">
        {currentStep === 1 && (
          <WelcomeStep onNext={handleNext} />
        )}

        {currentStep === 2 && (
          <ProductSelectionStep
            selectedProducts={data.selectedProducts}
            onUpdateProducts={(products) => updateData({ selectedProducts: products })}
            onNext={handleNext}
          />
        )}

        {currentStep === 3 && (
          <DisplayStyleStep
            selectedStyle={data.displayStyle}
            maxUpsells={data.maxUpsells}
            onUpdateStyle={(style) => updateData({ displayStyle: style })}
            onUpdateMaxUpsells={(max) => updateData({ maxUpsells: max })}
            onNext={handleNext}
          />
        )}

        {currentStep === 4 && (
          <BillingStep
            selectedPlan={data.selectedPlan}
            onSelectPlan={(plan) => updateData({ selectedPlan: plan })}
            onNext={handleNext}
            onSkip={handleNext}
          />
        )}

        {currentStep === 5 && (
          <CompleteStep
            data={data}
            onComplete={handleComplete}
            loading={loading}
          />
        )}
      </div>

      {/* Navigation Footer (for steps 2-4) */}
      {currentStep >= 2 && currentStep <= 4 && (
        <div style={{ marginTop: '24px' }}>
          <Card>
            <div style={{ padding: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Button onClick={handleBack}>
                Back
              </Button>
              <div style={{ display: 'flex', gap: '12px' }}>
                {currentStep === 4 && (
                  <Button onClick={handleNext}>
                    Skip for Now
                  </Button>
                )}
                <Button
                  variant="primary"
                  onClick={handleNext}
                  disabled={!canProceed()}
                >
                  Continue
                </Button>
              </div>
            </div>
          </Card>
        </div>
      )}

      <style jsx>{`
        .onboarding-content {
          min-height: 400px;
        }
      `}</style>
    </Page>
  );
}
