/**
 * TurboCart Dashboard
 * Feature-block based dashboard with quick stats and configuration cards
 */

'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { authenticatedFetch } from '@/lib/shopify/authenticated-fetch';

interface DashboardStats {
  totalRevenue: number;
  totalOrders: number;
  conversionRate: number;
  avgOrderIncrease: number;
}

interface FeatureStatus {
  upsells: boolean;
  rewards: boolean;
  addons: boolean;
  timer: boolean;
  announcement: boolean;
}

interface FeatureCardData {
  id: keyof FeatureStatus;
  name: string;
  description: string;
  icon: string;
  color: string;
  href: string;
}

const FEATURE_CARDS: FeatureCardData[] = [
  {
    id: 'upsells',
    name: 'Cart Upsells',
    description: 'Product recommendations to increase order value',
    icon: '🛒',
    color: '#6366f1',
    href: '/products',
  },
  {
    id: 'rewards',
    name: 'Rewards Progress',
    description: 'Free shipping & discount progress bars',
    icon: '🎁',
    color: '#10b981',
    href: '/cart-features',
  },
  {
    id: 'addons',
    name: 'Quick Add-Ons',
    description: 'One-click extras like shipping protection',
    icon: '⚡',
    color: '#f59e0b',
    href: '/cart-features',
  },
  {
    id: 'timer',
    name: 'Urgency Timer',
    description: 'Countdown timer to encourage checkout',
    icon: '⏱️',
    color: '#ef4444',
    href: '/cart-features',
  },
  {
    id: 'announcement',
    name: 'Announcement Bar',
    description: 'Custom messages and promotions',
    icon: '📢',
    color: '#8b5cf6',
    href: '/cart-features',
  },
];

export default function DashboardPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<DashboardStats>({
    totalRevenue: 0,
    totalOrders: 0,
    conversionRate: 0,
    avgOrderIncrease: 0,
  });
  const [features, setFeatures] = useState<FeatureStatus>({
    upsells: true,
    rewards: false,
    addons: false,
    timer: false,
    announcement: false,
  });
  const [productsCount, setProductsCount] = useState(0);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);

      // Fetch settings and products in parallel
      const [settingsRes, productsRes] = await Promise.all([
        authenticatedFetch('/api/admin/cart-features'),
        authenticatedFetch('/api/admin/products/selected'),
      ]);

      if (settingsRes.ok) {
        const data = await settingsRes.json();
        if (data.settings?.features) {
          setFeatures(data.settings.features);
        }
      }

      if (productsRes.ok) {
        const data = await productsRes.json();
        setProductsCount(data.products?.length || 0);
      }

      // For now, set placeholder stats (can be connected to real analytics later)
      setStats({
        totalRevenue: 0,
        totalOrders: 0,
        conversionRate: 0,
        avgOrderIncrease: 0,
      });
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleFeature = async (featureId: keyof FeatureStatus) => {
    const newValue = !features[featureId];
    setFeatures(prev => ({ ...prev, [featureId]: newValue }));

    try {
      await authenticatedFetch('/api/admin/cart-features', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          settings: {
            features: { [featureId]: newValue },
          },
        }),
      });
    } catch (error) {
      console.error('Error updating feature:', error);
      // Revert on error
      setFeatures(prev => ({ ...prev, [featureId]: !newValue }));
    }
  };

  const navigateTo = (href: string) => {
    router.push(href);
  };

  if (loading) {
    return (
      <div className="dashboard-loading">
        <div className="loading-spinner" />
        <p>Loading dashboard...</p>
        <style jsx>{`
          .dashboard-loading {
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            min-height: 400px;
          }
          .loading-spinner {
            width: 40px;
            height: 40px;
            border: 3px solid #e5e7eb;
            border-top-color: #6366f1;
            border-radius: 50%;
            animation: spin 0.8s linear infinite;
          }
          @keyframes spin {
            to { transform: rotate(360deg); }
          }
          p {
            margin-top: 16px;
            color: #6b7280;
          }
        `}</style>
      </div>
    );
  }

  return (
    <div className="dashboard">
      {/* Header */}
      <div className="dashboard-header">
        <div>
          <h1>Dashboard</h1>
          <p>Manage your cart features and track performance</p>
        </div>
        <button className="btn-primary" onClick={() => navigateTo('/products')}>
          Manage Products
        </button>
      </div>

      {/* Quick Stats */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon purple">📈</div>
          <div className="stat-content">
            <span className="stat-label">Active Features</span>
            <span className="stat-value">{Object.values(features).filter(Boolean).length}</span>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon blue">🛒</div>
          <div className="stat-content">
            <span className="stat-label">Upsell Products</span>
            <span className="stat-value">{productsCount}</span>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon green">💰</div>
          <div className="stat-content">
            <span className="stat-label">Revenue Generated</span>
            <span className="stat-value">${stats.totalRevenue.toFixed(0)}</span>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon orange">📊</div>
          <div className="stat-content">
            <span className="stat-label">Conversion Rate</span>
            <span className="stat-value">{stats.conversionRate.toFixed(1)}%</span>
          </div>
        </div>
      </div>

      {/* Feature Cards */}
      <div className="section">
        <div className="section-header">
          <h2>Cart Features</h2>
          <p>Toggle features on/off or click to configure</p>
        </div>

        <div className="features-grid">
          {FEATURE_CARDS.map(feature => (
            <div
              key={feature.id}
              className={`feature-card ${features[feature.id] ? 'enabled' : 'disabled'}`}
              style={{ '--feature-color': feature.color } as React.CSSProperties}
            >
              <div className="feature-header">
                <span className="feature-icon">{feature.icon}</span>
                <label className="toggle-switch">
                  <input
                    type="checkbox"
                    checked={features[feature.id]}
                    onChange={() => toggleFeature(feature.id)}
                  />
                  <span className="toggle-slider" />
                </label>
              </div>
              <h3>{feature.name}</h3>
              <p>{feature.description}</p>
              <button
                className="feature-config-btn"
                onClick={() => navigateTo(feature.href)}
              >
                Configure →
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="section">
        <div className="section-header">
          <h2>Quick Actions</h2>
        </div>

        <div className="actions-grid">
          <button className="action-card" onClick={() => navigateTo('/products')}>
            <span className="action-icon">🛍️</span>
            <span className="action-text">Add Products</span>
            <span className="action-arrow">→</span>
          </button>
          <button className="action-card" onClick={() => navigateTo('/cart-features')}>
            <span className="action-icon">⚙️</span>
            <span className="action-text">Cart Settings</span>
            <span className="action-arrow">→</span>
          </button>
          <button className="action-card" onClick={() => navigateTo('/analytics')}>
            <span className="action-icon">📊</span>
            <span className="action-text">View Analytics</span>
            <span className="action-arrow">→</span>
          </button>
          <button className="action-card" onClick={() => navigateTo('/settings')}>
            <span className="action-icon">🎨</span>
            <span className="action-text">Display Settings</span>
            <span className="action-arrow">→</span>
          </button>
        </div>
      </div>

      <style jsx>{`
        .dashboard {
          padding: 24px;
          max-width: 1200px;
          margin: 0 auto;
        }

        .dashboard-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 32px;
        }

        .dashboard-header h1 {
          font-size: 28px;
          font-weight: 700;
          color: #111827;
          margin: 0 0 4px;
        }

        .dashboard-header p {
          font-size: 14px;
          color: #6b7280;
          margin: 0;
        }

        .btn-primary {
          background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
          color: white;
          padding: 12px 24px;
          border: none;
          border-radius: 10px;
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .btn-primary:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 20px rgba(99, 102, 241, 0.3);
        }

        /* Stats Grid */
        .stats-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 16px;
          margin-bottom: 40px;
        }

        .stat-card {
          background: white;
          border-radius: 16px;
          padding: 20px;
          display: flex;
          align-items: center;
          gap: 16px;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
          border: 1px solid #f3f4f6;
        }

        .stat-icon {
          width: 48px;
          height: 48px;
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 24px;
        }

        .stat-icon.purple { background: rgba(99, 102, 241, 0.1); }
        .stat-icon.blue { background: rgba(59, 130, 246, 0.1); }
        .stat-icon.green { background: rgba(16, 185, 129, 0.1); }
        .stat-icon.orange { background: rgba(245, 158, 11, 0.1); }

        .stat-content {
          display: flex;
          flex-direction: column;
        }

        .stat-label {
          font-size: 12px;
          color: #6b7280;
          margin-bottom: 2px;
        }

        .stat-value {
          font-size: 24px;
          font-weight: 700;
          color: #111827;
        }

        /* Sections */
        .section {
          margin-bottom: 40px;
        }

        .section-header {
          margin-bottom: 20px;
        }

        .section-header h2 {
          font-size: 18px;
          font-weight: 600;
          color: #111827;
          margin: 0 0 4px;
        }

        .section-header p {
          font-size: 14px;
          color: #6b7280;
          margin: 0;
        }

        /* Feature Cards */
        .features-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
          gap: 16px;
        }

        .feature-card {
          background: white;
          border-radius: 16px;
          padding: 24px;
          border: 2px solid #f3f4f6;
          transition: all 0.2s ease;
        }

        .feature-card.enabled {
          border-color: var(--feature-color);
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
        }

        .feature-card.disabled {
          opacity: 0.7;
        }

        .feature-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 16px;
        }

        .feature-icon {
          font-size: 32px;
        }

        /* Toggle Switch */
        .toggle-switch {
          position: relative;
          display: inline-block;
          width: 48px;
          height: 26px;
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
          background-color: #e5e7eb;
          transition: 0.3s;
          border-radius: 26px;
        }

        .toggle-slider:before {
          position: absolute;
          content: "";
          height: 20px;
          width: 20px;
          left: 3px;
          bottom: 3px;
          background-color: white;
          transition: 0.3s;
          border-radius: 50%;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        }

        .toggle-switch input:checked + .toggle-slider {
          background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
        }

        .toggle-switch input:checked + .toggle-slider:before {
          transform: translateX(22px);
        }

        .feature-card h3 {
          font-size: 16px;
          font-weight: 600;
          color: #111827;
          margin: 0 0 6px;
        }

        .feature-card p {
          font-size: 13px;
          color: #6b7280;
          margin: 0 0 16px;
          line-height: 1.4;
        }

        .feature-config-btn {
          background: transparent;
          border: 1px solid #e5e7eb;
          padding: 8px 16px;
          border-radius: 8px;
          font-size: 13px;
          font-weight: 500;
          color: #374151;
          cursor: pointer;
          transition: all 0.2s ease;
          width: 100%;
        }

        .feature-config-btn:hover {
          background: #f9fafb;
          border-color: #d1d5db;
        }

        /* Actions Grid */
        .actions-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 16px;
        }

        .action-card {
          background: white;
          border: 1px solid #f3f4f6;
          border-radius: 12px;
          padding: 20px;
          display: flex;
          align-items: center;
          gap: 12px;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .action-card:hover {
          border-color: #6366f1;
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(99, 102, 241, 0.1);
        }

        .action-icon {
          font-size: 24px;
        }

        .action-text {
          flex: 1;
          font-size: 14px;
          font-weight: 500;
          color: #374151;
        }

        .action-arrow {
          font-size: 16px;
          color: #9ca3af;
        }

        /* Responsive */
        @media (max-width: 1024px) {
          .stats-grid {
            grid-template-columns: repeat(2, 1fr);
          }
          .actions-grid {
            grid-template-columns: repeat(2, 1fr);
          }
        }

        @media (max-width: 640px) {
          .dashboard-header {
            flex-direction: column;
            gap: 16px;
          }
          .stats-grid {
            grid-template-columns: 1fr;
          }
          .features-grid {
            grid-template-columns: 1fr;
          }
          .actions-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  );
}
