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
 * Store volume category (affects learning rate)
 */
export type StoreVolumeCategory = 'low' | 'medium' | 'high' | 'very_high';

/**
 * Customer segment
 */
export type CustomerSegment = 'new' | 'returning' | 'vip' | 'at_risk';

/**
 * Enhanced cart context for ML decisions with multi-factor analysis
 */
export interface CartContext {
  // Cart data
  items: CartItem[];
  totalValue: number;
  itemCount: number;
  collections: number[];
  productTypes: string[];

  // Time context
  timeOfDay: 'morning' | 'afternoon' | 'evening' | 'night';
  dayOfWeek: number;
  isWeekend: boolean;
  isHoliday: boolean;
  hour: number;

  // Customer context
  customerId?: number;
  customerSegment: CustomerSegment;
  customerLifetimeValue: number;
  isNewCustomer: boolean;
  previousOrderCount: number;

  // Session context
  sessionId: string;
  deviceType: 'mobile' | 'tablet' | 'desktop';
  trafficSource: string;
  pagesViewed: number;
  timeOnSite: number;

  // Store context
  storeVolume: StoreVolumeCategory;
  inventoryLevels?: Record<string, number>;
  seasonality?: string;
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
 * Volume-specific learning parameters
 */
interface VolumeLearningParams {
  explorationRate: number;
  minConfidenceThreshold: number;
  minSampleSize: number;
  learningRate: number;
}

/**
 * Statistical rigor configuration
 */
interface StatisticalConfig {
  minSampleSize: number;
  significanceLevel: number; // p-value threshold (default: 0.05)
  confidenceLevel: number; // confidence interval (default: 0.95)
  staleDaysThreshold: number; // days before data is considered stale
  minRecentDataPoints: number;
}

/**
 * ML Model configuration with adaptive learning and statistical rigor
 */
interface MLConfig {
  // Volume-adaptive parameters (will be overridden based on store volume)
  explorationRate: number;
  minSamplesForExploit: number;
  minConfidenceThreshold: number;

  // Context matching
  contextMatchingThreshold: number;
  recencyWeight: number;
  maxProductsToShow: number;

  // Statistical rigor
  statistical: StatisticalConfig;

  // Time-decay for old data
  timeDecayHalfLife: number; // days until data weight is halved

  // Volume-specific overrides
  volumeLearningParams: Record<StoreVolumeCategory, VolumeLearningParams>;
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

    // Volume-adaptive learning parameters (🔥 CRITICAL ENHANCEMENT #1)
    const volumeLearningParams: Record<StoreVolumeCategory, VolumeLearningParams> = {
      low: {
        explorationRate: 0.3, // 30% exploration - learn FAST
        minConfidenceThreshold: 0.6, // Lower confidence threshold
        minSampleSize: 20, // Small sample size needed
        learningRate: 1.5, // Fast learning
      },
      medium: {
        explorationRate: 0.2, // 20% exploration
        minConfidenceThreshold: 0.7,
        minSampleSize: 50,
        learningRate: 1.0,
      },
      high: {
        explorationRate: 0.15, // 15% exploration
        minConfidenceThreshold: 0.8,
        minSampleSize: 100,
        learningRate: 0.8,
      },
      very_high: {
        explorationRate: 0.1, // 10% exploration - learn CAREFULLY
        minConfidenceThreshold: 0.85, // High confidence threshold
        minSampleSize: 200, // Large sample size
        learningRate: 0.6, // Slower, more stable learning
      },
    };

    this.config = {
      explorationRate: config?.explorationRate ?? 0.2,
      minSamplesForExploit: config?.minSamplesForExploit ?? 100,
      minConfidenceThreshold: config?.minConfidenceThreshold ?? 0.7,
      contextMatchingThreshold: config?.contextMatchingThreshold ?? 0.7,
      recencyWeight: config?.recencyWeight ?? 0.3,
      maxProductsToShow: config?.maxProductsToShow ?? 3,
      timeDecayHalfLife: config?.timeDecayHalfLife ?? 30, // 30 days

      // Statistical rigor (🔥 CRITICAL ENHANCEMENT #4)
      statistical: {
        minSampleSize: config?.statistical?.minSampleSize ?? 30,
        significanceLevel: config?.statistical?.significanceLevel ?? 0.05, // p < 0.05
        confidenceLevel: config?.statistical?.confidenceLevel ?? 0.95,
        staleDaysThreshold: config?.statistical?.staleDaysThreshold ?? 30,
        minRecentDataPoints: config?.statistical?.minRecentDataPoints ?? 10,
        ...config?.statistical,
      },

      volumeLearningParams: config?.volumeLearningParams ?? volumeLearningParams,
    };
  }

  /**
   * Main decision function with 5-level bulletproof fallback hierarchy
   * (🔥 CRITICAL ENHANCEMENT #5)
   */
  async makeDecision(context: CartContext): Promise<MLDecision> {
    try {
      // Level 1: ML-optimized (high confidence)
      return await this.makeMLDecision(context);
    } catch (error) {
      console.error('ML decision failed, falling back:', error);

      try {
        // Level 2: Hybrid ML + rules
        return await this.makeHybridDecision(context);
      } catch (error2) {
        console.error('Hybrid decision failed, falling back:', error2);

        try {
          // Level 3: Simple collection matching
          return await this.makeCollectionMatchDecision(context);
        } catch (error3) {
          console.error('Collection match failed, falling back:', error3);

          try {
            // Level 4: Top performers
            return await this.makeTopPerformersDecision(context);
          } catch (error4) {
            console.error('Top performers failed, using emergency fallback:', error4);

            // Level 5: Emergency default (never fails)
            return this.makeEmergencyFallbackDecision(context);
          }
        }
      }
    }
  }

  /**
   * Level 1: Full ML-optimized decision with statistical rigor
   */
  private async makeMLDecision(context: CartContext): Promise<MLDecision> {
    // 1. Apply volume-adaptive parameters (🔥 CRITICAL ENHANCEMENT #1)
    const volumeParams = this.getVolumeAdaptiveParams(context.storeVolume);

    // 2. Decide: explore or exploit?
    const shouldExplore = Math.random() < volumeParams.explorationRate;

    // 3. Get enabled display styles for this shop
    const enabledStyles = await this.getEnabledDisplayStyles();

    // 4. Get product pool
    const productPool = await this.getProductPool();

    if (enabledStyles.length === 0 || productPool.length === 0) {
      throw new Error('No display styles or products configured');
    }

    // 5. Make decision based on mode
    let decision: MLDecision;

    if (shouldExplore || (await this.needsMoreData(volumeParams))) {
      decision = await this.explore(context, enabledStyles, productPool);
    } else {
      decision = await this.exploit(context, enabledStyles, productPool, volumeParams);
    }

    // 6. Validate statistical rigor (🔥 CRITICAL ENHANCEMENT #4)
    await this.validateStatisticalRigor(decision, volumeParams);

    // 7. Log decision for learning
    await this.logDecision(decision, context);

    return decision;
  }

  /**
   * Get volume-adaptive parameters for current store volume
   */
  private getVolumeAdaptiveParams(storeVolume: StoreVolumeCategory): VolumeLearningParams {
    return this.config.volumeLearningParams[storeVolume];
  }

  /**
   * EXPLOIT: Use what we know works best with volume-adaptive parameters
   * Select the mathematically optimal combination
   */
  private async exploit(
    context: CartContext,
    enabledStyles: DisplayStyle[],
    productPool: UpsellProduct[],
    volumeParams: VolumeLearningParams
  ): Promise<MLDecision> {
    // 1. Load Thompson Sampling state for display styles
    const displayArms = await this.loadDisplayArms(enabledStyles);

    // 2. Use Thompson Sampling to select best display style
    const { selectedArm: displayArm, samples: displaySamples } =
      this.thompsonEngine.selectArm(displayArms);

    const selectedDisplayStyle = displayArm.id as DisplayStyle;

    // 3. Load product arms
    const productArms = await this.loadProductArms(productPool);

    // 4. Score products using multi-factor context + Thompson Sampling
    // (🔥 CRITICAL ENHANCEMENT #2)
    const scoredProducts = await this.scoreProductsWithMultiFactorContext(
      productArms,
      context,
      selectedDisplayStyle,
      volumeParams
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
   * 🔥 CRITICAL ENHANCEMENT #2: Multi-Factor Context Scoring
   * Score products using Thompson Sampling + multi-factor contextual matching
   */
  private async scoreProductsWithMultiFactorContext(
    productArms: ThompsonArm[],
    context: CartContext,
    displayStyle: DisplayStyle,
    volumeParams: VolumeLearningParams
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

        // 2. Multi-factor context matching (0-1)
        const { score: contextScore, matches } = await this.getMultiFactorContextScore(
          product,
          context,
          displayStyle,
          contextBucket
        );

        // 3. Recency weight with time-decay (🔥 CRITICAL ENHANCEMENT #3)
        const recencyScore = await this.getRecencyScoreWithDecay(product.id, displayStyle);

        // 4. Customer segment matching (0-1)
        const segmentScore = await this.getCustomerSegmentScore(
          product,
          context.customerSegment,
          context.customerLifetimeValue
        );

        // 5. Time-of-day performance (0-1)
        const timeScore = await this.getTimePerformanceScore(
          product,
          displayStyle,
          context.timeOfDay,
          context.hour,
          context.isWeekend
        );

        // 6. Device-specific performance (0-1)
        const deviceScore = await this.getDevicePerformanceScore(
          product,
          displayStyle,
          context.deviceType
        );

        // 7. Combined score with volume-adaptive weighting
        const score =
          thompsonScore * 0.30 + // 30% from Thompson Sampling
          contextScore * 0.25 + // 25% from multi-factor context
          recencyScore * 0.20 + // 20% from recent performance
          segmentScore * 0.10 + // 10% from customer segment
          timeScore * 0.10 + // 10% from time performance
          deviceScore * 0.05; // 5% from device performance

        return {
          product,
          score: score * volumeParams.learningRate, // Apply volume-adaptive learning rate
          contextMatches: matches,
        };
      })
    );
  }

  /**
   * Legacy method for backward compatibility
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
   * 🔥 Multi-factor context scoring with time, customer, session, store data
   */
  private async getMultiFactorContextScore(
    product: UpsellProduct,
    context: CartContext,
    displayStyle: DisplayStyle,
    contextBucket: string
  ): Promise<{ score: number; matches: string[] }> {
    const matches: string[] = [];
    let totalScore = 0;
    let weightSum = 0;

    // 1. Cart value bucket matching (weight: 3)
    const cartResult = await this.getContextMatchingScore(product, context, displayStyle, contextBucket);
    totalScore += cartResult.score * 3;
    weightSum += 3;
    matches.push(...cartResult.matches);

    // 2. Time context (weight: 2)
    const timeContextScore = await this.getTimeContextPerformance(
      product,
      displayStyle,
      context.timeOfDay,
      context.isWeekend,
      context.isHoliday
    );
    totalScore += timeContextScore * 2;
    weightSum += 2;
    if (timeContextScore > 0.7) matches.push('strong_time_match');

    // 3. Customer type matching (weight: 2)
    const customerScore = await this.getCustomerContextPerformance(
      product,
      displayStyle,
      context.isNewCustomer,
      context.customerSegment
    );
    totalScore += customerScore * 2;
    weightSum += 2;
    if (customerScore > 0.7) matches.push('customer_segment_match');

    // 4. Device performance (weight: 1)
    const deviceContextScore = await this.getDeviceContextPerformance(
      product,
      displayStyle,
      context.deviceType
    );
    totalScore += deviceContextScore * 1;
    weightSum += 1;

    // Weighted average
    const finalScore = weightSum > 0 ? totalScore / weightSum : 0.5;

    return { score: finalScore, matches };
  }

  /**
   * Get time context performance
   */
  private async getTimeContextPerformance(
    product: UpsellProduct,
    displayStyle: DisplayStyle,
    timeOfDay: string,
    isWeekend: boolean,
    isHoliday: boolean
  ): Promise<number> {
    const result = await query<{ revenue_per_impression: number; impressions: number }>(
      `SELECT
        COALESCE(SUM(revenue) / NULLIF(SUM(impressions), 0), 0) as revenue_per_impression,
        SUM(impressions) as impressions
      FROM ml_combination_performance
      WHERE shop_id = $1
        AND display_style = $2
        AND $3 = ANY(product_ids)
        AND time_of_day = $4
        AND is_weekend = $5
        AND updated_at >= NOW() - INTERVAL '30 days'
        AND impressions > 5`,
      [this.shopId, displayStyle, product.shopify_product_id, timeOfDay, isWeekend]
    );

    if (!result.rows[0] || Number(result.rows[0].impressions) === 0) {
      return 0.5; // Neutral score if no data
    }

    return Math.min(Number(result.rows[0].revenue_per_impression) / 5, 1);
  }

  /**
   * Get customer context performance
   */
  private async getCustomerContextPerformance(
    product: UpsellProduct,
    displayStyle: DisplayStyle,
    isNewCustomer: boolean,
    customerSegment: CustomerSegment
  ): Promise<number> {
    const result = await query<{ revenue_per_impression: number; impressions: number }>(
      `SELECT
        COALESCE(SUM(revenue) / NULLIF(SUM(impressions), 0), 0) as revenue_per_impression,
        SUM(impressions) as impressions
      FROM ml_combination_performance
      WHERE shop_id = $1
        AND display_style = $2
        AND $3 = ANY(product_ids)
        AND customer_segment = $4
        AND updated_at >= NOW() - INTERVAL '30 days'
        AND impressions > 5`,
      [this.shopId, displayStyle, product.shopify_product_id, customerSegment]
    );

    if (!result.rows[0] || Number(result.rows[0].impressions) === 0) {
      return 0.5;
    }

    return Math.min(Number(result.rows[0].revenue_per_impression) / 5, 1);
  }

  /**
   * Get device context performance
   */
  private async getDeviceContextPerformance(
    product: UpsellProduct,
    displayStyle: DisplayStyle,
    deviceType: string
  ): Promise<number> {
    const result = await query<{ revenue_per_impression: number; impressions: number }>(
      `SELECT
        COALESCE(SUM(revenue) / NULLIF(SUM(impressions), 0), 0) as revenue_per_impression,
        SUM(impressions) as impressions
      FROM ml_combination_performance
      WHERE shop_id = $1
        AND display_style = $2
        AND $3 = ANY(product_ids)
        AND device_type = $4
        AND updated_at >= NOW() - INTERVAL '30 days'
        AND impressions > 5`,
      [this.shopId, displayStyle, product.shopify_product_id, deviceType]
    );

    if (!result.rows[0] || Number(result.rows[0].impressions) === 0) {
      return 0.5;
    }

    return Math.min(Number(result.rows[0].revenue_per_impression) / 5, 1);
  }

  /**
   * Get recency score with time-decay (🔥 CRITICAL ENHANCEMENT #3)
   */
  private async getRecencyScoreWithDecay(productId: string, displayStyle: DisplayStyle): Promise<number> {
    const result = await query<{
      revenue: number;
      impressions: number;
      days_ago: number;
    }>(
      `SELECT
        revenue,
        impressions,
        EXTRACT(DAY FROM NOW() - updated_at) as days_ago
      FROM ml_combination_performance
      WHERE shop_id = $1
        AND display_style = $2
        AND $3 = ANY(product_ids)
        AND updated_at >= NOW() - INTERVAL '90 days'
      ORDER BY updated_at DESC`,
      [this.shopId, displayStyle, productId]
    );

    if (result.rows.length === 0) {
      return 0.5;
    }

    // Apply exponential time decay: weight = exp(-days / halfLife)
    let weightedRevenue = 0;
    let weightedImpressions = 0;

    for (const row of result.rows) {
      const daysAgo = Number(row.days_ago);
      const weight = Math.exp(-daysAgo / this.config.timeDecayHalfLife);

      weightedRevenue += Number(row.revenue) * weight;
      weightedImpressions += Number(row.impressions) * weight;
    }

    if (weightedImpressions === 0) {
      return 0.5;
    }

    const revenuePerImpression = weightedRevenue / weightedImpressions;
    return Math.min(revenuePerImpression / 5, 1);
  }

  /**
   * Get customer segment score
   */
  private async getCustomerSegmentScore(
    product: UpsellProduct,
    segment: CustomerSegment,
    lifetimeValue: number
  ): Promise<number> {
    const result = await query<{ avg_acceptance_rate: number }>(
      `SELECT
        AVG(acceptance_rate) as avg_acceptance_rate
      FROM ml_combination_performance
      WHERE shop_id = $1
        AND $2 = ANY(product_ids)
        AND customer_segment = $3
        AND updated_at >= NOW() - INTERVAL '30 days'`,
      [this.shopId, product.shopify_product_id, segment]
    );

    if (!result.rows[0]) {
      // Default scoring based on segment
      const segmentDefaults: Record<CustomerSegment, number> = {
        vip: 0.8,
        returning: 0.6,
        new: 0.5,
        at_risk: 0.4,
      };
      return segmentDefaults[segment];
    }

    return Math.min(Number(result.rows[0].avg_acceptance_rate), 1);
  }

  /**
   * Get time performance score
   */
  private async getTimePerformanceScore(
    product: UpsellProduct,
    displayStyle: DisplayStyle,
    timeOfDay: string,
    hour: number,
    isWeekend: boolean
  ): Promise<number> {
    const result = await query<{ acceptance_rate: number }>(
      `SELECT
        AVG(acceptance_rate) as acceptance_rate
      FROM ml_combination_performance
      WHERE shop_id = $1
        AND display_style = $2
        AND $3 = ANY(product_ids)
        AND time_of_day = $4
        AND is_weekend = $5
        AND updated_at >= NOW() - INTERVAL '30 days'`,
      [this.shopId, displayStyle, product.shopify_product_id, timeOfDay, isWeekend]
    );

    return result.rows[0] ? Math.min(Number(result.rows[0].acceptance_rate), 1) : 0.5;
  }

  /**
   * Get device performance score
   */
  private async getDevicePerformanceScore(
    product: UpsellProduct,
    displayStyle: DisplayStyle,
    deviceType: string
  ): Promise<number> {
    const result = await query<{ acceptance_rate: number }>(
      `SELECT
        AVG(acceptance_rate) as acceptance_rate
      FROM ml_combination_performance
      WHERE shop_id = $1
        AND display_style = $2
        AND $3 = ANY(product_ids)
        AND device_type = $4
        AND updated_at >= NOW() - INTERVAL '30 days'`,
      [this.shopId, displayStyle, product.shopify_product_id, deviceType]
    );

    return result.rows[0] ? Math.min(Number(result.rows[0].acceptance_rate), 1) : 0.5;
  }

  /**
   * 🔥 CRITICAL ENHANCEMENT #4: Validate statistical rigor
   */
  private async validateStatisticalRigor(
    decision: MLDecision,
    volumeParams: VolumeLearningParams
  ): Promise<void> {
    // 1. Check minimum sample size
    const displayArm = await this.getDisplayArmData(decision.displayStyle);
    if (displayArm.totalImpressions < volumeParams.minSampleSize) {
      decision.reasoning.contextMatches.push('insufficient_sample_size');
      decision.confidence *= 0.7; // Reduce confidence
    }

    // 2. Check statistical significance
    const topProducts = decision.products.slice(0, 2);
    if (topProducts.length === 2) {
      const [prod1, prod2] = topProducts;
      const arm1 = await this.getProductArmData(prod1!.product.id);
      const arm2 = await this.getProductArmData(prod2!.product.id);

      if (arm1 && arm2) {
        const significance = this.thompsonEngine.calculateSignificance(arm1, arm2);
        if (!significance.significant) {
          decision.reasoning.contextMatches.push('not_statistically_significant');
          decision.confidence *= 0.85;
        }
      }
    }

    // 3. Check data recency
    const dataRecency = await this.checkDataRecency();
    if (dataRecency.staleDays > this.config.statistical.staleDaysThreshold) {
      decision.reasoning.contextMatches.push('stale_data');
      decision.confidence *= 0.8;
    }

    // 4. Confidence interval check
    if (decision.confidence < volumeParams.minConfidenceThreshold) {
      throw new Error('Confidence below threshold - falling back');
    }
  }

  /**
   * Get display arm data for validation
   */
  private async getDisplayArmData(displayStyle: DisplayStyle): Promise<{
    totalImpressions: number;
    totalAdds: number;
  }> {
    const result = await query<{ total_impressions: number; total_adds: number }>(
      `SELECT total_impressions, total_adds
       FROM ml_display_arms
       WHERE shop_id = $1 AND display_style = $2`,
      [this.shopId, displayStyle]
    );

    return result.rows[0] || { totalImpressions: 0, totalAdds: 0 };
  }

  /**
   * Get product arm data for validation
   */
  private async getProductArmData(productId: string): Promise<ThompsonArm | null> {
    const result = await query<{
      alpha: number;
      beta: number;
      total_impressions: number;
      total_adds: number;
    }>(
      `SELECT alpha, beta, total_impressions, total_adds
       FROM ml_product_arms
       WHERE shop_id = $1 AND upsell_product_id = $2`,
      [this.shopId, productId]
    );

    if (!result.rows[0]) return null;

    const row = result.rows[0];
    return createArm(productId, Number(row.alpha), Number(row.beta), {
      totalImpressions: row.total_impressions,
      totalAdds: row.total_adds,
    });
  }

  /**
   * Check data recency
   */
  private async checkDataRecency(): Promise<{ staleDays: number; recentCount: number }> {
    const result = await query<{ days_since_update: number; recent_count: number }>(
      `SELECT
        EXTRACT(DAY FROM NOW() - MAX(updated_at)) as days_since_update,
        COUNT(*) FILTER (WHERE updated_at >= NOW() - INTERVAL '7 days') as recent_count
      FROM ml_combination_performance
      WHERE shop_id = $1`,
      [this.shopId]
    );

    return {
      staleDays: result.rows[0] ? Number(result.rows[0].days_since_update) : 999,
      recentCount: result.rows[0] ? Number(result.rows[0].recent_count) : 0,
    };
  }

  /**
   * 🔥 FALLBACK LEVEL 2: Hybrid ML + Rules
   */
  private async makeHybridDecision(context: CartContext): Promise<MLDecision> {
    const enabledStyles = await this.getEnabledDisplayStyles();
    const productPool = await this.getProductPool();

    // Use simple rule-based selection with basic ML scoring
    const displayStyle = enabledStyles[0] || 'cards';

    // Get products that match cart collections
    const matchingProducts = productPool.filter((p) =>
      context.collections.some((c) => p.collection_ids?.includes(c))
    );

    const selectedProducts = (matchingProducts.length > 0 ? matchingProducts : productPool)
      .slice(0, this.config.maxProductsToShow)
      .map((product, index) => ({
        product,
        position: index + 1,
        score: 0.6,
      }));

    return {
      displayStyle,
      products: selectedProducts,
      decisionType: 'exploit',
      reasoning: {
        displayStyleScores: { [displayStyle]: 0.6 },
        productScores: Object.fromEntries(selectedProducts.map((p) => [p.product.id, 0.6])),
        contextMatches: ['hybrid_fallback', 'collection_match'],
        thompsonSamples: [],
      },
      decisionId: this.generateDecisionId(),
      confidence: 0.6,
    };
  }

  /**
   * 🔥 FALLBACK LEVEL 3: Simple Collection Matching
   */
  private async makeCollectionMatchDecision(context: CartContext): Promise<MLDecision> {
    const productPool = await this.getProductPool();

    // Match products by collection
    const matchingProducts = productPool.filter((p) =>
      context.collections.some((c) => p.collection_ids?.includes(c))
    );

    const selectedProducts = (matchingProducts.length > 0 ? matchingProducts : productPool)
      .slice(0, this.config.maxProductsToShow)
      .map((product, index) => ({
        product,
        position: index + 1,
        score: 0.5,
      }));

    return {
      displayStyle: 'cards',
      products: selectedProducts,
      decisionType: 'exploit',
      reasoning: {
        displayStyleScores: { cards: 0.5 },
        productScores: Object.fromEntries(selectedProducts.map((p) => [p.product.id, 0.5])),
        contextMatches: ['collection_fallback'],
        thompsonSamples: [],
      },
      decisionId: this.generateDecisionId(),
      confidence: 0.5,
    };
  }

  /**
   * 🔥 FALLBACK LEVEL 4: Top Performers
   */
  private async makeTopPerformersDecision(context: CartContext): Promise<MLDecision> {
    // Get historically top-performing products
    const result = await query<{ shopify_product_id: string; revenue: number }>(
      `SELECT
        UNNEST(product_ids) as shopify_product_id,
        SUM(revenue) as revenue
      FROM ml_combination_performance
      WHERE shop_id = $1
        AND updated_at >= NOW() - INTERVAL '90 days'
      GROUP BY shopify_product_id
      ORDER BY revenue DESC
      LIMIT $2`,
      [this.shopId, this.config.maxProductsToShow]
    );

    const productPool = await this.getProductPool();
    const topPerformerIds = new Set(result.rows.map((r) => r.shopify_product_id));

    const selectedProducts = productPool
      .filter((p) => topPerformerIds.has(p.shopify_product_id))
      .slice(0, this.config.maxProductsToShow)
      .map((product, index) => ({
        product,
        position: index + 1,
        score: 0.4,
      }));

    // If no top performers, use first N products
    if (selectedProducts.length === 0) {
      selectedProducts.push(
        ...productPool.slice(0, this.config.maxProductsToShow).map((product, index) => ({
          product,
          position: index + 1,
          score: 0.4,
        }))
      );
    }

    return {
      displayStyle: 'cards',
      products: selectedProducts,
      decisionType: 'exploit',
      reasoning: {
        displayStyleScores: { cards: 0.4 },
        productScores: Object.fromEntries(selectedProducts.map((p) => [p.product.id, 0.4])),
        contextMatches: ['top_performers_fallback'],
        thompsonSamples: [],
      },
      decisionId: this.generateDecisionId(),
      confidence: 0.4,
    };
  }

  /**
   * 🔥 FALLBACK LEVEL 5: Emergency Default (NEVER FAILS)
   */
  private makeEmergencyFallbackDecision(context: CartContext): MLDecision {
    // Absolute last resort - return something, anything
    const dummyProduct = {
      id: 'emergency_fallback',
      shop_id: this.shopId,
      shopify_product_id: 'fallback',
      title: 'Emergency Fallback Product',
      price: '0',
      image_url: null,
      is_active: true,
      priority: 0,
      collection_ids: [],
      trigger_collections: [],
      created_at: new Date(),
      updated_at: new Date(),
    };

    return {
      displayStyle: 'cards',
      products: [
        {
          product: dummyProduct,
          position: 1,
          score: 0.1,
        },
      ],
      decisionType: 'explore',
      reasoning: {
        displayStyleScores: { cards: 0.1 },
        productScores: { [dummyProduct.id]: 0.1 },
        contextMatches: ['emergency_fallback'],
        thompsonSamples: [],
      },
      decisionId: this.generateDecisionId(),
      confidence: 0.1,
    };
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
   * Check if we need more data before exploiting (volume-adaptive)
   */
  private async needsMoreData(volumeParams: VolumeLearningParams): Promise<boolean> {
    const result = await query<{ total_decisions: number }>(
      'SELECT total_decisions FROM ml_model_state WHERE shop_id = $1',
      [this.shopId]
    );

    if (result.rows.length === 0) {
      return true; // No data yet
    }

    // Use volume-specific minimum sample size
    return result.rows[0]!.total_decisions < volumeParams.minSampleSize;
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
   * Extract enhanced multi-factor context from cart
   * (🔥 CRITICAL ENHANCEMENT #2: Multi-Factor Context)
   */
  static extractContext(
    cartItems: CartItem[],
    sessionId: string,
    options: {
      customerId?: number;
      customerSegment?: CustomerSegment;
      customerLifetimeValue?: number;
      isNewCustomer?: boolean;
      previousOrderCount?: number;
      deviceType?: 'mobile' | 'tablet' | 'desktop';
      trafficSource?: string;
      pagesViewed?: number;
      timeOnSite?: number;
      storeVolume?: StoreVolumeCategory;
      inventoryLevels?: Record<string, number>;
      seasonality?: string;
    } = {}
  ): CartContext {
    const totalValue = cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
    const itemCount = cartItems.reduce((sum, item) => sum + item.quantity, 0);

    const collections = Array.from(
      new Set(cartItems.map((item) => item.collection_id).filter(Boolean))
    ) as number[];

    const productTypes = Array.from(
      new Set(cartItems.map((item) => item.product_type).filter(Boolean))
    ) as string[];

    // Time context
    const now = new Date();
    const hour = now.getHours();
    let timeOfDay: 'morning' | 'afternoon' | 'evening' | 'night';
    if (hour < 12) timeOfDay = 'morning';
    else if (hour < 17) timeOfDay = 'afternoon';
    else if (hour < 21) timeOfDay = 'evening';
    else timeOfDay = 'night';

    const dayOfWeek = now.getDay();
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;

    // Check if today is a holiday (simple US holidays check)
    const isHoliday = this.checkIfHoliday(now);

    // Customer context - with smart defaults
    const customerSegment = options.customerSegment || (options.isNewCustomer ? 'new' : 'returning');
    const customerLifetimeValue = options.customerLifetimeValue || 0;
    const isNewCustomer = options.isNewCustomer ?? true;
    const previousOrderCount = options.previousOrderCount || 0;

    // Session context - with smart defaults based on user agent
    const deviceType = options.deviceType || this.detectDeviceType();
    const trafficSource = options.trafficSource || 'direct';
    const pagesViewed = options.pagesViewed || 1;
    const timeOnSite = options.timeOnSite || 0;

    // Store context - with smart defaults
    const storeVolume = options.storeVolume || this.calculateStoreVolume(totalValue, itemCount);

    return {
      // Cart data
      items: cartItems,
      totalValue,
      itemCount,
      collections,
      productTypes,

      // Time context
      timeOfDay,
      dayOfWeek,
      isWeekend,
      isHoliday,
      hour,

      // Customer context
      customerId: options.customerId,
      customerSegment,
      customerLifetimeValue,
      isNewCustomer,
      previousOrderCount,

      // Session context
      sessionId,
      deviceType,
      trafficSource,
      pagesViewed,
      timeOnSite,

      // Store context
      storeVolume,
      inventoryLevels: options.inventoryLevels,
      seasonality: options.seasonality,
    };
  }

  /**
   * Check if date is a major holiday
   */
  private static checkIfHoliday(date: Date): boolean {
    const month = date.getMonth() + 1; // 1-12
    const day = date.getDate();

    // Major US shopping holidays
    const holidays = [
      { month: 1, day: 1 }, // New Year's Day
      { month: 2, day: 14 }, // Valentine's Day
      { month: 7, day: 4 }, // Independence Day
      { month: 10, day: 31 }, // Halloween
      { month: 11, day: 11 }, // Veterans Day
      { month: 12, day: 25 }, // Christmas
      { month: 12, day: 26 }, // Boxing Day
    ];

    // Black Friday (4th Friday of November) - approximate
    if (month === 11 && day >= 23 && day <= 29 && date.getDay() === 5) {
      return true;
    }

    // Cyber Monday (Monday after Black Friday)
    if (month === 11 && day >= 26 && day <= 30 && date.getDay() === 1) {
      return true;
    }

    return holidays.some((h) => h.month === month && h.day === day);
  }

  /**
   * Detect device type from user agent (server-side detection)
   */
  private static detectDeviceType(): 'mobile' | 'tablet' | 'desktop' {
    // Default to desktop if we can't detect
    // In production, this would use actual user agent detection
    return 'desktop';
  }

  /**
   * Calculate store volume category based on current activity
   */
  private static calculateStoreVolume(
    cartValue: number,
    itemCount: number
  ): StoreVolumeCategory {
    // Simple heuristic - in production, this would query actual order volume
    if (cartValue > 1000 || itemCount > 10) {
      return 'high';
    } else if (cartValue > 500 || itemCount > 5) {
      return 'medium';
    } else {
      return 'low';
    }
  }
}
