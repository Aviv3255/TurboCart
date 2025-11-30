/**
 * Settings API
 * Get and update shop settings (display style, cart position, A/B testing, etc.)
 */

import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/shopify/middleware';
import { updateShopSettings, type ShopSettings } from '@/lib/db/queries';

// Force dynamic rendering for API routes that use authentication
export const dynamic = 'force-dynamic';

/**
 * Get current shop settings
 * GET /api/admin/settings
 */
export async function GET(request: NextRequest) {
  return withAuth(request, async (req) => {
    try {
      if (!req.shop) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }

      // Return current settings from shop
      return NextResponse.json({
        settings: req.shop.settings,
      });
    } catch (error) {
      console.error('Error fetching settings:', error);
      return NextResponse.json(
        { error: 'Failed to fetch settings' },
        { status: 500 }
      );
    }
  });
}

/**
 * Update shop settings
 * POST /api/admin/settings
 */
export async function POST(request: NextRequest) {
  return withAuth(request, async (req) => {
    try {
      if (!req.shop) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }

      const body = await request.json();
      const { settings } = body;

      if (!settings) {
        return NextResponse.json(
          { error: 'Settings are required' },
          { status: 400 }
        );
      }

      // Validate settings structure
      const validSettings: Partial<ShopSettings> = {};

      if (settings.display_style) {
        const validStyles = [
          'minimal-strip', 'list', 'banner', 'cards', 'frequently-bought',
          'masonry-grid', 'vertical-scroll', 'sticky-tabs', 'comparison-table'
        ];
        if (!validStyles.includes(settings.display_style)) {
          return NextResponse.json(
            { error: 'Invalid display_style' },
            { status: 400 }
          );
        }
        validSettings.display_style = settings.display_style;
      }

      if (settings.cart_type) {
        const validCartTypes = ['drawer', 'page', 'both'];
        if (!validCartTypes.includes(settings.cart_type)) {
          return NextResponse.json(
            { error: 'Invalid cart_type' },
            { status: 400 }
          );
        }
        validSettings.cart_type = settings.cart_type;
      }

      if (settings.max_upsells !== undefined) {
        const maxUpsells = parseInt(settings.max_upsells);
        // Allow up to 25 products for cards slider, up to 10 for other styles
        const maxAllowed = settings.display_style === 'cards' ? 25 : 10;
        if (isNaN(maxUpsells) || maxUpsells < 1 || maxUpsells > maxAllowed) {
          return NextResponse.json(
            { error: `max_upsells must be between 1 and ${maxAllowed}` },
            { status: 400 }
          );
        }
        validSettings.max_upsells = maxUpsells;
      }

      if (settings.position) {
        const validPositions = ['top', 'bottom'];
        if (!validPositions.includes(settings.position)) {
          return NextResponse.json(
            { error: 'Invalid position' },
            { status: 400 }
          );
        }
        validSettings.position = settings.position;
      }

      if (settings.enable_ab_testing !== undefined) {
        validSettings.enable_ab_testing = Boolean(settings.enable_ab_testing);
      }

      // Validate enabled_display_styles array (for ML A/B testing)
      if (settings.enabled_display_styles !== undefined) {
        if (!Array.isArray(settings.enabled_display_styles)) {
          return NextResponse.json(
            { error: 'enabled_display_styles must be an array' },
            { status: 400 }
          );
        }

        const validDisplayStyles = [
          'minimal-strip', 'list', 'banner', 'cards', 'frequently-bought',
          'masonry-grid', 'vertical-scroll', 'sticky-tabs', 'comparison-table'
        ];
        const invalidStyles = settings.enabled_display_styles.filter(
          (style: string) => !validDisplayStyles.includes(style)
        );

        if (invalidStyles.length > 0) {
          return NextResponse.json(
            { error: `Invalid display styles: ${invalidStyles.join(', ')}` },
            { status: 400 }
          );
        }

        if (settings.enabled_display_styles.length < 1 || settings.enabled_display_styles.length > 3) {
          return NextResponse.json(
            { error: 'Must select 1-3 display styles for ML optimization' },
            { status: 400 }
          );
        }

        validSettings.enabled_display_styles = settings.enabled_display_styles;
      }

      // Update settings in database
      await updateShopSettings(req.shop.id, validSettings);

      return NextResponse.json({
        success: true,
        settings: {
          ...req.shop.settings,
          ...validSettings,
        },
      });
    } catch (error) {
      console.error('Error updating settings:', error);
      return NextResponse.json(
        { error: 'Failed to update settings' },
        { status: 500 }
      );
    }
  });
}
