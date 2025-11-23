/**
 * Onboarding Step 2: Product Selection
 */

'use client';

import { useState, useEffect } from 'react';
import { Card, ResourceList, ResourceItem, Thumbnail, Badge, TextField, Spinner, Banner } from '@shopify/polaris';

interface Product {
  id: string;
  title: string;
  image: string | null;
  price: number;
  currency: string;
}

interface ProductSelectionStepProps {
  selectedProducts: string[];
  onUpdateProducts: (products: string[]) => void;
  onNext: () => void;
}

export default function ProductSelectionStep({
  selectedProducts,
  onUpdateProducts,
  onNext,
}: ProductSelectionStepProps) {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchProducts();
  }, [searchQuery]);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (searchQuery) params.append('query', searchQuery);

      const response = await fetch(`/api/admin/products?${params}`);
      if (!response.ok) throw new Error('Failed to fetch products');

      const data = await response.json();
      setProducts(data.products || []);
    } catch (error) {
      console.error('Error fetching products:', error);
    } finally {
      setLoading(false);
    }
  };

  const isValid = selectedProducts.length >= 10 && selectedProducts.length <= 50;

  return (
    <div>
      <Card>
        <div style={{ padding: '24px' }}>
          <h2 style={{ fontSize: '20px', fontWeight: '700', marginBottom: '8px' }}>
            Choose Products to Upsell
          </h2>
          <p style={{ fontSize: '14px', color: 'var(--text-secondary)', marginBottom: '24px' }}>
            Select 10-50 products that you want to recommend as upsells. Our AI will automatically
            match them to items in your customer's cart.
          </p>

          {/* Selection Status */}
          <div style={{ marginBottom: '20px' }}>
            {selectedProducts.length > 0 && (
              <Banner
                status={isValid ? 'success' : 'warning'}
                title={`${selectedProducts.length} products selected`}
              >
                {selectedProducts.length < 10 && (
                  <p>Select at least {10 - selectedProducts.length} more products to continue</p>
                )}
                {selectedProducts.length > 50 && (
                  <p>Please remove {selectedProducts.length - 50} products (maximum 50)</p>
                )}
                {isValid && <p>Perfect! You can continue to the next step.</p>}
              </Banner>
            )}
          </div>

          {/* Search */}
          <div style={{ marginBottom: '16px' }}>
            <TextField
              label="Search products"
              value={searchQuery}
              onChange={setSearchQuery}
              placeholder="Search by product name..."
              autoComplete="off"
              labelHidden
            />
          </div>
        </div>
      </Card>

      {/* Product List */}
      <div style={{ marginTop: '20px' }}>
        <Card>
          {loading ? (
            <div style={{ padding: '60px', textAlign: 'center' }}>
              <Spinner size="large" />
              <p style={{ marginTop: '16px' }}>Loading products...</p>
            </div>
          ) : (
            <ResourceList
              resourceName={{ singular: 'product', plural: 'products' }}
              items={products.slice(0, 20)}
              selectedItems={selectedProducts}
              onSelectionChange={onUpdateProducts}
              selectable
              renderItem={(product) => {
                const media = product.image ? (
                  <Thumbnail source={product.image} alt={product.title} size="medium" />
                ) : (
                  <Thumbnail source="" alt={product.title} size="medium" />
                );

                return (
                  <ResourceItem id={product.id} media={media}>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <div>
                        <h3 style={{ fontSize: '14px', fontWeight: '600' }}>{product.title}</h3>
                      </div>
                      <div>
                        <span style={{ fontSize: '14px', fontWeight: '600' }}>
                          {new Intl.NumberFormat('en-US', {
                            style: 'currency',
                            currency: product.currency || 'USD',
                          }).format(product.price)}
                        </span>
                      </div>
                    </div>
                  </ResourceItem>
                );
              }}
            />
          )}
        </Card>
      </div>

      {/* Tips */}
      <div style={{ marginTop: '20px' }}>
        <Card>
          <div style={{ padding: '16px' }}>
            <h3 style={{ fontSize: '14px', fontWeight: '600', marginBottom: '8px' }}>
              💡 Selection Tips
            </h3>
            <ul style={{ paddingLeft: '20px', fontSize: '14px', color: 'var(--text-secondary)', margin: 0 }}>
              <li>Choose complementary products that go well together</li>
              <li>Mix different price points for better conversion</li>
              <li>Include your best-sellers and popular items</li>
            </ul>
          </div>
        </Card>
      </div>
    </div>
  );
}
