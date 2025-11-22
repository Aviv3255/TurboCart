/**
 * TurboCart Pricing Configuration
 * All pricing tiers and features
 */

export interface PricingTier {
  id: string;
  name: string;
  monthlyOrders: string;
  monthlyPrice: number;
  annualPrice: number;
  features: string[];
  popular?: boolean;
}

export const PRICING_TIERS: PricingTier[] = [
  {
    id: 'starter',
    name: 'Starter',
    monthlyOrders: '0-100',
    monthlyPrice: 9.99,
    annualPrice: 99.99,
    features: [
      'Unlimited upsell products',
      'AI optimization',
      'A/B testing',
      'Full analytics',
      'All display styles',
      'Email support',
      '14-day free trial',
    ],
  },
  {
    id: 'growth',
    name: 'Growth',
    monthlyOrders: '101-500',
    monthlyPrice: 19.99,
    annualPrice: 199.99,
    popular: true,
    features: [
      'Everything in Starter',
      'Priority support',
      'Advanced analytics',
      'Custom branding',
      'API access',
    ],
  },
  {
    id: 'pro',
    name: 'Pro',
    monthlyOrders: '501-1000',
    monthlyPrice: 27.99,
    annualPrice: 279.99,
    features: [
      'Everything in Growth',
      'Dedicated account manager',
      'Custom integrations',
      'Quarterly strategy review',
    ],
  },
  {
    id: 'business',
    name: 'Business',
    monthlyOrders: '1001-2000',
    monthlyPrice: 47.99,
    annualPrice: 479.99,
    features: [
      'Everything in Pro',
      'White-label option',
      'Custom development',
      'SLA guarantee',
    ],
  },
  {
    id: 'scale',
    name: 'Scale',
    monthlyOrders: '2001-3000',
    monthlyPrice: 67.99,
    annualPrice: 679.99,
    features: [
      'Everything in Business',
      'Enterprise features',
      'Multi-store support',
      '24/7 priority support',
    ],
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    monthlyOrders: '3001-5000',
    monthlyPrice: 89.99,
    annualPrice: 899.99,
    features: [
      'Everything in Scale',
      'Unlimited stores',
      'Custom SLA',
      'Dedicated infrastructure',
    ],
  },
  {
    id: 'enterprise-plus',
    name: 'Enterprise+',
    monthlyOrders: '5001+',
    monthlyPrice: 109.99,
    annualPrice: 1099.99,
    features: [
      'Everything in Enterprise',
      'Volume discounts available',
      'Custom contract terms',
      'Enterprise-grade support',
    ],
  },
];

/**
 * Get pricing tier by ID
 */
export function getPricingTier(id: string): PricingTier | undefined {
  return PRICING_TIERS.find(tier => tier.id === id);
}

/**
 * Get pricing tier by monthly orders
 */
export function getPricingTierByOrders(monthlyOrders: number): PricingTier {
  if (monthlyOrders <= 100) return PRICING_TIERS[0]!;
  if (monthlyOrders <= 500) return PRICING_TIERS[1]!;
  if (monthlyOrders <= 1000) return PRICING_TIERS[2]!;
  if (monthlyOrders <= 2000) return PRICING_TIERS[3]!;
  if (monthlyOrders <= 3000) return PRICING_TIERS[4]!;
  if (monthlyOrders <= 5000) return PRICING_TIERS[5]!;
  return PRICING_TIERS[6]!;
}

/**
 * Calculate annual savings
 */
export function calculateAnnualSavings(tier: PricingTier): number {
  const monthlyTotal = tier.monthlyPrice * 12;
  return monthlyTotal - tier.annualPrice;
}

/**
 * Format price for display
 */
export function formatPrice(price: number): string {
  return `$${price.toFixed(2)}`;
}

/**
 * Free trial duration (days)
 */
export const FREE_TRIAL_DAYS = 14;

/**
 * Get trial end date
 */
export function getTrialEndDate(startDate: Date = new Date()): Date {
  const endDate = new Date(startDate);
  endDate.setDate(endDate.getDate() + FREE_TRIAL_DAYS);
  return endDate;
}
