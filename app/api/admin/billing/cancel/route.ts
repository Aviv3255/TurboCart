/**
 * Subscription Cancellation API
 * Cancel current billing subscription
 */

import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/shopify/middleware';
import { cancelSubscription, getCurrentSubscription } from '@/lib/shopify/billing';

/**
 * Cancel current subscription
 * POST /api/admin/billing/cancel
 */
export async function POST(request: NextRequest) {
  return withAuth(request, async (req) => {
    try {
      if (!req.shop) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }

      // Get current subscription
      const subscription = await getCurrentSubscription(
        req.shop.domain,
        req.shop.accessToken
      );

      if (!subscription) {
        return NextResponse.json(
          { error: 'No active subscription found' },
          { status: 404 }
        );
      }

      // Cancel the subscription
      await cancelSubscription(
        req.shop.domain,
        req.shop.accessToken,
        subscription.id
      );

      return NextResponse.json({
        success: true,
        message: 'Subscription cancelled successfully',
      });
    } catch (error) {
      console.error('Error cancelling subscription:', error);
      return NextResponse.json(
        { error: error instanceof Error ? error.message : 'Failed to cancel subscription' },
        { status: 500 }
      );
    }
  });
}
