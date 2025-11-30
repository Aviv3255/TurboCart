/**
 * TurboCart Dashboard
 * Main overview with analytics blocks and quick configuration
 */

'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { authenticatedFetch } from '@/lib/shopify/authenticated-fetch';
import DisplayStylePreview from '@/components/DisplayStylePreview';

interface DashboardData {
  summary: {
    totalRevenue: number;
    revenuePerOrder: number;
    acceptanceRate: number;
    totalOrders: number;
    totalImpressions: number;
    totalAdds: number;
    aovImpact: number;
  };
  previousPeriod: {
    totalRevenue: number;
    revenuePerOrder: number;
    acceptanceRate: number;
  };
  topStyles: Array<{
    style: string;
    revenue: number;
    acceptanceRate: number;
    impressions: number;
  }>;
  topProducts: Array<{
    id: string;
    title: string;
    image: string | null;
    revenue: number;
    adds: number;
  }>;
  recentTrend: Array<{
    date: string;
    revenue: number;
  }>;
}

interface ShopSettings {
  enabled_display_styles: string[];
  cart_type: 'page' | 'drawer';
  max_upsells: number;
  theme_enabled: boolean;
}

interface SelectedProduct {
  id: string;
  title: string;
  image: string | null;
  price: number;
}

const STYLE_LABELS: Record<string, string> = {
  'minimal-strip': 'Minimal Strip',
  'cards': 'Product Cards',
  'banner': 'Urgency Banner',
  'list': 'Simple List',
  'frequently-bought': 'Frequently Bought',
  'masonry-grid': 'Masonry Grid',
  'vertical-scroll': 'Vertical Scroll',
  'sticky-tabs': 'Category Tabs',
  'comparison-table': 'Comparison Table',
};

export default function DashboardPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<DashboardData | null>(null);
  const [settings, setSettings] = useState<ShopSettings | null>(null);
  const [products, setProducts] = useState<SelectedProduct[]>([]);
  const [configExpanded, setConfigExpanded] = useState(false);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const endDate = new Date();
      const startDate = new Date(endDate.getTime() - 30 * 24 * 60 * 60 * 1000);

      const [analyticsRes, settingsRes, productsRes] = await Promise.all([
        authenticatedFetch(`/api/admin/analytics/comprehensive?startDate=${startDate.toISOString()}&endDate=${endDate.toISOString()}`),
        authenticatedFetch('/api/admin/settings'),
        authenticatedFetch('/api/admin/products/selected'),
      ]);

      if (analyticsRes.ok) {
        const analyticsData = await analyticsRes.json();
        setData({
          summary: analyticsData.summary || {
            totalRevenue: 0,
            revenuePerOrder: 0,
            acceptanceRate: 0,
            totalOrders: 0,
            totalImpressions: 0,
            totalAdds: 0,
            aovImpact: 0,
          },
          previousPeriod: analyticsData.summary?.previousPeriod || {
            totalRevenue: 0,
            revenuePerOrder: 0,
            acceptanceRate: 0,
          },
          topStyles: analyticsData.displayStyles?.slice(0, 3) || [],
          topProducts: analyticsData.products?.slice(0, 5) || [],
          recentTrend: analyticsData.trends?.slice(-7) || [],
        });
      }

      if (settingsRes.ok) {
        const settingsData = await settingsRes.json();
        setSettings(settingsData.settings);
      }

      if (productsRes.ok) {
        const productsData = await productsRes.json();
        setProducts(productsData.products || []);
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
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

  const getChangePercent = (current: number, previous: number) => {
    if (previous === 0) return 0;
    return ((current - previous) / previous) * 100;
  };

  if (loading) {
    return (
      <div className="dashboard-loading">
        <div className="spinner" />
        <p>Loading dashboard...</p>
        <style jsx>{`
          .dashboard-loading {
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            min-height: 60vh;
          }
          .spinner {
            width: 40px;
            height: 40px;
            border: 3px solid #e5e5ea;
            border-top-color: #000;
            border-radius: 50%;
            animation: spin 0.8s linear infinite;
          }
          @keyframes spin { to { transform: rotate(360deg); } }
          p { margin-top: 16px; color: #86868b; }
        `}</style>
      </div>
    );
  }

  const revenueChange = getChangePercent(data?.summary.totalRevenue || 0, data?.previousPeriod.totalRevenue || 0);

  return (
    <div className="dashboard">
      {/* Header */}
      <div className="dashboard-header">
        <div>
          <h1>Dashboard</h1>
          <p>Last 30 days performance</p>
        </div>
        <button className="view-analytics-btn" onClick={() => router.push('/analytics')}>
          View Full Analytics
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M6 3L11 8L6 13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
      </div>

      {/* Main KPIs */}
      <div className="kpi-grid">
        <div className="kpi-card primary">
          <div className="kpi-label">Total Upsell Revenue</div>
          <div className="kpi-value">{formatCurrency(data?.summary.totalRevenue || 0)}</div>
          <div className={`kpi-change ${revenueChange >= 0 ? 'positive' : 'negative'}`}>
            {revenueChange >= 0 ? '+' : ''}{revenueChange.toFixed(1)}% vs previous
          </div>
        </div>

        <div className="kpi-card">
          <div className="kpi-label">Revenue Per Order</div>
          <div className="kpi-value">{formatCurrency(data?.summary.revenuePerOrder || 0)}</div>
          <div className="kpi-subtext">from upsells</div>
        </div>

        <div className="kpi-card">
          <div className="kpi-label">Acceptance Rate</div>
          <div className="kpi-value">{formatPercent(data?.summary.acceptanceRate || 0)}</div>
          <div className="kpi-subtext">of impressions</div>
        </div>

        <div className="kpi-card">
          <div className="kpi-label">AOV Impact</div>
          <div className="kpi-value highlight">{data?.summary.aovImpact && data.summary.aovImpact > 0 ? '+' : ''}{formatPercent(data?.summary.aovImpact || 0)}</div>
          <div className="kpi-subtext">increase</div>
        </div>
      </div>

      {/* Quick Stats Row */}
      <div className="stats-row">
        <div className="stat-item">
          <div className="stat-icon">
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
              <circle cx="9" cy="9" r="7" stroke="currentColor" strokeWidth="1.5"/>
              <path d="M9 5V9L12 11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
          </div>
          <div>
            <span className="stat-value">{(data?.summary.totalImpressions || 0).toLocaleString()}</span>
            <span className="stat-label">Impressions</span>
          </div>
        </div>
        <div className="stat-item">
          <div className="stat-icon">
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
              <path d="M5 9L8 12L13 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              <circle cx="9" cy="9" r="7" stroke="currentColor" strokeWidth="1.5"/>
            </svg>
          </div>
          <div>
            <span className="stat-value">{(data?.summary.totalAdds || 0).toLocaleString()}</span>
            <span className="stat-label">Cart Adds</span>
          </div>
        </div>
        <div className="stat-item">
          <div className="stat-icon">
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
              <rect x="3" y="5" width="12" height="10" rx="1" stroke="currentColor" strokeWidth="1.5"/>
              <path d="M6 5V3C6 2.45 6.45 2 7 2H11C11.55 2 12 2.45 12 3V5" stroke="currentColor" strokeWidth="1.5"/>
            </svg>
          </div>
          <div>
            <span className="stat-value">{(data?.summary.totalOrders || 0).toLocaleString()}</span>
            <span className="stat-label">Orders</span>
          </div>
        </div>
        <div className="stat-item">
          <div className="stat-icon">
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
              <path d="M3 15L8 10L11 13L15 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <div>
            <span className="stat-value">{products.length}</span>
            <span className="stat-label">Active Products</span>
          </div>
        </div>
      </div>

      {/* Two Column Layout */}
      <div className="content-grid">
        {/* Left Column - Performance */}
        <div className="content-column">
          {/* Top Performing Styles */}
          <div className="card">
            <div className="card-header">
              <h3>Top Performing Styles</h3>
              <span className="badge ml-badge">Machine Learning</span>
            </div>
            {data?.topStyles && data.topStyles.length > 0 ? (
              <div className="styles-list">
                {data.topStyles.map((style, index) => (
                  <div key={style.style} className="style-item">
                    <div className="style-rank">{index + 1}</div>
                    <div className="style-preview-small">
                      <DisplayStylePreview style={style.style as 'minimal-strip' | 'cards' | 'banner' | 'list' | 'frequently-bought'} />
                    </div>
                    <div className="style-info">
                      <span className="style-name">{STYLE_LABELS[style.style] || style.style}</span>
                      <span className="style-stats">{formatCurrency(style.revenue)} revenue</span>
                    </div>
                    <div className="style-rate">{formatPercent(style.acceptanceRate)}</div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="empty-state">
                <p>No data yet. Start collecting impressions to see style performance.</p>
              </div>
            )}
          </div>

          {/* Top Products */}
          <div className="card">
            <div className="card-header">
              <h3>Top Upsell Products</h3>
            </div>
            {data?.topProducts && data.topProducts.length > 0 ? (
              <div className="products-list">
                {data.topProducts.map((product, index) => (
                  <div key={product.id} className="product-item">
                    <div className="product-rank">{index + 1}</div>
                    <div className="product-image">
                      {product.image ? (
                        <img src={product.image} alt={product.title} />
                      ) : (
                        <div className="no-image">No Image</div>
                      )}
                    </div>
                    <div className="product-info">
                      <span className="product-title">{product.title}</span>
                      <span className="product-stats">{product.adds} adds</span>
                    </div>
                    <div className="product-revenue">{formatCurrency(product.revenue)}</div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="empty-state">
                <p>No product data yet.</p>
              </div>
            )}
          </div>
        </div>

        {/* Right Column - Configuration */}
        <div className="content-column">
          {/* Configure Settings Card */}
          <div className="card config-card">
            <div className="card-header">
              <h3>Configure Settings</h3>
              <button
                className="expand-btn"
                onClick={() => setConfigExpanded(!configExpanded)}
              >
                {configExpanded ? 'Collapse' : 'Expand'}
              </button>
            </div>

            {/* Warning Banner */}
            <div className="config-warning">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <circle cx="8" cy="8" r="7" stroke="currentColor" strokeWidth="1.5"/>
                <path d="M8 5V8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                <circle cx="8" cy="11" r="1" fill="currentColor"/>
              </svg>
              <span>Frequent changes may impact Machine Learning optimization. Let the system learn for best results.</span>
            </div>

            {/* Quick View */}
            <div className="config-summary">
              <div className="config-item">
                <span className="config-label">Display Styles</span>
                <span className="config-value">{settings?.enabled_display_styles?.length || 0} active</span>
              </div>
              <div className="config-item">
                <span className="config-label">Cart Type</span>
                <span className="config-value">{settings?.cart_type === 'page' ? 'Cart Page' : 'Cart Drawer'}</span>
              </div>
              <div className="config-item">
                <span className="config-label">Max Products</span>
                <span className="config-value">{settings?.max_upsells || 3} shown</span>
              </div>
              <div className="config-item">
                <span className="config-label">Upsell Products</span>
                <span className="config-value">{products.length} selected</span>
              </div>
            </div>

            {/* Expanded Configuration */}
            {configExpanded && (
              <div className="config-expanded">
                <div className="config-section">
                  <h4>Active Display Styles</h4>
                  <div className="mini-styles-grid">
                    {settings?.enabled_display_styles?.map((style) => (
                      <div key={style} className="mini-style">
                        <div className="mini-preview">
                          <DisplayStylePreview style={style as 'minimal-strip' | 'cards' | 'banner' | 'list' | 'frequently-bought'} />
                        </div>
                        <span>{STYLE_LABELS[style] || style}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="config-section">
                  <h4>Selected Products ({products.length})</h4>
                  <div className="mini-products-grid">
                    {products.slice(0, 8).map((product) => (
                      <div key={product.id} className="mini-product">
                        {product.image ? (
                          <img src={product.image} alt={product.title} />
                        ) : (
                          <div className="no-img">No Image</div>
                        )}
                      </div>
                    ))}
                    {products.length > 8 && (
                      <div className="mini-product more">+{products.length - 8}</div>
                    )}
                  </div>
                </div>

                <div className="config-actions">
                  <button onClick={() => router.push('/settings')} className="config-btn">
                    Edit Display Styles
                  </button>
                  <button onClick={() => router.push('/products')} className="config-btn">
                    Edit Products
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Machine Learning Status */}
          <div className="card ml-card">
            <div className="card-header">
              <h3>Machine Learning Optimization</h3>
              <span className="status-badge active">Active</span>
            </div>
            <div className="ml-info">
              <p>Thompson Sampling algorithm is continuously learning which display styles and products perform best for different cart contexts.</p>
              <div className="ml-stats">
                <div className="ml-stat">
                  <span className="ml-stat-value">{(data?.summary.totalImpressions || 0).toLocaleString()}</span>
                  <span className="ml-stat-label">Training samples</span>
                </div>
                <div className="ml-stat">
                  <span className="ml-stat-value">{settings?.enabled_display_styles?.length || 0}</span>
                  <span className="ml-stat-label">Active arms</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        .dashboard {
          padding: 24px;
          max-width: 1400px;
          margin: 0 auto;
        }

        .dashboard-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 24px;
        }

        .dashboard-header h1 {
          font-size: 28px;
          font-weight: 700;
          color: #1d1d1f;
          margin: 0;
        }

        .dashboard-header p {
          font-size: 14px;
          color: #86868b;
          margin: 4px 0 0;
        }

        .view-analytics-btn {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 10px 20px;
          background: #000;
          color: #fff;
          border: none;
          border-radius: 10px;
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .view-analytics-btn:hover {
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
        }

        /* KPI Grid */
        .kpi-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 16px;
          margin-bottom: 16px;
        }

        @media (max-width: 1024px) {
          .kpi-grid { grid-template-columns: repeat(2, 1fr); }
        }

        .kpi-card {
          background: #fff;
          border-radius: 12px;
          padding: 20px;
          border: 1px solid #e5e5e5;
        }

        .kpi-card.primary {
          background: #000;
          color: #fff;
          border: none;
        }

        .kpi-label {
          font-size: 13px;
          color: #86868b;
          margin-bottom: 8px;
        }

        .kpi-card.primary .kpi-label {
          color: rgba(255, 255, 255, 0.7);
        }

        .kpi-value {
          font-size: 28px;
          font-weight: 700;
          color: #1d1d1f;
          line-height: 1.2;
        }

        .kpi-card.primary .kpi-value {
          color: #fff;
        }

        .kpi-value.highlight {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }

        .kpi-change {
          font-size: 12px;
          font-weight: 600;
          margin-top: 4px;
        }

        .kpi-change.positive { color: #34c759; }
        .kpi-change.negative { color: #ff3b30; }

        .kpi-card.primary .kpi-change {
          color: rgba(255, 255, 255, 0.7);
        }

        .kpi-subtext {
          font-size: 12px;
          color: #86868b;
          margin-top: 4px;
        }

        /* Stats Row */
        .stats-row {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 12px;
          margin-bottom: 24px;
        }

        @media (max-width: 768px) {
          .stats-row { grid-template-columns: repeat(2, 1fr); }
        }

        .stat-item {
          display: flex;
          align-items: center;
          gap: 12px;
          background: #fff;
          padding: 16px;
          border-radius: 10px;
          border: 1px solid #e5e5e5;
        }

        .stat-icon {
          width: 36px;
          height: 36px;
          background: #f5f5f7;
          border-radius: 8px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #86868b;
        }

        .stat-value {
          display: block;
          font-size: 18px;
          font-weight: 700;
          color: #1d1d1f;
        }

        .stat-label {
          display: block;
          font-size: 12px;
          color: #86868b;
        }

        /* Content Grid */
        .content-grid {
          display: grid;
          grid-template-columns: 1fr 400px;
          gap: 24px;
        }

        @media (max-width: 1024px) {
          .content-grid { grid-template-columns: 1fr; }
        }

        .content-column {
          display: flex;
          flex-direction: column;
          gap: 20px;
        }

        /* Cards */
        .card {
          background: #fff;
          border-radius: 12px;
          border: 1px solid #e5e5e5;
          overflow: hidden;
        }

        .card-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 16px 20px;
          border-bottom: 1px solid #f0f0f0;
        }

        .card-header h3 {
          font-size: 16px;
          font-weight: 600;
          color: #1d1d1f;
          margin: 0;
        }

        .badge {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: #fff;
          font-size: 11px;
          font-weight: 600;
          padding: 4px 10px;
          border-radius: 10px;
        }

        .badge.ml-badge {
          background: #000;
          color: transparent;
          background-clip: text;
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-image: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          position: relative;
          padding: 6px 12px;
          border-radius: 8px;
          font-weight: 700;
          font-size: 12px;
          letter-spacing: 0.3px;
        }

        .badge.ml-badge::before {
          content: '';
          position: absolute;
          inset: 0;
          background: #000;
          border-radius: 8px;
          z-index: -1;
        }

        .status-badge {
          font-size: 11px;
          font-weight: 600;
          padding: 4px 10px;
          border-radius: 10px;
        }

        .status-badge.active {
          background: rgba(52, 199, 89, 0.15);
          color: #34c759;
        }

        .expand-btn {
          background: #f5f5f7;
          border: none;
          padding: 6px 12px;
          border-radius: 6px;
          font-size: 12px;
          font-weight: 600;
          color: #1d1d1f;
          cursor: pointer;
        }

        .expand-btn:hover {
          background: #e5e5e5;
        }

        /* Styles List */
        .styles-list {
          padding: 12px;
        }

        .style-item {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 12px;
          border-radius: 8px;
          transition: background 0.2s ease;
        }

        .style-item:hover {
          background: #f5f5f7;
        }

        .style-rank {
          width: 24px;
          height: 24px;
          background: #000;
          color: #fff;
          font-size: 12px;
          font-weight: 700;
          border-radius: 6px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .style-preview-small {
          width: 60px;
          height: 44px;
          border-radius: 6px;
          overflow: hidden;
          background: #f5f5f7;
          border: 1px solid #e5e5e5;
        }

        .style-preview-small :global(.preview-wrapper) {
          transform: scale(0.15);
          transform-origin: top left;
          width: 400px;
        }

        .style-info {
          flex: 1;
          min-width: 0;
        }

        .style-name {
          display: block;
          font-size: 14px;
          font-weight: 600;
          color: #1d1d1f;
        }

        .style-stats {
          display: block;
          font-size: 12px;
          color: #86868b;
        }

        .style-rate {
          font-size: 14px;
          font-weight: 600;
          color: #34c759;
        }

        /* Products List */
        .products-list {
          padding: 12px;
        }

        .product-item {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 10px;
          border-radius: 8px;
        }

        .product-item:hover {
          background: #f5f5f7;
        }

        .product-rank {
          width: 20px;
          font-size: 12px;
          font-weight: 600;
          color: #86868b;
          text-align: center;
        }

        .product-image {
          width: 40px;
          height: 40px;
          border-radius: 6px;
          overflow: hidden;
          background: #f5f5f7;
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
          font-size: 8px;
          color: #86868b;
        }

        .product-info {
          flex: 1;
          min-width: 0;
        }

        .product-title {
          display: block;
          font-size: 13px;
          font-weight: 500;
          color: #1d1d1f;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .product-stats {
          display: block;
          font-size: 11px;
          color: #86868b;
        }

        .product-revenue {
          font-size: 13px;
          font-weight: 600;
          color: #667eea;
        }

        /* Config Card */
        .config-warning {
          display: flex;
          align-items: flex-start;
          gap: 10px;
          padding: 12px 16px;
          background: #fff7ed;
          color: #c2410c;
          font-size: 12px;
          line-height: 1.5;
          border-bottom: 1px solid #f0f0f0;
        }

        .config-warning svg {
          flex-shrink: 0;
          margin-top: 1px;
        }

        .config-summary {
          padding: 16px;
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 12px;
        }

        .config-item {
          display: flex;
          flex-direction: column;
          gap: 2px;
        }

        .config-label {
          font-size: 11px;
          color: #86868b;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .config-value {
          font-size: 14px;
          font-weight: 600;
          color: #1d1d1f;
        }

        .config-expanded {
          border-top: 1px solid #f0f0f0;
          padding: 16px;
        }

        .config-section {
          margin-bottom: 20px;
        }

        .config-section h4 {
          font-size: 12px;
          font-weight: 600;
          color: #86868b;
          margin: 0 0 12px;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .mini-styles-grid {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
        }

        .mini-style {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 6px;
        }

        .mini-preview {
          width: 80px;
          height: 56px;
          border-radius: 6px;
          overflow: hidden;
          background: #f5f5f7;
          border: 1px solid #e5e5e5;
        }

        .mini-preview :global(.preview-wrapper) {
          transform: scale(0.2);
          transform-origin: top left;
          width: 400px;
        }

        .mini-style span {
          font-size: 10px;
          color: #86868b;
          text-align: center;
        }

        .mini-products-grid {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
        }

        .mini-product {
          width: 48px;
          height: 48px;
          border-radius: 6px;
          overflow: hidden;
          background: #f5f5f7;
        }

        .mini-product img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .mini-product.more {
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 12px;
          font-weight: 600;
          color: #86868b;
        }

        .no-img {
          width: 100%;
          height: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 8px;
          color: #86868b;
        }

        .config-actions {
          display: flex;
          gap: 8px;
        }

        .config-btn {
          flex: 1;
          padding: 10px;
          background: #f5f5f7;
          border: none;
          border-radius: 8px;
          font-size: 13px;
          font-weight: 600;
          color: #1d1d1f;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .config-btn:hover {
          background: #e5e5e5;
        }

        /* Machine Learning Card */
        .ml-info {
          padding: 16px;
        }

        .ml-info p {
          font-size: 13px;
          color: #86868b;
          line-height: 1.5;
          margin: 0 0 16px;
        }

        .ml-stats {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 12px;
        }

        .ml-stat {
          background: #f5f5f7;
          padding: 12px;
          border-radius: 8px;
          text-align: center;
        }

        .ml-stat-value {
          display: block;
          font-size: 20px;
          font-weight: 700;
          color: #1d1d1f;
        }

        .ml-stat-label {
          display: block;
          font-size: 11px;
          color: #86868b;
          margin-top: 2px;
        }

        .empty-state {
          padding: 32px;
          text-align: center;
        }

        .empty-state p {
          font-size: 13px;
          color: #86868b;
          margin: 0;
        }
      `}</style>
    </div>
  );
}
