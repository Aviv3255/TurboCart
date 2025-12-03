/**
 * Rewards Settings API
 * GET - Get rewards progress bar settings and tiers
 * PUT - Update rewards settings and tiers
 */

import { NextRequest, NextResponse } from 'next/server';
import { withAuth, AuthenticatedRequest } from '@/lib/shopify/middleware';
import { query } from '@/lib/db';

export const dynamic = 'force-dynamic';

interface RewardsSettings {
  enabled: boolean;
  position: string;
  progress_bar_height: number;
  progress_bar_color: string;
  progress_bar_gradient_end: string;
  progress_bar_background: string;
  progress_bar_border_radius: number;
  show_percentage: boolean;
  animate_progress: boolean;
  milestone_icon_size: number;
  milestone_icon_background: string;
  milestone_icon_active_background: string;
  milestone_icon_color: string;
  milestone_icon_active_color: string;
  show_milestone_labels: boolean;
  show_milestone_amounts: boolean;
  message_template: string;
  completed_message: string;
  empty_cart_message: string;
  background_color: string;
  border_color: string;
  border_radius: number;
  padding: number;
  celebration_animation: boolean;
}

interface RewardTier {
  id?: string;
  threshold: number;
  reward_type: string;
  reward_value: string;
  label: string;
  description?: string;
  icon: string;
  icon_url?: string;
  discount_code?: string;
  auto_apply: boolean;
  celebration_message?: string;
  is_active: boolean;
}

const defaultSettings: RewardsSettings = {
  enabled: false,
  position: 'top',
  progress_bar_height: 8,
  progress_bar_color: '#10b981',
  progress_bar_gradient_end: '#059669',
  progress_bar_background: '#e5e7eb',
  progress_bar_border_radius: 4,
  show_percentage: false,
  animate_progress: true,
  milestone_icon_size: 32,
  milestone_icon_background: '#e5e7eb',
  milestone_icon_active_background: '#10b981',
  milestone_icon_color: '#6b7280',
  milestone_icon_active_color: '#ffffff',
  show_milestone_labels: true,
  show_milestone_amounts: true,
  message_template: 'Add {amount} more to unlock {reward}!',
  completed_message: 'Congratulations! You have unlocked all rewards!',
  empty_cart_message: 'Add items to start earning rewards!',
  background_color: '#f9fafb',
  border_color: '#e5e7eb',
  border_radius: 12,
  padding: 16,
  celebration_animation: true,
};

export async function GET(request: NextRequest) {
  return withAuth(request, async (req: AuthenticatedRequest) => {
    try {
      if (!req.shop) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }

      const shopId = req.shop.id;
      let settings: RewardsSettings = defaultSettings;
      let tiers: RewardTier[] = [];

      // Get settings
      try {
        const settingsResult = await query<RewardsSettings>(
          `SELECT enabled, position, progress_bar_height, progress_bar_color,
                  progress_bar_gradient_end, progress_bar_background, progress_bar_border_radius,
                  show_percentage, animate_progress, milestone_icon_size,
                  milestone_icon_background, milestone_icon_active_background,
                  milestone_icon_color, milestone_icon_active_color,
                  show_milestone_labels, show_milestone_amounts,
                  message_template, completed_message, empty_cart_message,
                  background_color, border_color, border_radius, padding, celebration_animation
           FROM rewards_settings WHERE shop_id = $1`,
          [shopId]
        );
        if (settingsResult.rows[0]) {
          settings = { ...defaultSettings, ...settingsResult.rows[0] };
        }
      } catch (err: unknown) {
        const dbError = err as { code?: string };
        if (dbError.code !== '42P01') throw err;
      }

      // Get tiers
      try {
        const tiersResult = await query<RewardTier>(
          `SELECT id, threshold::float, reward_type, reward_value, label, description,
                  icon, icon_url, discount_code, auto_apply, celebration_message, is_active
           FROM reward_tiers
           WHERE shop_id = $1
           ORDER BY threshold ASC`,
          [shopId]
        );
        tiers = tiersResult.rows;
      } catch (err: unknown) {
        const dbError = err as { code?: string };
        if (dbError.code !== '42P01') throw err;
      }

      return NextResponse.json({ settings, tiers });
    } catch (error) {
      console.error('[RewardsSettings GET] Error:', error);
      return NextResponse.json({ error: 'Failed to get rewards settings' }, { status: 500 });
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
      const { settings, tiers } = body as {
        settings?: Partial<RewardsSettings>;
        tiers?: RewardTier[];
      };

      // Update settings
      if (settings) {
        await query(
          `INSERT INTO rewards_settings (
            shop_id, enabled, position, progress_bar_height, progress_bar_color,
            progress_bar_gradient_end, progress_bar_background, progress_bar_border_radius,
            show_percentage, animate_progress, milestone_icon_size,
            milestone_icon_background, milestone_icon_active_background,
            milestone_icon_color, milestone_icon_active_color,
            show_milestone_labels, show_milestone_amounts,
            message_template, completed_message, empty_cart_message,
            background_color, border_color, border_radius, padding, celebration_animation
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24, $25)
          ON CONFLICT (shop_id) DO UPDATE SET
            enabled = $2, position = $3, progress_bar_height = $4, progress_bar_color = $5,
            progress_bar_gradient_end = $6, progress_bar_background = $7, progress_bar_border_radius = $8,
            show_percentage = $9, animate_progress = $10, milestone_icon_size = $11,
            milestone_icon_background = $12, milestone_icon_active_background = $13,
            milestone_icon_color = $14, milestone_icon_active_color = $15,
            show_milestone_labels = $16, show_milestone_amounts = $17,
            message_template = $18, completed_message = $19, empty_cart_message = $20,
            background_color = $21, border_color = $22, border_radius = $23, padding = $24,
            celebration_animation = $25, updated_at = NOW()`,
          [
            shopId,
            settings.enabled ?? defaultSettings.enabled,
            settings.position ?? defaultSettings.position,
            settings.progress_bar_height ?? defaultSettings.progress_bar_height,
            settings.progress_bar_color ?? defaultSettings.progress_bar_color,
            settings.progress_bar_gradient_end ?? defaultSettings.progress_bar_gradient_end,
            settings.progress_bar_background ?? defaultSettings.progress_bar_background,
            settings.progress_bar_border_radius ?? defaultSettings.progress_bar_border_radius,
            settings.show_percentage ?? defaultSettings.show_percentage,
            settings.animate_progress ?? defaultSettings.animate_progress,
            settings.milestone_icon_size ?? defaultSettings.milestone_icon_size,
            settings.milestone_icon_background ?? defaultSettings.milestone_icon_background,
            settings.milestone_icon_active_background ?? defaultSettings.milestone_icon_active_background,
            settings.milestone_icon_color ?? defaultSettings.milestone_icon_color,
            settings.milestone_icon_active_color ?? defaultSettings.milestone_icon_active_color,
            settings.show_milestone_labels ?? defaultSettings.show_milestone_labels,
            settings.show_milestone_amounts ?? defaultSettings.show_milestone_amounts,
            settings.message_template ?? defaultSettings.message_template,
            settings.completed_message ?? defaultSettings.completed_message,
            settings.empty_cart_message ?? defaultSettings.empty_cart_message,
            settings.background_color ?? defaultSettings.background_color,
            settings.border_color ?? defaultSettings.border_color,
            settings.border_radius ?? defaultSettings.border_radius,
            settings.padding ?? defaultSettings.padding,
            settings.celebration_animation ?? defaultSettings.celebration_animation,
          ]
        );

        // Update features flag
        const currentResult = await query<{ settings: Record<string, unknown> }>(
          'SELECT settings FROM shops WHERE id = $1',
          [shopId]
        );
        const currentSettings = currentResult.rows[0]?.settings || {};
        const features = (currentSettings.features as Record<string, boolean>) || {};
        features.rewards = settings.enabled ?? false;
        await query(
          'UPDATE shops SET settings = settings || $1 WHERE id = $2',
          [JSON.stringify({ features }), shopId]
        );
      }

      // Update tiers
      if (tiers !== undefined) {
        // Delete existing tiers
        await query('DELETE FROM reward_tiers WHERE shop_id = $1', [shopId]);

        // Insert new tiers
        for (let i = 0; i < tiers.length; i++) {
          const t = tiers[i];
          if (!t) continue;
          await query(
            `INSERT INTO reward_tiers (
              shop_id, threshold, reward_type, reward_value, label, description,
              icon, icon_url, discount_code, auto_apply, celebration_message, position, is_active
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)`,
            [
              shopId,
              t.threshold,
              t.reward_type,
              t.reward_value || '',
              t.label || '',
              t.description || null,
              t.icon || 'star',
              t.icon_url || null,
              t.discount_code || null,
              t.auto_apply ?? false,
              t.celebration_message || null,
              i,
              t.is_active !== false,
            ]
          );
        }
      }

      return NextResponse.json({ success: true });
    } catch (error) {
      console.error('[RewardsSettings PUT] Error:', error);
      return NextResponse.json({ error: 'Failed to update rewards settings' }, { status: 500 });
    }
  });
}
