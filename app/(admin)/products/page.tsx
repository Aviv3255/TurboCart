/**
 * Product Selection Page
 * Let merchants choose 1-25 products for upselling
 */

'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Page,
  Card,
  TextField,
  Select,
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
} from '@shopify/polaris';
import { SearchIcon, ProductIcon } from '@shopify/polaris-icons';
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

export default function ProductsPage() {
  const router = useRouter();
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

  // Fetch products and previously selected on mount
  useEffect(() => {
    fetchProducts();
    fetchSelectedProducts();
  }, []);

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
      if (!response.ok) throw new Error('Failed to fetch products');

      const data = await response.json();
      setProducts(data.products || []);
    } catch (error) {
      console.error('Error fetching products:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveSelection = async () => {
    try {
      setSaving(true);

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
        throw new Error('Failed to save');
      }

      const data = await response.json();

      // Show success modal with navigation options
      setSavedCount(data.count);
      setShowSuccessModal(true);
    } catch (error) {
      console.error('Error saving:', error);

      // Show error toast
      setToastMessage('Failed to save products. Please try again.');
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

  // Selection info
  const selectionCount = selectedProducts.length;
  const isValidSelection = selectionCount >= 1 && selectionCount <= 25;

  return (
    <Frame>
      <Page
        title="Product Selection"
        subtitle="Choose 1-25 products to upsell"
        backAction={{ content: 'Dashboard', onAction: () => router.push('/dashboard') }}
        primaryAction={{
          content: 'Save Selection',
          onAction: handleSaveSelection,
          loading: saving,
          disabled: !isValidSelection,
        }}
      >
      {/* Selection Status Banner */}
      {selectionCount > 0 && (
        <div style={{ marginBottom: '20px' }}>
          <Banner
            title={`${selectionCount} products selected`}
            tone={isValidSelection ? 'success' : 'warning'}
          >
            {selectionCount < 1 && <p>Select at least 1 product</p>}
            {selectionCount > 25 && <p>You can select maximum 25 products (remove {selectionCount - 25})</p>}
            {isValidSelection && <p>Perfect! Click "Save Selection" to continue.</p>}
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
            onSelectionChange={(items) => setSelectedProducts(items as string[])}
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
                  url="#"
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
              💡 Selection Tips
            </Text>
            <ul style={{ marginTop: '12px', paddingLeft: '20px', color: 'var(--text-secondary)' }}>
              <li>Choose products that complement items in your customer's cart</li>
              <li>Mix high and low-priced items for better conversion</li>
              <li>Include products from popular collections</li>
              <li>Our AI will automatically optimize which products to show</li>
            </ul>
          </div>
        </Card>
      </div>
    </Page>

    {/* Success Modal */}
    <Modal
      open={showSuccessModal}
      onClose={() => setShowSuccessModal(false)}
      title="Products Saved Successfully!"
      primaryAction={{
        content: 'Go to Dashboard',
        onAction: () => router.push('/dashboard'),
      }}
      secondaryActions={[
        {
          content: 'Configure Display Settings',
          onAction: () => router.push('/settings'),
        },
      ]}
    >
      <Modal.Section>
        <TextContainer>
          <p>Successfully saved {savedCount} products for upselling!</p>
          <p>What would you like to do next?</p>
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
