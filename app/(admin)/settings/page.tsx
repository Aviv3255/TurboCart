/**
 * Settings Page - Display Style Selector
 * Choose from 15 beautiful upsell display styles
 */

'use client';

import { useState, useEffect } from 'react';
import { Page, Card, RadioButton, Button, Banner, BlockStack } from '@shopify/polaris';
import DisplayStylePreview from '@/components/DisplayStylePreview';

type DisplayStyle = 'minimal-strip' | 'list' | 'banner' | 'cards' | 'frequently-bought' | 'masonry-grid' | 'carousel-arrows' | 'vertical-scroll' | 'spotlight' | 'sticky-tabs' | 'countdown-bundle' | 'progressive-discount' | 'quiz-match' | 'side-drawer' | 'comparison-table';

interface StyleOption {
  value: DisplayStyle;
  label: string;
  description: string;
  preview: string;
  recommended?: boolean;
}

const STYLE_OPTIONS: StyleOption[] = [
  {
    value: 'minimal-strip',
    label: 'Minimal Strip',
    description: 'Clean horizontal row of products. Modern, subtle design with no navigation arrows. up to 25 products.',
    preview: '[Product A] [Product B] [Product C]',
    recommended: true,
  },
  {
    value: 'list',
    label: 'Simple List',
    description: 'Vertical list with checkboxes. Great for multi-select and compact layouts.',
    preview: '☐ [Product A] $29.99 [+ Add]\n☐ [Product B] $19.99 [+ Add]',
  },
  {
    value: 'banner',
    label: 'Selling Fast',
    description: 'Single prominent upsell with urgency indicator. High visibility, focused attention.',
    preview: '[Image] Add Product - SELLING FAST! [Add to Cart]',
  },
  {
    value: 'cards',
    label: 'Compact Cards (slider)',
    description: 'Grid layout with image-first cards. Clean and space-efficient. עד 25 מוצרים',
    preview: '[Card 1] [Card 2] [Card 3]\n$29.99   $19.99   $24.99',
  },
  {
    value: 'frequently-bought',
    label: 'Frequently Bought Together',
    description: 'Bundle-style display showing cart item + upsell. Contextual pairing.',
    preview: '[Cart Item] + [Upsell] = Bundle Price',
  },
  {
    value: 'masonry-grid',
    label: 'Masonry Grid',
    description: 'Pinterest-style masonry layout with varying card heights. Dynamic, visually engaging multi-row display.',
    preview: '[Card 1 Tall]\n[Card 2] [Card 3]\n[Card 4]',
  },
  {
    value: 'carousel-arrows',
    label: 'Classic Carousel',
    description: 'Traditional carousel with navigation arrows and dots. Interactive browsing experience with manual control.',
    preview: '← [Product A] [Product B] [Product C] →\n● ○ ○',
  },
  {
    value: 'vertical-scroll',
    label: 'Vertical Scroll Gallery',
    description: 'Tall vertical gallery with large product images. Immersive scrollable experience, great for visual products.',
    preview: '[Large Image A]\n[Large Image B]\n[Large Image C]',
  },
  {
    value: 'spotlight',
    label: 'Featured Spotlight',
    description: 'Rotating featured product with auto-transition. Single large showcase that changes every few seconds.',
    preview: '★ [Featured Product - Auto-rotating] ★',
  },
  {
    value: 'sticky-tabs',
    label: 'Category Tabs',
    description: 'Tabbed interface with product categories. Organized navigation for browsing by type or collection.',
    preview: '[Tab: Best Sellers] [Tab: New] [Tab: Sale]\n[Product A] [Product B] [Product C]',
  },
  {
    value: 'countdown-bundle',
    label: 'Countdown Bundle Deal',
    description: 'Limited-time bundle offer with countdown timer. Creates urgency and scarcity for special promotions.',
    preview: '⏰ 2:45:30 LEFT | [Bundle] Save 30% | [Add Bundle]',
  },
  {
    value: 'progressive-discount',
    label: 'Progressive Discount Tiers',
    description: 'Tiered pricing display showing volume discounts. "Buy more, save more" approach to increase order value.',
    preview: 'Buy 2: 10% OFF | Buy 3: 20% OFF | Buy 4+: 30% OFF',
  },
  {
    value: 'quiz-match',
    label: 'Interactive Quiz Match',
    description: 'Interactive quiz-style product recommendations. Personalized suggestions based on customer preferences.',
    preview: '❓ Which feature matters most? [Speed] [Design] [Price]',
  },
  {
    value: 'side-drawer',
    label: 'Side Panel Drawer',
    description: 'Non-intrusive sliding panel from the side. Compact, elegant way to show add-ons without blocking content.',
    preview: '[Slide-in Panel] → Suggested Add-ons Inside',
  },
  {
    value: 'comparison-table',
    label: 'Product Comparison Table',
    description: 'Side-by-side comparison of product features and prices. Helps customers make informed decisions between options.',
    preview: '[Product A vs B vs C] | Features | Prices | [Select]',
  },
];

export default function SettingsPage() {
  const [selectedStyle, setSelectedStyle] = useState<DisplayStyle>('minimal-strip');
  const [maxUpsells, setMaxUpsells] = useState<number>(3);
  const [cartPosition, setCartPosition] = useState<'top' | 'bottom'>('top');
  const [abTestingEnabled, setAbTestingEnabled] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCurrentSettings();
  }, []);

  const fetchCurrentSettings = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/settings');

      if (!response.ok) {
        throw new Error('Failed to fetch settings');
      }

      const data = await response.json();
      if (data.settings) {
        setSelectedStyle(data.settings.display_style || 'minimal-strip');
        setMaxUpsells(data.settings.max_upsells || 3);
        setCartPosition(data.settings.position || 'top');
        setAbTestingEnabled(data.settings.enable_ab_testing !== false);
      }
    } catch (error) {
      console.error('Error fetching settings:', error);
      alert('Failed to load settings. Please refresh the page.');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      setSaved(false);

      const response = await fetch('/api/admin/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          settings: {
            display_style: selectedStyle,
            max_upsells: maxUpsells,
            position: cartPosition,
            enable_ab_testing: abTestingEnabled,
          },
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to save settings');
      }

      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (error) {
      console.error('Error saving:', error);
      alert('Failed to save settings. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Page title="Settings">
        <div style={{ padding: '60px', textAlign: 'center' }}>
          <div className="spinner-cosmic mx-auto"></div>
          <p style={{ marginTop: '16px' }}>Loading settings...</p>
        </div>
      </Page>
    );
  }

  return (
    <Page
      title="Settings"
      subtitle="Customize your upsell display"
      primaryAction={{
        content: 'Save Changes',
        onAction: handleSave,
        loading: saving,
      }}
    >
      {saved && (
        <div style={{ marginBottom: '20px' }}>
          <Banner tone="success" title="Settings saved successfully!">
            <p>Your display style has been updated.</p>
          </Banner>
        </div>
      )}

      <Card>
        <div style={{ padding: '24px' }}>
          <h2 style={{ fontSize: '18px', fontWeight: '700', marginBottom: '8px' }}>
            Display Style
          </h2>
          <p style={{ fontSize: '14px', color: 'var(--text-secondary)', marginBottom: '24px' }}>
            Choose how upsells appear to your customers
          </p>

          <BlockStack gap="400">
            {STYLE_OPTIONS.map((option) => (
              <div
                key={option.value}
                className={`style-option ${selectedStyle === option.value ? 'selected' : ''}`}
                onClick={() => setSelectedStyle(option.value)}
              >
                <div className="style-option-header">
                  <RadioButton
                    label={option.label}
                    checked={selectedStyle === option.value}
                    id={option.value}
                    onChange={() => setSelectedStyle(option.value)}
                  />
                  {option.recommended && (
                    <span className="badge-cosmic">Recommended</span>
                  )}
                </div>

                <div className="style-content-wrapper">
                  <div className="style-text-content">
                    <p className="style-description">{option.description}</p>
                  </div>
                  <div className="style-preview">
                    <DisplayStylePreview style={option.value} />
                  </div>
                </div>
              </div>
            ))}
          </BlockStack>
        </div>
      </Card>

      {/* Additional Settings */}
      <Card>
        <div style={{ padding: '24px' }}>
          <h2 style={{ fontSize: '18px', fontWeight: '700', marginBottom: '16px' }}>
            Advanced Options
          </h2>

          <div className="setting-item">
            <div className="setting-label">Maximum Upsells to Show</div>
            <div className="setting-description">
              How many upsell products to display at once (AI will select the best)
            </div>
            <select
              className="input"
              style={{ maxWidth: '200px', marginTop: '8px' }}
              value={maxUpsells}
              onChange={(e) => setMaxUpsells(parseInt(e.target.value))}
            >
              <option value="2">2 products</option>
              <option value="3">3 products</option>
              <option value="4">4 products</option>
              <option value="5">5 products</option>
              {selectedStyle === 'cards' && (
                <>
                  <option value="6">6 products</option>
                  <option value="8">8 products</option>
                  <option value="10">10 products</option>
                  <option value="12">12 products</option>
                  <option value="15">15 products</option>
                  <option value="20">20 products</option>
                  <option value="25">25 products</option>
                </>
              )}
            </select>
          </div>

          <div className="setting-item">
            <div className="setting-label">Cart Position</div>
            <div className="setting-description">Where to display upsells in the cart</div>
            <select
              className="input"
              style={{ maxWidth: '200px', marginTop: '8px' }}
              value={cartPosition}
              onChange={(e) => setCartPosition(e.target.value as 'top' | 'bottom')}
            >
              <option value="top">Top of cart</option>
              <option value="bottom">Bottom of cart</option>
            </select>
          </div>

          <div className="setting-item">
            <div className="setting-label">Enable A/B Testing</div>
            <div className="setting-description">
              Automatically test different product combinations to optimize revenue
            </div>
            <label className="toggle-switch">
              <input
                type="checkbox"
                checked={abTestingEnabled}
                onChange={(e) => setAbTestingEnabled(e.target.checked)}
              />
              <span className="toggle-slider"></span>
            </label>
          </div>
        </div>
      </Card>

      <style jsx>{`
        .style-option {
          padding: 20px;
          border: 2px solid var(--border-color);
          border-radius: 12px;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .style-option:hover {
          border-color: var(--cosmic-from);
          box-shadow: var(--shadow-cosmic);
        }

        .style-option.selected {
          border-color: var(--cosmic-from);
          background: linear-gradient(90deg, rgba(102, 126, 234, 0.05) 0%, transparent 100%);
        }

        .style-option-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 8px;
        }

        .style-content-wrapper {
          display: flex;
          gap: 24px;
          align-items: flex-start;
          margin: 12px 0 0 32px;
        }

        .style-text-content {
          flex: 1;
        }

        .style-description {
          font-size: 14px;
          color: var(--text-secondary);
          line-height: 1.5;
          margin: 0;
        }

        .style-preview {
          flex: 0 0 300px;
          border-radius: 8px;
          overflow: hidden;
        }

        .setting-item {
          padding: 20px 0;
          border-bottom: 1px solid var(--border-color);
        }

        .setting-item:last-child {
          border-bottom: none;
        }

        .setting-label {
          font-size: 16px;
          font-weight: 600;
          color: var(--text-primary);
          margin-bottom: 4px;
        }

        .setting-description {
          font-size: 14px;
          color: var(--text-secondary);
          line-height: 1.5;
        }

        .toggle-switch {
          display: inline-block;
          position: relative;
          width: 48px;
          height: 24px;
          margin-top: 8px;
        }

        .toggle-switch input {
          opacity: 0;
          width: 0;
          height: 0;
        }

        .toggle-slider {
          position: absolute;
          cursor: pointer;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background-color: var(--border-color);
          transition: 0.3s;
          border-radius: 24px;
        }

        .toggle-slider:before {
          position: absolute;
          content: '';
          height: 18px;
          width: 18px;
          left: 3px;
          bottom: 3px;
          background-color: white;
          transition: 0.3s;
          border-radius: 50%;
        }

        input:checked + .toggle-slider {
          background: var(--cosmic-gradient);
        }

        input:checked + .toggle-slider:before {
          transform: translateX(24px);
        }
      `}</style>
    </Page>
  );
}
