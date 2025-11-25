/**
 * Onboarding Step 3: Display Style Selection
 */

'use client';

import { Card, RadioButton, BlockStack } from '@shopify/polaris';
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
    preview: '☐ [Product A] $29.99 [+ Add]',
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
    preview: '[Card 1] [Card 2] [Card 3]',
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

interface DisplayStyleStepProps {
  selectedStyle: string;
  maxUpsells: number;
  onUpdateStyle: (style: string) => void;
  onUpdateMaxUpsells: (max: number) => void;
  onNext: () => void;
}

export default function DisplayStyleStep({
  selectedStyle,
  maxUpsells,
  onUpdateStyle,
  onUpdateMaxUpsells,
  onNext,
}: DisplayStyleStepProps) {
  return (
    <div>
      <Card>
        <div style={{ padding: '24px' }}>
          <h2 style={{ fontSize: '20px', fontWeight: '700', marginBottom: '8px' }}>
            Choose Your Display Style
          </h2>
          <p style={{ fontSize: '14px', color: 'var(--text-secondary)', marginBottom: '24px' }}>
            Select how upsells will appear to your customers in the cart
          </p>

          <BlockStack gap="400">
            {STYLE_OPTIONS.map((option) => (
              <div
                key={option.value}
                className={`style-option ${selectedStyle === option.value ? 'selected' : ''}`}
                onClick={() => onUpdateStyle(option.value)}
              >
                <div className="style-option-header">
                  <RadioButton
                    label={option.label}
                    checked={selectedStyle === option.value}
                    id={option.value}
                    onChange={() => onUpdateStyle(option.value)}
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

      {/* Advanced Settings */}
      <div style={{ marginTop: '20px' }}>
        <Card>
          <div style={{ padding: '24px' }}>
            <h3 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '16px' }}>
              Display Settings
            </h3>

            <div>
              <label style={{ fontSize: '14px', fontWeight: '600', display: 'block', marginBottom: '8px' }}>
                Maximum Upsells to Show
              </label>
              <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '12px' }}>
                How many upsell products to display at once
              </p>
              <select
                className="input"
                style={{ maxWidth: '200px' }}
                value={maxUpsells}
                onChange={(e) => onUpdateMaxUpsells(parseInt(e.target.value))}
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
          </div>
        </Card>
      </div>

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

        .badge-cosmic {
          background: #000;
          color: white;
          padding: 4px 12px;
          border-radius: 12px;
          font-size: 12px;
          font-weight: 600;
        }
      `}</style>
    </div>
  );
}
