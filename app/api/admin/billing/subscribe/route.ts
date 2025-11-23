/**
 * Subscription Creation API
 * Create a new billing subscription
 */

import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/shopify/middleware';
import { createSubscription } from '@/lib/shopify/billing';
import { getPricingTier } from '@/lib/pricing';

/**
 * Create a new subscription
 * POST /api/admin/billing/subscribe
 * Body: { planId: string, annual: boolean }
 */
export async function POST(request: NextRequest) {
  return withAuth(request, async (req) => {
    try {
      if (!req.shop) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }

      const body = await request.json();
      const { planId, annual = false } = body;

      if (!planId) {
        return NextResponse.json(
          { error: 'planId is required' },
          { status: 400 }
        );
      }

      // Get pricing tier
      const tier = getPricingTier(planId);
      if (!tier) {
        return NextResponse.json(
          { error: 'Invalid plan ID' },
          { status: 400 }
        );
      }

      // Create return URL (where Shopify redirects after approval)
      const returnUrl = `${process.env.NEXT_PUBLIC_APP_URL}/admin/billing/callback`;

      // Create subscription
      const subscription = await createSubscription(
        req.shop.domain,
        req.shop.accessToken,
        tier,
        annual,
        returnUrl
      );

      return NextResponse.json({
        success: true,
        confirmationUrl: subscription.confirmationUrl,
        subscription: {
          id: subscription.id,
          name: subscription.name,
          price: subscription.price,
          status: subscription.status,
          trialDays: subscription.trialDays,
        },
      });
    } catch (error) {
      console.error('Error creating subscription:', error);
      return NextResponse.json(
        { error: error instanceof Error ? error.message : 'Failed to create subscription' },
        { status: 500 }
      );
    }
  });
}
