/**
 * Admin Dashboard Page
 * Main overview with key metrics and quick actions
 */

'use client';

import { useState, useEffect } from 'react';
import {
  Page,
  Layout,
  LegacyCard,
  Text,
  Button,
  BlockStack,
  InlineGrid,
  Box,
  Banner,
  Spinner,
} from '@shopify/polaris';
import { useRouter } from 'next/navigation';

interface DashboardStats {
  total_revenue: number;
  aov_increase: number;
  acceptance_rate: number;
  active_upsells: number;
}

export default function DashboardPage() {
  const router = useRouter();
  const [stats, setStats] = useState<DashboardStats>({
    total_revenue: 0,
    aov_increase: 0,
    acceptance_rate: 0,
    active_upsells: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);

      // Fetch analytics summary
      const endDate = new Date();
      const startDate = new Date(endDate.getTime() - 30 * 24 * 60 * 60 * 1000);

      const [analyticsResponse, productsResponse] = await Promise.all([
        fetch(`/api/admin/analytics?startDate=${startDate.toISOString()}&endDate=${endDate.toISOString()}`),
        fetch('/api/admin/products/selected'),
      ]);

      if (analyticsResponse.ok) {
        const analyticsData = await analyticsResponse.json();
        const summary = analyticsData.summary;

        setStats({
          total_revenue: summary?.total_revenue || 0,
          aov_increase: summary?.avg_order_value || 0,
          acceptance_rate: summary?.acceptance_rate || 0,
          active_upsells: 0, // Will be set from products response
        });
      }

      if (productsResponse.ok) {
        const productsData = await productsResponse.json();
        setStats((prev) => ({
          ...prev,
          active_upsells: productsData.products?.length || 0,
        }));
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
    }).format(value);
  };

  return (
    <Page
      title="Dashboard"
      subtitle="Your AI-powered upsell engine is ready to boost your sales"
    >
      <Layout>
        {/* Welcome Banner */}
        <Layout.Section>
          <Banner
            title="Welcome to TurboCart"
            tone="info"
            onDismiss={() => {}}
          >
            <p>Get started by selecting products and choosing your display style below.</p>
          </Banner>
        </Layout.Section>

        {/* Stats Grid */}
        <Layout.Section>
          {loading ? (
            <div style={{ padding: '60px', textAlign: 'center' }}>
              <Spinner size="large" />
              <p style={{ marginTop: '16px' }}>Loading dashboard...</p>
            </div>
          ) : (
            <InlineGrid columns={{ xs: 1, sm: 2, md: 4 }} gap="400">
              <LegacyCard sectioned>
                <BlockStack gap="200">
                  <Text as="h3" variant="headingSm" tone="subdued">
                    Total Revenue
                  </Text>
                  <Text as="p" variant="heading2xl">
                    {formatCurrency(stats.total_revenue)}
                  </Text>
                  <Text as="p" variant="bodySm" tone="subdued">
                    Last 30 days
                  </Text>
                </BlockStack>
              </LegacyCard>

              <LegacyCard sectioned>
                <BlockStack gap="200">
                  <Text as="h3" variant="headingSm" tone="subdued">
                    AOV Increase
                  </Text>
                  <Text as="p" variant="heading2xl">
                    {formatCurrency(stats.aov_increase)}
                  </Text>
                  <Text as="p" variant="bodySm" tone="subdued">
                    {stats.aov_increase > 0 ? 'Average order value' : 'No data yet'}
                  </Text>
                </BlockStack>
              </LegacyCard>

              <LegacyCard sectioned>
                <BlockStack gap="200">
                  <Text as="h3" variant="headingSm" tone="subdued">
                    Acceptance Rate
                  </Text>
                  <Text as="p" variant="heading2xl">
                    {stats.acceptance_rate.toFixed(1)}%
                  </Text>
                  <Text as="p" variant="bodySm" tone="subdued">
                    {stats.acceptance_rate > 0 ? 'Conversion rate' : 'No data yet'}
                  </Text>
                </BlockStack>
              </LegacyCard>

              <LegacyCard sectioned>
                <BlockStack gap="200">
                  <Text as="h3" variant="headingSm" tone="subdued">
                    Active Upsells
                  </Text>
                  <Text as="p" variant="heading2xl">
                    {stats.active_upsells}
                  </Text>
                  <Text as="p" variant="bodySm" tone="subdued">
                    {stats.active_upsells > 0 ? 'Products selected' : 'Get started below'}
                  </Text>
                </BlockStack>
              </LegacyCard>
            </InlineGrid>
          )}
        </Layout.Section>

        {/* Quick Actions */}
        <Layout.Section>
          <LegacyCard title="Quick Start" sectioned>
            <InlineGrid columns={{ xs: 1, sm: 2, md: 3 }} gap="400">
              <Box>
                <BlockStack gap="400">
                  <Box>
                    <Text as="p" variant="headingMd">
                      📦 Select Products
                    </Text>
                  </Box>
                  <Text as="p" variant="bodyMd" tone="subdued">
                    Choose 10-50 products to start upselling
                  </Text>
                  <Button
                    variant="primary"
                    fullWidth
                    onClick={() => router.push('/products')}
                  >
                    Select Products
                  </Button>
                </BlockStack>
              </Box>

              <Box>
                <BlockStack gap="400">
                  <Box>
                    <Text as="p" variant="headingMd">
                      🎨 Choose Display Style
                    </Text>
                  </Box>
                  <Text as="p" variant="bodyMd" tone="subdued">
                    Pick from 5 beautiful upsell designs
                  </Text>
                  <Button
                    fullWidth
                    onClick={() => router.push('/settings')}
                  >
                    View Styles
                  </Button>
                </BlockStack>
              </Box>

              <Box>
                <BlockStack gap="400">
                  <Box>
                    <Text as="p" variant="headingMd">
                      📊 View Analytics
                    </Text>
                  </Box>
                  <Text as="p" variant="bodyMd" tone="subdued">
                    Track performance and ROI in real-time
                  </Text>
                  <Button
                    fullWidth
                    onClick={() => router.push('/analytics')}
                  >
                    Open Analytics
                  </Button>
                </BlockStack>
              </Box>
            </InlineGrid>
          </LegacyCard>
        </Layout.Section>

        {/* Getting Started Guide */}
        <Layout.Section>
          <LegacyCard title="Getting Started with TurboCart" sectioned>
            <BlockStack gap="400">
              <Box>
                <InlineGrid columns={{ xs: 1, md: 2 }} gap="400">
                  <BlockStack gap="200">
                    <Text as="h3" variant="headingMd">
                      1. Select Products
                    </Text>
                    <Text as="p" variant="bodyMd" tone="subdued">
                      Choose 10-50 products from your catalog that you want to upsell
                    </Text>
                  </BlockStack>

                  <BlockStack gap="200">
                    <Text as="h3" variant="headingMd">
                      2. Choose Display Style
                    </Text>
                    <Text as="p" variant="bodyMd" tone="subdued">
                      Select from 5 clean, minimal designs that match your theme
                    </Text>
                  </BlockStack>

                  <BlockStack gap="200">
                    <Text as="h3" variant="headingMd">
                      3. Enable in Theme
                    </Text>
                    <Text as="p" variant="bodyMd" tone="subdued">
                      Add the TurboCart app block to your cart page or drawer
                    </Text>
                  </BlockStack>

                  <BlockStack gap="200">
                    <Text as="h3" variant="headingMd">
                      4. Let AI Optimize
                    </Text>
                    <Text as="p" variant="bodyMd" tone="subdued">
                      Our AI will automatically test and optimize for maximum revenue
                    </Text>
                  </BlockStack>
                </InlineGrid>
              </Box>
            </BlockStack>
          </LegacyCard>
        </Layout.Section>
      </Layout>
    </Page>
  );
}
