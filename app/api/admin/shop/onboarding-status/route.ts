/**
 * Onboarding Status API
 * Checks if the current shop has completed the onboarding process
 */

import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/shopify/middleware';
import { query } from '@/lib/db';

// Force dynamic rendering for API routes that use authentication
export const dynamic = 'force-dynamic';

/**
 * Get onboarding status
 * GET /api/admin/shop/onboarding-status
 */
export async function GET(request: NextRequest) {
  return withAuth(request, async (req) => {
    try {
      if (!req.shop) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }

      // Check if shop has completed onboarding by checking:
      // 1) Has at least one upsell product selected
      // 2) Has settings configured (enabled_display_styles)
      // 3) Has theme enabled
      const result = await query<{
        has_products: boolean;
        settings: { enabled_display_styles?: string[]; theme_enabled?: boolean } | null;
      }>(
        `SELECT
          EXISTS(SELECT 1 FROM upsell_products WHERE shop_id = $1 AND is_active = true) as has_products,
          settings
        FROM shops
        WHERE id = $1`,
        [req.shop.id]
      );

      const data = result.rows[0];
      const hasProducts = data?.has_products || false;
      const hasSettings = data?.settings?.enabled_display_styles &&
                          data.settings.enabled_display_styles.length > 0;
      const themeEnabled = data?.settings?.theme_enabled === true;

      // Onboarding is complete if they have products selected
      // (settings have defaults so they're always valid)
      const onboardingComplete = hasProducts;

      return NextResponse.json({
        onboardingComplete,
        themeEnabled,
        status: {
          hasProducts,
          hasSettings: !!hasSettings,
          themeEnabled,
        },
      });
    } catch (error) {
      console.error('Error checking onboarding status:', error);
      // Default to complete to avoid blocking users on error
      return NextResponse.json({
        onboardingComplete: true,
        status: null,
        error: 'Failed to check status',
      });
    }
  });
}

/**
 * Mark onboarding as complete
 * POST /api/admin/shop/onboarding-status
 */
export async function POST(request: NextRequest) {
  return withAuth(request, async (req) => {
    try {
      if (!req.shop) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }

      // Mark onboarding as complete
      await query(
        `UPDATE shops SET onboarding_completed_at = NOW() WHERE id = $1`,
        [req.shop.id]
      );

      return NextResponse.json({
        success: true,
        onboardingComplete: true,
      });
    } catch (error) {
      console.error('Error completing onboarding:', error);
      return NextResponse.json(
        { error: 'Failed to complete onboarding' },
        { status: 500 }
      );
    }
  });
}
