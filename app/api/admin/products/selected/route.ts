/**
 * Save/Get Selected Upsell Products
 */

import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/shopify/middleware';
import { addUpsellProduct, getActiveUpsells, deactivateAllUpsells } from '@/lib/db/queries';

/**
 * Get selected upsell products
 * GET /api/admin/products/selected
 */
export async function GET(request: NextRequest) {
  return withAuth(request, async (req) => {
    try {
      if (!req.shop) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }

      const upsells = await getActiveUpsells(req.shop.id);

      return NextResponse.json({
        products: upsells.map((u) => ({
          id: u.shopify_product_id.toString(),
          title: u.title,
          price: u.price,
          image: u.image_url,
        })),
      });
    } catch (error) {
      console.error('Error fetching selected products:', error);
      return NextResponse.json(
        { error: 'Failed to fetch selected products' },
        { status: 500 }
      );
    }
  });
}

/**
 * Save selected upsell products
 * POST /api/admin/products/selected
 */
export async function POST(request: NextRequest) {
  return withAuth(request, async (req) => {
    try {
      if (!req.shop) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }

      const body = await request.json();
      const { products } = body;

      if (!Array.isArray(products)) {
        return NextResponse.json(
          { error: 'Invalid products array' },
          { status: 400 }
        );
      }

      if (products.length < 1 || products.length > 25) {
        return NextResponse.json(
          { error: 'Must select 1-25 products' },
          { status: 400 }
        );
      }

      // First, deactivate all existing upsells
      await deactivateAllUpsells(req.shop.id);

      // Then add new selections
      for (const product of products) {
        await addUpsellProduct(req.shop.id, {
          shopify_product_id: parseInt(product.id),
          shopify_variant_id: product.variantId ? parseInt(product.variantId) : null,
          title: product.title,
          handle: product.handle,
          product_type: product.productType,
          vendor: product.vendor,
          collection_ids: product.collections?.map((c: { id: string }) => parseInt(c.id)) || [],
          price: product.price,
          compare_at_price: null,
          image_url: product.image,
        });
      }

      return NextResponse.json({
        success: true,
        count: products.length,
      });
    } catch (error) {
      console.error('Error saving selected products:', error);
      return NextResponse.json(
        { error: 'Failed to save selected products' },
        { status: 500 }
      );
    }
  });
}
