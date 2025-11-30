/**
 * Settings Page - Multi-Display Style Selector
 * Choose 1-3 display styles for ML A/B testing optimization
 */

'use client';

import { useState, useEffect } from 'react';
import { Page, Card, Checkbox, Button, Banner, BlockStack, Text, InlineStack } from '@shopify/polaris';
import DisplayStylePreview from '@/components/DisplayStylePreview';
import { authenticatedFetch } from '@/lib/shopify/authenticated-fetch';

type DisplayStyle = 'minimal-strip' | 'list' | 'banner' | 'cards' | 'frequently-bought' | 'masonry-grid' | 'vertical-scroll' | 'sticky-tabs' | 'comparison-table';

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
    description: 'Clean horizontal row of products. Modern, subtle design with no navigation arrows. Up to 25 products.',
    preview: '[Product A] [Product B] [Product C]',
    recommended: true,
  },
  {
    value: 'cards',
    label: 'Compact Cards (Slider)',
    description: 'Grid layout with image-first cards. Clean and space-efficient with slider navigation. Up to 25 products.',
    preview: '[Card 1] [Card 2] [Card 3]\n$29.99   $19.99   $24.99',
    recommended: true,
  },
  {
    value: 'frequently-bought',
    label: 'Frequently Bought Together',
    description: 'Bundle-style display showing cart item + upsell. Contextual pairing for higher conversion.',
    preview: '[Cart Item] + [Upsell] = Bundle Price',
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
    label: 'Urgency Banner',
    description: 'Single prominent upsell with urgency indicator. High visibility, focused attention.',
    preview: '[Image] Add Product - SELLING FAST! [Add to Cart]',
  },
  {
    value: 'masonry-grid',
    label: 'Masonry Grid',
    description: 'Pinterest-style masonry layout with varying card heights. Dynamic, visually engaging multi-row display.',
    preview: '[Card 1 Tall]\n[Card 2] [Card 3]\n[Card 4]',
  },
  {
    value: 'vertical-scroll',
    label: 'Vertical Scroll Gallery',
    description: 'Tall vertical gallery with large product images. Immersive scrollable experience, great for visual products.',
    preview: '[Large Image A]\n[Large Image B]\n[Large Image C]',
  },
  {
    value: 'sticky-tabs',
    label: 'Category Tabs',
    description: 'Tabbed interface with product categories. Organized navigation for browsing by type or collection.',
    preview: '[Tab: Best Sellers] [Tab: New] [Tab: Sale]\n[Product A] [Product B] [Product C]',
  },
  {
    value: 'comparison-table',
    label: 'Product Comparison Table',
    description: 'Side-by-side comparison of product features and prices. Helps customers make informed decisions.',
    preview: '[Product A vs B vs C] | Features | Prices | [Select]',
  },
];

const MAX_STYLES = 3;

export default function SettingsPage() {
  const [selectedStyles, setSelectedStyles] = useState<DisplayStyle[]>(['minimal-strip']);
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
      const response = await authenticatedFetch('/api/admin/settings');

      if (!response.ok) {
        throw new Error('Failed to fetch settings');
      }

      const data = await response.json();
      if (data.settings) {
        // Handle both old single style and new multi-style format
        if (data.settings.enabled_display_styles && Array.isArray(data.settings.enabled_display_styles)) {
          setSelectedStyles(data.settings.enabled_display_styles);
        } else if (data.settings.display_style) {
          setSelectedStyles([data.settings.display_style]);
        }
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

  const toggleStyle = (style: DisplayStyle) => {
    if (selectedStyles.includes(style)) {
      // Don't allow removing the last style
      if (selectedStyles.length > 1) {
        setSelectedStyles(selectedStyles.filter(s => s !== style));
      }
    } else {
      // Only add if under max limit
      if (selectedStyles.length < MAX_STYLES) {
        setSelectedStyles([...selectedStyles, style]);
      }
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      setSaved(false);

      const response = await authenticatedFetch('/api/admin/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          settings: {
            enabled_display_styles: selectedStyles,
            display_style: selectedStyles[0], // Keep backward compatibility
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

  const isValidSelection = selectedStyles.length >= 1 && selectedStyles.length <= MAX_STYLES;

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
        disabled: !isValidSelection,
      }}
    >
      {saved && (
        <div style={{ marginBottom: '20px' }}>
          <Banner tone="success" title="Settings saved successfully!">
            <p>Your display styles have been updated. The ML engine will A/B test them automatically.</p>
          </Banner>
        </div>
      )}

      {/* Multi-Style Selection Info */}
      <div style={{ marginBottom: '20px' }}>
        <Banner tone="info">
          <p>
            <strong>ML A/B Testing:</strong> Select 1-3 display styles. The ML engine will automatically test all selected styles
            and optimize towards the one that converts best for each cart context.
          </p>
        </Banner>
      </div>

      <Card>
        <div style={{ padding: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <div>
              <h2 style={{ fontSize: '18px', fontWeight: '700', marginBottom: '4px' }}>
                Display Styles
              </h2>
              <p style={{ fontSize: '14px', color: 'var(--text-secondary)', margin: 0 }}>
                Choose 1-3 styles for ML optimization
              </p>
            </div>
            <div className="selection-badge" style={{
              padding: '8px 16px',
              borderRadius: '20px',
              background: isValidSelection ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' : '#ff6b6b',
              color: '#fff',
              fontWeight: '600',
              fontSize: '14px'
            }}>
              {selectedStyles.length} / {MAX_STYLES} selected
            </div>
          </div>

          <BlockStack gap="400">
            {STYLE_OPTIONS.map((option) => {
              const isSelected = selectedStyles.includes(option.value);
              const canSelect = isSelected || selectedStyles.length < MAX_STYLES;

              return (
                <div
                  key={option.value}
                  className={`style-option ${isSelected ? 'selected' : ''} ${!canSelect ? 'disabled' : ''}`}
                  onClick={() => canSelect && toggleStyle(option.value)}
                  style={{ opacity: canSelect ? 1 : 0.5, cursor: canSelect ? 'pointer' : 'not-allowed' }}
                >
                  <div className="style-option-header">
                    <InlineStack gap="300" align="center">
                      <Checkbox
                        label=""
                        labelHidden
                        checked={isSelected}
                        onChange={() => canSelect && toggleStyle(option.value)}
                        disabled={!canSelect}
                      />
                      <Text variant="bodyMd" fontWeight="bold" as="span">
                        {option.label}
                      </Text>
                      {option.recommended && (
                        <span className="badge-cosmic">Recommended</span>
                      )}
                      {isSelected && (
                        <span style={{
                          background: '#10b981',
                          color: '#fff',
                          padding: '2px 8px',
                          borderRadius: '10px',
                          fontSize: '11px',
                          fontWeight: '600'
                        }}>
                          Active
                        </span>
                      )}
                    </InlineStack>
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
              );
            })}
          </BlockStack>

          {selectedStyles.length === MAX_STYLES && (
            <div style={{ marginTop: '16px' }}>
              <Banner tone="warning">
                <p>Maximum {MAX_STYLES} styles selected. Deselect one to choose a different style.</p>
              </Banner>
            </div>
          )}
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
              How many upsell products to display at once (ML will select the best)
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
              <option value="6">6 products</option>
              <option value="8">8 products</option>
              <option value="10">10 products</option>
              <option value="15">15 products</option>
              <option value="20">20 products</option>
              <option value="25">25 products</option>
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
            <div className="setting-label">Enable ML A/B Testing</div>
            <div className="setting-description">
              Automatically test selected display styles and optimize for highest conversion
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

      {/* ML Info Card */}
      <Card>
        <div style={{ padding: '24px' }}>
          <h2 style={{ fontSize: '18px', fontWeight: '700', marginBottom: '16px' }}>
            How ML Optimization Works
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px' }}>
            <div className="info-card">
              <div className="info-icon">🧠</div>
              <h4>Thompson Sampling</h4>
              <p>Uses Bayesian statistics to balance exploring new options with exploiting known winners.</p>
            </div>
            <div className="info-card">
              <div className="info-icon">📊</div>
              <h4>Context-Aware</h4>
              <p>Different styles may work better for different cart values, times of day, and customer segments.</p>
            </div>
            <div className="info-card">
              <div className="info-icon">🎯</div>
              <h4>Continuous Learning</h4>
              <p>The system learns from every impression and conversion to improve over time.</p>
            </div>
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

        .style-option:hover:not(.disabled) {
          border-color: var(--cosmic-from);
          box-shadow: var(--shadow-cosmic);
        }

        .style-option.selected {
          border-color: var(--cosmic-from);
          background: linear-gradient(90deg, rgba(102, 126, 234, 0.08) 0%, transparent 100%);
        }

        .style-option.disabled {
          cursor: not-allowed;
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

        .info-card {
          background: linear-gradient(135deg, rgba(102, 126, 234, 0.05) 0%, rgba(118, 75, 162, 0.05) 100%);
          border-radius: 12px;
          padding: 20px;
          text-align: center;
        }

        .info-icon {
          font-size: 32px;
          margin-bottom: 12px;
        }

        .info-card h4 {
          font-size: 15px;
          font-weight: 600;
          color: var(--text-primary);
          margin: 0 0 8px 0;
        }

        .info-card p {
          font-size: 13px;
          color: var(--text-secondary);
          margin: 0;
          line-height: 1.5;
        }
      `}</style>
    </Page>
  );
}
