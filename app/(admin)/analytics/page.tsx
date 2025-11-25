/**
 * TurboCart Advanced Analytics Dashboard
 *
 * Comprehensive analytics with Apple-style clean design.
 *
 * Features:
 * - Key performance metrics (KPIs)
 * - Revenue trends over time
 * - Display style performance comparison
 * - Product performance matrix
 * - Cart type analysis
 * - Context-based heatmaps
 * - A/B test results
 * - Export functionality (PDF/CSV)
 */

'use client';

import { useState, useEffect, useMemo } from 'react';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  ComposedChart,
} from 'recharts';
import { format, subDays } from 'date-fns';

// Types
interface AnalyticsData {
  summary: {
    totalRevenue: number;
    totalOrders: number;
    totalImpressions: number;
    totalAdds: number;
    acceptanceRate: number;
    revenuePerOrder: number;
    aovImpact: number;
    conversionImpact: number;
    previousPeriod: {
      totalRevenue: number;
      revenuePerOrder: number;
      acceptanceRate: number;
    };
  };
  trends: Array<{
    date: string;
    revenue: number;
    orders: number;
    impressions: number;
    adds: number;
    acceptanceRate: number;
    revenuePerOrder: number;
  }>;
  displayStyles: Array<{
    style: string;
    impressions: number;
    adds: number;
    revenue: number;
    revenuePerImpression: number;
    acceptanceRate: number;
    avgCartValue: number;
    confidence: number;
  }>;
  products: Array<{
    id: string;
    title: string;
    image: string | null;
    impressions: number;
    adds: number;
    revenue: number;
    conversionRate: number;
    avgOrderValue: number;
    bestPosition: number;
    confidenceScore: number;
  }>;
  cartTypes: Array<{
    type: string;
    range: string;
    impressions: number;
    adds: number;
    revenue: number;
    acceptanceRate: number;
    avgUpsellValue: number;
  }>;
  contextHeatmap: Array<{
    cartValueBucket: string;
    itemCountBucket: string;
    revenue: number;
    impressions: number;
    revenuePerImpression: number;
    acceptanceRate: number;
    bestStyle: string;
  }>;
  abTests: Array<{
    id: string;
    name: string;
    status: 'running' | 'completed' | 'winner';
    variants: Array<{
      name: string;
      impressions: number;
      conversions: number;
      revenue: number;
      conversionRate: number;
      isWinner: boolean;
    }>;
    startDate: string;
    endDate?: string;
    confidence: number;
  }>;
  attribution: {
    beforeOptimization: {
      avgRevenuePerOrder: number;
      avgAcceptanceRate: number;
      period: string;
    };
    afterOptimization: {
      avgRevenuePerOrder: number;
      avgAcceptanceRate: number;
      period: string;
    };
    improvement: {
      revenueIncrease: number;
      percentageIncrease: number;
      additionalRevenue: number;
    };
  };
}

// Date range options
const DATE_RANGES = [
  { label: 'Last 7 days', days: 7 },
  { label: 'Last 30 days', days: 30 },
  { label: 'Last 90 days', days: 90 },
  { label: 'Last 365 days', days: 365 },
];

// Tab configuration
const TABS = [
  { id: 'overview', label: 'Overview' },
  { id: 'display-styles', label: 'Display Styles' },
  { id: 'products', label: 'Products' },
  { id: 'cart-types', label: 'Cart Analysis' },
  { id: 'ab-tests', label: 'A/B Tests' },
  { id: 'attribution', label: 'Attribution' },
];

// Colors
const COLORS = {
  primary: '#667eea',
  secondary: '#764ba2',
  success: '#34c759',
  warning: '#ff9500',
  danger: '#ff3b30',
  chartColors: ['#667eea', '#764ba2', '#34c759', '#ff9500', '#5ac8fa', '#af52de'],
};

// Style labels
const STYLE_LABELS: Record<string, string> = {
  'minimal-strip': 'Minimal Strip',
  'cards': 'Product Cards',
  'banner': 'Urgency Banner',
  'list': 'Simple List',
  'frequently-bought': 'Frequently Bought',
  'masonry-grid': 'Masonry Grid',
  'vertical-scroll': 'Vertical Scroll',
};

export default function AdvancedAnalyticsPage() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [dateRange, setDateRange] = useState(30);
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    fetchAnalytics();
  }, [dateRange]);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      const endDate = new Date();
      const startDate = subDays(endDate, dateRange);

      const response = await fetch(
        `/api/admin/analytics/comprehensive?` +
        `startDate=${startDate.toISOString()}&endDate=${endDate.toISOString()}`
      );

      if (response.ok) {
        const analyticsData = await response.json();
        setData(analyticsData);
      } else {
        // Use mock data for demo
        setData(generateMockData());
      }
    } catch (error) {
      console.error('Error fetching analytics:', error);
      setData(generateMockData());
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async (format: 'csv' | 'pdf') => {
    setExporting(true);
    try {
      if (format === 'csv') {
        exportToCSV();
      } else {
        exportToPDF();
      }
    } finally {
      setExporting(false);
    }
  };

  const exportToCSV = () => {
    if (!data) return;

    // Summary data
    const summaryRows = [
      ['TurboCart Analytics Report'],
      [`Generated: ${format(new Date(), 'PPpp')}`],
      [''],
      ['SUMMARY METRICS'],
      ['Metric', 'Value'],
      ['Total Revenue', `$${data.summary.totalRevenue.toFixed(2)}`],
      ['Total Orders', data.summary.totalOrders.toString()],
      ['Total Impressions', data.summary.totalImpressions.toString()],
      ['Total Cart Adds', data.summary.totalAdds.toString()],
      ['Acceptance Rate', `${data.summary.acceptanceRate.toFixed(1)}%`],
      ['Revenue Per Order', `$${data.summary.revenuePerOrder.toFixed(2)}`],
      ['AOV Impact', `${data.summary.aovImpact > 0 ? '+' : ''}${data.summary.aovImpact.toFixed(1)}%`],
      [''],
      ['DISPLAY STYLE PERFORMANCE'],
      ['Style', 'Impressions', 'Adds', 'Revenue', 'Rev/Impression', 'Acceptance Rate'],
      ...data.displayStyles.map(s => [
        STYLE_LABELS[s.style] || s.style,
        s.impressions.toString(),
        s.adds.toString(),
        `$${s.revenue.toFixed(2)}`,
        `$${s.revenuePerImpression.toFixed(2)}`,
        `${s.acceptanceRate.toFixed(1)}%`,
      ]),
      [''],
      ['TOP PRODUCTS'],
      ['Product', 'Impressions', 'Adds', 'Revenue', 'Conversion Rate'],
      ...data.products.slice(0, 10).map(p => [
        p.title,
        p.impressions.toString(),
        p.adds.toString(),
        `$${p.revenue.toFixed(2)}`,
        `${(p.conversionRate * 100).toFixed(1)}%`,
      ]),
    ];

    const csvContent = summaryRows.map(row => row.join(',')).join('\n');
    downloadFile(csvContent, `turbocart-analytics-${format(new Date(), 'yyyy-MM-dd')}.csv`, 'text/csv');
  };

  const exportToPDF = () => {
    if (!data) return;

    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>TurboCart Analytics Report</title>
          <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body {
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
              padding: 40px;
              color: #1d1d1f;
              line-height: 1.5;
            }
            .header {
              text-align: center;
              margin-bottom: 40px;
              padding-bottom: 20px;
              border-bottom: 2px solid #667eea;
            }
            .header h1 {
              font-size: 28px;
              color: #667eea;
              margin-bottom: 8px;
            }
            .header p { color: #86868b; font-size: 14px; }
            .section { margin-bottom: 32px; }
            .section h2 {
              font-size: 18px;
              color: #1d1d1f;
              margin-bottom: 16px;
              padding-bottom: 8px;
              border-bottom: 1px solid #e5e5ea;
            }
            .metrics-grid {
              display: grid;
              grid-template-columns: repeat(4, 1fr);
              gap: 16px;
              margin-bottom: 24px;
            }
            .metric {
              background: #f5f5f7;
              padding: 20px;
              border-radius: 12px;
              text-align: center;
            }
            .metric .label { font-size: 12px; color: #86868b; margin-bottom: 4px; }
            .metric .value { font-size: 24px; font-weight: 700; color: #1d1d1f; }
            .metric .change { font-size: 12px; color: #34c759; }
            table { width: 100%; border-collapse: collapse; margin-top: 16px; }
            th {
              text-align: left;
              font-size: 11px;
              color: #86868b;
              padding: 12px 8px;
              border-bottom: 2px solid #e5e5ea;
              text-transform: uppercase;
            }
            td {
              padding: 12px 8px;
              border-bottom: 1px solid #f0f0f0;
              font-size: 13px;
            }
            .highlight { font-weight: 600; color: #667eea; }
            @media print {
              body { padding: 20px; }
              .metrics-grid { grid-template-columns: repeat(2, 1fr); }
            }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>TurboCart Analytics Report</h1>
            <p>Generated: ${format(new Date(), 'MMMM d, yyyy h:mm a')} | Period: Last ${dateRange} days</p>
          </div>

          <div class="section">
            <h2>Key Metrics</h2>
            <div class="metrics-grid">
              <div class="metric">
                <div class="label">Total Revenue</div>
                <div class="value">$${data.summary.totalRevenue.toLocaleString()}</div>
              </div>
              <div class="metric">
                <div class="label">Revenue Per Order</div>
                <div class="value">$${data.summary.revenuePerOrder.toFixed(2)}</div>
              </div>
              <div class="metric">
                <div class="label">Acceptance Rate</div>
                <div class="value">${data.summary.acceptanceRate.toFixed(1)}%</div>
              </div>
              <div class="metric">
                <div class="label">AOV Impact</div>
                <div class="value">${data.summary.aovImpact > 0 ? '+' : ''}${data.summary.aovImpact.toFixed(1)}%</div>
                <div class="change">increase</div>
              </div>
            </div>
          </div>

          <div class="section">
            <h2>Display Style Performance</h2>
            <table>
              <thead>
                <tr>
                  <th>Style</th>
                  <th>Impressions</th>
                  <th>Adds</th>
                  <th>Revenue</th>
                  <th>Rev/Impression</th>
                  <th>Acceptance</th>
                </tr>
              </thead>
              <tbody>
                ${data.displayStyles.map(s => `
                  <tr>
                    <td>${STYLE_LABELS[s.style] || s.style}</td>
                    <td>${s.impressions.toLocaleString()}</td>
                    <td>${s.adds.toLocaleString()}</td>
                    <td class="highlight">$${s.revenue.toLocaleString()}</td>
                    <td>$${s.revenuePerImpression.toFixed(2)}</td>
                    <td>${s.acceptanceRate.toFixed(1)}%</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>

          <div class="section">
            <h2>Top Products</h2>
            <table>
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
                ${data.products.slice(0, 10).map(p => `
                  <tr>
                    <td>${p.title}</td>
                    <td>${p.impressions.toLocaleString()}</td>
                    <td>${p.adds.toLocaleString()}</td>
                    <td class="highlight">$${p.revenue.toLocaleString()}</td>
                    <td>${(p.conversionRate * 100).toFixed(1)}%</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>

          <div class="section">
            <h2>Revenue Attribution</h2>
            <div class="metrics-grid" style="grid-template-columns: repeat(3, 1fr);">
              <div class="metric">
                <div class="label">Before Optimization</div>
                <div class="value">$${data.attribution.beforeOptimization.avgRevenuePerOrder.toFixed(2)}</div>
                <div style="font-size: 11px; color: #86868b;">per order</div>
              </div>
              <div class="metric">
                <div class="label">After Optimization</div>
                <div class="value">$${data.attribution.afterOptimization.avgRevenuePerOrder.toFixed(2)}</div>
                <div style="font-size: 11px; color: #86868b;">per order</div>
              </div>
              <div class="metric" style="background: linear-gradient(135deg, rgba(102, 126, 234, 0.1) 0%, rgba(118, 75, 162, 0.1) 100%);">
                <div class="label">Improvement</div>
                <div class="value" style="color: #34c759;">+${data.attribution.improvement.percentageIncrease.toFixed(1)}%</div>
                <div style="font-size: 11px; color: #34c759;">+$${data.attribution.improvement.additionalRevenue.toLocaleString()}</div>
              </div>
            </div>
          </div>
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.print();
  };

  const downloadFile = (content: string, filename: string, type: string) => {
    const blob = new Blob([content], { type });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const formatPercent = (value: number) => `${value.toFixed(1)}%`;

  const formatNumber = (value: number) => {
    if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M`;
    if (value >= 1000) return `${(value / 1000).toFixed(1)}K`;
    return value.toLocaleString();
  };

  const getChangeIndicator = (current: number, previous: number) => {
    if (previous === 0) return { value: '0', isPositive: true, color: COLORS.success };
    const change = ((current - previous) / previous) * 100;
    const isPositive = change >= 0;
    return {
      value: Math.abs(change).toFixed(1),
      isPositive,
      color: isPositive ? COLORS.success : COLORS.danger,
    };
  };

  if (loading) {
    return (
      <div className="analytics-container">
        <div className="loading-state">
          <div className="spinner" />
          <p>Loading analytics...</p>
        </div>
        <style jsx>{`
          .analytics-container {
            min-height: 100vh;
            background: linear-gradient(180deg, #fafafa 0%, #f5f5f7 100%);
            display: flex;
            align-items: center;
            justify-content: center;
          }
          .loading-state {
            text-align: center;
          }
          .spinner {
            width: 48px;
            height: 48px;
            border: 3px solid #e5e5ea;
            border-top-color: #667eea;
            border-radius: 50%;
            animation: spin 0.8s linear infinite;
            margin: 0 auto 16px;
          }
          @keyframes spin { to { transform: rotate(360deg); } }
          .loading-state p { color: #86868b; font-size: 15px; }
        `}</style>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="analytics-container">
        <div className="empty-state">
          <div className="empty-icon">
            <svg width="64" height="64" viewBox="0 0 64 64" fill="none">
              <circle cx="32" cy="32" r="28" stroke="currentColor" strokeWidth="2"/>
              <path d="M22 32L30 40L42 24" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <h2>No data yet</h2>
          <p>Analytics will appear once you start receiving upsell traffic</p>
        </div>
        <style jsx>{`
          .analytics-container {
            min-height: 100vh;
            background: linear-gradient(180deg, #fafafa 0%, #f5f5f7 100%);
            display: flex;
            align-items: center;
            justify-content: center;
          }
          .empty-state {
            text-align: center;
            padding: 40px;
          }
          .empty-icon {
            width: 80px;
            height: 80px;
            background: #f5f5f7;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            margin: 0 auto 24px;
            color: #86868b;
          }
          .empty-state h2 { font-size: 24px; color: #1d1d1f; margin: 0 0 8px; }
          .empty-state p { font-size: 15px; color: #86868b; margin: 0; }
        `}</style>
      </div>
    );
  }

  return (
    <div className="analytics-container">
      {/* Header */}
      <div className="analytics-header">
        <div className="header-left">
          <h1>Analytics</h1>
          <p>Track your upsell performance and ROI</p>
        </div>
        <div className="header-right">
          <select
            className="date-select"
            value={dateRange}
            onChange={(e) => setDateRange(parseInt(e.target.value))}
          >
            {DATE_RANGES.map((range) => (
              <option key={range.days} value={range.days}>
                {range.label}
              </option>
            ))}
          </select>
          <div className="export-buttons">
            <button className="export-btn" onClick={() => handleExport('csv')} disabled={exporting}>
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path d="M14 10V12.67C14 13.4 13.4 14 12.67 14H3.33C2.6 14 2 13.4 2 12.67V10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                <path d="M8 2V10M8 10L5 7M8 10L11 7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              CSV
            </button>
            <button className="export-btn" onClick={() => handleExport('pdf')} disabled={exporting}>
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path d="M14 10V12.67C14 13.4 13.4 14 12.67 14H3.33C2.6 14 2 13.4 2 12.67V10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                <path d="M8 2V10M8 10L5 7M8 10L11 7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              PDF
            </button>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="tabs-container">
        <div className="tabs">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              className={`tab ${activeTab === tab.id ? 'active' : ''}`}
              onClick={() => setActiveTab(tab.id)}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Tab Content */}
      <div className="tab-content">
        {activeTab === 'overview' && (
          <OverviewTab
            data={data}
            formatCurrency={formatCurrency}
            formatPercent={formatPercent}
            formatNumber={formatNumber}
            getChangeIndicator={getChangeIndicator}
          />
        )}
        {activeTab === 'display-styles' && (
          <DisplayStylesTab data={data} formatCurrency={formatCurrency} formatPercent={formatPercent} />
        )}
        {activeTab === 'products' && (
          <ProductsTab data={data} formatCurrency={formatCurrency} formatPercent={formatPercent} />
        )}
        {activeTab === 'cart-types' && (
          <CartTypesTab data={data} formatCurrency={formatCurrency} formatPercent={formatPercent} />
        )}
        {activeTab === 'ab-tests' && (
          <ABTestsTab data={data} formatCurrency={formatCurrency} formatPercent={formatPercent} />
        )}
        {activeTab === 'attribution' && (
          <AttributionTab data={data} formatCurrency={formatCurrency} formatPercent={formatPercent} />
        )}
      </div>

      <style jsx>{`
        .analytics-container {
          min-height: 100vh;
          background: linear-gradient(180deg, #fafafa 0%, #f5f5f7 100%);
        }
        .analytics-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 32px 32px 24px;
          background: #fff;
          border-bottom: 1px solid rgba(0, 0, 0, 0.06);
        }
        .header-left h1 {
          font-size: 28px;
          font-weight: 700;
          color: #1d1d1f;
          margin: 0 0 4px 0;
        }
        .header-left p {
          font-size: 15px;
          color: #86868b;
          margin: 0;
        }
        .header-right {
          display: flex;
          align-items: center;
          gap: 16px;
        }
        .date-select {
          padding: 10px 16px;
          border: 1px solid #e5e5ea;
          border-radius: 10px;
          font-size: 14px;
          background: #fff;
          cursor: pointer;
          outline: none;
        }
        .export-buttons {
          display: flex;
          gap: 8px;
        }
        .export-btn {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 10px 16px;
          background: #f5f5f7;
          border: none;
          border-radius: 10px;
          font-size: 14px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s ease;
          color: #1d1d1f;
        }
        .export-btn:hover {
          background: #e5e5ea;
        }
        .export-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
        .tabs-container {
          background: #fff;
          padding: 0 32px;
          border-bottom: 1px solid rgba(0, 0, 0, 0.06);
        }
        .tabs {
          display: flex;
          gap: 4px;
        }
        .tab {
          padding: 16px 20px;
          background: none;
          border: none;
          font-size: 14px;
          font-weight: 500;
          color: #86868b;
          cursor: pointer;
          position: relative;
          transition: all 0.2s ease;
        }
        .tab:hover {
          color: #1d1d1f;
        }
        .tab.active {
          color: #667eea;
        }
        .tab.active::after {
          content: '';
          position: absolute;
          bottom: 0;
          left: 0;
          right: 0;
          height: 2px;
          background: linear-gradient(90deg, #667eea 0%, #764ba2 100%);
          border-radius: 2px 2px 0 0;
        }
        .tab-content {
          padding: 32px;
          max-width: 1400px;
          margin: 0 auto;
        }
      `}</style>
    </div>
  );
}

// ============================================================================
// OVERVIEW TAB
// ============================================================================

function OverviewTab({
  data,
  formatCurrency,
  formatPercent,
  formatNumber,
  getChangeIndicator,
}: {
  data: AnalyticsData;
  formatCurrency: (v: number) => string;
  formatPercent: (v: number) => string;
  formatNumber: (v: number) => string;
  getChangeIndicator: (c: number, p: number) => { value: string; isPositive: boolean; color: string };
}) {
  const { summary, trends } = data;
  const revenueChange = getChangeIndicator(summary.totalRevenue, summary.previousPeriod.totalRevenue);
  const rpoChange = getChangeIndicator(summary.revenuePerOrder, summary.previousPeriod.revenuePerOrder);
  const acceptanceChange = getChangeIndicator(summary.acceptanceRate, summary.previousPeriod.acceptanceRate);

  return (
    <div className="overview-tab">
      {/* KPI Cards */}
      <div className="kpi-grid">
        <div className="kpi-card primary">
          <div className="kpi-header">
            <span className="kpi-label">Total Upsell Revenue</span>
            <span className={`kpi-change ${revenueChange.isPositive ? 'positive' : 'negative'}`}>
              {revenueChange.isPositive ? '+' : '-'}{revenueChange.value}%
            </span>
          </div>
          <div className="kpi-value">{formatCurrency(summary.totalRevenue)}</div>
          <div className="kpi-subtext">vs previous period</div>
        </div>

        <div className="kpi-card">
          <div className="kpi-header">
            <span className="kpi-label">Revenue Per Order</span>
            <span className={`kpi-change ${rpoChange.isPositive ? 'positive' : 'negative'}`}>
              {rpoChange.isPositive ? '+' : '-'}{rpoChange.value}%
            </span>
          </div>
          <div className="kpi-value">{formatCurrency(summary.revenuePerOrder)}</div>
          <div className="kpi-subtext">from upsells</div>
        </div>

        <div className="kpi-card">
          <div className="kpi-header">
            <span className="kpi-label">Acceptance Rate</span>
            <span className={`kpi-change ${acceptanceChange.isPositive ? 'positive' : 'negative'}`}>
              {acceptanceChange.isPositive ? '+' : '-'}{acceptanceChange.value}%
            </span>
          </div>
          <div className="kpi-value">{formatPercent(summary.acceptanceRate)}</div>
          <div className="kpi-subtext">of impressions converted</div>
        </div>

        <div className="kpi-card">
          <div className="kpi-header">
            <span className="kpi-label">AOV Impact</span>
          </div>
          <div className="kpi-value aov-impact">{summary.aovImpact > 0 ? '+' : ''}{formatPercent(summary.aovImpact)}</div>
          <div className="kpi-subtext">increase in average order value</div>
        </div>
      </div>

      {/* Revenue Trend Chart */}
      <div className="chart-card">
        <div className="chart-header">
          <h3>Revenue Trend</h3>
        </div>
        <div className="chart-container">
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={trends}>
              <defs>
                <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#667eea" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#667eea" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e5ea" vertical={false} />
              <XAxis
                dataKey="date"
                tickFormatter={(v) => format(new Date(v), 'MMM d')}
                stroke="#86868b"
                fontSize={12}
                tickLine={false}
              />
              <YAxis
                tickFormatter={(v) => `$${v}`}
                stroke="#86868b"
                fontSize={12}
                tickLine={false}
                axisLine={false}
              />
              <Tooltip
                formatter={(value: number) => [formatCurrency(value), 'Revenue']}
                labelFormatter={(label) => format(new Date(label), 'MMMM d, yyyy')}
                contentStyle={{
                  background: '#fff',
                  border: 'none',
                  borderRadius: '12px',
                  boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
                }}
              />
              <Area
                type="monotone"
                dataKey="revenue"
                stroke="#667eea"
                strokeWidth={2}
                fill="url(#revenueGradient)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="stats-row">
        <div className="stat-item">
          <div className="stat-icon">
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <circle cx="10" cy="10" r="8" stroke="currentColor" strokeWidth="1.5"/>
              <path d="M10 6V10L13 13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
          </div>
          <div>
            <div className="stat-label">Total Impressions</div>
            <div className="stat-value">{formatNumber(summary.totalImpressions)}</div>
          </div>
        </div>
        <div className="stat-item">
          <div className="stat-icon">
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <path d="M6 10L9 13L14 7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              <circle cx="10" cy="10" r="8" stroke="currentColor" strokeWidth="1.5"/>
            </svg>
          </div>
          <div>
            <div className="stat-label">Cart Adds</div>
            <div className="stat-value">{formatNumber(summary.totalAdds)}</div>
          </div>
        </div>
        <div className="stat-item">
          <div className="stat-icon">
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <path d="M3 6H17M7 6V4C7 3.45 7.45 3 8 3H12C12.55 3 13 3.45 13 4V6M17 6V16C17 16.55 16.55 17 16 17H4C3.45 17 3 16.55 3 16V6H17Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
          </div>
          <div>
            <div className="stat-label">Total Orders</div>
            <div className="stat-value">{formatNumber(summary.totalOrders)}</div>
          </div>
        </div>
        <div className="stat-item">
          <div className="stat-icon">
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <path d="M10 2V18M10 2L6 6M10 2L14 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <div>
            <div className="stat-label">Conversion Impact</div>
            <div className="stat-value conversion-impact">{summary.conversionImpact > 0 ? '+' : ''}{formatPercent(summary.conversionImpact)}</div>
          </div>
        </div>
      </div>

      <style jsx>{`
        .overview-tab {}
        .kpi-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 20px;
          margin-bottom: 32px;
        }
        @media (max-width: 1024px) {
          .kpi-grid { grid-template-columns: repeat(2, 1fr); }
        }
        .kpi-card {
          background: #fff;
          border-radius: 16px;
          padding: 24px;
          border: 1px solid rgba(0, 0, 0, 0.06);
        }
        .kpi-card.primary {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: #fff;
          border: none;
        }
        .kpi-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 12px;
        }
        .kpi-label {
          font-size: 13px;
          font-weight: 500;
          opacity: 0.8;
        }
        .kpi-change {
          font-size: 12px;
          font-weight: 600;
          padding: 4px 8px;
          border-radius: 6px;
        }
        .kpi-change.positive {
          background: rgba(52, 199, 89, 0.15);
          color: #34c759;
        }
        .kpi-change.negative {
          background: rgba(255, 59, 48, 0.15);
          color: #ff3b30;
        }
        .kpi-card.primary .kpi-change {
          background: rgba(255, 255, 255, 0.2);
          color: #fff;
        }
        .kpi-value {
          font-size: 32px;
          font-weight: 700;
          margin-bottom: 4px;
        }
        .kpi-value.aov-impact {
          color: #34c759;
        }
        .kpi-subtext {
          font-size: 13px;
          opacity: 0.7;
        }
        .chart-card {
          background: #fff;
          border-radius: 16px;
          padding: 24px;
          border: 1px solid rgba(0, 0, 0, 0.06);
          margin-bottom: 24px;
        }
        .chart-header {
          margin-bottom: 24px;
        }
        .chart-header h3 {
          font-size: 17px;
          font-weight: 600;
          color: #1d1d1f;
          margin: 0;
        }
        .stats-row {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 20px;
        }
        @media (max-width: 768px) {
          .stats-row { grid-template-columns: repeat(2, 1fr); }
        }
        .stat-item {
          display: flex;
          align-items: center;
          gap: 16px;
          background: #fff;
          padding: 20px;
          border-radius: 12px;
          border: 1px solid rgba(0, 0, 0, 0.06);
        }
        .stat-icon {
          width: 44px;
          height: 44px;
          background: rgba(102, 126, 234, 0.1);
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #667eea;
          flex-shrink: 0;
        }
        .stat-label {
          font-size: 13px;
          color: #86868b;
          margin-bottom: 2px;
        }
        .stat-value {
          font-size: 20px;
          font-weight: 700;
          color: #1d1d1f;
        }
        .stat-value.conversion-impact {
          color: #34c759;
        }
      `}</style>
    </div>
  );
}

// ============================================================================
// DISPLAY STYLES TAB
// ============================================================================

function DisplayStylesTab({
  data,
  formatCurrency,
  formatPercent,
}: {
  data: AnalyticsData;
  formatCurrency: (v: number) => string;
  formatPercent: (v: number) => string;
}) {
  const sortedStyles = [...data.displayStyles].sort((a, b) => b.revenuePerImpression - a.revenuePerImpression);

  return (
    <div className="display-styles-tab">
      {/* Chart */}
      <div className="chart-card">
        <h3>Revenue Per Impression by Style</h3>
        <div className="chart-container">
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={sortedStyles} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e5ea" horizontal={false} />
              <XAxis type="number" tickFormatter={(v) => `$${v.toFixed(2)}`} stroke="#86868b" fontSize={12} />
              <YAxis
                type="category"
                dataKey="style"
                tickFormatter={(v) => STYLE_LABELS[v] || v}
                stroke="#86868b"
                fontSize={12}
                width={120}
              />
              <Tooltip
                formatter={(value: number) => [formatCurrency(value), 'Rev/Impression']}
                contentStyle={{ background: '#fff', border: 'none', borderRadius: '12px', boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }}
              />
              <Bar dataKey="revenuePerImpression" radius={[0, 8, 8, 0]}>
                {sortedStyles.map((_, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS.chartColors[index % COLORS.chartColors.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Table */}
      <div className="table-card">
        <h3>Style Performance Details</h3>
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Style</th>
                <th className="right">Impressions</th>
                <th className="right">Adds</th>
                <th className="right">Revenue</th>
                <th className="right">Rev/Impression</th>
                <th className="right">Acceptance</th>
                <th className="right">Confidence</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {sortedStyles.map((style, index) => (
                <tr key={style.style}>
                  <td className="style-name">
                    {index === 0 && <span className="winner-badge">1st</span>}
                    {STYLE_LABELS[style.style] || style.style}
                  </td>
                  <td className="right">{style.impressions.toLocaleString()}</td>
                  <td className="right">{style.adds.toLocaleString()}</td>
                  <td className="right revenue">{formatCurrency(style.revenue)}</td>
                  <td className="right highlight">{formatCurrency(style.revenuePerImpression)}</td>
                  <td className="right">{formatPercent(style.acceptanceRate)}</td>
                  <td className="right">
                    <div className="confidence-bar">
                      <div className="confidence-fill" style={{ width: `${style.confidence * 100}%` }} />
                    </div>
                  </td>
                  <td>
                    {index === 0 ? (
                      <span className="status-badge success">Best</span>
                    ) : style.revenuePerImpression < sortedStyles[0]!.revenuePerImpression * 0.5 ? (
                      <span className="status-badge warning">Underperforming</span>
                    ) : (
                      <span className="status-badge neutral">Good</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <style jsx>{`
        .display-styles-tab {}
        .chart-card, .table-card {
          background: #fff;
          border-radius: 16px;
          padding: 24px;
          border: 1px solid rgba(0, 0, 0, 0.06);
          margin-bottom: 24px;
        }
        .chart-card h3, .table-card h3 {
          font-size: 17px;
          font-weight: 600;
          color: #1d1d1f;
          margin: 0 0 24px 0;
        }
        .table-container { overflow-x: auto; }
        .data-table { width: 100%; border-collapse: collapse; }
        .data-table th {
          text-align: left;
          font-size: 12px;
          font-weight: 600;
          color: #86868b;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          padding: 12px 16px;
          border-bottom: 1px solid rgba(0, 0, 0, 0.06);
        }
        .data-table th.right { text-align: right; }
        .data-table td {
          padding: 16px;
          font-size: 14px;
          color: #1d1d1f;
          border-bottom: 1px solid rgba(0, 0, 0, 0.04);
        }
        .data-table td.right { text-align: right; }
        .data-table tr:hover { background: rgba(102, 126, 234, 0.02); }
        .style-name {
          display: flex;
          align-items: center;
          gap: 10px;
          font-weight: 600;
        }
        .winner-badge {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: #fff;
          font-size: 10px;
          font-weight: 700;
          padding: 4px 8px;
          border-radius: 6px;
        }
        .revenue { font-weight: 600; color: #667eea; }
        .highlight { font-weight: 700; }
        .confidence-bar {
          width: 80px;
          height: 6px;
          background: #e5e5ea;
          border-radius: 3px;
          overflow: hidden;
        }
        .confidence-fill {
          height: 100%;
          background: linear-gradient(90deg, #667eea 0%, #764ba2 100%);
          border-radius: 3px;
        }
        .status-badge {
          display: inline-block;
          padding: 4px 10px;
          border-radius: 6px;
          font-size: 12px;
          font-weight: 600;
        }
        .status-badge.success { background: rgba(52, 199, 89, 0.15); color: #34c759; }
        .status-badge.warning { background: rgba(255, 149, 0, 0.15); color: #ff9500; }
        .status-badge.neutral { background: #f5f5f7; color: #86868b; }
      `}</style>
    </div>
  );
}

// ============================================================================
// PRODUCTS TAB
// ============================================================================

function ProductsTab({
  data,
  formatCurrency,
  formatPercent,
}: {
  data: AnalyticsData;
  formatCurrency: (v: number) => string;
  formatPercent: (v: number) => string;
}) {
  const [sortBy, setSortBy] = useState<'revenue' | 'conversionRate' | 'impressions'>('revenue');
  const [search, setSearch] = useState('');

  const sortedProducts = useMemo(() => {
    return [...data.products]
      .filter(p => p.title.toLowerCase().includes(search.toLowerCase()))
      .sort((a, b) => b[sortBy] - a[sortBy]);
  }, [data.products, sortBy, search]);

  return (
    <div className="products-tab">
      {/* Controls */}
      <div className="controls-row">
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
        <div className="sort-control">
          <span>Sort by:</span>
          <select value={sortBy} onChange={(e) => setSortBy(e.target.value as typeof sortBy)}>
            <option value="revenue">Revenue</option>
            <option value="conversionRate">Conversion Rate</option>
            <option value="impressions">Impressions</option>
          </select>
        </div>
      </div>

      {/* Product Grid */}
      <div className="products-grid">
        {sortedProducts.slice(0, 20).map((product, index) => (
          <div key={product.id} className="product-card">
            <div className="product-rank">#{index + 1}</div>
            <div className="product-image">
              {product.image ? (
                <img src={product.image} alt={product.title} />
              ) : (
                <div className="no-image">No Image</div>
              )}
            </div>
            <div className="product-info">
              <h4>{product.title}</h4>
              <div className="product-stats">
                <div className="stat">
                  <span className="stat-label">Revenue</span>
                  <span className="stat-value">{formatCurrency(product.revenue)}</span>
                </div>
                <div className="stat">
                  <span className="stat-label">Conversion</span>
                  <span className="stat-value">{formatPercent(product.conversionRate * 100)}</span>
                </div>
                <div className="stat">
                  <span className="stat-label">Best Position</span>
                  <span className="stat-value">#{product.bestPosition}</span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      <style jsx>{`
        .products-tab {}
        .controls-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 24px;
          gap: 16px;
          flex-wrap: wrap;
        }
        .search-box {
          display: flex;
          align-items: center;
          gap: 10px;
          background: #fff;
          border: 1px solid rgba(0, 0, 0, 0.06);
          border-radius: 10px;
          padding: 10px 16px;
          color: #86868b;
        }
        .search-box input {
          border: none;
          background: none;
          outline: none;
          font-size: 14px;
          width: 200px;
        }
        .sort-control {
          display: flex;
          align-items: center;
          gap: 10px;
          font-size: 14px;
          color: #86868b;
        }
        .sort-control select {
          padding: 10px 16px;
          border: 1px solid rgba(0, 0, 0, 0.06);
          border-radius: 10px;
          font-size: 14px;
          background: #fff;
          cursor: pointer;
        }
        .products-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
          gap: 20px;
        }
        .product-card {
          background: #fff;
          border: 1px solid rgba(0, 0, 0, 0.06);
          border-radius: 16px;
          overflow: hidden;
          position: relative;
        }
        .product-rank {
          position: absolute;
          top: 12px;
          left: 12px;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: #fff;
          font-size: 12px;
          font-weight: 700;
          padding: 6px 12px;
          border-radius: 8px;
          z-index: 1;
        }
        .product-image {
          width: 100%;
          height: 160px;
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
          padding: 16px;
        }
        .product-info h4 {
          font-size: 15px;
          font-weight: 600;
          color: #1d1d1f;
          margin: 0 0 12px 0;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .product-stats {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 8px;
        }
        .product-stats .stat { text-align: center; }
        .product-stats .stat-label {
          font-size: 11px;
          color: #86868b;
          display: block;
          margin-bottom: 2px;
        }
        .product-stats .stat-value {
          font-size: 14px;
          font-weight: 600;
          color: #1d1d1f;
        }
      `}</style>
    </div>
  );
}

// ============================================================================
// CART TYPES TAB
// ============================================================================

function CartTypesTab({
  data,
  formatCurrency,
  formatPercent,
}: {
  data: AnalyticsData;
  formatCurrency: (v: number) => string;
  formatPercent: (v: number) => string;
}) {
  return (
    <div className="cart-types-tab">
      {/* Chart */}
      <div className="chart-card">
        <h3>Performance by Cart Type</h3>
        <div className="chart-container">
          <ResponsiveContainer width="100%" height={300}>
            <ComposedChart data={data.cartTypes}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e5ea" vertical={false} />
              <XAxis dataKey="type" stroke="#86868b" fontSize={12} />
              <YAxis yAxisId="left" stroke="#86868b" fontSize={12} tickFormatter={(v) => `$${v}`} />
              <YAxis yAxisId="right" orientation="right" stroke="#86868b" fontSize={12} tickFormatter={(v) => `${v}%`} />
              <Tooltip contentStyle={{ background: '#fff', border: 'none', borderRadius: '12px', boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }} />
              <Legend />
              <Bar yAxisId="left" dataKey="revenue" name="Revenue" fill="#667eea" radius={[4, 4, 0, 0]} />
              <Line yAxisId="right" type="monotone" dataKey="acceptanceRate" name="Acceptance %" stroke="#34c759" strokeWidth={2} />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Heatmap */}
      <div className="heatmap-card">
        <h3>Context Performance Matrix</h3>
        <p>Revenue per impression by cart value and item count</p>
        <div className="heatmap-grid">
          <div className="heatmap-corner" />
          {['$0-50', '$50-100', '$100-200', '$200+'].map((bucket) => (
            <div key={bucket} className="heatmap-header">{bucket}</div>
          ))}
          {['1', '2-3', '4-5', '6+'].map((itemCount) => (
            <>
              <div key={`label-${itemCount}`} className="heatmap-label">{itemCount} {itemCount === '1' ? 'item' : 'items'}</div>
              {['0-50', '50-100', '100-200', '200+'].map((valueBucket) => {
                const cell = data.contextHeatmap.find(
                  c => c.cartValueBucket === valueBucket && c.itemCountBucket === itemCount
                );
                const maxRPI = Math.max(...data.contextHeatmap.map(c => c.revenuePerImpression));
                const intensity = cell ? (cell.revenuePerImpression / maxRPI) : 0;

                return (
                  <div
                    key={`${valueBucket}-${itemCount}`}
                    className="heatmap-cell"
                    style={{
                      background: `rgba(102, 126, 234, ${intensity * 0.8 + 0.1})`,
                      color: intensity > 0.5 ? '#fff' : '#1d1d1f',
                    }}
                    title={cell ? `${formatCurrency(cell.revenuePerImpression)}/impression` : 'No data'}
                  >
                    {cell ? formatCurrency(cell.revenuePerImpression) : '-'}
                  </div>
                );
              })}
            </>
          ))}
        </div>
      </div>

      <style jsx>{`
        .cart-types-tab {}
        .chart-card, .heatmap-card {
          background: #fff;
          border-radius: 16px;
          padding: 24px;
          border: 1px solid rgba(0, 0, 0, 0.06);
          margin-bottom: 24px;
        }
        .chart-card h3, .heatmap-card h3 {
          font-size: 17px;
          font-weight: 600;
          color: #1d1d1f;
          margin: 0 0 8px 0;
        }
        .heatmap-card p {
          font-size: 13px;
          color: #86868b;
          margin: 0 0 24px 0;
        }
        .heatmap-grid {
          display: grid;
          grid-template-columns: 100px repeat(4, 1fr);
          gap: 4px;
        }
        .heatmap-corner { background: transparent; }
        .heatmap-header {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: #fff;
          padding: 12px;
          text-align: center;
          font-size: 12px;
          font-weight: 600;
          border-radius: 8px;
        }
        .heatmap-label {
          display: flex;
          align-items: center;
          justify-content: flex-end;
          padding-right: 12px;
          font-size: 13px;
          font-weight: 500;
          color: #86868b;
        }
        .heatmap-cell {
          padding: 16px 8px;
          text-align: center;
          font-size: 13px;
          font-weight: 600;
          border-radius: 8px;
          transition: transform 0.2s ease;
          cursor: help;
        }
        .heatmap-cell:hover {
          transform: scale(1.05);
          z-index: 1;
        }
      `}</style>
    </div>
  );
}

// ============================================================================
// A/B TESTS TAB
// ============================================================================

function ABTestsTab({
  data,
  formatCurrency,
  formatPercent,
}: {
  data: AnalyticsData;
  formatCurrency: (v: number) => string;
  formatPercent: (v: number) => string;
}) {
  if (data.abTests.length === 0) {
    return (
      <div className="ab-tests-tab">
        <div className="empty-state-inline">
          <div className="empty-icon">
            <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
              <path d="M24 8V40M8 24H40" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            </svg>
          </div>
          <h3>No A/B Tests Yet</h3>
          <p>A/B tests are automatically created when you enable multiple display styles</p>
        </div>
        <style jsx>{`
          .ab-tests-tab {}
          .empty-state-inline {
            background: #fff;
            border-radius: 16px;
            padding: 60px 24px;
            text-align: center;
            border: 1px solid rgba(0, 0, 0, 0.06);
          }
          .empty-icon {
            width: 64px;
            height: 64px;
            background: #f5f5f7;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            margin: 0 auto 20px;
            color: #86868b;
          }
          .empty-state-inline h3 {
            font-size: 18px;
            font-weight: 600;
            color: #1d1d1f;
            margin: 0 0 8px 0;
          }
          .empty-state-inline p {
            font-size: 14px;
            color: #86868b;
            margin: 0;
          }
        `}</style>
      </div>
    );
  }

  return (
    <div className="ab-tests-tab">
      <div className="tests-list">
        {data.abTests.map((test) => (
          <div key={test.id} className="test-card">
            <div className="test-header">
              <div className="test-info">
                <h3>{test.name}</h3>
                <span className={`test-status ${test.status}`}>
                  {test.status === 'running' ? 'Running' : test.status === 'completed' ? 'Completed' : 'Winner Found'}
                </span>
              </div>
              <div className="test-confidence">
                <span className="confidence-label">Confidence</span>
                <span className="confidence-value">{formatPercent(test.confidence)}</span>
              </div>
            </div>
            <div className="variants-grid">
              {test.variants.map((variant) => (
                <div key={variant.name} className={`variant-card ${variant.isWinner ? 'winner' : ''}`}>
                  {variant.isWinner && <span className="winner-label">Winner</span>}
                  <h4>{variant.name}</h4>
                  <div className="variant-stats">
                    <div className="variant-stat">
                      <span>Impressions</span>
                      <strong>{variant.impressions.toLocaleString()}</strong>
                    </div>
                    <div className="variant-stat">
                      <span>Conversions</span>
                      <strong>{variant.conversions.toLocaleString()}</strong>
                    </div>
                    <div className="variant-stat">
                      <span>Revenue</span>
                      <strong>{formatCurrency(variant.revenue)}</strong>
                    </div>
                    <div className="variant-stat highlight">
                      <span>Conversion Rate</span>
                      <strong>{formatPercent(variant.conversionRate)}</strong>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <div className="test-footer">
              <span>Started: {format(new Date(test.startDate), 'MMM d, yyyy')}</span>
              {test.endDate && <span>Ended: {format(new Date(test.endDate), 'MMM d, yyyy')}</span>}
            </div>
          </div>
        ))}
      </div>

      <style jsx>{`
        .ab-tests-tab {}
        .tests-list { display: flex; flex-direction: column; gap: 24px; }
        .test-card {
          background: #fff;
          border-radius: 16px;
          padding: 24px;
          border: 1px solid rgba(0, 0, 0, 0.06);
        }
        .test-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 24px;
        }
        .test-info h3 {
          font-size: 18px;
          font-weight: 600;
          color: #1d1d1f;
          margin: 0 0 8px 0;
        }
        .test-status {
          display: inline-block;
          padding: 4px 12px;
          border-radius: 6px;
          font-size: 12px;
          font-weight: 600;
        }
        .test-status.running { background: rgba(102, 126, 234, 0.15); color: #667eea; }
        .test-status.completed { background: rgba(134, 134, 139, 0.15); color: #86868b; }
        .test-status.winner { background: rgba(52, 199, 89, 0.15); color: #34c759; }
        .test-confidence { text-align: right; }
        .confidence-label { display: block; font-size: 12px; color: #86868b; margin-bottom: 4px; }
        .confidence-value { font-size: 24px; font-weight: 700; color: #667eea; }
        .variants-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
          gap: 16px;
          margin-bottom: 20px;
        }
        .variant-card {
          background: #f5f5f7;
          border-radius: 12px;
          padding: 20px;
          position: relative;
        }
        .variant-card.winner {
          background: linear-gradient(135deg, rgba(52, 199, 89, 0.1) 0%, rgba(52, 199, 89, 0.05) 100%);
          border: 2px solid rgba(52, 199, 89, 0.3);
        }
        .winner-label {
          position: absolute;
          top: -8px;
          right: 12px;
          background: #34c759;
          color: #fff;
          font-size: 11px;
          font-weight: 700;
          padding: 4px 10px;
          border-radius: 6px;
        }
        .variant-card h4 {
          font-size: 15px;
          font-weight: 600;
          color: #1d1d1f;
          margin: 0 0 16px 0;
        }
        .variant-stats { display: grid; grid-template-columns: repeat(2, 1fr); gap: 12px; }
        .variant-stat span { display: block; font-size: 12px; color: #86868b; margin-bottom: 2px; }
        .variant-stat strong { font-size: 16px; color: #1d1d1f; }
        .variant-stat.highlight strong { color: #667eea; }
        .test-footer { display: flex; gap: 20px; font-size: 13px; color: #86868b; }
      `}</style>
    </div>
  );
}

// ============================================================================
// ATTRIBUTION TAB
// ============================================================================

function AttributionTab({
  data,
  formatCurrency,
  formatPercent,
}: {
  data: AnalyticsData;
  formatCurrency: (v: number) => string;
  formatPercent: (v: number) => string;
}) {
  const { attribution } = data;

  return (
    <div className="attribution-tab">
      <div className="attribution-header">
        <h2>Revenue Attribution</h2>
        <p>Before vs after ML optimization</p>
      </div>

      <div className="attribution-comparison">
        <div className="attribution-card before">
          <div className="attribution-label">Before Optimization</div>
          <div className="attribution-period">{attribution.beforeOptimization.period}</div>
          <div className="attribution-metrics">
            <div className="metric">
              <span>Avg Revenue/Order</span>
              <strong>{formatCurrency(attribution.beforeOptimization.avgRevenuePerOrder)}</strong>
            </div>
            <div className="metric">
              <span>Acceptance Rate</span>
              <strong>{formatPercent(attribution.beforeOptimization.avgAcceptanceRate)}</strong>
            </div>
          </div>
        </div>

        <div className="attribution-arrow">
          <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
            <path d="M8 24H40M40 24L30 14M40 24L30 34" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>

        <div className="attribution-card after">
          <div className="attribution-label">After Optimization</div>
          <div className="attribution-period">{attribution.afterOptimization.period}</div>
          <div className="attribution-metrics">
            <div className="metric">
              <span>Avg Revenue/Order</span>
              <strong>{formatCurrency(attribution.afterOptimization.avgRevenuePerOrder)}</strong>
            </div>
            <div className="metric">
              <span>Acceptance Rate</span>
              <strong>{formatPercent(attribution.afterOptimization.avgAcceptanceRate)}</strong>
            </div>
          </div>
        </div>
      </div>

      <div className="improvement-summary">
        <div className="improvement-card">
          <div className="improvement-icon success">
            <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
              <path d="M16 4V28M16 4L8 12M16 4L24 12" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <div className="improvement-content">
            <div className="improvement-label">Revenue Per Order Increase</div>
            <div className="improvement-value">+{formatCurrency(attribution.improvement.revenueIncrease)}</div>
            <div className="improvement-percent">+{formatPercent(attribution.improvement.percentageIncrease)} improvement</div>
          </div>
        </div>

        <div className="improvement-card">
          <div className="improvement-icon primary">
            <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
              <path d="M4 28L14 18L20 24L28 12" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <div className="improvement-content">
            <div className="improvement-label">Additional Revenue Generated</div>
            <div className="improvement-value">{formatCurrency(attribution.improvement.additionalRevenue)}</div>
            <div className="improvement-percent">from ML optimization</div>
          </div>
        </div>
      </div>

      <style jsx>{`
        .attribution-tab {}
        .attribution-header {
          text-align: center;
          margin-bottom: 40px;
        }
        .attribution-header h2 {
          font-size: 24px;
          font-weight: 700;
          color: #1d1d1f;
          margin: 0 0 8px 0;
        }
        .attribution-header p {
          font-size: 15px;
          color: #86868b;
          margin: 0;
        }
        .attribution-comparison {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 32px;
          margin-bottom: 48px;
          flex-wrap: wrap;
        }
        .attribution-card {
          background: #fff;
          border-radius: 16px;
          padding: 32px;
          width: 280px;
          border: 1px solid rgba(0, 0, 0, 0.06);
        }
        .attribution-card.before { opacity: 0.7; }
        .attribution-card.after {
          border: 2px solid #667eea;
          box-shadow: 0 4px 20px rgba(102, 126, 234, 0.2);
        }
        .attribution-label {
          font-size: 14px;
          font-weight: 600;
          color: #86868b;
          margin-bottom: 4px;
        }
        .attribution-period {
          font-size: 12px;
          color: #86868b;
          margin-bottom: 20px;
        }
        .attribution-metrics .metric {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 12px 0;
          border-bottom: 1px solid rgba(0, 0, 0, 0.06);
        }
        .attribution-metrics .metric:last-child { border-bottom: none; }
        .attribution-metrics .metric span { font-size: 13px; color: #86868b; }
        .attribution-metrics .metric strong { font-size: 18px; font-weight: 700; color: #1d1d1f; }
        .attribution-arrow { color: #667eea; }
        .improvement-summary {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
          gap: 24px;
        }
        .improvement-card {
          background: #fff;
          border-radius: 16px;
          padding: 32px;
          display: flex;
          align-items: center;
          gap: 24px;
          border: 1px solid rgba(0, 0, 0, 0.06);
        }
        .improvement-icon {
          width: 64px;
          height: 64px;
          border-radius: 16px;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }
        .improvement-icon.success { background: rgba(52, 199, 89, 0.15); color: #34c759; }
        .improvement-icon.primary { background: rgba(102, 126, 234, 0.15); color: #667eea; }
        .improvement-label { font-size: 13px; color: #86868b; margin-bottom: 4px; }
        .improvement-value { font-size: 32px; font-weight: 700; color: #1d1d1f; margin-bottom: 4px; }
        .improvement-percent { font-size: 14px; color: #34c759; font-weight: 600; }
      `}</style>
    </div>
  );
}

// ============================================================================
// MOCK DATA GENERATOR
// ============================================================================

function generateMockData(): AnalyticsData {
  const trends = [];
  for (let i = 30; i >= 0; i--) {
    const date = subDays(new Date(), i);
    trends.push({
      date: date.toISOString(),
      revenue: 500 + Math.random() * 500 + (30 - i) * 10,
      orders: 20 + Math.floor(Math.random() * 20),
      impressions: 200 + Math.floor(Math.random() * 100),
      adds: 20 + Math.floor(Math.random() * 20),
      acceptanceRate: 8 + Math.random() * 4,
      revenuePerOrder: 20 + Math.random() * 10,
    });
  }

  return {
    summary: {
      totalRevenue: 23450,
      totalOrders: 892,
      totalImpressions: 12450,
      totalAdds: 1340,
      acceptanceRate: 10.8,
      revenuePerOrder: 26.29,
      aovImpact: 12.4,
      conversionImpact: 3.2,
      previousPeriod: {
        totalRevenue: 19800,
        revenuePerOrder: 22.10,
        acceptanceRate: 9.2,
      },
    },
    trends,
    displayStyles: [
      { style: 'minimal-strip', impressions: 4500, adds: 520, revenue: 9800, revenuePerImpression: 2.18, acceptanceRate: 11.6, avgCartValue: 85, confidence: 0.92 },
      { style: 'cards', impressions: 3800, adds: 410, revenue: 7200, revenuePerImpression: 1.89, acceptanceRate: 10.8, avgCartValue: 92, confidence: 0.88 },
      { style: 'frequently-bought', impressions: 2100, adds: 240, revenue: 4100, revenuePerImpression: 1.95, acceptanceRate: 11.4, avgCartValue: 78, confidence: 0.85 },
      { style: 'banner', impressions: 1200, adds: 100, revenue: 1500, revenuePerImpression: 1.25, acceptanceRate: 8.3, avgCartValue: 65, confidence: 0.72 },
      { style: 'list', impressions: 850, adds: 70, revenue: 850, revenuePerImpression: 1.00, acceptanceRate: 8.2, avgCartValue: 58, confidence: 0.65 },
    ],
    products: [
      { id: '1', title: 'Premium Leather Wallet', image: null, impressions: 2100, adds: 280, revenue: 4200, conversionRate: 0.133, avgOrderValue: 45, bestPosition: 1, confidenceScore: 0.94 },
      { id: '2', title: 'Wireless Earbuds Pro', image: null, impressions: 1800, adds: 220, revenue: 3960, conversionRate: 0.122, avgOrderValue: 89, bestPosition: 1, confidenceScore: 0.91 },
      { id: '3', title: 'Phone Case Ultra', image: null, impressions: 1650, adds: 190, revenue: 2850, conversionRate: 0.115, avgOrderValue: 29, bestPosition: 2, confidenceScore: 0.88 },
      { id: '4', title: 'USB-C Hub 7-in-1', image: null, impressions: 1400, adds: 150, revenue: 2250, conversionRate: 0.107, avgOrderValue: 65, bestPosition: 2, confidenceScore: 0.84 },
      { id: '5', title: 'Laptop Stand Aluminum', image: null, impressions: 1200, adds: 120, revenue: 1800, conversionRate: 0.100, avgOrderValue: 49, bestPosition: 3, confidenceScore: 0.79 },
    ],
    cartTypes: [
      { type: '1 item', range: '$0-50', impressions: 3200, adds: 290, revenue: 4350, acceptanceRate: 9.1, avgUpsellValue: 15 },
      { type: '2-3 items', range: '$50-100', impressions: 4100, adds: 480, revenue: 7680, acceptanceRate: 11.7, avgUpsellValue: 16 },
      { type: '4-5 items', range: '$100-200', impressions: 3500, adds: 420, revenue: 7560, acceptanceRate: 12.0, avgUpsellValue: 18 },
      { type: '6+ items', range: '$200+', impressions: 1650, adds: 150, revenue: 3000, acceptanceRate: 9.1, avgUpsellValue: 20 },
    ],
    contextHeatmap: [
      { cartValueBucket: '0-50', itemCountBucket: '1', revenue: 2100, impressions: 1800, revenuePerImpression: 1.17, acceptanceRate: 8.2, bestStyle: 'minimal-strip' },
      { cartValueBucket: '50-100', itemCountBucket: '1', revenue: 2800, impressions: 2000, revenuePerImpression: 1.40, acceptanceRate: 9.5, bestStyle: 'cards' },
      { cartValueBucket: '100-200', itemCountBucket: '1', revenue: 1900, impressions: 1200, revenuePerImpression: 1.58, acceptanceRate: 10.8, bestStyle: 'frequently-bought' },
      { cartValueBucket: '200+', itemCountBucket: '1', revenue: 1100, impressions: 600, revenuePerImpression: 1.83, acceptanceRate: 11.2, bestStyle: 'minimal-strip' },
      { cartValueBucket: '0-50', itemCountBucket: '2-3', revenue: 1800, impressions: 1400, revenuePerImpression: 1.29, acceptanceRate: 9.1, bestStyle: 'list' },
      { cartValueBucket: '50-100', itemCountBucket: '2-3', revenue: 3600, impressions: 2200, revenuePerImpression: 1.64, acceptanceRate: 11.4, bestStyle: 'cards' },
      { cartValueBucket: '100-200', itemCountBucket: '2-3', revenue: 4200, impressions: 2100, revenuePerImpression: 2.00, acceptanceRate: 12.8, bestStyle: 'frequently-bought' },
      { cartValueBucket: '200+', itemCountBucket: '2-3', revenue: 2400, impressions: 1000, revenuePerImpression: 2.40, acceptanceRate: 13.5, bestStyle: 'minimal-strip' },
      { cartValueBucket: '0-50', itemCountBucket: '4-5', revenue: 900, impressions: 800, revenuePerImpression: 1.13, acceptanceRate: 8.5, bestStyle: 'list' },
      { cartValueBucket: '50-100', itemCountBucket: '4-5', revenue: 2100, impressions: 1300, revenuePerImpression: 1.62, acceptanceRate: 11.2, bestStyle: 'cards' },
      { cartValueBucket: '100-200', itemCountBucket: '4-5', revenue: 3000, impressions: 1500, revenuePerImpression: 2.00, acceptanceRate: 12.5, bestStyle: 'frequently-bought' },
      { cartValueBucket: '200+', itemCountBucket: '4-5', revenue: 1800, impressions: 700, revenuePerImpression: 2.57, acceptanceRate: 14.2, bestStyle: 'minimal-strip' },
      { cartValueBucket: '0-50', itemCountBucket: '6+', revenue: 400, impressions: 400, revenuePerImpression: 1.00, acceptanceRate: 7.8, bestStyle: 'list' },
      { cartValueBucket: '50-100', itemCountBucket: '6+', revenue: 800, impressions: 500, revenuePerImpression: 1.60, acceptanceRate: 10.5, bestStyle: 'cards' },
      { cartValueBucket: '100-200', itemCountBucket: '6+', revenue: 1200, impressions: 500, revenuePerImpression: 2.40, acceptanceRate: 13.0, bestStyle: 'frequently-bought' },
      { cartValueBucket: '200+', itemCountBucket: '6+', revenue: 900, impressions: 300, revenuePerImpression: 3.00, acceptanceRate: 15.5, bestStyle: 'minimal-strip' },
    ],
    abTests: [
      {
        id: '1',
        name: 'Display Style Test',
        status: 'winner',
        variants: [
          { name: 'Minimal Strip', impressions: 4500, conversions: 520, revenue: 9800, conversionRate: 11.6, isWinner: true },
          { name: 'Product Cards', impressions: 3800, conversions: 410, revenue: 7200, conversionRate: 10.8, isWinner: false },
        ],
        startDate: subDays(new Date(), 21).toISOString(),
        endDate: subDays(new Date(), 3).toISOString(),
        confidence: 95.2,
      },
    ],
    attribution: {
      beforeOptimization: {
        avgRevenuePerOrder: 18.50,
        avgAcceptanceRate: 7.2,
        period: 'First 2 weeks',
      },
      afterOptimization: {
        avgRevenuePerOrder: 26.29,
        avgAcceptanceRate: 10.8,
        period: 'Last 2 weeks',
      },
      improvement: {
        revenueIncrease: 7.79,
        percentageIncrease: 42.1,
        additionalRevenue: 6950,
      },
    },
  };
}
