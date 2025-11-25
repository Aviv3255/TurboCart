/**
 * TurboCart ML Learning Engine
 *
 * Continuously updates the ML model based on observed outcomes:
 * - Updates Thompson Sampling parameters (alpha/beta)
 * - Learns context patterns
 * - Detects performance trends
 * - Calculates statistical significance
 *
 * This runs after every event (impression, click, add, purchase)
 */

import { query } from '../db';
import { thompsonSampling } from './thompson-sampling';

/**
 * Event outcome for learning
 */
export interface EventOutcome {
  shopId: string;
  sessionId: string;
  eventType: 'impression' | 'click' | 'add' | 'purchase';
  displayStyle: string;
  productIds: number[];
  productPositions: Record<number, number>;
  revenue?: number;
  cartValue: number;
  cartItemCount: number;
  timeOfDay: string;
  dayOfWeek: number;
  decisionId?: string;
}

/**
 * ML Learning Engine
 */
export class MLLearningEngine {
  private shopId: string;

  constructor(shopId: string) {
    this.shopId = shopId;
  }

  /**
   * Learn from an event outcome
   * This is called after EVERY tracked event
   */
  async learnFromEvent(outcome: EventOutcome): Promise<void> {
    try {
      // 1. Update display style arm
      await this.updateDisplayStyleArm(outcome);

      // 2. Update product arms
      await this.updateProductArms(outcome);

      // 3. Update combination performance
      await this.updateCombinationPerformance(outcome);

      // 4. Update decision log with outcome
      if (outcome.decisionId) {
        await this.updateDecisionOutcome(outcome);
      }

      // 5. Detect and learn patterns (async, don't wait)
      this.learnContextPatterns(outcome).catch((err) =>
        console.error('Error learning context patterns:', err)
      );
    } catch (error) {
      console.error('Error in ML learning:', error);
      // Don't throw - learning failures shouldn't break user experience
    }
  }

  /**
   * Update Thompson Sampling parameters for display style
   */
  private async updateDisplayStyleArm(outcome: EventOutcome): Promise<void> {
    // Define what counts as "success" for different event types
    const isSuccess = outcome.eventType === 'add' || outcome.eventType === 'purchase';

    // Calculate reward (for revenue-based optimization)
    const reward = outcome.revenue || 0;
    const maxReward = 100; // Normalize based on typical max upsell value

    // Get current arm state
    const current = await query<{
      alpha: number;
      beta: number;
      total_impressions: number;
      total_adds: number;
      total_revenue: number;
    }>(
      `SELECT alpha, beta, total_impressions, total_adds, total_revenue
       FROM ml_display_arms
       WHERE shop_id = $1 AND display_style = $2`,
      [this.shopId, outcome.displayStyle]
    );

    let alpha = 1.0;
    let beta = 1.0;
    let totalImpressions = 0;
    let totalAdds = 0;
    let totalRevenue = 0;

    if (current.rows.length > 0) {
      alpha = Number(current.rows[0]!.alpha);
      beta = Number(current.rows[0]!.beta);
      totalImpressions = current.rows[0]!.total_impressions;
      totalAdds = current.rows[0]!.total_adds;
      totalRevenue = Number(current.rows[0]!.total_revenue);
    }

    // Update based on event type
    if (outcome.eventType === 'impression') {
      totalImpressions++;
    } else if (outcome.eventType === 'add') {
      totalAdds++;
      alpha += 1; // Success
    } else if (outcome.eventType === 'purchase') {
      // Purchase is a strong success signal
      alpha += Math.min(reward / maxReward, 1);
      totalRevenue += reward;
    } else {
      // Click without add is a partial failure
      beta += 0.5;
    }

    // Calculate derived metrics
    const revenuePerImpression = totalImpressions > 0 ? totalRevenue / totalImpressions : 0;
    const acceptanceRate = totalImpressions > 0 ? totalAdds / totalImpressions : 0;

    // Update or insert
    await query(
      `INSERT INTO ml_display_arms (
        shop_id, display_style, alpha, beta,
        total_impressions, total_adds, total_revenue,
        revenue_per_impression, acceptance_rate, sample_size
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $5)
      ON CONFLICT (shop_id, display_style)
      DO UPDATE SET
        alpha = $3,
        beta = $4,
        total_impressions = $5,
        total_adds = $6,
        total_revenue = $7,
        revenue_per_impression = $8,
        acceptance_rate = $9,
        sample_size = $5,
        last_updated_at = NOW()`,
      [
        this.shopId,
        outcome.displayStyle,
        alpha,
        beta,
        totalImpressions,
        totalAdds,
        totalRevenue,
        revenuePerImpression,
        acceptanceRate,
      ]
    );
  }

  /**
   * Update Thompson Sampling parameters for products
   */
  private async updateProductArms(outcome: EventOutcome): Promise<void> {
    for (const productId of outcome.productIds) {
      const position = outcome.productPositions[productId] || 1;

      // Get upsell_product_id
      const productResult = await query<{ id: string }>(
        'SELECT id FROM upsell_products WHERE shop_id = $1 AND shopify_product_id = $2',
        [this.shopId, productId]
      );

      if (productResult.rows.length === 0) continue;

      const upsellProductId = productResult.rows[0]!.id;

      // Get current arm state
      const current = await query<{
        alpha: number;
        beta: number;
        total_impressions: number;
        total_adds: number;
        total_revenue: number;
        position_performance: Record<
          string,
          { impressions: number; adds: number; revenue: number }
        >;
      }>(
        `SELECT alpha, beta, total_impressions, total_adds, total_revenue, position_performance
         FROM ml_product_arms
         WHERE shop_id = $1 AND upsell_product_id = $2`,
        [this.shopId, upsellProductId]
      );

      let alpha = 1.0;
      let beta = 1.0;
      let totalImpressions = 0;
      let totalAdds = 0;
      let totalRevenue = 0;
      let positionPerformance: Record<
        string,
        { impressions: number; adds: number; revenue: number }
      > = {
        '1': { impressions: 0, adds: 0, revenue: 0 },
        '2': { impressions: 0, adds: 0, revenue: 0 },
        '3': { impressions: 0, adds: 0, revenue: 0 },
      };

      if (current.rows.length > 0) {
        alpha = Number(current.rows[0]!.alpha);
        beta = Number(current.rows[0]!.beta);
        totalImpressions = current.rows[0]!.total_impressions;
        totalAdds = current.rows[0]!.total_adds;
        totalRevenue = Number(current.rows[0]!.total_revenue);
        positionPerformance = current.rows[0]!.position_performance;
      }

      // Update based on event type
      if (outcome.eventType === 'impression') {
        totalImpressions++;
        positionPerformance[position.toString()].impressions++;
      } else if (outcome.eventType === 'add') {
        totalAdds++;
        alpha += 1;
        positionPerformance[position.toString()].adds++;
      } else if (outcome.eventType === 'purchase') {
        const revenue = outcome.revenue || 0;
        alpha += Math.min(revenue / 100, 1);
        totalRevenue += revenue;
        positionPerformance[position.toString()].revenue += revenue;
      } else {
        beta += 0.5;
      }

      // Calculate metrics
      const conversionRate = totalImpressions > 0 ? totalAdds / totalImpressions : 0;
      const revenuePerImpression = totalImpressions > 0 ? totalRevenue / totalImpressions : 0;
      const confidenceScore = Math.min(totalImpressions / 1000, 1);

      // Update or insert
      await query(
        `INSERT INTO ml_product_arms (
          shop_id, upsell_product_id, alpha, beta,
          total_impressions, total_adds, total_revenue,
          position_performance, conversion_rate,
          revenue_per_impression, confidence_score
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
        ON CONFLICT (shop_id, upsell_product_id)
        DO UPDATE SET
          alpha = $3,
          beta = $4,
          total_impressions = $5,
          total_adds = $6,
          total_revenue = $7,
          position_performance = $8,
          conversion_rate = $9,
          revenue_per_impression = $10,
          confidence_score = $11,
          last_updated_at = NOW()`,
        [
          this.shopId,
          upsellProductId,
          alpha,
          beta,
          totalImpressions,
          totalAdds,
          totalRevenue,
          JSON.stringify(positionPerformance),
          conversionRate,
          revenuePerImpression,
          confidenceScore,
        ]
      );
    }
  }

  /**
   * Update combination performance
   * Tracks specific [display style + products + context] combinations
   */
  private async updateCombinationPerformance(outcome: EventOutcome): Promise<void> {
    const cartValueBucket = this.getCartValueBucket(outcome.cartValue);
    const cartItemCountBucket = this.getCartItemCountBucket(outcome.cartItemCount);

    // Find or create combination record
    const result = await query<{
      id: string;
      impressions: number;
      clicks: number;
      adds: number;
      revenue: number;
      alpha: number;
      beta: number;
    }>(
      `SELECT id, impressions, clicks, adds, revenue, alpha, beta
       FROM ml_combination_performance
       WHERE shop_id = $1
         AND display_style = $2
         AND product_ids = $3
         AND cart_value_bucket = $4
         AND cart_item_count_bucket = $5
         AND time_of_day = $6
         AND day_of_week = $7
       LIMIT 1`,
      [
        this.shopId,
        outcome.displayStyle,
        outcome.productIds,
        cartValueBucket,
        cartItemCountBucket,
        outcome.timeOfDay,
        outcome.dayOfWeek,
      ]
    );

    let impressions = 0;
    let clicks = 0;
    let adds = 0;
    let revenue = 0;
    let alpha = 1.0;
    let beta = 1.0;

    if (result.rows.length > 0) {
      impressions = result.rows[0]!.impressions;
      clicks = result.rows[0]!.clicks;
      adds = result.rows[0]!.adds;
      revenue = Number(result.rows[0]!.revenue);
      alpha = Number(result.rows[0]!.alpha);
      beta = Number(result.rows[0]!.beta);
    }

    // Update counts
    if (outcome.eventType === 'impression') {
      impressions++;
    } else if (outcome.eventType === 'click') {
      clicks++;
    } else if (outcome.eventType === 'add') {
      adds++;
      alpha += 1;
    } else if (outcome.eventType === 'purchase') {
      revenue += outcome.revenue || 0;
      alpha += Math.min((outcome.revenue || 0) / 100, 1);
    }

    // Calculate metrics
    const revenuePerImpression = impressions > 0 ? revenue / impressions : 0;
    const acceptanceRate = impressions > 0 ? adds / impressions : 0;
    const ctr = impressions > 0 ? clicks / impressions : 0;

    // Create product order array (position for each product)
    const productOrder = outcome.productIds.map((id) => outcome.productPositions[id] || 1);

    // Insert or update
    await query(
      `INSERT INTO ml_combination_performance (
        shop_id, display_style, product_ids, product_order,
        cart_value_bucket, cart_item_count_bucket, time_of_day, day_of_week,
        impressions, clicks, adds, revenue,
        revenue_per_impression, acceptance_rate, ctr,
        alpha, beta, last_shown_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, NOW())
      ON CONFLICT (shop_id, display_style, product_ids, cart_value_bucket, cart_item_count_bucket, time_of_day, day_of_week)
      DO UPDATE SET
        impressions = $9,
        clicks = $10,
        adds = $11,
        revenue = $12,
        revenue_per_impression = $13,
        acceptance_rate = $14,
        ctr = $15,
        alpha = $16,
        beta = $17,
        last_shown_at = NOW(),
        updated_at = NOW()`,
      [
        this.shopId,
        outcome.displayStyle,
        outcome.productIds,
        productOrder,
        cartValueBucket,
        cartItemCountBucket,
        outcome.timeOfDay,
        outcome.dayOfWeek,
        impressions,
        clicks,
        adds,
        revenue,
        revenuePerImpression,
        acceptanceRate,
        ctr,
        alpha,
        beta,
      ]
    );
  }

  /**
   * Update decision log with outcome
   */
  private async updateDecisionOutcome(outcome: EventOutcome): Promise<void> {
    await query(
      `UPDATE ml_decisions_log
       SET outcome = $1,
           outcome_revenue = $2,
           outcome_recorded_at = NOW()
       WHERE shop_id = $3 AND session_id = $4
       ORDER BY created_at DESC
       LIMIT 1`,
      [outcome.eventType, outcome.revenue || null, this.shopId, outcome.sessionId]
    );
  }

  /**
   * Learn context patterns
   * Identifies which contexts lead to best performance
   */
  private async learnContextPatterns(outcome: EventOutcome): Promise<void> {
    // Only learn from successes (adds/purchases)
    if (outcome.eventType !== 'add' && outcome.eventType !== 'purchase') {
      return;
    }

    // Pattern: Cart value range performance
    const cartValueBucket = this.getCartValueBucket(outcome.cartValue);

    await this.updateContextPattern(
      'cart_value_range',
      { range: cartValueBucket },
      outcome
    );

    // Pattern: Time of day performance
    await this.updateContextPattern(
      'time_pattern',
      { time: outcome.timeOfDay, day: outcome.dayOfWeek },
      outcome
    );
  }

  /**
   * Update a specific context pattern
   */
  private async updateContextPattern(
    patternType: string,
    patternDef: Record<string, unknown>,
    outcome: EventOutcome
  ): Promise<void> {
    const result = await query<{
      occurrences: number;
      total_revenue: number;
      avg_acceptance_rate: number;
    }>(
      `SELECT occurrences, total_revenue, avg_acceptance_rate
       FROM ml_context_patterns
       WHERE shop_id = $1
         AND pattern_type = $2
         AND pattern_definition = $3`,
      [this.shopId, patternType, JSON.stringify(patternDef)]
    );

    let occurrences = 0;
    let totalRevenue = 0;
    let avgAcceptanceRate = 0;

    if (result.rows.length > 0) {
      occurrences = result.rows[0]!.occurrences;
      totalRevenue = Number(result.rows[0]!.total_revenue);
      avgAcceptanceRate = Number(result.rows[0]!.avg_acceptance_rate);
    }

    occurrences++;
    totalRevenue += outcome.revenue || 0;

    // Update acceptance rate (exponential moving average)
    const newSuccess = outcome.eventType === 'add' ? 1 : 0;
    avgAcceptanceRate = avgAcceptanceRate * 0.9 + newSuccess * 0.1;

    // Calculate confidence
    const confidenceLevel = Math.min(occurrences / 1000, 1);

    await query(
      `INSERT INTO ml_context_patterns (
        shop_id, pattern_type, pattern_definition,
        occurrences, total_revenue, avg_acceptance_rate,
        confidence_level, best_display_style, best_display_style_revenue
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      ON CONFLICT (shop_id, pattern_type, pattern_definition)
      DO UPDATE SET
        occurrences = $4,
        total_revenue = $5,
        avg_acceptance_rate = $6,
        confidence_level = $7,
        best_display_style = $8,
        best_display_style_revenue = $9,
        last_calculated_at = NOW()`,
      [
        this.shopId,
        patternType,
        JSON.stringify(patternDef),
        occurrences,
        totalRevenue,
        avgAcceptanceRate,
        confidenceLevel,
        outcome.displayStyle,
        (outcome.revenue || 0) / occurrences,
      ]
    );
  }

  /**
   * Run periodic optimization
   * Called by a cron job to analyze performance and adjust parameters
   */
  async runPeriodicOptimization(): Promise<void> {
    // 1. Calculate overall improvement
    await this.calculateImprovement();

    // 2. Identify underperforming arms
    await this.identifyUnderperformers();

    // 3. Update exploration needs
    await this.updateExplorationNeeds();

    // 4. Clean up old data
    await this.cleanupOldData();
  }

  /**
   * Calculate improvement metrics
   */
  private async calculateImprovement(): Promise<void> {
    // Get baseline (first 100 decisions)
    const baselineResult = await query<{ avg_revenue: number }>(
      `SELECT AVG(outcome_revenue) as avg_revenue
       FROM (
         SELECT outcome_revenue
         FROM ml_decisions_log
         WHERE shop_id = $1 AND outcome IS NOT NULL
         ORDER BY created_at ASC
         LIMIT 100
       ) baseline`,
      [this.shopId]
    );

    // Get current performance (last 100 decisions)
    const currentResult = await query<{ avg_revenue: number }>(
      `SELECT AVG(outcome_revenue) as avg_revenue
       FROM (
         SELECT outcome_revenue
         FROM ml_decisions_log
         WHERE shop_id = $1 AND outcome IS NOT NULL
         ORDER BY created_at DESC
         LIMIT 100
       ) current`,
      [this.shopId]
    );

    const baseline = Number(baselineResult.rows[0]?.avg_revenue) || 0;
    const current = Number(currentResult.rows[0]?.avg_revenue) || 0;
    const improvement = baseline > 0 ? ((current - baseline) / baseline) * 100 : 0;

    // Update model state
    await query(
      `UPDATE ml_model_state
       SET baseline_revenue_per_order = $1,
           current_revenue_per_order = $2,
           improvement_percentage = $3,
           last_trained_at = NOW()
       WHERE shop_id = $4`,
      [baseline, current, improvement, this.shopId]
    );
  }

  /**
   * Identify underperforming options
   */
  private async identifyUnderperformers(): Promise<void> {
    // Find display styles with low performance
    await query(
      `UPDATE ml_display_arms
       SET alpha = GREATEST(alpha * 0.9, 1),
           beta = GREATEST(beta * 0.9, 1)
       WHERE shop_id = $1
         AND total_impressions > 100
         AND revenue_per_impression < (
           SELECT AVG(revenue_per_impression) * 0.5
           FROM ml_display_arms
           WHERE shop_id = $1
         )`,
      [this.shopId]
    );
  }

  /**
   * Update exploration needs
   */
  private async updateExplorationNeeds(): Promise<void> {
    // Mark combinations that need more exploration
    await query(
      `UPDATE ml_exploration_tracker
       SET needs_more_exploration = (times_explored < min_exploration_count)
       WHERE shop_id = $1`,
      [this.shopId]
    );
  }

  /**
   * Clean up old data
   */
  private async cleanupOldData(): Promise<void> {
    // Delete decision logs older than 90 days
    await query(
      `DELETE FROM ml_decisions_log
       WHERE shop_id = $1
         AND created_at < NOW() - INTERVAL '90 days'`,
      [this.shopId]
    );

    // Archive old combination performance with low impressions
    await query(
      `DELETE FROM ml_combination_performance
       WHERE shop_id = $1
         AND impressions < 5
         AND updated_at < NOW() - INTERVAL '30 days'`,
      [this.shopId]
    );
  }

  /**
   * Helper: Get cart value bucket
   */
  private getCartValueBucket(value: number): string {
    if (value < 50) return '0-50';
    if (value < 100) return '50-100';
    if (value < 200) return '100-200';
    return '200+';
  }

  /**
   * Helper: Get cart item count bucket
   */
  private getCartItemCountBucket(count: number): string {
    if (count === 1) return '1';
    if (count <= 3) return '2-3';
    if (count <= 5) return '4-5';
    return '6+';
  }
}

/**
 * Quick helper to learn from event
 */
export async function learnFromEvent(outcome: EventOutcome): Promise<void> {
  const engine = new MLLearningEngine(outcome.shopId);
  await engine.learnFromEvent(outcome);
}
