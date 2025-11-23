/**
 * Billing API
 * Get current subscription status and billing information
 */

import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/shopify/middleware';
import {
  getCurrentSubscription,
  isInTrialPeriod,
  getTrialDaysRemaining,
  getPlanFromSubscriptionName,
} from '@/lib/shopify/billing';

// Force dynamic rendering for API routes that use authentication
export const dynamic = 'force-dynamic';

/**
 * Get current billing status
 * GET /api/admin/billing
 */
export async function GET(request: NextRequest) {
  return withAuth(request, async (req) => {
    try {
      if (!req.shop) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }

      // Get current subscription from Shopify
      const subscription = await getCurrentSubscription(
        req.shop.shop_domain,
        req.shop.access_token
      );

      if (!subscription) {
        return NextResponse.json({
          status: 'no_subscription',
          plan: null,
          trial: false,
          trialDaysRemaining: 0,
        });
      }

      const plan = getPlanFromSubscriptionName(subscription.name);
      const inTrial = isInTrialPeriod(subscription);
      const trialDaysRemaining = getTrialDaysRemaining(subscription);

      return NextResponse.json({
        status: subscription.status.toLowerCase(),
        plan: plan?.id || null,
        planName: plan?.name || null,
        price: subscription.price,
        trial: inTrial,
        trialDaysRemaining,
        billingOn: subscription.billingOn,
        createdAt: subscription.createdAt,
        test: subscription.test,
      });
    } catch (error) {
      console.error('Error fetching billing status:', error);
      return NextResponse.json(
        { error: 'Failed to fetch billing status' },
        { status: 500 }
      );
    }
  });
}
