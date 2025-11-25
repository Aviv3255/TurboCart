/**
 * Background ML Optimization System
 * (🔥 CRITICAL ENHANCEMENT #3: Continuous Background Optimization)
 *
 * This system runs hourly to:
 * - Analyze recent performance data
 * - Detect new patterns and trends
 * - Apply time-decay to old data
 * - Rebalance Thompson Sampling parameters
 * - Auto-adjust learning rates based on volume
 * - Detect and flag anomalies
 */

import { query } from '../db';
import { ThompsonSamplingEngine, type ThompsonArm, createArm } from './thompson-sampling';
import type { DisplayStyle, StoreVolumeCategory } from './optimization-engine';

/**
 * Optimization insights from analysis
 */
export interface OptimizationInsights {
  shopId: string;
  timestamp: Date;

  // Volume analysis
  storeVolume: StoreVolumeCategory;
  ordersPerDay: number;
  avgCartValue: number;

  // Performance trends
  topDisplayStyles: Array<{ style: DisplayStyle; revenue: number; conversionRate: number }>;
  topProducts: Array<{ productId: string; revenue: number; acceptanceRate: number }>;

  // Pattern detection
  timePatterns: Array<{ timeOfDay: string; performance: number }>;
  customerSegmentPatterns: Array<{ segment: string; performance: number }>;
  devicePatterns: Array<{ device: string; performance: number }>;

  // Data health
  dataFreshness: {
    lastUpdate: Date;
    staleDays: number;
    recentDataPoints: number;
  };

  // Recommendations
  recommendations: string[];
}

/**
 * Background Optimization Job Result
 */
export interface OptimizationJobResult {
  success: boolean;
  shopId: string;
  insights: OptimizationInsights;
  updatedArms: number;
  decayedRecords: number;
  errors: string[];
}

/**
 * Background ML Optimizer
 */
export class BackgroundMLOptimizer {
  private thompsonEngine: ThompsonSamplingEngine;

  constructor() {
    this.thompsonEngine = new ThompsonSamplingEngine();
  }

  /**
   * Run optimization for all active shops
   */
  async optimizeAllShops(): Promise<OptimizationJobResult[]> {
    const shops = await this.getActiveShops();
    const results: OptimizationJobResult[] = [];

    for (const shop of shops) {
      try {
        const result = await this.optimizeShop(shop.id);
        results.push(result);
      } catch (error) {
        console.error(`Optimization failed for shop ${shop.id}:`, error);
        results.push({
          success: false,
          shopId: shop.id,
          insights: {} as OptimizationInsights,
          updatedArms: 0,
          decayedRecords: 0,
          errors: [(error as Error).message],
        });
      }
    }

    return results;
  }

  /**
   * Optimize a single shop
   */
  async optimizeShop(shopId: string): Promise<OptimizationJobResult> {
    const errors: string[] = [];
    let updatedArms = 0;
    let decayedRecords = 0;

    try {
      // 1. Analyze performance and gather insights
      const insights = await this.analyzePerformance(shopId);

      // 2. Apply time-decay to old data
      decayedRecords = await this.applyTimeDecay(shopId);

      // 3. Rebalance Thompson Sampling arms based on recent data
      updatedArms = await this.rebalanceArms(shopId, insights);

      // 4. Detect and store patterns
      await this.detectAndStorePatterns(shopId, insights);

      // 5. Update store volume classification
      await this.updateStoreVolume(shopId, insights.ordersPerDay);

      // 6. Clean up stale data
      await this.cleanupStaleData(shopId);

      return {
        success: true,
        shopId,
        insights,
        updatedArms,
        decayedRecords,
        errors,
      };
    } catch (error) {
      errors.push((error as Error).message);
      throw error;
    }
  }

  /**
   * Analyze shop performance and generate insights
   */
  private async analyzePerformance(shopId: string): Promise<OptimizationInsights> {
    // Calculate volume metrics
    const volumeMetrics = await query<{
      orders_per_day: number;
      avg_cart_value: number;
    }>(
      `SELECT
        COUNT(*) / 30.0 as orders_per_day,
        AVG(cart_value) as avg_cart_value
      FROM ml_decisions_log
      WHERE shop_id = $1
        AND created_at >= NOW() - INTERVAL '30 days'`,
      [shopId]
    );

    const ordersPerDay = Number(volumeMetrics.rows[0]?.orders_per_day || 0);
    const avgCartValue = Number(volumeMetrics.rows[0]?.avg_cart_value || 0);

    // Determine store volume category
    let storeVolume: StoreVolumeCategory;
    if (ordersPerDay >= 500) storeVolume = 'very_high';
    else if (ordersPerDay >= 100) storeVolume = 'high';
    else if (ordersPerDay >= 20) storeVolume = 'medium';
    else storeVolume = 'low';

    // Top display styles
    const topDisplayStyles = await query<{
      display_style: string;
      total_revenue: number;
      conversion_rate: number;
    }>(
      `SELECT
        display_style,
        SUM(revenue) as total_revenue,
        AVG(acceptance_rate) as conversion_rate
      FROM ml_combination_performance
      WHERE shop_id = $1
        AND updated_at >= NOW() - INTERVAL '30 days'
      GROUP BY display_style
      ORDER BY total_revenue DESC
      LIMIT 5`,
      [shopId]
    );

    // Top products
    const topProducts = await query<{
      product_id: string;
      total_revenue: number;
      acceptance_rate: number;
    }>(
      `SELECT
        UNNEST(product_ids) as product_id,
        SUM(revenue) as total_revenue,
        AVG(acceptance_rate) as acceptance_rate
      FROM ml_combination_performance
      WHERE shop_id = $1
        AND updated_at >= NOW() - INTERVAL '30 days'
      GROUP BY product_id
      ORDER BY total_revenue DESC
      LIMIT 10`,
      [shopId]
    );

    // Time patterns
    const timePatterns = await query<{
      time_of_day: string;
      avg_performance: number;
    }>(
      `SELECT
        time_of_day,
        AVG(revenue_per_impression) as avg_performance
      FROM ml_combination_performance
      WHERE shop_id = $1
        AND updated_at >= NOW() - INTERVAL '30 days'
      GROUP BY time_of_day
      ORDER BY avg_performance DESC`,
      [shopId]
    );

    // Customer segment patterns
    const customerPatterns = await query<{
      customer_segment: string;
      avg_performance: number;
    }>(
      `SELECT
        customer_segment,
        AVG(revenue_per_impression) as avg_performance
      FROM ml_combination_performance
      WHERE shop_id = $1
        AND updated_at >= NOW() - INTERVAL '30 days'
        AND customer_segment IS NOT NULL
      GROUP BY customer_segment
      ORDER BY avg_performance DESC`,
      [shopId]
    );

    // Device patterns
    const devicePatterns = await query<{
      device_type: string;
      avg_performance: number;
    }>(
      `SELECT
        device_type,
        AVG(revenue_per_impression) as avg_performance
      FROM ml_combination_performance
      WHERE shop_id = $1
        AND updated_at >= NOW() - INTERVAL '30 days'
        AND device_type IS NOT NULL
      GROUP BY device_type
      ORDER BY avg_performance DESC`,
      [shopId]
    );

    // Data freshness
    const freshnessData = await query<{
      last_update: Date;
      days_since_update: number;
      recent_count: number;
    }>(
      `SELECT
        MAX(updated_at) as last_update,
        EXTRACT(DAY FROM NOW() - MAX(updated_at)) as days_since_update,
        COUNT(*) FILTER (WHERE updated_at >= NOW() - INTERVAL '7 days') as recent_count
      FROM ml_combination_performance
      WHERE shop_id = $1`,
      [shopId]
    );

    // Generate recommendations
    const recommendations: string[] = [];

    if (ordersPerDay < 5) {
      recommendations.push('Low volume detected - increase exploration rate to learn faster');
    }

    if (freshnessData.rows[0] && Number(freshnessData.rows[0].days_since_update) > 7) {
      recommendations.push('Stale data detected - consider running test campaigns');
    }

    if (topDisplayStyles.rows.length < 2) {
      recommendations.push('Limited display style data - enable more styles for better optimization');
    }

    // Check for statistical significance
    const displayArms = await this.getDisplayArms(shopId);
    for (let i = 0; i < displayArms.length - 1; i++) {
      const arm1 = displayArms[i]!;
      const arm2 = displayArms[i + 1]!;
      const significance = this.thompsonEngine.calculateSignificance(arm1, arm2);
      if (!significance.significant && arm1.totalTrials > 100) {
        recommendations.push(
          `Display styles ${arm1.id} and ${arm2.id} show no significant difference - consider consolidating`
        );
      }
    }

    return {
      shopId,
      timestamp: new Date(),
      storeVolume,
      ordersPerDay,
      avgCartValue,
      topDisplayStyles: topDisplayStyles.rows.map((row) => ({
        style: row.display_style as DisplayStyle,
        revenue: Number(row.total_revenue),
        conversionRate: Number(row.conversion_rate),
      })),
      topProducts: topProducts.rows.map((row) => ({
        productId: row.product_id,
        revenue: Number(row.total_revenue),
        acceptanceRate: Number(row.acceptance_rate),
      })),
      timePatterns: timePatterns.rows.map((row) => ({
        timeOfDay: row.time_of_day,
        performance: Number(row.avg_performance),
      })),
      customerSegmentPatterns: customerPatterns.rows.map((row) => ({
        segment: row.customer_segment,
        performance: Number(row.avg_performance),
      })),
      devicePatterns: devicePatterns.rows.map((row) => ({
        device: row.device_type,
        performance: Number(row.avg_performance),
      })),
      dataFreshness: {
        lastUpdate: freshnessData.rows[0]?.last_update || new Date(0),
        staleDays: freshnessData.rows[0] ? Number(freshnessData.rows[0].days_since_update) : 999,
        recentDataPoints: freshnessData.rows[0] ? Number(freshnessData.rows[0].recent_count) : 0,
      },
      recommendations,
    };
  }

  /**
   * Apply time-decay to old performance data
   * Recent data = more relevant
   */
  private async applyTimeDecay(shopId: string): Promise<number> {
    // Decay factor: 0.5^(days / halfLife)
    // After 30 days (default half-life), data weight is halved
    const halfLifeDays = 30;

    const result = await query(
      `UPDATE ml_combination_performance
       SET
         revenue = revenue * POW(0.5, EXTRACT(DAY FROM NOW() - updated_at) / $2),
         impressions = GREATEST(1, FLOOR(impressions * POW(0.5, EXTRACT(DAY FROM NOW() - updated_at) / $2)))
       WHERE shop_id = $1
         AND updated_at < NOW() - INTERVAL '7 days'
       RETURNING 1`,
      [shopId, halfLifeDays]
    );

    return result.rowCount || 0;
  }

  /**
   * Rebalance Thompson Sampling arms based on recent performance
   */
  private async rebalanceArms(shopId: string, insights: OptimizationInsights): Promise<number> {
    let updated = 0;

    // Rebalance display style arms
    const displayArms = await this.getDisplayArms(shopId);
    for (const arm of displayArms) {
      // Get recent performance
      const recentPerf = await query<{ adds: number; impressions: number }>(
        `SELECT
          COALESCE(SUM(adds), 0) as adds,
          COALESCE(SUM(impressions), 0) as impressions
        FROM ml_combination_performance
        WHERE shop_id = $1
          AND display_style = $2
          AND updated_at >= NOW() - INTERVAL '7 days'`,
        [shopId, arm.id]
      );

      if (recentPerf.rows[0]) {
        const adds = Number(recentPerf.rows[0].adds);
        const impressions = Number(recentPerf.rows[0].impressions);

        // Update arm with new data
        const updatedArm = {
          ...arm,
          alpha: arm.alpha + adds,
          beta: arm.beta + (impressions - adds),
        };

        await query(
          `UPDATE ml_display_arms
           SET alpha = $3, beta = $4, updated_at = NOW()
           WHERE shop_id = $1 AND display_style = $2`,
          [shopId, arm.id, updatedArm.alpha, updatedArm.beta]
        );

        updated++;
      }
    }

    // Rebalance product arms (similar logic)
    const productArms = await this.getProductArms(shopId);
    for (const arm of productArms) {
      const recentPerf = await query<{ adds: number; impressions: number }>(
        `SELECT
          COALESCE(SUM(adds), 0) as adds,
          COALESCE(SUM(impressions), 0) as impressions
        FROM ml_combination_performance
        WHERE shop_id = $1
          AND $2 = ANY(product_ids)
          AND updated_at >= NOW() - INTERVAL '7 days'`,
        [shopId, arm.id]
      );

      if (recentPerf.rows[0]) {
        const adds = Number(recentPerf.rows[0].adds);
        const impressions = Number(recentPerf.rows[0].impressions);

        const updatedArm = {
          ...arm,
          alpha: arm.alpha + adds,
          beta: arm.beta + (impressions - adds),
        };

        await query(
          `UPDATE ml_product_arms
           SET alpha = $3, beta = $4, updated_at = NOW()
           WHERE shop_id = $1 AND upsell_product_id = $2`,
          [shopId, arm.id, updatedArm.alpha, updatedArm.beta]
        );

        updated++;
      }
    }

    return updated;
  }

  /**
   * Detect and store performance patterns
   */
  private async detectAndStorePatterns(
    shopId: string,
    insights: OptimizationInsights
  ): Promise<void> {
    // Store pattern insights for future use
    await query(
      `INSERT INTO ml_pattern_insights (
        shop_id,
        pattern_type,
        pattern_data,
        detected_at
      ) VALUES
        ($1, 'time_patterns', $2, NOW()),
        ($1, 'customer_patterns', $3, NOW()),
        ($1, 'device_patterns', $4, NOW())
      ON CONFLICT (shop_id, pattern_type)
      DO UPDATE SET
        pattern_data = EXCLUDED.pattern_data,
        detected_at = NOW()`,
      [
        shopId,
        JSON.stringify(insights.timePatterns),
        JSON.stringify(insights.customerSegmentPatterns),
        JSON.stringify(insights.devicePatterns),
      ]
    );
  }

  /**
   * Update store volume classification
   */
  private async updateStoreVolume(
    shopId: string,
    ordersPerDay: number
  ): Promise<void> {
    let volumeCategory: StoreVolumeCategory;
    if (ordersPerDay >= 500) volumeCategory = 'very_high';
    else if (ordersPerDay >= 100) volumeCategory = 'high';
    else if (ordersPerDay >= 20) volumeCategory = 'medium';
    else volumeCategory = 'low';

    await query(
      `UPDATE shops
       SET
         settings = jsonb_set(
           COALESCE(settings, '{}'::jsonb),
           '{store_volume}',
           $2::jsonb
         ),
         updated_at = NOW()
       WHERE id = $1`,
      [shopId, JSON.stringify(volumeCategory)]
    );
  }

  /**
   * Clean up stale data (older than 90 days)
   */
  private async cleanupStaleData(shopId: string): Promise<number> {
    const result = await query(
      `DELETE FROM ml_combination_performance
       WHERE shop_id = $1
         AND updated_at < NOW() - INTERVAL '90 days'
       RETURNING 1`,
      [shopId]
    );

    return result.rowCount || 0;
  }

  /**
   * Get active shops that need optimization
   */
  private async getActiveShops(): Promise<Array<{ id: string }>> {
    const result = await query<{ id: string }>(
      `SELECT id FROM shops
       WHERE is_active = true
         AND (
           last_optimization_run IS NULL
           OR last_optimization_run < NOW() - INTERVAL '1 hour'
         )`
    );

    return result.rows;
  }

  /**
   * Get display arms for shop
   */
  private async getDisplayArms(shopId: string): Promise<ThompsonArm[]> {
    const result = await query<{
      display_style: string;
      alpha: number;
      beta: number;
      total_impressions: number;
      total_adds: number;
    }>(
      `SELECT display_style, alpha, beta, total_impressions, total_adds
       FROM ml_display_arms
       WHERE shop_id = $1`,
      [shopId]
    );

    return result.rows.map((row) =>
      createArm(row.display_style, Number(row.alpha), Number(row.beta), {
        totalImpressions: row.total_impressions,
        totalAdds: row.total_adds,
      })
    );
  }

  /**
   * Get product arms for shop
   */
  private async getProductArms(shopId: string): Promise<ThompsonArm[]> {
    const result = await query<{
      upsell_product_id: string;
      alpha: number;
      beta: number;
      total_impressions: number;
      total_adds: number;
    }>(
      `SELECT upsell_product_id, alpha, beta, total_impressions, total_adds
       FROM ml_product_arms
       WHERE shop_id = $1`,
      [shopId]
    );

    return result.rows.map((row) =>
      createArm(row.upsell_product_id, Number(row.alpha), Number(row.beta), {
        totalImpressions: row.total_impressions,
        totalAdds: row.total_adds,
      })
    );
  }
}

/**
 * Export singleton instance
 */
export const backgroundOptimizer = new BackgroundMLOptimizer();

/**
 * Hourly cron job function
 * Call this from your job scheduler (e.g., node-cron, bull, etc.)
 */
export async function runHourlyOptimization(): Promise<OptimizationJobResult[]> {
  console.log('[ML Background Optimizer] Starting hourly optimization...');

  try {
    const results = await backgroundOptimizer.optimizeAllShops();

    const successCount = results.filter((r) => r.success).length;
    const failCount = results.filter((r) => !r.success).length;

    console.log(
      `[ML Background Optimizer] Completed: ${successCount} success, ${failCount} failed`
    );

    return results;
  } catch (error) {
    console.error('[ML Background Optimizer] Fatal error:', error);
    throw error;
  }
}
