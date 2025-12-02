/**
 * Trust Badges API
 * GET - Get all trust badges and settings
 * PUT - Update trust badges and settings
 */

import { NextRequest, NextResponse } from 'next/server';
import { withAuth, AuthenticatedRequest } from '@/lib/shopify/middleware';
import { query } from '@/lib/db';

export const dynamic = 'force-dynamic';

interface TrustBadge {
  id?: string;
  badge_type: string;
  title: string;
  subtitle?: string;
  icon: string;
  custom_icon_url?: string;
  background_color: string;
  text_color: string;
  icon_color: string;
  position: number;
  is_active: boolean;
}

interface TrustBadgeSettings {
  enabled: boolean;
  display_style: string;
  position: string;
  show_border: boolean;
  show_background: boolean;
  background_color: string;
  border_color: string;
  border_radius: number;
  padding: number;
  spacing: number;
  icon_size: string;
  animation: string;
}

const defaultSettings: TrustBadgeSettings = {
  enabled: true,
  display_style: 'horizontal',
  position: 'below_checkout',
  show_border: true,
  show_background: true,
  background_color: '#ffffff',
  border_color: '#e5e7eb',
  border_radius: 12,
  padding: 16,
  spacing: 12,
  icon_size: 'medium',
  animation: 'none',
};

const defaultBadges: Omit<TrustBadge, 'id'>[] = [
  {
    badge_type: 'secure_checkout',
    title: '100% Secure Checkout',
    subtitle: 'SSL Encrypted',
    icon: 'lock',
    background_color: '#f0fdf4',
    text_color: '#166534',
    icon_color: '#22c55e',
    position: 0,
    is_active: true,
  },
  {
    badge_type: 'money_back',
    title: '30-Day Money Back',
    subtitle: 'Guaranteed',
    icon: 'refresh',
    background_color: '#eff6ff',
    text_color: '#1e40af',
    icon_color: '#3b82f6',
    position: 1,
    is_active: true,
  },
  {
    badge_type: 'free_shipping',
    title: 'Free Shipping',
    subtitle: 'On orders over $50',
    icon: 'truck',
    background_color: '#fefce8',
    text_color: '#854d0e',
    icon_color: '#eab308',
    position: 2,
    is_active: true,
  },
];

export async function GET(request: NextRequest) {
  return withAuth(request, async (req: AuthenticatedRequest) => {
    try {
      if (!req.shop) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }

      const shopId = req.shop.id;

      // Get settings
      let settings: TrustBadgeSettings = defaultSettings;
      try {
        const settingsResult = await query<TrustBadgeSettings>(
          'SELECT * FROM trust_badge_settings WHERE shop_id = $1',
          [shopId]
        );
        if (settingsResult.rows[0]) {
          settings = { ...defaultSettings, ...settingsResult.rows[0] };
        }
      } catch (err: unknown) {
        const dbError = err as { code?: string };
        if (dbError.code !== '42P01') throw err;
      }

      // Get badges
      let badges: TrustBadge[] = [];
      try {
        const badgesResult = await query<TrustBadge>(
          `SELECT id, badge_type, title, subtitle, icon, custom_icon_url,
                  background_color, text_color, icon_color, position, is_active
           FROM trust_badges
           WHERE shop_id = $1
           ORDER BY position ASC`,
          [shopId]
        );
        badges = badgesResult.rows;
      } catch (err: unknown) {
        const dbError = err as { code?: string };
        if (dbError.code !== '42P01') throw err;
      }

      return NextResponse.json({ settings, badges });
    } catch (error) {
      console.error('[TrustBadges GET] Error:', error);
      return NextResponse.json({ error: 'Failed to get trust badges' }, { status: 500 });
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
      const { settings, badges } = body as {
        settings?: Partial<TrustBadgeSettings>;
        badges?: TrustBadge[];
      };

      // Update settings
      if (settings) {
        await query(
          `INSERT INTO trust_badge_settings (
            shop_id, enabled, display_style, position, show_border, show_background,
            background_color, border_color, border_radius, padding, spacing, icon_size, animation
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
          ON CONFLICT (shop_id) DO UPDATE SET
            enabled = $2, display_style = $3, position = $4, show_border = $5, show_background = $6,
            background_color = $7, border_color = $8, border_radius = $9, padding = $10,
            spacing = $11, icon_size = $12, animation = $13, updated_at = NOW()`,
          [
            shopId,
            settings.enabled ?? true,
            settings.display_style ?? 'horizontal',
            settings.position ?? 'below_checkout',
            settings.show_border ?? true,
            settings.show_background ?? true,
            settings.background_color ?? '#ffffff',
            settings.border_color ?? '#e5e7eb',
            settings.border_radius ?? 12,
            settings.padding ?? 16,
            settings.spacing ?? 12,
            settings.icon_size ?? 'medium',
            settings.animation ?? 'none',
          ]
        );
      }

      // Update badges
      if (badges !== undefined) {
        // Delete existing badges
        await query('DELETE FROM trust_badges WHERE shop_id = $1', [shopId]);

        // Insert new badges
        for (let i = 0; i < badges.length; i++) {
          const b = badges[i];
          if (!b) continue;
          await query(
            `INSERT INTO trust_badges (
              shop_id, badge_type, title, subtitle, icon, custom_icon_url,
              background_color, text_color, icon_color, position, is_active
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
            [
              shopId,
              b.badge_type,
              b.title,
              b.subtitle || null,
              b.icon,
              b.custom_icon_url || null,
              b.background_color || '#f8f9fa',
              b.text_color || '#1a1a1a',
              b.icon_color || '#10b981',
              i,
              b.is_active !== false,
            ]
          );
        }
      }

      // Also update the features flag in shop settings
      if (settings?.enabled !== undefined) {
        const currentResult = await query<{ settings: Record<string, unknown> }>(
          'SELECT settings FROM shops WHERE id = $1',
          [shopId]
        );
        const currentSettings = currentResult.rows[0]?.settings || {};
        const features = (currentSettings.features as Record<string, boolean>) || {};
        features.trust_badges = settings.enabled;
        await query(
          'UPDATE shops SET settings = settings || $1 WHERE id = $2',
          [JSON.stringify({ features }), shopId]
        );
      }

      return NextResponse.json({ success: true });
    } catch (error) {
      console.error('[TrustBadges PUT] Error:', error);
      return NextResponse.json({ error: 'Failed to update trust badges' }, { status: 500 });
    }
  });
}
