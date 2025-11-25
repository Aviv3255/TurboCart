/**
 * ML Analytics API
 * Exposes ML optimization performance data to the admin dashboard
 *
 * GET /api/admin/ml-analytics?startDate=...&endDate=...
 */

import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    // TODO: Add authentication middleware
    // For now, get shop from query param
    const { searchParams } = new URL(request.url);
    const shopDomain = searchParams.get('shop');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    if (!shopDomain) {
      return NextResponse.json({ error: 'Missing shop parameter' }, { status: 400 });
    }

    // Get shop ID
    const shopResult = await query<{ id: string }>(
      'SELECT id FROM shops WHERE shop_domain = $1',
      [shopDomain]
    );

    if (shopResult.rows.length === 0) {
      return NextResponse.json({ error: 'Shop not found' }, { status: 404 });
    }

    const shopId = shopResult.rows[0]!.id;

    // Fetch all ML analytics data in parallel
    const [
      modelState,
      displayPerformance,
      productPerformance,
      contextHeatmap,
      recentDecisions,
      improvement,
    ] = await Promise.all([
      getModelState(shopId),
      getDisplayStylePerformance(shopId),
      getProductPerformance(shopId),
      getContextHeatmap(shopId),
      getRecentDecisions(shopId, 10),
      getImprovementMetrics(shopId),
    ]);

    return NextResponse.json({
      modelState,
      displayPerformance,
      productPerformance,
      contextHeatmap,
      recentDecisions,
      improvement,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('ML analytics error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch ML analytics' },
      { status: 500 }
    );
  }
}

/**
 * Get overall model state
 */
async function getModelState(shopId: string) {
  const result = await query<{
    exploration_rate: number;
    total_decisions: number;
    exploration_decisions: number;
    exploitation_decisions: number;
    baseline_revenue_per_order: number;
    current_revenue_per_order: number;
    improvement_percentage: number;
    model_confidence: number;
    training_status: string;
  }>(
    `SELECT
      exploration_rate,
      total_decisions,
      exploration_decisions,
      exploitation_decisions,
      baseline_revenue_per_order,
      current_revenue_per_order,
      improvement_percentage,
      model_confidence,
      training_status
    FROM ml_model_state
    WHERE shop_id = $1`,
    [shopId]
  );

  if (result.rows.length === 0) {
    return {
      exploration_rate: 0.2,
      total_decisions: 0,
      exploration_decisions: 0,
      exploitation_decisions: 0,
      baseline_revenue_per_order: 0,
      current_revenue_per_order: 0,
      improvement_percentage: 0,
      model_confidence: 0,
      training_status: 'learning',
    };
  }

  return result.rows[0];
}

/**
 * Get display style performance comparison
 */
async function getDisplayStylePerformance(shopId: string) {
  const result = await query<{
    display_style: string;
    total_impressions: number;
    total_adds: number;
    total_revenue: number;
    revenue_per_impression: number;
    acceptance_rate: number;
    estimated_success_rate: number;
    confidence_interval: { lower: number; upper: number };
    sample_size: number;
  }>(
    `SELECT
      display_style,
      total_impressions,
      total_adds,
      total_revenue,
      revenue_per_impression,
      acceptance_rate,
      estimated_success_rate,
      confidence_interval,
      sample_size
    FROM v_ml_display_performance
    WHERE shop_id = $1
    ORDER BY revenue_per_impression DESC`,
    [shopId]
  );

  return result.rows.map((row) => ({
    ...row,
    total_revenue: Number(row.total_revenue),
    revenue_per_impression: Number(row.revenue_per_impression),
    acceptance_rate: Number(row.acceptance_rate),
    estimated_success_rate: Number(row.estimated_success_rate),
  }));
}

/**
 * Get product performance matrix
 */
async function getProductPerformance(shopId: string) {
  const result = await query<{
    upsell_product_id: string;
    title: string;
    shopify_product_id: number;
    total_impressions: number;
    total_adds: number;
    total_revenue: number;
    revenue_per_impression: number;
    conversion_rate: number;
    estimated_conversion_rate: number;
    confidence_score: number;
    position_performance: Record<string, { impressions: number; adds: number; revenue: number }>;
  }>(
    `SELECT
      upsell_product_id,
      title,
      shopify_product_id,
      total_impressions,
      total_adds,
      total_revenue,
      revenue_per_impression,
      conversion_rate,
      estimated_conversion_rate,
      confidence_score,
      position_performance
    FROM v_ml_product_performance
    WHERE shop_id = $1
    ORDER BY revenue_per_impression DESC
    LIMIT 20`,
    [shopId]
  );

  return result.rows.map((row) => ({
    ...row,
    total_revenue: Number(row.total_revenue),
    revenue_per_impression: Number(row.revenue_per_impression),
    conversion_rate: Number(row.conversion_rate),
    estimated_conversion_rate: Number(row.estimated_conversion_rate),
    confidence_score: Number(row.confidence_score),
  }));
}

/**
 * Get context performance heatmap
 */
async function getContextHeatmap(shopId: string) {
  const result = await query<{
    cart_value_bucket: string;
    cart_item_count_bucket: string;
    display_style: string;
    total_impressions: number;
    total_adds: number;
    total_revenue: number;
    revenue_per_impression: number;
    acceptance_rate: number;
  }>(
    `SELECT
      cart_value_bucket,
      cart_item_count_bucket,
      display_style,
      total_impressions,
      total_adds,
      total_revenue,
      revenue_per_impression,
      acceptance_rate
    FROM v_ml_context_heatmap
    WHERE shop_id = $1
      AND total_impressions > 10
    ORDER BY revenue_per_impression DESC`,
    [shopId]
  );

  return result.rows.map((row) => ({
    ...row,
    total_revenue: Number(row.total_revenue),
    revenue_per_impression: Number(row.revenue_per_impression),
    acceptance_rate: Number(row.acceptance_rate),
  }));
}

/**
 * Get recent ML decisions
 */
async function getRecentDecisions(shopId: string, limit: number = 10) {
  const result = await query<{
    id: string;
    decision_type: string;
    selected_display_style: string;
    selected_products: Array<{ product: { title: string }; position: number; score: number }>;
    cart_value: number;
    cart_item_count: number;
    outcome: string | null;
    outcome_revenue: number | null;
    confidence: number;
    created_at: Date;
  }>(
    `SELECT
      id,
      decision_type,
      selected_display_style,
      selected_products,
      cart_value,
      cart_item_count,
      outcome,
      outcome_revenue,
      reasoning->>'confidence' as confidence,
      created_at
    FROM ml_decisions_log
    WHERE shop_id = $1
    ORDER BY created_at DESC
    LIMIT $2`,
    [shopId, limit]
  );

  return result.rows.map((row) => ({
    ...row,
    cart_value: Number(row.cart_value),
    outcome_revenue: row.outcome_revenue ? Number(row.outcome_revenue) : null,
    confidence: Number(row.confidence || 0),
  }));
}

/**
 * Get improvement metrics over time
 */
async function getImprovementMetrics(shopId: string) {
  // Get revenue per order trend (last 30 days)
  const trendResult = await query<{
    date: string;
    avg_revenue: number;
    decision_count: number;
  }>(
    `SELECT
      DATE(created_at) as date,
      AVG(outcome_revenue) as avg_revenue,
      COUNT(*) as decision_count
    FROM ml_decisions_log
    WHERE shop_id = $1
      AND outcome IS NOT NULL
      AND created_at >= NOW() - INTERVAL '30 days'
    GROUP BY DATE(created_at)
    ORDER BY date ASC`,
    [shopId]
  );

  // Calculate exploration vs exploitation success rates
  const explorationResult = await query<{
    decision_type: string;
    avg_revenue: number;
    success_count: number;
    total_count: number;
  }>(
    `SELECT
      decision_type,
      AVG(outcome_revenue) as avg_revenue,
      SUM(CASE WHEN outcome IN ('add', 'purchase') THEN 1 ELSE 0 END) as success_count,
      COUNT(*) as total_count
    FROM ml_decisions_log
    WHERE shop_id = $1
      AND outcome IS NOT NULL
      AND created_at >= NOW() - INTERVAL '7 days'
    GROUP BY decision_type`,
    [shopId]
  );

  return {
    trend: trendResult.rows.map((row) => ({
      date: row.date,
      avgRevenue: Number(row.avg_revenue),
      decisionCount: row.decision_count,
    })),
    exploitationVsExploration: explorationResult.rows.map((row) => ({
      type: row.decision_type,
      avgRevenue: Number(row.avg_revenue),
      successRate:
        row.total_count > 0 ? (Number(row.success_count) / Number(row.total_count)) * 100 : 0,
      totalDecisions: row.total_count,
    })),
  };
}
