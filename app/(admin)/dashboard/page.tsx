/**
 * Admin Dashboard Page
 * Main overview with key metrics and quick actions
 */

'use client';

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
} from '@shopify/polaris';

export default function DashboardPage() {
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
          <InlineGrid columns={{ xs: 1, sm: 2, md: 4 }} gap="400">
            <LegacyCard sectioned>
              <BlockStack gap="200">
                <Text as="h3" variant="headingSm" tone="subdued">
                  Total Revenue
                </Text>
                <Text as="p" variant="heading2xl">
                  $0.00
                </Text>
                <Text as="p" variant="bodySm" tone="subdued">
                  +0% from last month
                </Text>
              </BlockStack>
            </LegacyCard>

            <LegacyCard sectioned>
              <BlockStack gap="200">
                <Text as="h3" variant="headingSm" tone="subdued">
                  AOV Increase
                </Text>
                <Text as="p" variant="heading2xl">
                  0%
                </Text>
                <Text as="p" variant="bodySm" tone="subdued">
                  No data yet
                </Text>
              </BlockStack>
            </LegacyCard>

            <LegacyCard sectioned>
              <BlockStack gap="200">
                <Text as="h3" variant="headingSm" tone="subdued">
                  Acceptance Rate
                </Text>
                <Text as="p" variant="heading2xl">
                  0%
                </Text>
                <Text as="p" variant="bodySm" tone="subdued">
                  No data yet
                </Text>
              </BlockStack>
            </LegacyCard>

            <LegacyCard sectioned>
              <BlockStack gap="200">
                <Text as="h3" variant="headingSm" tone="subdued">
                  Active Upsells
                </Text>
                <Text as="p" variant="heading2xl">
                  0
                </Text>
                <Text as="p" variant="bodySm" tone="subdued">
                  Get started below
                </Text>
              </BlockStack>
            </LegacyCard>
          </InlineGrid>
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
                  <Button variant="primary" fullWidth>
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
                  <Button fullWidth>View Styles</Button>
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
                  <Button fullWidth>Open Analytics</Button>
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
