/**
 * Product Selection API
 * Fetches products from Shopify with filtering
 */

import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/shopify/middleware';
import { createShopifyClient } from '@/lib/shopify/auth';

/**
 * Get products from Shopify
 * GET /api/admin/products?query=...&collection=...
 */
export async function GET(request: NextRequest) {
  return withAuth(request, async (req) => {
    try {
      const { searchParams } = new URL(request.url);
      const query = searchParams.get('query') || '';
      const collection = searchParams.get('collection') || '';
      const productType = searchParams.get('productType') || '';
      const limit = parseInt(searchParams.get('limit') || '50');

      if (!req.shop) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }

      // Create Shopify GraphQL client
      const client = createShopifyClient(req.shop.shop_domain, req.shop.access_token);

      // Build GraphQL query
      let searchQuery = '';
      if (query) searchQuery += `title:*${query}*`;
      if (productType) searchQuery += ` product_type:${productType}`;

      const graphqlQuery = `
        query GetProducts($first: Int!, $query: String) {
          products(first: $first, query: $query) {
            edges {
              node {
                id
                title
                handle
                productType
                vendor
                status
                totalInventory
                priceRangeV2 {
                  minVariantPrice {
                    amount
                    currencyCode
                  }
                  maxVariantPrice {
                    amount
                    currencyCode
                  }
                }
                featuredImage {
                  url
                  altText
                }
                variants(first: 1) {
                  edges {
                    node {
                      id
                      price
                    }
                  }
                }
                collections(first: 5) {
                  edges {
                    node {
                      id
                      title
                    }
                  }
                }
              }
            }
            pageInfo {
              hasNextPage
              endCursor
            }
          }
        }
      `;

      const response = await client.graphql<{
        products: {
          edges: Array<{
            node: {
              id: string;
              title: string;
              handle: string;
              productType: string;
              vendor: string;
              status: string;
              totalInventory: number;
              priceRangeV2: {
                minVariantPrice: { amount: string; currencyCode: string };
                maxVariantPrice: { amount: string; currencyCode: string };
              };
              featuredImage: { url: string; altText: string } | null;
              variants: { edges: Array<{ node: { id: string; price: string } }> };
              collections: { edges: Array<{ node: { id: string; title: string } }> };
            };
          }>;
          pageInfo: { hasNextPage: boolean; endCursor: string | null };
        };
      }>(graphqlQuery, {
        first: limit,
        query: searchQuery || null,
      });

      // Transform data for frontend
      const products = response.products.edges.map(({ node }) => ({
        id: node.id.replace('gid://shopify/Product/', ''),
        title: node.title,
        handle: node.handle,
        productType: node.productType,
        vendor: node.vendor,
        status: node.status,
        inventory: node.totalInventory,
        price: parseFloat(node.priceRangeV2.minVariantPrice.amount),
        currency: node.priceRangeV2.minVariantPrice.currencyCode,
        image: node.featuredImage?.url || null,
        variantId: node.variants.edges[0]?.node.id.replace('gid://shopify/ProductVariant/', ''),
        collections: node.collections.edges.map(({ node: col }) => ({
          id: col.id.replace('gid://shopify/Collection/', ''),
          title: col.title,
        })),
      }));

      return NextResponse.json({
        products,
        hasMore: response.products.pageInfo.hasNextPage,
      });
    } catch (error) {
      console.error('Error fetching products:', error);
      return NextResponse.json(
        { error: 'Failed to fetch products' },
        { status: 500 }
      );
    }
  });
}
