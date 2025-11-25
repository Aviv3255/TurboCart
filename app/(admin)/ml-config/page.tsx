/**
 * ML Configuration Page
 * Configure which display styles the ML engine can choose from
 */

'use client';

import { useState, useEffect } from 'react';
import { Page, Card, Checkbox, Button, Banner, Badge, Text } from '@shopify/polaris';

interface DisplayStyleOption {
  value: string;
  label: string;
  description: string;
  enabled: boolean;
}

const AVAILABLE_DISPLAY_STYLES: Array<{
  value: string;
  label: string;
  description: string;
}> = [
  {
    value: 'minimal-strip',
    label: 'Minimal Strip',
    description: 'Clean horizontal row of products. Modern, subtle design.',
  },
  {
    value: 'list',
    label: 'Simple List',
    description: 'Vertical list with checkboxes. Great for multi-select.',
  },
  {
    value: 'banner',
    label: 'Selling Fast',
    description: 'Single prominent upsell with urgency indicator.',
  },
  {
    value: 'cards',
    label: 'Compact Cards',
    description: 'Grid layout with image-first cards.',
  },
  {
    value: 'frequently-bought',
    label: 'Frequently Bought Together',
    description: 'Bundle-style display showing cart + upsell pairing.',
  },
];

export default function MLConfigPage() {
  const [displayStyles, setDisplayStyles] = useState<DisplayStyleOption[]>(
    AVAILABLE_DISPLAY_STYLES.map((style) => ({
      ...style,
      enabled: true, // Default: all enabled
    }))
  );
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchConfig();
  }, []);

  const fetchConfig = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/settings');

      if (!response.ok) throw new Error('Failed to fetch');

      const data = await response.json();

      if (data.settings?.enabled_display_styles) {
        const enabledStyles = data.settings.enabled_display_styles;

        setDisplayStyles(
          AVAILABLE_DISPLAY_STYLES.map((style) => ({
            ...style,
            enabled: enabledStyles.includes(style.value),
          }))
        );
      }
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleToggle = (styleValue: string) => {
    setDisplayStyles((prev) =>
      prev.map((style) =>
        style.value === styleValue ? { ...style, enabled: !style.enabled } : style
      )
    );
  };

  const handleSave = async () => {
    const enabledCount = displayStyles.filter((s) => s.enabled).length;

    if (enabledCount === 0) {
      alert('Please enable at least one display style');
      return;
    }

    try {
      setSaving(true);
      setSaved(false);

      const enabledStyles = displayStyles.filter((s) => s.enabled).map((s) => s.value);

      const response = await fetch('/api/admin/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          settings: {
            enabled_display_styles: enabledStyles,
          },
        }),
      });

      if (!response.ok) throw new Error('Failed to save');

      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (error) {
      console.error('Error:', error);
      alert('Failed to save configuration. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const enabledCount = displayStyles.filter((s) => s.enabled).length;

  if (loading) {
    return (
      <Page title="ML Configuration">
        <div style={{ padding: '60px', textAlign: 'center' }}>
          <div className="spinner-cosmic mx-auto"></div>
          <p style={{ marginTop: '16px' }}>Loading configuration...</p>
        </div>
      </Page>
    );
  }

  return (
    <Page
      title="ML Optimization Configuration"
      subtitle="Select which display styles the AI can test and optimize"
      primaryAction={{
        content: 'Save Configuration',
        onAction: handleSave,
        loading: saving,
      }}
    >
      {saved && (
        <div style={{ marginBottom: '20px' }}>
          <Banner tone="success" title="Configuration saved!">
            <p>The ML engine will now optimize across {enabledCount} display styles.</p>
          </Banner>
        </div>
      )}

      <Card>
        <div style={{ padding: '24px' }}>
          <div className="ml-config-header">
            <div>
              <h2 style={{ fontSize: '18px', fontWeight: '700', marginBottom: '8px' }}>
                Display Style Pool
              </h2>
              <p style={{ fontSize: '14px', color: 'var(--text-secondary)', marginBottom: '16px' }}>
                The ML engine will automatically test these styles and show the best performer for
                each context
              </p>
            </div>
            <Badge tone="info">
              {`${enabledCount} of ${displayStyles.length} enabled`}
            </Badge>
          </div>

          <div className="info-box">
            <h3>🤖 How ML Optimization Works:</h3>
            <ul>
              <li>
                <strong>Automatic Testing:</strong> The AI shows different display styles to
                customers
              </li>
              <li>
                <strong>Learning:</strong> Tracks which styles generate the most revenue in
                different contexts
              </li>
              <li>
                <strong>Optimization:</strong> Automatically shows the best-performing style for
                each situation
              </li>
              <li>
                <strong>Continuous Improvement:</strong> Keeps learning and adapting over time
              </li>
            </ul>
          </div>

          <div className="styles-grid">
            {displayStyles.map((style) => (
              <div
                key={style.value}
                className={`style-config-card ${style.enabled ? 'enabled' : 'disabled'}`}
                onClick={() => handleToggle(style.value)}
              >
                <div className="style-config-header">
                  <Checkbox
                    label=""
                    checked={style.enabled}
                    onChange={() => handleToggle(style.value)}
                  />
                  <h3 className="style-config-title">{style.label}</h3>
                  {style.enabled && <Badge tone="success">Active</Badge>}
                </div>
                <p className="style-config-description">{style.description}</p>

                {style.enabled && (
                  <div className="style-config-status">
                    <span className="status-dot"></span>
                    <span>Available for ML optimization</span>
                  </div>
                )}
              </div>
            ))}
          </div>

          <div className="recommendation-box">
            <strong>💡 Recommendation:</strong> Enable 3-5 display styles for best results. Too few
            limits optimization potential, too many slows down learning.
          </div>
        </div>
      </Card>

      {/* Configuration Guide */}
      <Card>
        <div style={{ padding: '24px' }}>
          <h2 style={{ fontSize: '18px', fontWeight: '700', marginBottom: '16px' }}>
            Optimization Strategy
          </h2>

          <div className="strategy-grid">
            <div className="strategy-card">
              <div className="strategy-icon">🎯</div>
              <h3>80% Exploitation</h3>
              <p>Shows proven winners to maximize revenue</p>
            </div>

            <div className="strategy-card">
              <div className="strategy-icon">🔬</div>
              <h3>20% Exploration</h3>
              <p>Tests new combinations to discover improvements</p>
            </div>

            <div className="strategy-card">
              <div className="strategy-icon">📈</div>
              <h3>Context-Aware</h3>
              <p>Learns which styles work best for different cart values and item counts</p>
            </div>

            <div className="strategy-card">
              <div className="strategy-icon">⚡</div>
              <h3>Real-Time Learning</h3>
              <p>Updates recommendations instantly based on customer behavior</p>
            </div>
          </div>
        </div>
      </Card>

      <style jsx>{`
        .ml-config-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 24px;
        }

        .info-box {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          padding: 20px;
          border-radius: 12px;
          margin-bottom: 24px;
        }

        .info-box h3 {
          font-size: 16px;
          margin-bottom: 12px;
        }

        .info-box ul {
          list-style: none;
          padding: 0;
        }

        .info-box li {
          padding: 8px 0;
          font-size: 14px;
        }

        .styles-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
          gap: 16px;
          margin-bottom: 24px;
        }

        .style-config-card {
          border: 2px solid var(--border-color);
          border-radius: 12px;
          padding: 16px;
          cursor: pointer;
          transition: all 0.2s;
        }

        .style-config-card.enabled {
          border-color: #667eea;
          background: rgba(102, 126, 234, 0.05);
        }

        .style-config-card.disabled {
          opacity: 0.6;
        }

        .style-config-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
        }

        .style-config-header {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-bottom: 8px;
        }

        .style-config-title {
          font-size: 16px;
          font-weight: 600;
          flex: 1;
        }

        .style-config-description {
          font-size: 14px;
          color: var(--text-secondary);
          margin-bottom: 12px;
        }

        .style-config-status {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 12px;
          color: #2ecc71;
        }

        .status-dot {
          width: 8px;
          height: 8px;
          background: #2ecc71;
          border-radius: 50%;
          animation: pulse 2s infinite;
        }

        @keyframes pulse {
          0%,
          100% {
            opacity: 1;
          }
          50% {
            opacity: 0.5;
          }
        }

        .recommendation-box {
          background: #fff8e1;
          border: 2px solid #ffd54f;
          padding: 16px;
          border-radius: 8px;
          font-size: 14px;
        }

        .strategy-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 16px;
        }

        .strategy-card {
          background: var(--bg-secondary);
          padding: 20px;
          border-radius: 12px;
          text-align: center;
        }

        .strategy-icon {
          font-size: 32px;
          margin-bottom: 12px;
        }

        .strategy-card h3 {
          font-size: 16px;
          font-weight: 600;
          margin-bottom: 8px;
        }

        .strategy-card p {
          font-size: 13px;
          color: var(--text-secondary);
        }
      `}</style>
    </Page>
  );
}
