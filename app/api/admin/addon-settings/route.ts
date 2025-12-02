/**
 * Add-On Settings API
 * GET - Get add-on display settings and items
 * PUT - Update add-on settings and items
 */

import { NextRequest, NextResponse } from 'next/server';
import { withAuth, AuthenticatedRequest } from '@/lib/shopify/middleware';
import { query } from '@/lib/db';

export const dynamic = 'force-dynamic';

interface AddonSettings {
  enabled: boolean;
  position: string;
  section_title: string;
  section_subtitle: string | null;
  show_section_header: boolean;
  display_style: string;
  columns: number;
  item_background: string;
  item_border_color: string;
  item_border_radius: number;
  item_padding: number;
  toggle_active_color: string;
  toggle_inactive_color: string;
  toggle_style: string;
  auto_add_defaults: boolean;
  show_savings: boolean;
}

interface AddonItem {
  id?: string;
  shopify_product_id: number | null;
  shopify_variant_id: number | null;
  name: string;
  description: string;
  price: number;
  compare_price?: number;
  icon: string;
  icon_url?: string;
  tooltip?: string;
  default_enabled: boolean;
  is_active: boolean;
}

const defaultSettings: AddonSettings = {
  enabled: false,
  position: 'below_items',
  section_title: 'Protect Your Order',
  section_subtitle: 'Add valuable extras to your purchase',
  show_section_header: true,
  display_style: 'card',
  columns: 1,
  item_background: '#f9fafb',
  item_border_color: '#e5e7eb',
  item_border_radius: 10,
  item_padding: 12,
  toggle_active_color: '#10b981',
  toggle_inactive_color: '#d1d5db',
  toggle_style: 'switch',
  auto_add_defaults: true,
  show_savings: false,
};

export async function GET(request: NextRequest) {
  return withAuth(request, async (req: AuthenticatedRequest) => {
    try {
      if (!req.shop) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }

      const shopId = req.shop.id;
      let settings: AddonSettings = defaultSettings;
      let items: AddonItem[] = [];

      // Get settings
      try {
        const settingsResult = await query<AddonSettings>(
          `SELECT enabled, position, section_title, section_subtitle, show_section_header,
                  display_style, columns, item_background, item_border_color,
                  item_border_radius, item_padding, toggle_active_color, toggle_inactive_color,
                  toggle_style, auto_add_defaults, show_savings
           FROM addon_settings WHERE shop_id = $1`,
          [shopId]
        );
        if (settingsResult.rows[0]) {
          settings = { ...defaultSettings, ...settingsResult.rows[0] };
        }
      } catch (err: unknown) {
        const dbError = err as { code?: string };
        if (dbError.code !== '42P01') throw err;
      }

      // Get items
      try {
        const itemsResult = await query<AddonItem>(
          `SELECT id, shopify_product_id, shopify_variant_id, name, description,
                  price::float, compare_price::float, icon, icon_url, tooltip,
                  default_enabled, is_active
           FROM switch_addons
           WHERE shop_id = $1
           ORDER BY position ASC`,
          [shopId]
        );
        items = itemsResult.rows;
      } catch (err: unknown) {
        const dbError = err as { code?: string };
        if (dbError.code !== '42P01') throw err;
      }

      return NextResponse.json({ settings, items });
    } catch (error) {
      console.error('[AddonSettings GET] Error:', error);
      return NextResponse.json({ error: 'Failed to get addon settings' }, { status: 500 });
    }
  });
}

export async function PUT(request: NextRequest) {
  return withAuth(request, async (req: AuthenticatedRequest) => {
    try {
      if (!req.shop) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }

      const shopId = req.shop.id;
      const body = await request.json();
      const { settings, items } = body as {
        settings?: Partial<AddonSettings>;
        items?: AddonItem[];
      };

      // Update settings
      if (settings) {
        await query(
          `INSERT INTO addon_settings (
            shop_id, enabled, position, section_title, section_subtitle, show_section_header,
            display_style, columns, item_background, item_border_color,
            item_border_radius, item_padding, toggle_active_color, toggle_inactive_color,
            toggle_style, auto_add_defaults, show_savings
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17)
          ON CONFLICT (shop_id) DO UPDATE SET
            enabled = $2, position = $3, section_title = $4, section_subtitle = $5,
            show_section_header = $6, display_style = $7, columns = $8, item_background = $9,
            item_border_color = $10, item_border_radius = $11, item_padding = $12,
            toggle_active_color = $13, toggle_inactive_color = $14, toggle_style = $15,
            auto_add_defaults = $16, show_savings = $17, updated_at = NOW()`,
          [
            shopId,
            settings.enabled ?? defaultSettings.enabled,
            settings.position ?? defaultSettings.position,
            settings.section_title ?? defaultSettings.section_title,
            settings.section_subtitle ?? null,
            settings.show_section_header ?? defaultSettings.show_section_header,
            settings.display_style ?? defaultSettings.display_style,
            settings.columns ?? defaultSettings.columns,
            settings.item_background ?? defaultSettings.item_background,
            settings.item_border_color ?? defaultSettings.item_border_color,
            settings.item_border_radius ?? defaultSettings.item_border_radius,
            settings.item_padding ?? defaultSettings.item_padding,
            settings.toggle_active_color ?? defaultSettings.toggle_active_color,
            settings.toggle_inactive_color ?? defaultSettings.toggle_inactive_color,
            settings.toggle_style ?? defaultSettings.toggle_style,
            settings.auto_add_defaults ?? defaultSettings.auto_add_defaults,
            settings.show_savings ?? defaultSettings.show_savings,
          ]
        );

        // Update features flag
        const currentResult = await query<{ settings: Record<string, unknown> }>(
          'SELECT settings FROM shops WHERE id = $1',
          [shopId]
        );
        const currentSettings = currentResult.rows[0]?.settings || {};
        const features = (currentSettings.features as Record<string, boolean>) || {};
        features.addons = settings.enabled ?? false;
        await query(
          'UPDATE shops SET settings = settings || $1 WHERE id = $2',
          [JSON.stringify({ features }), shopId]
        );
      }

      // Update items
      if (items !== undefined) {
        // Delete existing items
        await query('DELETE FROM switch_addons WHERE shop_id = $1', [shopId]);

        // Insert new items
        for (let i = 0; i < items.length; i++) {
          const item = items[i];
          if (!item) continue;
          await query(
            `INSERT INTO switch_addons (
              shop_id, shopify_product_id, shopify_variant_id, name, description,
              price, compare_price, icon, icon_url, tooltip, default_enabled, position, is_active
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)`,
            [
              shopId,
              item.shopify_product_id || null,
              item.shopify_variant_id || null,
              item.name,
              item.description || '',
              item.price,
              item.compare_price || null,
              item.icon || 'shield',
              item.icon_url || null,
              item.tooltip || null,
              item.default_enabled ?? false,
              i,
              item.is_active !== false,
            ]
          );
        }
      }

      return NextResponse.json({ success: true });
    } catch (error) {
      console.error('[AddonSettings PUT] Error:', error);
      return NextResponse.json({ error: 'Failed to update addon settings' }, { status: 500 });
    }
  });
}
