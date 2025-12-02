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
  console.log('[Onboarding GET] Request received');
  return withAuth(request, async (req) => {
    try {
      if (!req.shop) {
        console.log('[Onboarding GET] No shop');
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }

      console.log('[Onboarding GET] Shop:', req.shop.id);

      // Check onboarding status
      const result = await query<{
        has_products: boolean;
        settings: { enabled_display_styles?: string[]; theme_enabled?: boolean } | null;
        uninstalled_at: string | null;
        onboarding_completed_at: string | null;
      }>(
        `SELECT
          EXISTS(SELECT 1 FROM upsell_products WHERE shop_id = $1 AND is_active = true) as has_products,
          settings,
          uninstalled_at,
          onboarding_completed_at
        FROM shops
        WHERE id = $1`,
        [req.shop.id]
      );

      console.log('[Onboarding GET] Query result:', result.rows[0]);

      const data = result.rows[0];

      // Check if this is a reinstall (uninstalled_at is set)
      const wasReinstalled = data?.uninstalled_at !== null;

      // If this is a reinstall, clear the uninstalled_at flag
      if (wasReinstalled) {
        await query(
          `UPDATE shops SET uninstalled_at = NULL, onboarding_completed_at = NULL WHERE id = $1`,
          [req.shop.id]
        );
        console.log('[Onboarding GET] Reinstall detected, cleared flags');
      }

      const hasProducts = data?.has_products || false;
      const themeEnabled = data?.settings?.theme_enabled === true;

      // Onboarding is complete if:
      // 1) onboarding_completed_at is set (user clicked through onboarding), OR
      // 2) has products selected (legacy check)
      // BUT if reinstall, always start fresh
      const onboardingComplete = wasReinstalled
        ? false
        : (data?.onboarding_completed_at !== null || hasProducts);

      console.log('[Onboarding GET] Returning:', { onboardingComplete, wasReinstalled });

      return NextResponse.json({
        onboardingComplete,
        themeEnabled,
        wasReinstalled,
        status: {
          hasProducts: wasReinstalled ? false : hasProducts,
          hasSettings: false,
          themeEnabled: wasReinstalled ? false : themeEnabled,
        },
      });
    } catch (error) {
      console.error('[Onboarding GET] Error:', error);
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

      // Auto-create ScriptTag for backup injection (in case App Embed isn't enabled)
      const SCRIPT_URL = 'https://turbocart.onrender.com/api/storefront/inject.js';

      try {
        // Check if script tag already exists
        const checkResponse = await fetch(
          `https://${req.shop.shop_domain}/admin/api/2024-01/script_tags.json`,
          {
            headers: {
              'X-Shopify-Access-Token': req.shop.access_token,
              'Content-Type': 'application/json',
            },
          }
        );

        let scriptTagExists = false;
        if (checkResponse.ok) {
          const checkData = await checkResponse.json();
          scriptTagExists = checkData.script_tags?.some(
            (st: { src: string }) => st.src.includes('turbocart')
          );
        }

        // Create script tag if it doesn't exist
        if (!scriptTagExists) {
          console.log('[Onboarding] Creating ScriptTag for shop:', req.shop.shop_domain);

          const createResponse = await fetch(
            `https://${req.shop.shop_domain}/admin/api/2024-01/script_tags.json`,
            {
              method: 'POST',
              headers: {
                'X-Shopify-Access-Token': req.shop.access_token,
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                script_tag: {
                  event: 'onload',
                  src: SCRIPT_URL,
                  display_scope: 'online_store',
                },
              }),
            }
          );

          if (createResponse.ok) {
            console.log('[Onboarding] ScriptTag created successfully');
          } else {
            const errorText = await createResponse.text();
            console.error('[Onboarding] ScriptTag creation failed:', errorText);
          }
        } else {
          console.log('[Onboarding] ScriptTag already exists');
        }
      } catch (scriptError) {
        // Don't fail onboarding if ScriptTag creation fails
        console.error('[Onboarding] ScriptTag error (non-fatal):', scriptError);
      }

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
