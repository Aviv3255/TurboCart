/**
 * TurboCart Onboarding - Premium Introduction
 *
 * Clean, informational onboarding with elegant animations.
 * No actions taken here - just explains the features.
 */

'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { authenticatedFetch } from '@/lib/shopify/authenticated-fetch';

type Step = 'intro' | 'features' | 'ready';

// SVG Icons - Clean, consistent style
const Icons = {
  cart: (
    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/>
      <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/>
    </svg>
  ),
  gift: (
    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 12 20 22 4 22 4 12"/><rect x="2" y="7" width="20" height="5"/>
      <line x1="12" y1="22" x2="12" y2="7"/><path d="M12 7H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7z"/>
      <path d="M12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7z"/>
    </svg>
  ),
  zap: (
    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
    </svg>
  ),
  clock: (
    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
    </svg>
  ),
  megaphone: (
    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 11l18-5v12L3 14v-3z"/><path d="M11.6 16.8a3 3 0 1 1-5.8-1.6"/>
    </svg>
  ),
  check: (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12"/>
    </svg>
  ),
  arrowRight: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/>
    </svg>
  ),
};

const FEATURES = [
  {
    id: 'upsells',
    icon: Icons.cart,
    title: 'Cart Upsells',
    description: 'Display product recommendations directly in the cart to increase average order value.',
  },
  {
    id: 'rewards',
    icon: Icons.gift,
    title: 'Rewards Progress',
    description: 'Show progress bars for free shipping, discounts, and other incentives.',
  },
  {
    id: 'addons',
    icon: Icons.zap,
    title: 'Quick Add-Ons',
    description: 'One-click additions like shipping protection, gift wrapping, and more.',
  },
  {
    id: 'timer',
    icon: Icons.clock,
    title: 'Urgency Timer',
    description: 'Create urgency with customizable countdown timers in the cart.',
  },
  {
    id: 'announcement',
    icon: Icons.megaphone,
    title: 'Announcement Bar',
    description: 'Display custom promotional messages and important notices.',
  },
];

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>('intro');
  const [visible, setVisible] = useState(false);
  const [typedText, setTypedText] = useState('');
  const [showSubtext, setShowSubtext] = useState(false);
  const [featuresVisible, setFeaturesVisible] = useState<boolean[]>([false, false, false, false, false]);

  const fullText = 'Welcome to TurboCart';

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

  // Intro animations
  useEffect(() => {
    if (step === 'intro') {
      setVisible(true);
      // Typing effect
      let i = 0;
      const typingInterval = setInterval(() => {
        if (i <= fullText.length) {
          setTypedText(fullText.slice(0, i));
          i++;
        } else {
          clearInterval(typingInterval);
          setTimeout(() => setShowSubtext(true), 300);
        }
      }, 60);
      return () => clearInterval(typingInterval);
    }
  }, [step]);

  // Features animation
  useEffect(() => {
    if (step === 'features') {
      FEATURES.forEach((_, index) => {
        setTimeout(() => {
          setFeaturesVisible(prev => {
            const newState = [...prev];
            newState[index] = true;
            return newState;
          });
        }, index * 150);
      });
    }
  }, [step]);

  const goToStep = (nextStep: Step) => {
    setVisible(false);
    setShowSubtext(false);
    setFeaturesVisible([false, false, false, false, false]);
    setTimeout(() => {
      setStep(nextStep);
      setVisible(true);
    }, 400);
  };

  const completeOnboarding = async () => {
    try {
      await authenticatedFetch('/api/admin/shop/complete-onboarding', {
        method: 'POST',
      });
      router.push('/dashboard');
    } catch (e) {
      console.error('Error completing onboarding:', e);
      router.push('/dashboard');
    }
  };

  return (
    <div className="onboarding">
      <div className={`content ${visible ? 'visible' : ''}`}>

        {/* Step 1: Intro */}
        {step === 'intro' && (
          <div className="step-intro">
            <div className="logo">
              <span>TC</span>
            </div>

            <h1 className="typed-title">
              {typedText}
              <span className="cursor">|</span>
            </h1>

            <p className={`subtitle ${showSubtext ? 'visible' : ''}`}>
              The premium cart optimization suite for Shopify
            </p>

            <div className={`intro-features ${showSubtext ? 'visible' : ''}`}>
              <div className="intro-feature">
                <span className="icon">{Icons.check}</span>
                <span>Increase average order value</span>
              </div>
              <div className="intro-feature">
                <span className="icon">{Icons.check}</span>
                <span>Reduce cart abandonment</span>
              </div>
              <div className="intro-feature">
                <span className="icon">{Icons.check}</span>
                <span>Professional cart experience</span>
              </div>
            </div>

            <button
              className={`btn-primary ${showSubtext ? 'visible' : ''}`}
              onClick={() => goToStep('features')}
            >
              <span>Discover Features</span>
              {Icons.arrowRight}
            </button>
          </div>
        )}

        {/* Step 2: Features Overview */}
        {step === 'features' && (
          <div className="step-features">
            <div className="step-header">
              <h1>Five Powerful Features</h1>
              <p>Everything you need to optimize your cart</p>
            </div>

            <div className="features-list">
              {FEATURES.map((feature, index) => (
                <div
                  key={feature.id}
                  className={`feature-item ${featuresVisible[index] ? 'visible' : ''}`}
                >
                  <div className="feature-icon">{feature.icon}</div>
                  <div className="feature-content">
                    <h3>{feature.title}</h3>
                    <p>{feature.description}</p>
                  </div>
                </div>
              ))}
            </div>

            <button className="btn-primary" onClick={() => goToStep('ready')}>
              <span>Continue</span>
              {Icons.arrowRight}
            </button>
          </div>
        )}

        {/* Step 3: Ready */}
        {step === 'ready' && (
          <div className="step-ready">
            <div className="ready-icon">
              {Icons.check}
            </div>

            <h1>Ready to Go</h1>
            <p>Configure each feature from your dashboard. Enable or disable them anytime with a single click.</p>

            <div className="ready-info">
              <div className="info-item">
                <strong>Dashboard</strong>
                <span>Toggle features on/off and access settings</span>
              </div>
              <div className="info-item">
                <strong>Theme Editor</strong>
                <span>Add the TurboCart block to your cart template</span>
              </div>
            </div>

            <button className="btn-primary large" onClick={completeOnboarding}>
              <span>Go to Dashboard</span>
              {Icons.arrowRight}
            </button>
          </div>
        )}
      </div>

      <style jsx>{`
        .onboarding {
          min-height: 100vh;
          background: linear-gradient(145deg, #0a0a0f 0%, #111118 50%, #0d0d12 100%);
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 40px 24px;
        }

        .content {
          max-width: 680px;
          width: 100%;
          opacity: 0;
          transform: translateY(20px);
          transition: all 0.5s cubic-bezier(0.4, 0, 0.2, 1);
        }

        .content.visible {
          opacity: 1;
          transform: translateY(0);
        }

        /* Intro Step */
        .step-intro {
          text-align: center;
        }

        .logo {
          width: 72px;
          height: 72px;
          background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
          border-radius: 18px;
          display: flex;
          align-items: center;
          justify-content: center;
          margin: 0 auto 40px;
          box-shadow: 0 20px 50px rgba(99, 102, 241, 0.25);
        }

        .logo span {
          font-size: 28px;
          font-weight: 700;
          color: white;
          letter-spacing: -1px;
        }

        .typed-title {
          font-size: 48px;
          font-weight: 700;
          color: white;
          margin: 0 0 16px;
          letter-spacing: -1px;
          min-height: 60px;
        }

        .cursor {
          animation: blink 1s infinite;
          color: #6366f1;
        }

        @keyframes blink {
          0%, 50% { opacity: 1; }
          51%, 100% { opacity: 0; }
        }

        .subtitle {
          font-size: 18px;
          color: rgba(255, 255, 255, 0.5);
          margin: 0 0 48px;
          opacity: 0;
          transform: translateY(10px);
          transition: all 0.5s ease;
        }

        .subtitle.visible {
          opacity: 1;
          transform: translateY(0);
        }

        .intro-features {
          display: flex;
          flex-direction: column;
          gap: 16px;
          margin-bottom: 48px;
          opacity: 0;
          transform: translateY(10px);
          transition: all 0.5s ease 0.2s;
        }

        .intro-features.visible {
          opacity: 1;
          transform: translateY(0);
        }

        .intro-feature {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 12px;
          color: rgba(255, 255, 255, 0.7);
          font-size: 15px;
        }

        .intro-feature .icon {
          color: #10b981;
          display: flex;
        }

        .btn-primary {
          display: inline-flex;
          align-items: center;
          gap: 10px;
          background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
          color: white;
          padding: 16px 32px;
          border: none;
          border-radius: 12px;
          font-size: 16px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s ease;
          opacity: 0;
          transform: translateY(10px);
        }

        .btn-primary.visible, .step-features .btn-primary, .step-ready .btn-primary {
          opacity: 1;
          transform: translateY(0);
        }

        .btn-primary:hover {
          transform: translateY(-2px);
          box-shadow: 0 12px 35px rgba(99, 102, 241, 0.35);
        }

        .btn-primary.large {
          padding: 18px 40px;
          font-size: 17px;
        }

        /* Features Step */
        .step-features {
          text-align: center;
        }

        .step-header {
          margin-bottom: 40px;
        }

        .step-header h1 {
          font-size: 36px;
          font-weight: 700;
          color: white;
          margin: 0 0 8px;
          letter-spacing: -0.5px;
        }

        .step-header p {
          font-size: 16px;
          color: rgba(255, 255, 255, 0.5);
          margin: 0;
        }

        .features-list {
          display: flex;
          flex-direction: column;
          gap: 16px;
          margin-bottom: 40px;
        }

        .feature-item {
          display: flex;
          align-items: flex-start;
          gap: 20px;
          background: rgba(255, 255, 255, 0.03);
          border: 1px solid rgba(255, 255, 255, 0.06);
          border-radius: 16px;
          padding: 24px;
          text-align: left;
          opacity: 0;
          transform: translateX(-20px);
          transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
        }

        .feature-item.visible {
          opacity: 1;
          transform: translateX(0);
        }

        .feature-icon {
          width: 56px;
          height: 56px;
          background: rgba(99, 102, 241, 0.1);
          border-radius: 14px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #8b5cf6;
          flex-shrink: 0;
        }

        .feature-content h3 {
          font-size: 17px;
          font-weight: 600;
          color: white;
          margin: 0 0 6px;
        }

        .feature-content p {
          font-size: 14px;
          color: rgba(255, 255, 255, 0.5);
          margin: 0;
          line-height: 1.5;
        }

        /* Ready Step */
        .step-ready {
          text-align: center;
        }

        .ready-icon {
          width: 80px;
          height: 80px;
          background: linear-gradient(135deg, #10b981 0%, #059669 100%);
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          margin: 0 auto 32px;
          color: white;
          box-shadow: 0 20px 50px rgba(16, 185, 129, 0.25);
        }

        .ready-icon :global(svg) {
          width: 40px;
          height: 40px;
        }

        .step-ready h1 {
          font-size: 36px;
          font-weight: 700;
          color: white;
          margin: 0 0 12px;
        }

        .step-ready > p {
          font-size: 16px;
          color: rgba(255, 255, 255, 0.5);
          margin: 0 0 40px;
          max-width: 480px;
          margin-left: auto;
          margin-right: auto;
          line-height: 1.6;
        }

        .ready-info {
          display: flex;
          flex-direction: column;
          gap: 16px;
          margin-bottom: 40px;
        }

        .info-item {
          background: rgba(255, 255, 255, 0.03);
          border: 1px solid rgba(255, 255, 255, 0.06);
          border-radius: 12px;
          padding: 20px 24px;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .info-item strong {
          font-size: 15px;
          font-weight: 600;
          color: white;
        }

        .info-item span {
          font-size: 14px;
          color: rgba(255, 255, 255, 0.5);
        }

        /* Responsive */
        @media (max-width: 640px) {
          .typed-title {
            font-size: 32px;
          }

          .step-header h1, .step-ready h1 {
            font-size: 28px;
          }

          .feature-item {
            flex-direction: column;
            text-align: center;
          }

          .feature-icon {
            margin: 0 auto;
          }

          .info-item {
            flex-direction: column;
            gap: 4px;
            text-align: center;
          }
        }
      `}</style>
    </div>
  );
}
