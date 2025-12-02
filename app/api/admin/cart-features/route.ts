/**
 * Cart Features API
 * GET - Get all cart feature settings
 * PUT - Update cart feature settings
 */

import { NextRequest, NextResponse } from 'next/server';
import { withAuth, AuthenticatedRequest } from '@/lib/shopify/middleware';
import { query } from '@/lib/db';

// Force dynamic rendering for API routes that use authentication
export const dynamic = 'force-dynamic';

interface CartFeatureSettings {
  features: {
    upsells: boolean;
    rewards: boolean;
    addons: boolean;
    timer: boolean;
    announcement: boolean;
  };
  timer: {
    duration: number;
    message: string;
  };
  announcement: {
    text: string;
    icon: string;
  };
  display_style: string;
  position: string;
}

interface RewardTier {
  id?: string;
  threshold: number;
  reward_type: string;
  reward_value: string;
  label: string;
  icon: string;
  is_active: boolean;
}

interface SwitchAddon {
  id?: string;
  shopify_product_id: number | null;
  shopify_variant_id: number | null;
  name: string;
  description: string;
  price: number;
  icon: string;
  default_enabled: boolean;
  is_active: boolean;
}

/**
 * GET /api/admin/cart-features
 * Get all cart feature settings, rewards, and addons
 */
export async function GET(request: NextRequest) {
  console.log('[CartFeatures GET] Request received');
  return withAuth(request, async (req: AuthenticatedRequest) => {
    console.log('[CartFeatures GET] Inside handler');
    try {
      if (!req.shop) {
        console.log('[CartFeatures GET] No shop found');
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }

      const shopId = req.shop.id;
      console.log('[CartFeatures GET] Shop ID:', shopId);

      // Get shop settings
      console.log('[CartFeatures GET] Fetching shop settings...');
      const shopResult = await query<{ settings: CartFeatureSettings | null }>(
        'SELECT settings FROM shops WHERE id = $1',
        [shopId]
      );
      console.log('[CartFeatures GET] Shop settings fetched');

      const settings: Partial<CartFeatureSettings> = shopResult.rows[0]?.settings || {};

      // Get reward tiers (handle missing table gracefully)
      let rewards: RewardTier[] = [];
      try {
        const rewardsResult = await query<RewardTier>(
          `SELECT id, threshold::float, reward_type, reward_value, label, icon, is_active
           FROM reward_tiers
           WHERE shop_id = $1
           ORDER BY threshold ASC`,
          [shopId]
        );
        rewards = rewardsResult.rows;
      } catch (err: unknown) {
        const dbError = err as { code?: string };
        if (dbError.code === '42P01') {
          console.log('[CartFeatures] reward_tiers table does not exist yet, returning empty array');
        } else {
          throw err;
        }
      }

      // Get switch addons (handle missing table gracefully)
      let addons: SwitchAddon[] = [];
      try {
        const addonsResult = await query<SwitchAddon>(
          `SELECT id, shopify_product_id, shopify_variant_id, name, description, price::float, icon, default_enabled, is_active
           FROM switch_addons
           WHERE shop_id = $1
           ORDER BY position ASC`,
          [shopId]
        );
        addons = addonsResult.rows;
      } catch (err: unknown) {
        const dbError = err as { code?: string };
        if (dbError.code === '42P01') {
          console.log('[CartFeatures] switch_addons table does not exist yet, returning empty array');
        } else {
          throw err;
        }
      }

      console.log('[CartFeatures GET] Returning response with settings');
      const response = {
        settings: {
          features: settings.features || {
            upsells: true,
            rewards: false,
            addons: false,
            timer: false,
            announcement: false,
          },
          timer: settings.timer || {
            duration: 10,
            message: 'Your cart will expire in {time}!',
          },
          announcement: settings.announcement || {
            text: '',
            icon: 'info',
          },
          display_style: settings.display_style || 'carousel',
          position: settings.position || 'top',
        },
        rewards,
        addons,
      };
      console.log('[CartFeatures GET] Response ready, sending...');
      return NextResponse.json(response);
    } catch (error) {
      console.error('[CartFeatures GET] Error:', error);
      return NextResponse.json(
        { error: 'Failed to get cart features' },
        { status: 500 }
      );
    }
  });
}

/**
 * PUT /api/admin/cart-features
 * Update cart feature settings, rewards, and addons
 */
export async function PUT(request: NextRequest) {
  return withAuth(request, async (req: AuthenticatedRequest) => {
    try {
      if (!req.shop) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }

      const shopId = req.shop.id;
      const body = await request.json();

      const { settings, rewards, addons } = body as {
        settings?: Partial<CartFeatureSettings>;
        rewards?: RewardTier[];
        addons?: SwitchAddon[];
      };

      // Update shop settings if provided
      if (settings) {
        // Get current settings
        const currentResult = await query<{ settings: CartFeatureSettings | null }>(
          'SELECT settings FROM shops WHERE id = $1',
          [shopId]
        );
        const currentSettings: Partial<CartFeatureSettings> = currentResult.rows[0]?.settings || {};

        // Merge settings
        const newSettings = {
          ...currentSettings,
          ...settings,
          features: { ...currentSettings.features, ...settings.features },
          timer: { ...currentSettings.timer, ...settings.timer },
          announcement: { ...currentSettings.announcement, ...settings.announcement },
        };

        await query(
          'UPDATE shops SET settings = $1 WHERE id = $2',
          [JSON.stringify(newSettings), shopId]
        );
      }

      // Update rewards if provided
      if (rewards !== undefined) {
        // Delete existing rewards
        await query('DELETE FROM reward_tiers WHERE shop_id = $1', [shopId]);

        // Insert new rewards
        for (let i = 0; i < rewards.length; i++) {
          const r = rewards[i];
          if (!r) continue;
          await query(
            `INSERT INTO reward_tiers (shop_id, threshold, reward_type, reward_value, label, icon, position, is_active)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
            [shopId, r.threshold, r.reward_type, r.reward_value || '', r.label || '', r.icon || 'star', i, r.is_active !== false]
          );
        }
      }

      // Update addons if provided
      if (addons !== undefined) {
        // Delete existing addons
        await query('DELETE FROM switch_addons WHERE shop_id = $1', [shopId]);

        // Insert new addons
        for (let i = 0; i < addons.length; i++) {
          const a = addons[i];
          if (!a) continue;
          await query(
            `INSERT INTO switch_addons (shop_id, shopify_product_id, shopify_variant_id, name, description, price, icon, default_enabled, position, is_active)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
            [shopId, a.shopify_product_id, a.shopify_variant_id, a.name, a.description || '', a.price, a.icon || 'shield', a.default_enabled || false, i, a.is_active !== false]
          );
        }
      }

      return NextResponse.json({ success: true });
    } catch (error) {
      console.error('[CartFeatures PUT] Error:', error);
      return NextResponse.json(
        { error: 'Failed to update cart features' },
        { status: 500 }
      );
    }
  });
}
