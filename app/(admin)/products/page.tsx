/**
 * Product Selection Page
 * Step 1: Choose display style
 * Step 2: Select products (quantity depends on display style)
 */

'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Page,
  Card,
  TextField,
  Button,
  ResourceList,
  ResourceItem,
  Thumbnail,
  Text,
  Badge,
  Filters,
  ChoiceList,
  Banner,
  Spinner,
  EmptyState,
  Frame,
  Toast,
  Modal,
  TextContainer,
  InlineStack,
  BlockStack,
  Box,
} from '@shopify/polaris';
import { authenticatedFetch } from '@/lib/shopify/authenticated-fetch';

interface Product {
  id: string;
  title: string;
  handle: string;
  productType: string;
  vendor: string;
  status: string;
  inventory: number;
  price: number;
  currency: string;
  image: string | null;
  variantId: string;
  collections: Array<{ id: string; title: string }>;
}

interface DisplayStyle {
  id: string;
  name: string;
  description: string;
  maxProducts: number;
  icon: string;
  preview: string;
}

const DISPLAY_STYLES: DisplayStyle[] = [
  {
    id: 'carousel',
    name: 'Carousel Slider',
    description: 'Horizontal scrolling carousel with product cards',
    maxProducts: 25,
    icon: '🎠',
    preview: 'Products slide horizontally with navigation arrows',
  },
  {
    id: 'cards',
    name: 'Product Cards Grid',
    description: 'Grid layout with product cards',
    maxProducts: 25,
    icon: '🃏',
    preview: '2-3 column grid of product cards',
  },
  {
    id: 'list',
    name: 'Compact List',
    description: 'Vertical list with small thumbnails',
    maxProducts: 25,
    icon: '📋',
    preview: 'Space-efficient vertical list view',
  },
  {
    id: 'minimal-strip',
    name: 'Minimal Strip',
    description: 'Sleek horizontal strip with minimal design',
    maxProducts: 25,
    icon: '➖',
    preview: 'Clean, modern horizontal strip',
  },
  {
    id: 'banner',
    name: 'Featured Banner',
    description: 'Large banner highlighting a single product',
    maxProducts: 1,
    icon: '🏷️',
    preview: 'Full-width banner with call-to-action',
  },
  {
    id: 'frequently-bought',
    name: 'Frequently Bought Together',
    description: 'Amazon-style product bundle suggestion',
    maxProducts: 3,
    icon: '🛒',
    preview: 'Product + Product + Product = Bundle',
  },
  {
    id: 'comparison-table',
    name: 'Comparison Table',
    description: 'Side-by-side product comparison',
    maxProducts: 5,
    icon: '📊',
    preview: 'Table comparing product features',
  },
  {
    id: 'masonry-grid',
    name: 'Masonry Grid',
    description: 'Pinterest-style dynamic grid layout',
    maxProducts: 25,
    icon: '🧱',
    preview: 'Dynamic, flowing grid arrangement',
  },
  {
    id: 'vertical-scroll',
    name: 'Vertical Scroll',
    description: 'Scrollable vertical product feed',
    maxProducts: 25,
    icon: '📜',
    preview: 'Smooth scrolling product feed',
  },
];

export default function ProductsPage() {
  const router = useRouter();

  // Step management
  const [currentStep, setCurrentStep] = useState<'style' | 'products'>('style');
  const [selectedStyle, setSelectedStyle] = useState<string | null>(null);

  // Products state
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedProducts, setSelectedProducts] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [productType, setProductType] = useState<string | null>(null);
  const [stockFilter, setStockFilter] = useState<string[]>([]);

  // Toast notifications
  const [toastActive, setToastActive] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastError, setToastError] = useState(false);

  // Success modal
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [savedCount, setSavedCount] = useState(0);

  // Get current style config
  const currentStyleConfig = DISPLAY_STYLES.find(s => s.id === selectedStyle);
  const maxProducts = currentStyleConfig?.maxProducts || 25;

  // Fetch existing settings and products on mount
  useEffect(() => {
    fetchSettings();
    fetchProducts();
    fetchSelectedProducts();
  }, []);

  const fetchSettings = async () => {
    try {
      const response = await authenticatedFetch('/api/admin/settings');
      if (response.ok) {
        const data = await response.json();
        if (data.settings?.display_style) {
          setSelectedStyle(data.settings.display_style);
          setCurrentStep('products'); // Go directly to products if style already set
        }
      }
    } catch (error) {
      console.error('Error fetching settings:', error);
    }
  };

  const fetchSelectedProducts = async () => {
    try {
      const response = await authenticatedFetch('/api/admin/products/selected');
      if (!response.ok) return;

      const data = await response.json();
      if (data.products) {
        setSelectedProducts(data.products.map((p: { id: string }) => p.id));
      }
    } catch (error) {
      console.error('Error fetching selected products:', error);
    }
  };

  const fetchProducts = async (query = '') => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (query) params.append('query', query);
      if (productType) params.append('productType', productType);

      const response = await authenticatedFetch(`/api/admin/products?${params}`);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));

        if (errorData.code === 'REAUTH_REQUIRED' || response.status === 401) {
          setToastMessage('Session expired. Please reinstall the app from your Shopify admin.');
          setToastError(true);
          setToastActive(true);
          return;
        }

        throw new Error('Failed to fetch products');
      }

      const data = await response.json();
      setProducts(data.products || []);
    } catch (error) {
      console.error('Error fetching products:', error);
      setToastMessage('Failed to load products. Please try again.');
      setToastError(true);
      setToastActive(true);
    } finally {
      setLoading(false);
    }
  };

  const handleStyleSelect = (styleId: string) => {
    setSelectedStyle(styleId);
    const style = DISPLAY_STYLES.find(s => s.id === styleId);

    // If switching to a style with fewer max products, trim selection
    if (style && selectedProducts.length > style.maxProducts) {
      setSelectedProducts(selectedProducts.slice(0, style.maxProducts));
    }

    setCurrentStep('products');
  };

  const handleSaveSelection = async () => {
    if (!selectedStyle) {
      setToastMessage('Please select a display style first');
      setToastError(true);
      setToastActive(true);
      return;
    }

    try {
      setSaving(true);

      // Save display style first
      const styleResponse = await authenticatedFetch('/api/admin/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          settings: {
            display_style: selectedStyle,
            max_upsells: Math.min(selectedProducts.length, maxProducts)
          }
        }),
      });

      if (!styleResponse.ok) {
        throw new Error('Failed to save display style');
      }

      // Get full product data for selected items
      const selectedProductsData = products.filter((p) =>
        selectedProducts.includes(p.id)
      );

      const response = await authenticatedFetch('/api/admin/products/selected', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ products: selectedProductsData }),
      });

      if (!response.ok) {
        throw new Error('Failed to save products');
      }

      const data = await response.json();

      // Show success modal
      setSavedCount(data.count);
      setShowSuccessModal(true);
    } catch (error) {
      console.error('Error saving:', error);
      setToastMessage('Failed to save. Please try again.');
      setToastError(true);
      setToastActive(true);
    } finally {
      setSaving(false);
    }
  };

  const handleSearch = (value: string) => {
    setSearchQuery(value);
    fetchProducts(value);
  };

  const handleClearFilters = () => {
    setSearchQuery('');
    setProductType(null);
    setStockFilter([]);
    fetchProducts();
  };

  // Filter products by stock
  const filteredProducts = products.filter((product) => {
    if (stockFilter.includes('in_stock') && product.inventory <= 0) return false;
    if (stockFilter.includes('out_of_stock') && product.inventory > 0) return false;
    return true;
  });

  // Selection validation
  const selectionCount = selectedProducts.length;
  const isValidSelection = selectionCount >= 1 && selectionCount <= maxProducts;

  // Render Step 1: Display Style Selection
  if (currentStep === 'style') {
    return (
      <Frame>
        <Page
          title="Choose Display Style"
          subtitle="Select how upsell products will appear in the cart"
          backAction={{ content: 'Dashboard', onAction: () => router.push('/dashboard') }}
        >
          <div style={{ marginBottom: '20px' }}>
            <Banner tone="info">
              <p>Your display style determines how products are shown to customers. Choose based on your store design and product catalog.</p>
            </Banner>
          </div>

          <div className="display-styles-grid">
            {DISPLAY_STYLES.map((style) => (
              <div
                key={style.id}
                className={`display-style-card ${selectedStyle === style.id ? 'selected' : ''}`}
                onClick={() => handleStyleSelect(style.id)}
              >
                <div className="style-icon">{style.icon}</div>
                <div className="style-name">{style.name}</div>
                <div className="style-description">{style.description}</div>
                <div className="style-preview">{style.preview}</div>
                <div className="style-max">
                  <Badge tone={style.maxProducts === 1 ? 'attention' : 'success'}>
                    Max {style.maxProducts} product{style.maxProducts > 1 ? 's' : ''}
                  </Badge>
                </div>
                {selectedStyle === style.id && (
                  <div className="selected-indicator">
                    <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                      <circle cx="10" cy="10" r="10" fill="#008060"/>
                      <path d="M6 10L9 13L14 7" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </div>
                )}
              </div>
            ))}
          </div>

          <style jsx>{`
            .display-styles-grid {
              display: grid;
              grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
              gap: 16px;
              margin-top: 20px;
            }
            .display-style-card {
              background: #fff;
              border: 2px solid #e1e3e5;
              border-radius: 12px;
              padding: 20px;
              cursor: pointer;
              transition: all 0.2s ease;
              position: relative;
            }
            .display-style-card:hover {
              border-color: #008060;
              transform: translateY(-2px);
              box-shadow: 0 4px 12px rgba(0,0,0,0.1);
            }
            .display-style-card.selected {
              border-color: #008060;
              background: #f0fdf4;
            }
            .style-icon {
              font-size: 32px;
              margin-bottom: 12px;
            }
            .style-name {
              font-size: 16px;
              font-weight: 600;
              color: #202223;
              margin-bottom: 4px;
            }
            .style-description {
              font-size: 13px;
              color: #6d7175;
              margin-bottom: 8px;
            }
            .style-preview {
              font-size: 12px;
              color: #8c9196;
              font-style: italic;
              margin-bottom: 12px;
              padding: 8px;
              background: #f6f6f7;
              border-radius: 6px;
            }
            .style-max {
              margin-top: auto;
            }
            .selected-indicator {
              position: absolute;
              top: 12px;
              right: 12px;
            }
          `}</style>
        </Page>
      </Frame>
    );
  }

  // Render Step 2: Product Selection
  return (
    <Frame>
      <Page
        title={`Select Products for ${currentStyleConfig?.name || 'Upsells'}`}
        subtitle={`Choose up to ${maxProducts} product${maxProducts > 1 ? 's' : ''}`}
        backAction={{ content: 'Change Style', onAction: () => setCurrentStep('style') }}
        primaryAction={{
          content: 'Save Selection',
          onAction: handleSaveSelection,
          loading: saving,
          disabled: !isValidSelection || !selectedStyle,
        }}
      >
        {/* Current Style Info */}
        <div style={{ marginBottom: '20px' }}>
          <Card>
            <div style={{ padding: '16px' }}>
              <InlineStack align="space-between" blockAlign="center">
                <InlineStack gap="400" blockAlign="center">
                  <span style={{ fontSize: '24px' }}>{currentStyleConfig?.icon}</span>
                  <BlockStack gap="100">
                    <Text variant="headingSm" as="h3">{currentStyleConfig?.name}</Text>
                    <Text variant="bodySm" tone="subdued">{currentStyleConfig?.description}</Text>
                  </BlockStack>
                </InlineStack>
                <Button variant="plain" onClick={() => setCurrentStep('style')}>
                  Change Style
                </Button>
              </InlineStack>
            </div>
          </Card>
        </div>

        {/* Selection Status Banner */}
        {selectionCount > 0 && (
          <div style={{ marginBottom: '20px' }}>
            <Banner
              title={`${selectionCount} of ${maxProducts} products selected`}
              tone={isValidSelection ? 'success' : 'warning'}
            >
              {selectionCount < 1 && <p>Select at least 1 product</p>}
              {selectionCount > maxProducts && (
                <p>This display style supports maximum {maxProducts} products. Please remove {selectionCount - maxProducts} product{selectionCount - maxProducts > 1 ? 's' : ''}.</p>
              )}
              {isValidSelection && <p>Click Save Selection to continue.</p>}
            </Banner>
          </div>
        )}

        {/* Filters */}
        <Card>
          <div style={{ padding: '16px' }}>
            <Filters
              queryValue={searchQuery}
              queryPlaceholder="Search products..."
              filters={[
                {
                  key: 'productType',
                  label: 'Product Type',
                  filter: (
                    <TextField
                      label="Product Type"
                      value={productType || ''}
                      onChange={(value) => setProductType(value || null)}
                      autoComplete="off"
                      labelHidden
                    />
                  ),
                  shortcut: true,
                },
                {
                  key: 'stock',
                  label: 'Stock Status',
                  filter: (
                    <ChoiceList
                      title="Stock Status"
                      titleHidden
                      choices={[
                        { label: 'In Stock', value: 'in_stock' },
                        { label: 'Out of Stock', value: 'out_of_stock' },
                      ]}
                      selected={stockFilter}
                      onChange={setStockFilter}
                      allowMultiple
                    />
                  ),
                },
              ]}
              onQueryChange={handleSearch}
              onQueryClear={() => handleSearch('')}
              onClearAll={handleClearFilters}
            />
          </div>
        </Card>

        {/* Product List */}
        <Card>
          {loading ? (
            <div style={{ padding: '60px', textAlign: 'center' }}>
              <Spinner size="large" />
              <p style={{ marginTop: '16px' }}>Loading products...</p>
            </div>
          ) : filteredProducts.length === 0 ? (
            <EmptyState
              heading="No products found"
              image="https://cdn.shopify.com/s/files/1/0262/4071/2726/files/emptystate-files.png"
            >
              <p>Try adjusting your search or filters</p>
            </EmptyState>
          ) : (
            <ResourceList
              resourceName={{ singular: 'product', plural: 'products' }}
              items={filteredProducts}
              selectedItems={selectedProducts}
              onSelectionChange={(items) => {
                const newSelection = items as string[];
                // Limit selection to max products for current style
                if (newSelection.length <= maxProducts) {
                  setSelectedProducts(newSelection);
                } else {
                  setToastMessage(`Maximum ${maxProducts} products allowed for ${currentStyleConfig?.name}`);
                  setToastError(true);
                  setToastActive(true);
                }
              }}
              selectable
              renderItem={(product) => {
                const { id, title, image, price, currency, inventory, productType, vendor, status } =
                  product;

                const media = image ? (
                  <Thumbnail source={image} alt={title} size="medium" />
                ) : (
                  <Thumbnail source="" alt={title} size="medium" />
                );

                return (
                  <ResourceItem
                    id={id}
                    media={media}
                    accessibilityLabel={`Select ${title}`}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <div style={{ flex: 1 }}>
                        <Text variant="bodyMd" fontWeight="bold" as="h3">
                          {title}
                        </Text>
                        <div style={{ marginTop: '4px', display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                          {productType && <Badge>{productType}</Badge>}
                          {vendor && <Badge tone="info">{vendor}</Badge>}
                          {status === 'ACTIVE' ? (
                            <Badge tone="success">Active</Badge>
                          ) : (
                            <Badge>Draft</Badge>
                          )}
                          {inventory > 0 ? (
                            <Badge tone="success">{`${inventory} in stock`}</Badge>
                          ) : (
                            <Badge tone="critical">Out of stock</Badge>
                          )}
                        </div>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <Text variant="bodyMd" fontWeight="bold" as="p">
                          {new Intl.NumberFormat('en-US', {
                            style: 'currency',
                            currency: currency || 'USD',
                          }).format(price)}
                        </Text>
                      </div>
                    </div>
                  </ResourceItem>
                );
              }}
            />
          )}
        </Card>

        {/* Help Text */}
        <div style={{ marginTop: '20px' }}>
          <Card>
            <div style={{ padding: '16px' }}>
              <Text variant="headingMd" as="h2">
                Selection Tips for {currentStyleConfig?.name}
              </Text>
              <ul style={{ marginTop: '12px', paddingLeft: '20px', color: 'var(--text-secondary)' }}>
                {currentStyleConfig?.id === 'banner' && (
                  <li>Choose your best-selling or most profitable product for the featured banner</li>
                )}
                {currentStyleConfig?.id === 'frequently-bought' && (
                  <>
                    <li>Select products that are commonly purchased together</li>
                    <li>Consider products in the same category or complementary items</li>
                  </>
                )}
                {currentStyleConfig?.id === 'comparison-table' && (
                  <>
                    <li>Choose similar products with different features or price points</li>
                    <li>Works best with products that have comparable attributes</li>
                  </>
                )}
                {(currentStyleConfig?.maxProducts || 0) >= 10 && (
                  <>
                    <li>Mix high and low-priced items for better conversion</li>
                    <li>Include products from popular collections</li>
                  </>
                )}
                <li>Products will be shown based on cart contents and customer behavior</li>
              </ul>
            </div>
          </Card>
        </div>
      </Page>

      {/* Success Modal */}
      <Modal
        open={showSuccessModal}
        onClose={() => setShowSuccessModal(false)}
        title="Upsells Configured Successfully!"
        primaryAction={{
          content: 'Go to Dashboard',
          onAction: () => router.push('/dashboard'),
        }}
        secondaryActions={[
          {
            content: 'Configure Cart Features',
            onAction: () => router.push('/cart-features'),
          },
        ]}
      >
        <Modal.Section>
          <TextContainer>
            <p>
              <strong>Display Style:</strong> {currentStyleConfig?.name}
            </p>
            <p>
              <strong>Products:</strong> {savedCount} selected for upselling
            </p>
            <p style={{ marginTop: '12px' }}>
              Your upsells are now active! Want to add more features like rewards progress, add-ons, or urgency timer?
            </p>
          </TextContainer>
        </Modal.Section>
      </Modal>

      {/* Toast Notification */}
      {toastActive && (
        <Toast
          content={toastMessage}
          error={toastError}
          onDismiss={() => setToastActive(false)}
        />
      )}
    </Frame>
  );
}
