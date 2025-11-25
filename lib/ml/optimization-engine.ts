/**
 * TurboCart ML Optimization Engine
 *
 * The core ML system that:
 * 1. Selects optimal [Display Style + Products + Order] combinations
 * 2. Uses Thompson Sampling for multi-armed bandit optimization
 * 3. Learns from context (cart value, items, collections, time, etc.)
 * 4. Balances exploration (20%) vs exploitation (80%)
 * 5. Continuously improves based on real outcomes
 *
 * This is the "killer feature" - automatically optimizing for maximum revenue
 */

import { query } from '../db';
import {
  ThompsonSamplingEngine,
  type ThompsonArm,
  createArm,
} from './thompson-sampling';
import type { CartItem } from '../ai/recommendations';
import type { UpsellProduct } from '../db/queries';

/**
 * Cart context for ML decisions
 */
export interface CartContext {
  items: CartItem[];
  totalValue: number;
  itemCount: number;
  collections: number[];
  productTypes: string[];
  timeOfDay: 'morning' | 'afternoon' | 'evening' | 'night';
  dayOfWeek: number;
  sessionId: string;
  customerId?: number;
}

/**
 * Display style option
 */
export type DisplayStyle =
  | 'minimal-strip'
  | 'list'
  | 'banner'
  | 'cards'
  | 'frequently-bought'
  | 'inline';

/**
 * ML Decision result
 */
export interface MLDecision {
  // What to show
  displayStyle: DisplayStyle;
  products: Array<{
    product: UpsellProduct;
    position: number;
    score: number;
  }>;

  // Why this decision
  decisionType: 'exploit' | 'explore';
  reasoning: {
    displayStyleScores: Record<string, number>;
    productScores: Record<string, number>;
    contextMatches: string[];
    thompsonSamples: Array<{ id: string; sample: number }>;
  };

  // For tracking
  decisionId: string;
  confidence: number;
}

/**
 * ML Model configuration
 */
interface MLConfig {
  explorationRate: number;
  minSamplesForExploit: number;
  contextMatchingThreshold: number;
  recencyWeight: number;
  maxProductsToShow: number;
}

/**
 * Main ML Optimization Engine
 */
export class MLOptimizationEngine {
  private shopId: string;
  private thompsonEngine: ThompsonSamplingEngine;
  private config: MLConfig;

  constructor(shopId: string, config?: Partial<MLConfig>) {
    this.shopId = shopId;
    this.thompsonEngine = new ThompsonSamplingEngine();
    this.config = {
      explorationRate: config?.explorationRate ?? 0.2, // 20% exploration
      minSamplesForExploit: config?.minSamplesForExploit ?? 100,
      contextMatchingThreshold: config?.contextMatchingThreshold ?? 0.7,
      recencyWeight: config?.recencyWeight ?? 0.3,
      maxProductsToShow: config?.maxProductsToShow ?? 3,
    };
  }

  /**
   * Main decision function - called every time we need to show upsells
   */
  async makeDecision(context: CartContext): Promise<MLDecision> {
    // 1. Decide: explore or exploit?
    const shouldExplore = Math.random() < this.config.explorationRate;

    // 2. Get enabled display styles for this shop
    const enabledStyles = await this.getEnabledDisplayStyles();

    // 3. Get product pool
    const productPool = await this.getProductPool();

    if (enabledStyles.length === 0 || productPool.length === 0) {
      throw new Error('No display styles or products configured');
    }

    // 4. Make decision based on mode
    let decision: MLDecision;

    if (shouldExplore || (await this.needsMoreData())) {
      decision = await this.explore(context, enabledStyles, productPool);
    } else {
      decision = await this.exploit(context, enabledStyles, productPool);
    }

    // 5. Log decision for learning
    await this.logDecision(decision, context);

    return decision;
  }

  /**
   * EXPLOIT: Use what we know works best
   * Select the mathematically optimal combination
   */
  private async exploit(
    context: CartContext,
    enabledStyles: DisplayStyle[],
    productPool: UpsellProduct[]
  ): Promise<MLDecision> {
    // 1. Load Thompson Sampling state for display styles
    const displayArms = await this.loadDisplayArms(enabledStyles);

    // 2. Use Thompson Sampling to select best display style
    const { selectedArm: displayArm, samples: displaySamples } =
      this.thompsonEngine.selectArm(displayArms);

    const selectedDisplayStyle = displayArm.id as DisplayStyle;

    // 3. Load product arms
    const productArms = await this.loadProductArms(productPool);

    // 4. Score products using contextual matching + Thompson Sampling
    const scoredProducts = await this.scoreProductsWithContext(
      productArms,
      context,
      selectedDisplayStyle
    );

    // 5. Select top N products
    const topProducts = scoredProducts
      .sort((a, b) => b.score - a.score)
      .slice(0, this.config.maxProductsToShow)
      .map((p, index) => ({
        product: p.product,
        position: index + 1,
        score: p.score,
      }));

    // 6. Build decision
    const decisionId = this.generateDecisionId();

    return {
      displayStyle: selectedDisplayStyle,
      products: topProducts,
      decisionType: 'exploit',
      reasoning: {
        displayStyleScores: Object.fromEntries(
          displaySamples.map((s) => [s.armId, s.sample])
        ),
        productScores: Object.fromEntries(
          scoredProducts.map((p) => [p.product.id, p.score])
        ),
        contextMatches: scoredProducts.flatMap((p) => p.contextMatches),
        thompsonSamples: displaySamples.map((s) => ({
          id: s.armId,
          sample: s.sample,
        })),
      },
      decisionId,
      confidence: this.calculateConfidence(displayArm, scoredProducts),
    };
  }

  /**
   * EXPLORE: Test new combinations to learn
   * Random selection to gather data
   */
  private async explore(
    context: CartContext,
    enabledStyles: DisplayStyle[],
    productPool: UpsellProduct[]
  ): Promise<MLDecision> {
    // Randomly select display style
    const selectedDisplayStyle =
      enabledStyles[Math.floor(Math.random() * enabledStyles.length)]!;

    // Randomly select products
    const shuffled = [...productPool].sort(() => Math.random() - 0.5);
    const selectedProducts = shuffled
      .slice(0, this.config.maxProductsToShow)
      .map((product, index) => ({
        product,
        position: index + 1,
        score: Math.random(), // Random score for exploration
      }));

    const decisionId = this.generateDecisionId();

    return {
      displayStyle: selectedDisplayStyle,
      products: selectedProducts,
      decisionType: 'explore',
      reasoning: {
        displayStyleScores: { [selectedDisplayStyle]: Math.random() },
        productScores: Object.fromEntries(
          selectedProducts.map((p) => [p.product.id, p.score])
        ),
        contextMatches: ['random_exploration'],
        thompsonSamples: [],
      },
      decisionId,
      confidence: 0.1, // Low confidence during exploration
    };
  }

  /**
   * Score products using Thompson Sampling + contextual matching
   */
  private async scoreProductsWithContext(
    productArms: ThompsonArm[],
    context: CartContext,
    displayStyle: DisplayStyle
  ): Promise<
    Array<{
      product: UpsellProduct;
      score: number;
      contextMatches: string[];
    }>
  > {
    const contextBucket = this.getContextBucket(context);

    return Promise.all(
      productArms.map(async (arm) => {
        const product = arm.metadata!.product as UpsellProduct;

        // 1. Thompson Sampling score (0-1)
        const thompsonScore = this.thompsonEngine.getSamples([arm])[0]!.sample;

        // 2. Context matching score (0-1)
        const { score: contextScore, matches } = await this.getContextMatchingScore(
          product,
          context,
          displayStyle,
          contextBucket
        );

        // 3. Recency weight (recent performance matters more)
        const recencyScore = await this.getRecencyScore(product.id, displayStyle);

        // 4. Combined score
        const score =
          thompsonScore * 0.5 + // 50% from Thompson Sampling
          contextScore * 0.3 + // 30% from context matching
          recencyScore * 0.2; // 20% from recent performance

        return {
          product,
          score,
          contextMatches: matches,
        };
      })
    );
  }

  /**
   * Get context matching score
   * Checks historical performance in similar contexts
   */
  private async getContextMatchingScore(
    product: UpsellProduct,
    context: CartContext,
    displayStyle: DisplayStyle,
    contextBucket: string
  ): Promise<{ score: number; matches: string[] }> {
    const matches: string[] = [];

    // Query context performance
    const result = await query<{
      revenue_per_impression: number;
      acceptance_rate: number;
      impressions: number;
    }>(
      `SELECT
        revenue_per_impression,
        acceptance_rate,
        impressions
      FROM ml_combination_performance
      WHERE shop_id = $1
        AND display_style = $2
        AND $3 = ANY(product_ids)
        AND cart_value_bucket = $4
        AND impressions > 10
      ORDER BY revenue_per_impression DESC
      LIMIT 1`,
      [this.shopId, displayStyle, product.shopify_product_id, contextBucket]
    );

    if (result.rows.length === 0) {
      return { score: 0.5, matches: ['no_historical_data'] };
    }

    const perf = result.rows[0]!;
    matches.push('historical_context_match');

    // Score based on revenue per impression (normalize to 0-1)
    const score = Math.min(Number(perf.revenue_per_impression) / 5, 1);

    return { score, matches };
  }

  /**
   * Get recency score - recent performance weighted more heavily
   */
  private async getRecencyScore(productId: string, displayStyle: DisplayStyle): Promise<number> {
    const result = await query<{
      recent_revenue: number;
      recent_impressions: number;
    }>(
      `SELECT
        COALESCE(SUM(revenue), 0) as recent_revenue,
        COALESCE(SUM(impressions), 0) as recent_impressions
      FROM ml_combination_performance
      WHERE shop_id = $1
        AND display_style = $2
        AND $3 = ANY(product_ids)
        AND updated_at >= NOW() - INTERVAL '7 days'`,
      [this.shopId, displayStyle, productId]
    );

    if (result.rows.length === 0 || Number(result.rows[0]!.recent_impressions) === 0) {
      return 0.5;
    }

    const revenuePerImpression =
      Number(result.rows[0]!.recent_revenue) / Number(result.rows[0]!.recent_impressions);

    return Math.min(revenuePerImpression / 5, 1);
  }

  /**
   * Load display style Thompson Sampling arms
   */
  private async loadDisplayArms(enabledStyles: DisplayStyle[]): Promise<ThompsonArm[]> {
    const result = await query<{
      display_style: string;
      alpha: number;
      beta: number;
      total_impressions: number;
      total_adds: number;
    }>(
      `SELECT display_style, alpha, beta, total_impressions, total_adds
       FROM ml_display_arms
       WHERE shop_id = $1 AND display_style = ANY($2)`,
      [this.shopId, enabledStyles]
    );

    const existingArms = new Map(
      result.rows.map((row) => [
        row.display_style,
        createArm(
          row.display_style,
          Number(row.alpha),
          Number(row.beta),
          {
            totalImpressions: row.total_impressions,
            totalAdds: row.total_adds,
          }
        ),
      ])
    );

    // Create arms for styles that don't have data yet
    return enabledStyles.map(
      (style) =>
        existingArms.get(style) || createArm(style, 1, 1, { totalImpressions: 0, totalAdds: 0 })
    );
  }

  /**
   * Load product Thompson Sampling arms
   */
  private async loadProductArms(products: UpsellProduct[]): Promise<ThompsonArm[]> {
    const productIds = products.map((p) => p.id);

    const result = await query<{
      upsell_product_id: string;
      alpha: number;
      beta: number;
      total_impressions: number;
      total_adds: number;
    }>(
      `SELECT upsell_product_id, alpha, beta, total_impressions, total_adds
       FROM ml_product_arms
       WHERE shop_id = $1 AND upsell_product_id = ANY($2)`,
      [this.shopId, productIds]
    );

    const existingArms = new Map(
      result.rows.map((row) => [
        row.upsell_product_id,
        createArm(
          row.upsell_product_id,
          Number(row.alpha),
          Number(row.beta),
          {
            totalImpressions: row.total_impressions,
            totalAdds: row.total_adds,
          }
        ),
      ])
    );

    return products.map((product) => {
      const existingArm = existingArms.get(product.id);
      return (
        existingArm ||
        createArm(product.id, 1, 1, {
          product,
          totalImpressions: 0,
          totalAdds: 0,
        })
      );
    });
  }

  /**
   * Get enabled display styles for this shop
   */
  private async getEnabledDisplayStyles(): Promise<DisplayStyle[]> {
    const result = await query<{ settings: { enabled_display_styles?: string[] } }>(
      'SELECT settings FROM shops WHERE id = $1',
      [this.shopId]
    );

    if (result.rows.length === 0) {
      throw new Error('Shop not found');
    }

    const enabledStyles = result.rows[0]!.settings.enabled_display_styles;

    // If not set, return all display styles
    if (!enabledStyles || enabledStyles.length === 0) {
      return ['minimal-strip', 'list', 'banner', 'cards', 'frequently-bought'];
    }

    return enabledStyles as DisplayStyle[];
  }

  /**
   * Get product pool for this shop
   */
  private async getProductPool(): Promise<UpsellProduct[]> {
    const result = await query<UpsellProduct>(
      `SELECT * FROM upsell_products
       WHERE shop_id = $1 AND is_active = true
       ORDER BY priority DESC, created_at ASC`,
      [this.shopId]
    );

    return result.rows;
  }

  /**
   * Check if we need more data before exploiting
   */
  private async needsMoreData(): Promise<boolean> {
    const result = await query<{ total_decisions: number }>(
      'SELECT total_decisions FROM ml_model_state WHERE shop_id = $1',
      [this.shopId]
    );

    if (result.rows.length === 0) {
      return true; // No data yet
    }

    return result.rows[0]!.total_decisions < this.config.minSamplesForExploit;
  }

  /**
   * Get context bucket for cart
   */
  private getContextBucket(context: CartContext): string {
    const value = context.totalValue;

    if (value < 50) return '0-50';
    if (value < 100) return '50-100';
    if (value < 200) return '100-200';
    return '200+';
  }

  /**
   * Calculate confidence score for decision
   */
  private calculateConfidence(
    displayArm: ThompsonArm,
    scoredProducts: Array<{ score: number }>
  ): number {
    // Confidence based on:
    // 1. Display style sample size
    // 2. Product scores variance

    const displayConfidence = Math.min(
      (displayArm.metadata?.totalImpressions as number) / 1000,
      1
    );
    const scoreVariance = this.calculateVariance(scoredProducts.map((p) => p.score));
    const scoreConfidence = 1 - Math.min(scoreVariance, 1);

    return displayConfidence * 0.6 + scoreConfidence * 0.4;
  }

  /**
   * Calculate variance
   */
  private calculateVariance(numbers: number[]): number {
    if (numbers.length === 0) return 0;

    const mean = numbers.reduce((sum, n) => sum + n, 0) / numbers.length;
    const squaredDiffs = numbers.map((n) => Math.pow(n - mean, 2));
    return squaredDiffs.reduce((sum, d) => sum + d, 0) / numbers.length;
  }

  /**
   * Log decision for analysis and learning
   */
  private async logDecision(decision: MLDecision, context: CartContext): Promise<void> {
    await query(
      `INSERT INTO ml_decisions_log (
        shop_id, session_id, cart_snapshot, cart_value, cart_item_count,
        decision_type, selected_display_style, selected_products,
        reasoning, thompson_samples
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
      [
        this.shopId,
        context.sessionId,
        JSON.stringify(context.items),
        context.totalValue,
        context.itemCount,
        decision.decisionType,
        decision.displayStyle,
        JSON.stringify(decision.products),
        JSON.stringify(decision.reasoning),
        JSON.stringify(decision.reasoning.thompsonSamples),
      ]
    );

    // Update model state
    await query(
      `INSERT INTO ml_model_state (shop_id, total_decisions, ${decision.decisionType}_decisions)
       VALUES ($1, 1, 1)
       ON CONFLICT (shop_id)
       DO UPDATE SET
         total_decisions = ml_model_state.total_decisions + 1,
         ${decision.decisionType === 'explore' ? 'exploration' : 'exploitation'}_decisions =
           ml_model_state.${decision.decisionType === 'explore' ? 'exploration' : 'exploitation'}_decisions + 1`,
      [this.shopId]
    );
  }

  /**
   * Generate unique decision ID
   */
  private generateDecisionId(): string {
    return `dec_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Extract context from cart
   */
  static extractContext(
    cartItems: CartItem[],
    sessionId: string,
    customerId?: number
  ): CartContext {
    const totalValue = cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
    const itemCount = cartItems.reduce((sum, item) => sum + item.quantity, 0);

    const collections = Array.from(
      new Set(cartItems.map((item) => item.collection_id).filter(Boolean))
    ) as number[];

    const productTypes = Array.from(
      new Set(cartItems.map((item) => item.product_type).filter(Boolean))
    ) as string[];

    const hour = new Date().getHours();
    let timeOfDay: 'morning' | 'afternoon' | 'evening' | 'night';
    if (hour < 12) timeOfDay = 'morning';
    else if (hour < 17) timeOfDay = 'afternoon';
    else if (hour < 21) timeOfDay = 'evening';
    else timeOfDay = 'night';

    const dayOfWeek = new Date().getDay();

    return {
      items: cartItems,
      totalValue,
      itemCount,
      collections,
      productTypes,
      timeOfDay,
      dayOfWeek,
      sessionId,
      customerId,
    };
  }
}
