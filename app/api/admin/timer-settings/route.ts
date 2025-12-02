/**
 * Timer Settings API
 * GET - Get urgency timer settings
 * PUT - Update timer settings
 */

import { NextRequest, NextResponse } from 'next/server';
import { withAuth, AuthenticatedRequest } from '@/lib/shopify/middleware';
import { query } from '@/lib/db';

export const dynamic = 'force-dynamic';

interface TimerSettings {
  enabled: boolean;
  position: string;
  duration_minutes: number;
  reset_on_activity: boolean;
  message_template: string;
  expired_message: string;
  urgency_message: string | null;
  style: string;
  background_color: string;
  text_color: string;
  accent_color: string;
  timer_color: string;
  font_size: number;
  padding: number;
  border_radius: number;
  animation: string;
  animate_last_minute: boolean;
  show_progress_bar: boolean;
  play_sound_warning: boolean;
  sound_warning_seconds: number;
  min_cart_value: number;
}

const defaultSettings: TimerSettings = {
  enabled: false,
  position: 'top',
  duration_minutes: 10,
  reset_on_activity: true,
  message_template: 'Your cart will expire in {time}! Checkout now before items sell out.',
  expired_message: 'Your cart has expired. Items may no longer be reserved.',
  urgency_message: 'Hurry! Only {time} left!',
  style: 'bar',
  background_color: '#fef3c7',
  text_color: '#92400e',
  accent_color: '#f59e0b',
  timer_color: '#dc2626',
  font_size: 14,
  padding: 12,
  border_radius: 8,
  animation: 'none',
  animate_last_minute: true,
  show_progress_bar: false,
  play_sound_warning: false,
  sound_warning_seconds: 60,
  min_cart_value: 0,
};

export async function GET(request: NextRequest) {
  return withAuth(request, async (req: AuthenticatedRequest) => {
    try {
      if (!req.shop) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }

      const shopId = req.shop.id;
      let settings: TimerSettings = defaultSettings;

      try {
        const result = await query<TimerSettings>(
          `SELECT enabled, position, duration_minutes, reset_on_activity,
                  message_template, expired_message, urgency_message,
                  style, background_color, text_color, accent_color, timer_color,
                  font_size, padding, border_radius, animation, animate_last_minute,
                  show_progress_bar, play_sound_warning, sound_warning_seconds,
                  min_cart_value::float
           FROM timer_settings WHERE shop_id = $1`,
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
      console.error('[TimerSettings GET] Error:', error);
      return NextResponse.json({ error: 'Failed to get timer settings' }, { status: 500 });
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
      const { settings } = body as { settings: Partial<TimerSettings> };

      if (settings) {
        await query(
          `INSERT INTO timer_settings (
            shop_id, enabled, position, duration_minutes, reset_on_activity,
            message_template, expired_message, urgency_message,
            style, background_color, text_color, accent_color, timer_color,
            font_size, padding, border_radius, animation, animate_last_minute,
            show_progress_bar, play_sound_warning, sound_warning_seconds, min_cart_value
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22)
          ON CONFLICT (shop_id) DO UPDATE SET
            enabled = $2, position = $3, duration_minutes = $4, reset_on_activity = $5,
            message_template = $6, expired_message = $7, urgency_message = $8,
            style = $9, background_color = $10, text_color = $11, accent_color = $12, timer_color = $13,
            font_size = $14, padding = $15, border_radius = $16, animation = $17, animate_last_minute = $18,
            show_progress_bar = $19, play_sound_warning = $20, sound_warning_seconds = $21,
            min_cart_value = $22, updated_at = NOW()`,
          [
            shopId,
            settings.enabled ?? defaultSettings.enabled,
            settings.position ?? defaultSettings.position,
            settings.duration_minutes ?? defaultSettings.duration_minutes,
            settings.reset_on_activity ?? defaultSettings.reset_on_activity,
            settings.message_template ?? defaultSettings.message_template,
            settings.expired_message ?? defaultSettings.expired_message,
            settings.urgency_message ?? defaultSettings.urgency_message,
            settings.style ?? defaultSettings.style,
            settings.background_color ?? defaultSettings.background_color,
            settings.text_color ?? defaultSettings.text_color,
            settings.accent_color ?? defaultSettings.accent_color,
            settings.timer_color ?? defaultSettings.timer_color,
            settings.font_size ?? defaultSettings.font_size,
            settings.padding ?? defaultSettings.padding,
            settings.border_radius ?? defaultSettings.border_radius,
            settings.animation ?? defaultSettings.animation,
            settings.animate_last_minute ?? defaultSettings.animate_last_minute,
            settings.show_progress_bar ?? defaultSettings.show_progress_bar,
            settings.play_sound_warning ?? defaultSettings.play_sound_warning,
            settings.sound_warning_seconds ?? defaultSettings.sound_warning_seconds,
            settings.min_cart_value ?? defaultSettings.min_cart_value,
          ]
        );

        // Update features flag
        const currentResult = await query<{ settings: Record<string, unknown> }>(
          'SELECT settings FROM shops WHERE id = $1',
          [shopId]
        );
        const currentSettings = currentResult.rows[0]?.settings || {};
        const features = (currentSettings.features as Record<string, boolean>) || {};
        features.timer = settings.enabled ?? false;
        await query(
          'UPDATE shops SET settings = settings || $1 WHERE id = $2',
          [JSON.stringify({ features }), shopId]
        );
      }

      return NextResponse.json({ success: true });
    } catch (error) {
      console.error('[TimerSettings PUT] Error:', error);
      return NextResponse.json({ error: 'Failed to update timer settings' }, { status: 500 });
    }
  });
}
