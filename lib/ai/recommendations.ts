/**
 * TurboCart AI Recommendation Engine
 * Smart, context-aware product recommendations with A/B testing
 */

import { getActiveUpsells, getProductAffinities, type UpsellProduct } from '../db/queries';

export interface CartItem {
  id: number;
  product_id: number;
  variant_id: number;
  title: string;
  product_type?: string;
  vendor?: string;
  collection_id?: number;
  price: number;
  quantity: number;
}

export interface RecommendationContext {
  shop_id: string;
  cart_items: CartItem[];
  customer_id?: number;
  session_id?: string;
  ab_test_variant?: 'A' | 'B' | 'control' | 'test';
}

export interface ScoredRecommendation extends UpsellProduct {
  score: number;
  matching_factors: string[];
  confidence: number;
}

/**
 * Main recommendation engine class
 */
export class RecommendationEngine {
  private shopId: string;

  constructor(shopId: string) {
    this.shopId = shopId;
  }

  /**
   * Get personalized upsell recommendations
   */
  async getRecommendations(
    context: RecommendationContext,
    options: {
      maxResults?: number;
      minScore?: number;
      excludeProductIds?: number[];
    } = {}
  ): Promise<ScoredRecommendation[]> {
    const {
      maxResults = 5,
      minScore = 0,
      excludeProductIds = [],
    } = options;

    // Get all active upsell products for this shop
    const upsellPool = await getActiveUpsells(this.shopId);

    // Filter out products already in cart
    const cartProductIds = context.cart_items.map(item => item.product_id);
    const availableUpsells = upsellPool.filter(
      upsell => !cartProductIds.includes(upsell.shopify_product_id) &&
                !excludeProductIds.includes(upsell.shopify_product_id)
    );

    if (availableUpsells.length === 0) {
      return [];
    }

    // Score each upsell based on cart contents
    const scoredRecommendations = await Promise.all(
      availableUpsells.map(upsell => this.scoreUpsell(upsell, context))
    );

    // Sort by score (descending)
    const sorted = scoredRecommendations
      .filter(rec => rec.score >= minScore)
      .sort((a, b) => b.score - a.score);

    // Apply A/B testing if enabled
    const withABTesting = this.applyABTesting(sorted, context);

    // Return top N results
    return withABTesting.slice(0, maxResults);
  }

  /**
   * Score an upsell product based on cart context
   */
  private async scoreUpsell(
    upsell: UpsellProduct,
    context: RecommendationContext
  ): Promise<ScoredRecommendation> {
    let score = 0;
    const matchingFactors: string[] = [];

    // Base priority score (0-10)
    score += (upsell.priority || 0);
    if (upsell.priority > 0) {
      matchingFactors.push('merchant_priority');
    }

    // Analyze against each cart item
    for (const cartItem of context.cart_items) {
      const itemScore = await this.scoreAgainstCartItem(upsell, cartItem, matchingFactors);
      score += itemScore;
    }

    // Get ML-learned product affinities
    const affinityScore = await this.getAffinityScore(upsell, context.cart_items);
    score += affinityScore;
    if (affinityScore > 0) {
      matchingFactors.push('learned_affinity');
    }

    // Historical performance boost (from analytics)
    // This will come from the analytics table - for now, placeholder
    const performanceBoost = 0; // TODO: Implement based on conversion rates
    score += performanceBoost;

    // Calculate confidence (0-1)
    const confidence = this.calculateConfidence(score, matchingFactors.length);

    return {
      ...upsell,
      score,
      matching_factors: matchingFactors,
      confidence,
    };
  }

  /**
   * Score upsell against a single cart item
   */
  private async scoreAgainstCartItem(
    upsell: UpsellProduct,
    cartItem: CartItem,
    matchingFactors: string[]
  ): Promise<number> {
    let score = 0;

    // 1. Collection matching (highest priority - 40 points)
    if (cartItem.collection_id && upsell.collection_ids.includes(cartItem.collection_id)) {
      score += 40;
      if (!matchingFactors.includes('same_collection')) {
        matchingFactors.push('same_collection');
      }
    }

    // 2. Product type matching (30 points)
    if (cartItem.product_type && upsell.product_type === cartItem.product_type) {
      score += 30;
      if (!matchingFactors.includes('same_product_type')) {
        matchingFactors.push('same_product_type');
      }
    }

    // 3. Vendor matching (10 points)
    if (cartItem.vendor && upsell.vendor === cartItem.vendor) {
      score += 10;
      if (!matchingFactors.includes('same_vendor')) {
        matchingFactors.push('same_vendor');
      }
    }

    // 4. Price range matching (15 points)
    // Upsells work best when within 30% of cart item price
    const priceDiff = Math.abs(cartItem.price - Number(upsell.price)) / cartItem.price;
    if (priceDiff <= 0.3) {
      score += 15;
      if (!matchingFactors.includes('similar_price')) {
        matchingFactors.push('similar_price');
      }
    } else if (priceDiff <= 0.5) {
      score += 7; // Partial credit
    }

    // 5. Discount/savings boost (5 points)
    if (upsell.compare_at_price && Number(upsell.compare_at_price) > Number(upsell.price)) {
      const savingsPercent = ((Number(upsell.compare_at_price) - Number(upsell.price)) / Number(upsell.compare_at_price)) * 100;
      if (savingsPercent >= 15) {
        score += 5;
        if (!matchingFactors.includes('significant_discount')) {
          matchingFactors.push('significant_discount');
        }
      }
    }

    return score;
  }

  /**
   * Get ML-learned product affinity score
   */
  private async getAffinityScore(
    upsell: UpsellProduct,
    cartItems: CartItem[]
  ): Promise<number> {
    let maxAffinity = 0;

    for (const cartItem of cartItems) {
      const affinities = await getProductAffinities(
        this.shopId,
        cartItem.product_id,
        10
      );

      const match = affinities.find(
        a => a.product_id === upsell.shopify_product_id
      );

      if (match && match.score > maxAffinity) {
        maxAffinity = match.score;
      }
    }

    // Scale affinity score to 0-20 points
    return maxAffinity * 20;
  }

  /**
   * Calculate confidence score (0-1)
   */
  private calculateConfidence(score: number, factorCount: number): number {
    // Base confidence on score and number of matching factors
    const scoreConfidence = Math.min(score / 100, 1);
    const factorConfidence = Math.min(factorCount / 5, 1);

    // Weighted average
    return (scoreConfidence * 0.7) + (factorConfidence * 0.3);
  }

  /**
   * Apply A/B testing logic
   */
  private applyABTesting(
    recommendations: ScoredRecommendation[],
    context: RecommendationContext
  ): ScoredRecommendation[] {
    // Determine if this is a test variant (20% of traffic)
    const isTestVariant = Math.random() < 0.2;

    if (isTestVariant && recommendations.length > 1) {
      // Test variant: Randomly shuffle to test different combinations
      return this.shuffleArray([...recommendations]);
    }

    // Control variant: Return sorted by score (best performers)
    return recommendations;
  }

  /**
   * Shuffle array (Fisher-Yates algorithm)
   */
  private shuffleArray<T>(array: T[]): T[] {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j]!, shuffled[i]!];
    }
    return shuffled;
  }
}

/**
 * Quick recommendation helper
 */
export async function getSmartRecommendations(
  shopId: string,
  cartItems: CartItem[],
  options?: {
    maxResults?: number;
    customerId?: number;
    sessionId?: string;
  }
): Promise<ScoredRecommendation[]> {
  const engine = new RecommendationEngine(shopId);

  return engine.getRecommendations(
    {
      shop_id: shopId,
      cart_items: cartItems,
      customer_id: options?.customerId,
      session_id: options?.sessionId,
    },
    {
      maxResults: options?.maxResults || 5,
    }
  );
}

/**
 * Batch recommendation for multiple carts
 */
export async function getBatchRecommendations(
  shopId: string,
  carts: Array<{ id: string; items: CartItem[] }>
): Promise<Map<string, ScoredRecommendation[]>> {
  const engine = new RecommendationEngine(shopId);
  const results = new Map<string, ScoredRecommendation[]>();

  await Promise.all(
    carts.map(async (cart) => {
      const recommendations = await engine.getRecommendations({
        shop_id: shopId,
        cart_items: cart.items,
      });
      results.set(cart.id, recommendations);
    })
  );

  return results;
}

/**
 * Update product affinities based on purchase data
 * This runs periodically to learn from actual purchases
 */
export async function updateProductAffinities(
  shopId: string,
  orderItems: Array<{ product_id: number; quantity: number }>
): Promise<void> {
  // Find products that were purchased together
  for (let i = 0; i < orderItems.length; i++) {
    for (let j = i + 1; j < orderItems.length; j++) {
      const productA = orderItems[i]!;
      const productB = orderItems[j]!;

      // Calculate affinity score (simple co-occurrence for now)
      // In a production system, this would be more sophisticated
      const score = 0.1; // Placeholder - would be calculated based on frequency

      // Update in database (implementation in queries.ts)
      // await updateProductAffinity(shopId, productA.product_id, productB.product_id, score);
    }
  }
}
