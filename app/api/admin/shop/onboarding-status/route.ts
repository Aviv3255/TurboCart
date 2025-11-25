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

      // Check if shop has completed onboarding
      // This checks for: 1) ML config exists, 2) At least one upsell product, 3) Widget enabled
      const result = await query<{
        has_ml_config: boolean;
        has_products: boolean;
        widget_enabled: boolean;
        onboarding_completed_at: Date | null;
      }>(
        `SELECT
          EXISTS(SELECT 1 FROM ml_configurations WHERE shop_id = $1) as has_ml_config,
          EXISTS(SELECT 1 FROM upsell_products WHERE shop_id = $1 AND is_active = true) as has_products,
          COALESCE(
            (SELECT widget_enabled FROM shop_settings WHERE shop_id = $1),
            false
          ) as widget_enabled,
          (SELECT onboarding_completed_at FROM shops WHERE id = $1) as onboarding_completed_at
        `,
        [req.shop.id]
      );

      const status = result.rows[0];

      // Onboarding is complete if they've explicitly completed it OR have all required setup
      const onboardingComplete =
        status?.onboarding_completed_at !== null ||
        (status?.has_ml_config && status?.has_products);

      return NextResponse.json({
        onboardingComplete,
        status: {
          hasMLConfig: status?.has_ml_config || false,
          hasProducts: status?.has_products || false,
          widgetEnabled: status?.widget_enabled || false,
          completedAt: status?.onboarding_completed_at,
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
