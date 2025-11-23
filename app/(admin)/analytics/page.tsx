/**
 * Analytics Dashboard Page
 * Beautiful charts and deep insights
 */

'use client';

import { useState, useEffect } from 'react';
import { Page, Card, Button, Select, Spinner, EmptyState } from '@shopify/polaris';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { format, subDays } from 'date-fns';

interface AnalyticsSummary {
  total_revenue: number;
  total_impressions: number;
  total_adds: number;
  acceptance_rate: number;
  avg_order_value: number;
}

interface DailyData {
  date: string;
  impressions: number;
  adds: number;
  revenue: number;
}

interface TopProduct {
  id: string;
  title: string;
  impressions: number;
  adds: number;
  revenue: number;
  conversionRate: number;
}

export default function AnalyticsPage() {
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState('30');
  const [summary, setSummary] = useState<AnalyticsSummary | null>(null);
  const [dailyData, setDailyData] = useState<DailyData[]>([]);
  const [topProducts, setTopProducts] = useState<TopProduct[]>([]);

  useEffect(() => {
    fetchAnalytics();
  }, [dateRange]);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      const days = parseInt(dateRange);
      const endDate = new Date();
      const startDate = subDays(endDate, days);

      const response = await fetch(
        `/api/admin/analytics?startDate=${startDate.toISOString()}&endDate=${endDate.toISOString()}`
      );

      if (!response.ok) throw new Error('Failed to fetch');

      const data = await response.json();
      setSummary(data.summary);
      setDailyData(data.daily);
      setTopProducts(data.topProducts);
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

  if (loading) {
    return (
      <Page title="Analytics">
        <div style={{ padding: '60px', textAlign: 'center' }}>
          <Spinner size="large" />
          <p style={{ marginTop: '16px' }}>Loading analytics...</p>
        </div>
      </Page>
    );
  }

  if (!summary || summary.total_impressions === 0) {
    return (
      <Page title="Analytics">
        <EmptyState
          heading="No data yet"
          image="https://cdn.shopify.com/s/files/1/0262/4071/2726/files/emptystate-files.png"
        >
          <p>Start getting upsells to see analytics here</p>
        </EmptyState>
      </Page>
    );
  }

  return (
    <Page
      title="Analytics"
      subtitle="Track your upsell performance"
      secondaryActions={[
        {
          content: 'Export PDF',
          onAction: () => alert('Export feature coming soon!'),
        },
      ]}
    >
      {/* Date Range Selector */}
      <div style={{ marginBottom: '20px', maxWidth: '200px' }}>
        <Select
          label="Date Range"
          options={[
            { label: 'Last 7 days', value: '7' },
            { label: 'Last 30 days', value: '30' },
            { label: 'Last 90 days', value: '90' },
          ]}
          value={dateRange}
          onChange={setDateRange}
        />
      </div>

      {/* Key Metrics */}
      <div className="metrics-grid" style={{ marginBottom: '24px' }}>
        <div className="metric-card card-cosmic">
          <div className="metric-label">Total Revenue</div>
          <div className="metric-value">{formatCurrency(summary.total_revenue)}</div>
          <div className="metric-change">+0% from previous period</div>
        </div>

        <div className="metric-card card-cosmic">
          <div className="metric-label">Acceptance Rate</div>
          <div className="metric-value">{summary.acceptance_rate.toFixed(1)}%</div>
          <div className="metric-change">{summary.total_adds} adds from {summary.total_impressions} impressions</div>
        </div>

        <div className="metric-card card-cosmic">
          <div className="metric-label">AOV Impact</div>
          <div className="metric-value">{formatCurrency(summary.avg_order_value)}</div>
          <div className="metric-change">Average order value</div>
        </div>

        <div className="metric-card card-cosmic">
          <div className="metric-label">Total Impressions</div>
          <div className="metric-value">{summary.total_impressions.toLocaleString()}</div>
          <div className="metric-change">Upsells shown to customers</div>
        </div>
      </div>

      {/* Revenue Chart */}
      <Card>
        <div style={{ padding: '24px' }}>
          <h2 style={{ fontSize: '18px', fontWeight: '700', marginBottom: '24px' }}>
            Revenue Over Time
          </h2>
          <div style={{ height: '300px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={dailyData}>
                <defs>
                  <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
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
                <Area
                  type="monotone"
                  dataKey="revenue"
                  stroke="#667EEA"
                  strokeWidth={3}
                  fill="url(#colorRevenue)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </Card>

      {/* Top Performing Products */}
      <Card>
        <div style={{ padding: '24px' }}>
          <h2 style={{ fontSize: '18px', fontWeight: '700', marginBottom: '16px' }}>
            Top Performing Upsells
          </h2>
          <div className="table-wrapper">
            <table className="analytics-table">
              <thead>
                <tr>
                  <th>Product</th>
                  <th>Impressions</th>
                  <th>Adds</th>
                  <th>Revenue</th>
                  <th>Conversion</th>
                </tr>
              </thead>
              <tbody>
                {topProducts.map((product) => (
                  <tr key={product.id}>
                    <td className="product-title">{product.title}</td>
                    <td>{product.impressions.toLocaleString()}</td>
                    <td>{product.adds.toLocaleString()}</td>
                    <td className="revenue-cell">{formatCurrency(product.revenue)}</td>
                    <td>
                      <span className={`conversion-badge ${product.conversionRate > 10 ? 'high' : ''}`}>
                        {product.conversionRate.toFixed(1)}%
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </Card>

      <style jsx>{`
        .metrics-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
          gap: 20px;
        }

        .metric-card {
          background: var(--bg-primary);
          border: 1px solid var(--border-color);
          border-radius: 16px;
          padding: 24px;
          position: relative;
          overflow: hidden;
        }

        .metric-card::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          height: 4px;
          background: var(--cosmic-gradient);
        }

        .metric-label {
          font-size: 14px;
          color: var(--text-secondary);
          font-weight: 600;
          margin-bottom: 8px;
        }

        .metric-value {
          font-size: 32px;
          font-weight: 700;
          color: var(--text-primary);
          margin-bottom: 4px;
        }

        .metric-change {
          font-size: 12px;
          color: var(--text-tertiary);
        }

        .table-wrapper {
          overflow-x: auto;
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
          color: var(--text-primary);
        }

        .analytics-table tr:hover {
          background: var(--bg-secondary);
        }

        .product-title {
          font-weight: 600;
        }

        .revenue-cell {
          font-weight: 700;
          color: var(--cosmic-from);
        }

        .conversion-badge {
          display: inline-block;
          padding: 4px 8px;
          border-radius: 12px;
          background: var(--bg-secondary);
          font-weight: 600;
          font-size: 12px;
        }

        .conversion-badge.high {
          background: var(--cosmic-gradient);
          color: white;
        }

        @media (max-width: 768px) {
          .metrics-grid {
            grid-template-columns: 1fr;
          }

          .metric-value {
            font-size: 28px;
          }
        }
      `}</style>
    </Page>
  );
}
