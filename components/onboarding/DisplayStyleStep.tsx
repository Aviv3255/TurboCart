/**
 * Onboarding Step 3: Display Style Selection
 */

'use client';

import { Card, RadioButton, Stack } from '@shopify/polaris';

type DisplayStyle = 'carousel' | 'list' | 'banner' | 'cards' | 'frequently-bought';

interface StyleOption {
  value: DisplayStyle;
  label: string;
  description: string;
  preview: string;
  recommended?: boolean;
}

const STYLE_OPTIONS: StyleOption[] = [
  {
    value: 'carousel',
    label: 'Clean Carousel',
    description: 'Horizontal scrolling with 2-3 products visible. Perfect for product discovery.',
    preview: '← [Product A] [Product B] [Product C] →',
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
    label: 'Discount Banner',
    description: 'Single prominent upsell with savings message. High visibility, focused attention.',
    preview: '[Image] Add Product - Save $6.00! [Add to Cart]',
  },
  {
    value: 'cards',
    label: 'Compact Cards',
    description: 'Grid layout with image-first cards. Clean and space-efficient.',
    preview: '[Card 1] [Card 2] [Card 3]',
  },
  {
    value: 'frequently-bought',
    label: 'Frequently Bought Together',
    description: 'Bundle-style display showing cart item + upsell. Contextual pairing.',
    preview: '[Cart Item] + [Upsell] = Bundle Price',
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

          <Stack vertical spacing="loose">
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

                <p className="style-description">{option.description}</p>

                <div className="style-preview">
                  <code>{option.preview}</code>
                </div>
              </div>
            ))}
          </Stack>
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

        .style-description {
          font-size: 14px;
          color: var(--text-secondary);
          margin: 12px 0 12px 32px;
          line-height: 1.5;
        }

        .style-preview {
          margin: 12px 0 0 32px;
          padding: 16px;
          background: var(--bg-secondary);
          border-radius: 8px;
          border-left: 4px solid var(--cosmic-from);
        }

        .style-preview code {
          font-family: 'SF Mono', 'Monaco', monospace;
          font-size: 12px;
          color: var(--text-secondary);
          white-space: pre-wrap;
        }

        .badge-cosmic {
          background: var(--cosmic-gradient);
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
