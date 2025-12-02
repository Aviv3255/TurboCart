/**
 * Announcement Settings API
 * GET - Get announcement bar settings
 * PUT - Update announcement settings
 */

import { NextRequest, NextResponse } from 'next/server';
import { withAuth, AuthenticatedRequest } from '@/lib/shopify/middleware';
import { query } from '@/lib/db';

export const dynamic = 'force-dynamic';

interface AnnouncementSettings {
  enabled: boolean;
  position: string;
  message: string;
  secondary_message: string | null;
  icon: string;
  link_enabled: boolean;
  link_url: string | null;
  link_text: string | null;
  link_new_tab: boolean;
  style: string;
  background_color: string;
  gradient_end_color: string;
  text_color: string;
  font_size: number;
  font_weight: string;
  padding: number;
  border_radius: number;
  animation: string;
  dismissible: boolean;
  dismiss_duration: number;
  schedule_enabled: boolean;
  schedule_start: string | null;
  schedule_end: string | null;
  show_on_empty_cart: boolean;
  min_cart_value: number;
  max_cart_value: number | null;
}

const defaultSettings: AnnouncementSettings = {
  enabled: false,
  position: 'top',
  message: 'Free shipping on orders over $50!',
  secondary_message: null,
  icon: 'truck',
  link_enabled: false,
  link_url: null,
  link_text: null,
  link_new_tab: true,
  style: 'gradient',
  background_color: '#667eea',
  gradient_end_color: '#764ba2',
  text_color: '#ffffff',
  font_size: 14,
  font_weight: '500',
  padding: 12,
  border_radius: 8,
  animation: 'none',
  dismissible: false,
  dismiss_duration: 24,
  schedule_enabled: false,
  schedule_start: null,
  schedule_end: null,
  show_on_empty_cart: true,
  min_cart_value: 0,
  max_cart_value: null,
};

export async function GET(request: NextRequest) {
  return withAuth(request, async (req: AuthenticatedRequest) => {
    try {
      if (!req.shop) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }

      const shopId = req.shop.id;
      let settings: AnnouncementSettings = defaultSettings;

      try {
        const result = await query<AnnouncementSettings>(
          `SELECT enabled, position, message, secondary_message, icon,
                  link_enabled, link_url, link_text, link_new_tab,
                  style, background_color, gradient_end_color, text_color,
                  font_size, font_weight, padding, border_radius, animation,
                  dismissible, dismiss_duration, schedule_enabled,
                  schedule_start, schedule_end, show_on_empty_cart,
                  min_cart_value::float, max_cart_value::float
           FROM announcement_settings WHERE shop_id = $1`,
          [shopId]
        );
        if (result.rows[0]) {
          settings = { ...defaultSettings, ...result.rows[0] };
        }
      } catch (err: unknown) {
        const dbError = err as { code?: string };
        if (dbError.code !== '42P01') throw err;
      }

      return NextResponse.json({ settings });
    } catch (error) {
      console.error('[AnnouncementSettings GET] Error:', error);
      return NextResponse.json({ error: 'Failed to get announcement settings' }, { status: 500 });
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
      const { settings } = body as { settings: Partial<AnnouncementSettings> };

      if (settings) {
        await query(
          `INSERT INTO announcement_settings (
            shop_id, enabled, position, message, secondary_message, icon,
            link_enabled, link_url, link_text, link_new_tab,
            style, background_color, gradient_end_color, text_color,
            font_size, font_weight, padding, border_radius, animation,
            dismissible, dismiss_duration, schedule_enabled,
            schedule_start, schedule_end, show_on_empty_cart,
            min_cart_value, max_cart_value
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24, $25, $26, $27)
          ON CONFLICT (shop_id) DO UPDATE SET
            enabled = $2, position = $3, message = $4, secondary_message = $5, icon = $6,
            link_enabled = $7, link_url = $8, link_text = $9, link_new_tab = $10,
            style = $11, background_color = $12, gradient_end_color = $13, text_color = $14,
            font_size = $15, font_weight = $16, padding = $17, border_radius = $18, animation = $19,
            dismissible = $20, dismiss_duration = $21, schedule_enabled = $22,
            schedule_start = $23, schedule_end = $24, show_on_empty_cart = $25,
            min_cart_value = $26, max_cart_value = $27, updated_at = NOW()`,
          [
            shopId,
            settings.enabled ?? defaultSettings.enabled,
            settings.position ?? defaultSettings.position,
            settings.message ?? defaultSettings.message,
            settings.secondary_message ?? null,
            settings.icon ?? defaultSettings.icon,
            settings.link_enabled ?? defaultSettings.link_enabled,
            settings.link_url ?? null,
            settings.link_text ?? null,
            settings.link_new_tab ?? defaultSettings.link_new_tab,
            settings.style ?? defaultSettings.style,
            settings.background_color ?? defaultSettings.background_color,
            settings.gradient_end_color ?? defaultSettings.gradient_end_color,
            settings.text_color ?? defaultSettings.text_color,
            settings.font_size ?? defaultSettings.font_size,
            settings.font_weight ?? defaultSettings.font_weight,
            settings.padding ?? defaultSettings.padding,
            settings.border_radius ?? defaultSettings.border_radius,
            settings.animation ?? defaultSettings.animation,
            settings.dismissible ?? defaultSettings.dismissible,
            settings.dismiss_duration ?? defaultSettings.dismiss_duration,
            settings.schedule_enabled ?? defaultSettings.schedule_enabled,
            settings.schedule_start ?? null,
            settings.schedule_end ?? null,
            settings.show_on_empty_cart ?? defaultSettings.show_on_empty_cart,
            settings.min_cart_value ?? defaultSettings.min_cart_value,
            settings.max_cart_value ?? null,
          ]
        );

        // Update features flag
        const currentResult = await query<{ settings: Record<string, unknown> }>(
          'SELECT settings FROM shops WHERE id = $1',
          [shopId]
        );
        const currentSettings = currentResult.rows[0]?.settings || {};
        const features = (currentSettings.features as Record<string, boolean>) || {};
        features.announcement = settings.enabled ?? false;
        await query(
          'UPDATE shops SET settings = settings || $1 WHERE id = $2',
          [JSON.stringify({ features }), shopId]
        );
      }

      return NextResponse.json({ success: true });
    } catch (error) {
      console.error('[AnnouncementSettings PUT] Error:', error);
      return NextResponse.json({ error: 'Failed to update announcement settings' }, { status: 500 });
    }
  });
}
