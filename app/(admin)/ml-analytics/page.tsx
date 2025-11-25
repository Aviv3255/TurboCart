/**
 * ML Optimization Analytics Dashboard
 * Shows merchants how the AI is learning and improving their revenue
 */

'use client';

import { useState, useEffect } from 'react';
import { Page, Card, Button, Spinner, EmptyState, Badge, Tabs } from '@shopify/polaris';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
  Legend,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
} from 'recharts';
import { format } from 'date-fns';

interface MLAnalyticsData {
  modelState: {
    exploration_rate: number;
    total_decisions: number;
    exploration_decisions: number;
    exploitation_decisions: number;
    baseline_revenue_per_order: number;
    current_revenue_per_order: number;
    improvement_percentage: number;
    model_confidence: number;
    training_status: string;
  };
  displayPerformance: Array<{
    display_style: string;
    total_impressions: number;
    total_adds: number;
    total_revenue: number;
    revenue_per_impression: number;
    acceptance_rate: number;
    confidence_interval: { lower: number; upper: number };
  }>;
  productPerformance: Array<{
    title: string;
    total_impressions: number;
    total_adds: number;
    total_revenue: number;
    revenue_per_impression: number;
    conversion_rate: number;
    confidence_score: number;
    position_performance: Record<string, { impressions: number; adds: number; revenue: number }>;
  }>;
  contextHeatmap: Array<{
    cart_value_bucket: string;
    cart_item_count_bucket: string;
    display_style: string;
    revenue_per_impression: number;
    acceptance_rate: number;
  }>;
  improvement: {
    trend: Array<{ date: string; avgRevenue: number; decisionCount: number }>;
    exploitationVsExploration: Array<{
      type: string;
      avgRevenue: number;
      successRate: number;
    }>;
  };
}

export default function MLAnalyticsPage() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<MLAnalyticsData | null>(null);
  const [selectedTab, setSelectedTab] = useState(0);

  useEffect(() => {
    fetchMLAnalytics();
  }, []);

  const fetchMLAnalytics = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/ml-analytics?shop=demo-store.myshopify.com');

      if (!response.ok) throw new Error('Failed to fetch');

      const analyticsData = await response.json();
      setData(analyticsData);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(value);
  };

  const formatPercent = (value: number) => {
    return `${value.toFixed(1)}%`;
  };

  const getDisplayStyleLabel = (style: string) => {
    const labels: Record<string, string> = {
      'minimal-strip': 'Minimal Strip',
      list: 'List View',
      banner: 'Banner',
      cards: 'Product Cards',
      'frequently-bought': 'Frequently Bought',
      inline: 'Inline',
    };
    return labels[style] || style;
  };

  const getTrainingStatusColor = (status: string) => {
    const colors: Record<string, 'success' | 'info' | 'warning'> = {
      learning: 'info',
      trained: 'success',
      optimizing: 'warning',
    };
    return colors[status] || 'info';
  };

  if (loading) {
    return (
      <Page title="ML Optimization">
        <div style={{ padding: '60px', textAlign: 'center' }}>
          <Spinner size="large" />
          <p style={{ marginTop: '16px' }}>Loading ML analytics...</p>
        </div>
      </Page>
    );
  }

  if (!data || data.modelState.total_decisions === 0) {
    return (
      <Page title="ML Optimization">
        <EmptyState
          heading="ML Engine is learning"
          image="https://cdn.shopify.com/s/files/1/0262/4071/2726/files/emptystate-files.png"
        >
          <p>
            The ML optimization engine needs more data to start showing insights. Keep your upsells
            running to let the AI learn what works best!
          </p>
          <p style={{ marginTop: '12px' }}>
            <strong>Status:</strong> Collecting initial data...
          </p>
        </EmptyState>
      </Page>
    );
  }

  const { modelState, displayPerformance, productPerformance, contextHeatmap, improvement } = data;

  const tabs = [
    { id: 'overview', content: 'Overview', accessibilityLabel: 'ML Overview' },
    { id: 'display', content: 'Display Styles', accessibilityLabel: 'Display Style Performance' },
    { id: 'products', content: 'Products', accessibilityLabel: 'Product Performance' },
    { id: 'context', content: 'Context Analysis', accessibilityLabel: 'Context Analysis' },
  ];

  return (
    <Page
      title="ML Optimization Dashboard"
      subtitle="See how the AI is learning and improving your revenue"
      secondaryActions={[
        {
          content: 'Refresh',
          onAction: fetchMLAnalytics,
        },
      ]}
    >
      {/* Model Status Banner */}
      <div className="status-banner">
        <div className="status-grid">
          <div className="status-item">
            <span className="status-label">Status</span>
            <Badge tone={getTrainingStatusColor(modelState.training_status)}>
              {modelState.training_status.toUpperCase()}
            </Badge>
          </div>
          <div className="status-item">
            <span className="status-label">Total Decisions</span>
            <span className="status-value">{modelState.total_decisions.toLocaleString()}</span>
          </div>
          <div className="status-item">
            <span className="status-label">Confidence</span>
            <span className="status-value">{formatPercent(modelState.model_confidence * 100)}</span>
          </div>
          <div className="status-item">
            <span className="status-label">Revenue Improvement</span>
            <span
              className="status-value"
              style={{ color: modelState.improvement_percentage > 0 ? '#2ecc71' : '#e74c3c' }}
            >
              {modelState.improvement_percentage > 0 ? '+' : ''}
              {formatPercent(modelState.improvement_percentage)}
            </span>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <Tabs tabs={tabs} selected={selectedTab} onSelect={setSelectedTab}>
        {/* Overview Tab */}
        {selectedTab === 0 && (
          <div style={{ marginTop: '24px' }}>
            {/* Revenue Improvement */}
            <Card>
              <div style={{ padding: '24px' }}>
                <h2 style={{ fontSize: '18px', fontWeight: '700', marginBottom: '24px' }}>
                  Revenue Per Order Improvement
                </h2>

                <div className="improvement-stats">
                  <div className="improvement-card">
                    <div className="improvement-label">Baseline</div>
                    <div className="improvement-value">
                      {formatCurrency(modelState.baseline_revenue_per_order)}
                    </div>
                    <div className="improvement-note">First 100 orders</div>
                  </div>

                  <div className="improvement-arrow">→</div>

                  <div className="improvement-card highlighted">
                    <div className="improvement-label">Current</div>
                    <div className="improvement-value">
                      {formatCurrency(modelState.current_revenue_per_order)}
                    </div>
                    <div className="improvement-note">Latest 100 orders</div>
                  </div>

                  <div className="improvement-card success">
                    <div className="improvement-label">Improvement</div>
                    <div className="improvement-value">
                      +{formatCurrency(modelState.current_revenue_per_order - modelState.baseline_revenue_per_order)}
                    </div>
                    <div className="improvement-note">
                      {formatPercent(modelState.improvement_percentage)} increase
                    </div>
                  </div>
                </div>

                {improvement.trend.length > 0 && (
                  <div style={{ height: '300px', marginTop: '32px' }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={improvement.trend}>
                        <defs>
                          <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#667EEA" stopOpacity={0.3} />
                            <stop offset="95%" stopColor="#764BA2" stopOpacity={0.1} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                        <XAxis
                          dataKey="date"
                          tickFormatter={(value) => format(new Date(value), 'MMM d')}
                          stroke="#6B7280"
                        />
                        <YAxis stroke="#6B7280" tickFormatter={(value) => `$${value}`} />
                        <Tooltip
                          formatter={(value: number) => formatCurrency(value)}
                          labelFormatter={(label) => format(new Date(label), 'MMM d, yyyy')}
                        />
                        <Line
                          type="monotone"
                          dataKey="avgRevenue"
                          stroke="#667EEA"
                          strokeWidth={3}
                          fill="url(#revenueGradient)"
                          dot={{ fill: '#667EEA', strokeWidth: 2, r: 4 }}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </div>
            </Card>

            {/* Exploration vs Exploitation */}
            <Card>
              <div style={{ padding: '24px' }}>
                <h2 style={{ fontSize: '18px', fontWeight: '700', marginBottom: '16px' }}>
                  Exploration vs Exploitation
                </h2>
                <p style={{ fontSize: '14px', color: '#6B7280', marginBottom: '24px' }}>
                  The ML engine uses 80% exploitation (showing proven winners) and 20% exploration
                  (testing new combinations)
                </p>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
                  {improvement.exploitationVsExploration.map((item) => (
                    <div key={item.type} className="exploit-card">
                      <div className="exploit-header">
                        <h3 className="exploit-title">
                          {item.type === 'exploit' ? '⚡ Exploitation' : '🔬 Exploration'}
                        </h3>
                        <Badge tone={item.type === 'exploit' ? 'success' : 'info'}>
                          {`${item.type === 'exploit' ? '80%' : '20%'} of traffic`}
                        </Badge>
                      </div>
                      <div className="exploit-metrics">
                        <div>
                          <div className="metric-label">Avg Revenue</div>
                          <div className="metric-value">{formatCurrency(item.avgRevenue)}</div>
                        </div>
                        <div>
                          <div className="metric-label">Success Rate</div>
                          <div className="metric-value">{formatPercent(item.successRate)}</div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </Card>
          </div>
        )}

        {/* Display Styles Tab */}
        {selectedTab === 1 && (
          <div style={{ marginTop: '24px' }}>
            <Card>
              <div style={{ padding: '24px' }}>
                <h2 style={{ fontSize: '18px', fontWeight: '700', marginBottom: '24px' }}>
                  Display Style Performance
                </h2>

                <div style={{ height: '400px' }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={displayPerformance}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                      <XAxis
                        dataKey="display_style"
                        tickFormatter={getDisplayStyleLabel}
                        stroke="#6B7280"
                        angle={-45}
                        textAnchor="end"
                        height={100}
                      />
                      <YAxis stroke="#6B7280" tickFormatter={(value) => `$${value.toFixed(2)}`} />
                      <Tooltip
                        formatter={(value: number) => formatCurrency(value)}
                        labelFormatter={getDisplayStyleLabel}
                      />
                      <Bar dataKey="revenue_per_impression" fill="#667EEA" radius={[8, 8, 0, 0]}>
                        {displayPerformance.map((entry, index) => (
                          <Cell
                            key={`cell-${index}`}
                            fill={index === 0 ? '#667EEA' : index === 1 ? '#764BA2' : '#A78BFA'}
                          />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                <div className="table-wrapper" style={{ marginTop: '32px' }}>
                  <table className="analytics-table">
                    <thead>
                      <tr>
                        <th>Display Style</th>
                        <th>Impressions</th>
                        <th>Adds</th>
                        <th>Revenue</th>
                        <th>Rev/Impression</th>
                        <th>Acceptance Rate</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {displayPerformance.map((style, index) => (
                        <tr key={style.display_style}>
                          <td className="display-style-cell">
                            {index === 0 && <span className="winner-badge">🏆</span>}
                            <strong>{getDisplayStyleLabel(style.display_style)}</strong>
                          </td>
                          <td>{style.total_impressions.toLocaleString()}</td>
                          <td>{style.total_adds.toLocaleString()}</td>
                          <td className="revenue-cell">{formatCurrency(style.total_revenue)}</td>
                          <td>
                            <strong>{formatCurrency(style.revenue_per_impression)}</strong>
                          </td>
                          <td>
                            <span
                              className={`rate-badge ${style.acceptance_rate > 10 ? 'high' : ''}`}
                            >
                              {formatPercent(style.acceptance_rate)}
                            </span>
                          </td>
                          <td>
                            {index === 0 ? (
                              <Badge tone="success">Best Performer</Badge>
                            ) : style.revenue_per_impression < displayPerformance[0]!.revenue_per_impression * 0.5 ? (
                              <Badge tone="warning">Underperforming</Badge>
                            ) : (
                              <Badge>Good</Badge>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </Card>
          </div>
        )}

        {/* Products Tab */}
        {selectedTab === 2 && (
          <div style={{ marginTop: '24px' }}>
            <Card>
              <div style={{ padding: '24px' }}>
                <h2 style={{ fontSize: '18px', fontWeight: '700', marginBottom: '16px' }}>
                  Product Performance Matrix
                </h2>
                <p style={{ fontSize: '14px', color: '#6B7280', marginBottom: '24px' }}>
                  Shows how each product performs and which position works best
                </p>

                <div className="table-wrapper">
                  <table className="analytics-table">
                    <thead>
                      <tr>
                        <th>Product</th>
                        <th>Impressions</th>
                        <th>Adds</th>
                        <th>Revenue</th>
                        <th>Rev/Impression</th>
                        <th>Conversion</th>
                        <th>Best Position</th>
                        <th>Confidence</th>
                      </tr>
                    </thead>
                    <tbody>
                      {productPerformance.map((product, index) => {
                        // Find best position
                        const positions = Object.entries(product.position_performance || {});
                        let bestPosition = '1';
                        let bestPositionRevenue = 0;

                        positions.forEach(([pos, perf]) => {
                          const rev = perf.impressions > 0 ? perf.revenue / perf.impressions : 0;
                          if (rev > bestPositionRevenue) {
                            bestPosition = pos;
                            bestPositionRevenue = rev;
                          }
                        });

                        return (
                          <tr key={index}>
                            <td className="product-title">
                              {index < 3 && <span className="rank-badge">#{index + 1}</span>}
                              {product.title}
                            </td>
                            <td>{product.total_impressions.toLocaleString()}</td>
                            <td>{product.total_adds.toLocaleString()}</td>
                            <td className="revenue-cell">{formatCurrency(product.total_revenue)}</td>
                            <td>
                              <strong>{formatCurrency(product.revenue_per_impression)}</strong>
                            </td>
                            <td>
                              <span
                                className={`rate-badge ${product.conversion_rate > 0.1 ? 'high' : ''}`}
                              >
                                {formatPercent(product.conversion_rate * 100)}
                              </span>
                            </td>
                            <td>
                              <Badge tone="info">{`Position ${bestPosition}`}</Badge>
                            </td>
                            <td>
                              <div className="confidence-bar">
                                <div
                                  className="confidence-fill"
                                  style={{ width: `${product.confidence_score * 100}%` }}
                                />
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </Card>
          </div>
        )}

        {/* Context Analysis Tab */}
        {selectedTab === 3 && (
          <div style={{ marginTop: '24px' }}>
            <Card>
              <div style={{ padding: '24px' }}>
                <h2 style={{ fontSize: '18px', fontWeight: '700', marginBottom: '16px' }}>
                  Context Performance Heatmap
                </h2>
                <p style={{ fontSize: '14px', color: '#6B7280', marginBottom: '24px' }}>
                  Shows which display styles work best for different cart contexts
                </p>

                <div className="heatmap-grid">
                  {['0-50', '50-100', '100-200', '200+'].map((cartValue) => (
                    <div key={cartValue} className="heatmap-column">
                      <div className="heatmap-header">${cartValue}</div>
                      {['1', '2-3', '4-5', '6+'].map((itemCount) => {
                        const cell = contextHeatmap.find(
                          (c) =>
                            c.cart_value_bucket === cartValue &&
                            c.cart_item_count_bucket === itemCount
                        );

                        const maxRevenue = Math.max(
                          ...contextHeatmap.map((c) => c.revenue_per_impression)
                        );
                        const intensity = cell
                          ? (cell.revenue_per_impression / maxRevenue) * 100
                          : 0;

                        return (
                          <div
                            key={`${cartValue}-${itemCount}`}
                            className="heatmap-cell"
                            style={{
                              background: cell
                                ? `linear-gradient(135deg, rgba(102, 126, 234, ${intensity / 100}) 0%, rgba(118, 75, 162, ${intensity / 100}) 100%)`
                                : '#f3f4f6',
                            }}
                            title={
                              cell
                                ? `${formatCurrency(cell.revenue_per_impression)}/impression\n${formatPercent(cell.acceptance_rate)} acceptance`
                                : 'No data'
                            }
                          >
                            <div className="heatmap-label">{itemCount} items</div>
                            {cell && (
                              <div className="heatmap-value">
                                {formatCurrency(cell.revenue_per_impression)}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  ))}
                </div>

                <div style={{ marginTop: '32px' }}>
                  <h3 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '16px' }}>
                    Key Insights
                  </h3>
                  <ul className="insights-list">
                    <li>
                      <strong>Best Context:</strong>{' '}
                      {contextHeatmap.length > 0 &&
                        `$${contextHeatmap[0]!.cart_value_bucket} with ${contextHeatmap[0]!.cart_item_count_bucket} items`}
                    </li>
                    <li>
                      <strong>Best Display Style:</strong>{' '}
                      {contextHeatmap.length > 0 && getDisplayStyleLabel(contextHeatmap[0]!.display_style)}
                    </li>
                    <li>
                      <strong>Revenue per Impression:</strong>{' '}
                      {contextHeatmap.length > 0 && formatCurrency(contextHeatmap[0]!.revenue_per_impression)}
                    </li>
                  </ul>
                </div>
              </div>
            </Card>
          </div>
        )}
      </Tabs>

      <style jsx>{`
        .status-banner {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          padding: 24px;
          border-radius: 16px;
          margin-bottom: 24px;
        }

        .status-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 24px;
        }

        .status-item {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .status-label {
          font-size: 14px;
          opacity: 0.9;
        }

        .status-value {
          font-size: 24px;
          font-weight: 700;
        }

        .improvement-stats {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 24px;
          margin: 32px 0;
        }

        .improvement-card {
          background: var(--bg-secondary);
          padding: 24px;
          border-radius: 12px;
          text-align: center;
          flex: 1;
          max-width: 200px;
        }

        .improvement-card.highlighted {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
        }

        .improvement-card.success {
          background: #2ecc71;
          color: white;
        }

        .improvement-label {
          font-size: 12px;
          text-transform: uppercase;
          letter-spacing: 1px;
          margin-bottom: 8px;
          opacity: 0.8;
        }

        .improvement-value {
          font-size: 28px;
          font-weight: 700;
          margin-bottom: 4px;
        }

        .improvement-note {
          font-size: 12px;
          opacity: 0.8;
        }

        .improvement-arrow {
          font-size: 32px;
          font-weight: 700;
          color: var(--text-secondary);
        }

        .exploit-card {
          background: var(--bg-secondary);
          padding: 20px;
          border-radius: 12px;
        }

        .exploit-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 16px;
        }

        .exploit-title {
          font-size: 16px;
          font-weight: 600;
        }

        .exploit-metrics {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 16px;
        }

        .analytics-table {
          width: 100%;
          border-collapse: collapse;
        }

        .analytics-table th {
          text-align: left;
          font-size: 12px;
          font-weight: 600;
          color: var(--text-secondary);
          padding: 12px;
          border-bottom: 2px solid var(--border-color);
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .analytics-table td {
          padding: 16px 12px;
          border-bottom: 1px solid var(--border-color);
          font-size: 14px;
        }

        .analytics-table tr:hover {
          background: var(--bg-secondary);
        }

        .display-style-cell {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .winner-badge {
          font-size: 20px;
        }

        .rank-badge {
          background: var(--cosmic-gradient);
          color: white;
          padding: 2px 8px;
          border-radius: 12px;
          font-size: 11px;
          font-weight: 700;
          margin-right: 8px;
        }

        .revenue-cell {
          font-weight: 700;
          color: var(--cosmic-from);
        }

        .rate-badge {
          display: inline-block;
          padding: 4px 12px;
          border-radius: 12px;
          background: var(--bg-secondary);
          font-weight: 600;
          font-size: 12px;
        }

        .rate-badge.high {
          background: var(--cosmic-gradient);
          color: white;
        }

        .confidence-bar {
          width: 100%;
          height: 8px;
          background: var(--border-color);
          border-radius: 4px;
          overflow: hidden;
        }

        .confidence-fill {
          height: 100%;
          background: var(--cosmic-gradient);
          transition: width 0.3s ease;
        }

        .heatmap-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 8px;
          margin-top: 24px;
        }

        .heatmap-column {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .heatmap-header {
          background: var(--cosmic-gradient);
          color: white;
          padding: 12px;
          text-align: center;
          font-weight: 600;
          border-radius: 8px;
        }

        .heatmap-cell {
          padding: 16px;
          border-radius: 8px;
          text-align: center;
          min-height: 80px;
          display: flex;
          flex-direction: column;
          justify-content: center;
          cursor: help;
          transition: transform 0.2s;
        }

        .heatmap-cell:hover {
          transform: scale(1.05);
        }

        .heatmap-label {
          font-size: 12px;
          font-weight: 600;
          margin-bottom: 4px;
        }

        .heatmap-value {
          font-size: 14px;
          font-weight: 700;
        }

        .insights-list {
          list-style: none;
          padding: 0;
        }

        .insights-list li {
          padding: 12px;
          background: var(--bg-secondary);
          border-radius: 8px;
          margin-bottom: 8px;
          font-size: 14px;
        }

        .metric-label {
          font-size: 12px;
          color: var(--text-secondary);
          margin-bottom: 4px;
        }

        .metric-value {
          font-size: 20px;
          font-weight: 700;
        }
      `}</style>
    </Page>
  );
}
