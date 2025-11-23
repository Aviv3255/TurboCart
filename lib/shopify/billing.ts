/**
 * Shopify Billing Service
 * Handles recurring application charges (subscriptions)
 */

import { createShopifyClient } from './auth';
import { PRICING_TIERS, FREE_TRIAL_DAYS } from '../pricing';
import type { PricingTier } from '../pricing';

export interface BillingSubscription {
  id: string;
  name: string;
  price: number;
  status: 'PENDING' | 'ACTIVE' | 'CANCELLED' | 'EXPIRED' | 'DECLINED';
  trialDays: number;
  confirmationUrl?: string;
  createdAt: Date;
  billingOn?: Date;
  test?: boolean;
}

/**
 * Create a recurring application charge (subscription)
 */
export async function createSubscription(
  shopDomain: string,
  accessToken: string,
  tier: PricingTier,
  isAnnual: boolean = false,
  returnUrl: string = `https://${shopDomain}/admin/apps`,
  test: boolean = process.env.NODE_ENV === 'development'
): Promise<BillingSubscription> {
  const client = createShopifyClient(shopDomain, accessToken);

  const price = isAnnual ? tier.annualPrice : tier.monthlyPrice;
  const interval = isAnnual ? 'ANNUAL' : 'EVERY_30_DAYS';

  const mutation = `
    mutation CreateRecurringCharge(
      $name: String!
      $price: Decimal!
      $returnUrl: URL!
      $trialDays: Int
      $test: Boolean
    ) {
      appSubscriptionCreate(
        name: $name
        returnUrl: $returnUrl
        trialDays: $trialDays
        test: $test
        lineItems: [{
          plan: {
            appRecurringPricingDetails: {
              price: { amount: $price, currencyCode: USD }
              interval: ${interval}
            }
          }
        }]
      ) {
        userErrors {
          field
          message
        }
        confirmationUrl
        appSubscription {
          id
          name
          status
          createdAt
          trialDays
          currentPeriodEnd
          test
        }
      }
    }
  `;

  const response = await client.graphql<{
    appSubscriptionCreate: {
      userErrors: Array<{ field: string[]; message: string }>;
      confirmationUrl: string;
      appSubscription: {
        id: string;
        name: string;
        status: string;
        createdAt: string;
        trialDays: number;
        currentPeriodEnd: string;
        test: boolean;
      };
    };
  }>(mutation, {
    name: `TurboCart - ${tier.name}`,
    price: price.toString(),
    returnUrl,
    trialDays: FREE_TRIAL_DAYS,
    test,
  });

  const { appSubscriptionCreate } = response;

  if (appSubscriptionCreate.userErrors?.length > 0) {
    throw new Error(
      `Billing error: ${appSubscriptionCreate.userErrors.map(e => e.message).join(', ')}`
    );
  }

  return {
    id: appSubscriptionCreate.appSubscription.id.replace('gid://shopify/AppSubscription/', ''),
    name: appSubscriptionCreate.appSubscription.name,
    price,
    status: appSubscriptionCreate.appSubscription.status as BillingSubscription['status'],
    trialDays: appSubscriptionCreate.appSubscription.trialDays,
    confirmationUrl: appSubscriptionCreate.confirmationUrl,
    createdAt: new Date(appSubscriptionCreate.appSubscription.createdAt),
    billingOn: new Date(appSubscriptionCreate.appSubscription.currentPeriodEnd),
    test: appSubscriptionCreate.appSubscription.test,
  };
}

/**
 * Get current active subscription
 */
export async function getCurrentSubscription(
  shopDomain: string,
  accessToken: string
): Promise<BillingSubscription | null> {
  const client = createShopifyClient(shopDomain, accessToken);

  const query = `
    query GetCurrentSubscription {
      currentAppInstallation {
        activeSubscriptions {
          id
          name
          status
          createdAt
          trialDays
          currentPeriodEnd
          test
          lineItems {
            plan {
              pricingDetails {
                ... on AppRecurringPricing {
                  price {
                    amount
                  }
                  interval
                }
              }
            }
          }
        }
      }
    }
  `;

  const response = await client.graphql<{
    currentAppInstallation: {
      activeSubscriptions: Array<{
        id: string;
        name: string;
        status: string;
        createdAt: string;
        trialDays: number;
        currentPeriodEnd: string;
        test: boolean;
        lineItems: Array<{
          plan: {
            pricingDetails: {
              price: { amount: string };
              interval: string;
            };
          };
        }>;
      }>;
    };
  }>(query);

  const subscriptions = response.currentAppInstallation?.activeSubscriptions || [];

  if (subscriptions.length === 0) {
    return null;
  }

  // Get the first active subscription
  const sub = subscriptions[0];

  return {
    id: sub.id.replace('gid://shopify/AppSubscription/', ''),
    name: sub.name,
    price: parseFloat(sub.lineItems[0].plan.pricingDetails.price.amount),
    status: sub.status as BillingSubscription['status'],
    trialDays: sub.trialDays,
    createdAt: new Date(sub.createdAt),
    billingOn: new Date(sub.currentPeriodEnd),
    test: sub.test,
  };
}

/**
 * Cancel current subscription
 */
export async function cancelSubscription(
  shopDomain: string,
  accessToken: string,
  subscriptionId: string
): Promise<void> {
  const client = createShopifyClient(shopDomain, accessToken);

  const mutation = `
    mutation CancelSubscription($id: ID!) {
      appSubscriptionCancel(id: $id) {
        userErrors {
          field
          message
        }
        appSubscription {
          id
          status
        }
      }
    }
  `;

  const response = await client.graphql<{
    appSubscriptionCancel: {
      userErrors: Array<{ field: string[]; message: string }>;
      appSubscription: {
        id: string;
        status: string;
      };
    };
  }>(mutation, {
    id: `gid://shopify/AppSubscription/${subscriptionId}`,
  });

  const { appSubscriptionCancel } = response;

  if (appSubscriptionCancel.userErrors?.length > 0) {
    throw new Error(
      `Failed to cancel subscription: ${appSubscriptionCancel.userErrors.map(e => e.message).join(', ')}`
    );
  }
}

/**
 * Check if shop has active subscription
 */
export async function hasActiveSubscription(
  shopDomain: string,
  accessToken: string
): Promise<boolean> {
  const subscription = await getCurrentSubscription(shopDomain, accessToken);
  return subscription !== null && subscription.status === 'ACTIVE';
}

/**
 * Get plan tier from subscription name
 */
export function getPlanFromSubscriptionName(name: string): PricingTier | null {
  // Extract tier name from "TurboCart - {TierName}"
  const match = name.match(/TurboCart - (.+)/);
  if (!match) return null;

  const tierName = match[1];
  return PRICING_TIERS.find(t => t.name === tierName) || null;
}

/**
 * Check if shop is in trial period
 */
export function isInTrialPeriod(subscription: BillingSubscription): boolean {
  if (!subscription || subscription.status !== 'ACTIVE') return false;

  const trialEndDate = new Date(subscription.createdAt);
  trialEndDate.setDate(trialEndDate.getDate() + subscription.trialDays);

  return new Date() < trialEndDate;
}

/**
 * Get days remaining in trial
 */
export function getTrialDaysRemaining(subscription: BillingSubscription): number {
  if (!isInTrialPeriod(subscription)) return 0;

  const trialEndDate = new Date(subscription.createdAt);
  trialEndDate.setDate(trialEndDate.getDate() + subscription.trialDays);

  const msPerDay = 24 * 60 * 60 * 1000;
  const daysRemaining = Math.ceil((trialEndDate.getTime() - new Date().getTime()) / msPerDay);

  return Math.max(0, daysRemaining);
}
