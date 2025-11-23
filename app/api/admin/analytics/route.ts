/**
 * Analytics API
 * Fetches aggregated analytics data
 */

import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/shopify/middleware';
import { getAnalyticsSummary } from '@/lib/db/queries';
import { query } from '@/lib/db';

// Force dynamic rendering for API routes that use authentication
export const dynamic = 'force-dynamic';

/**
 * Get analytics data
 * GET /api/admin/analytics?startDate=...&endDate=...
 */
export async function GET(request: NextRequest) {
  return withAuth(request, async (req) => {
    try {
      if (!req.shop) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }

      const { searchParams } = new URL(request.url);
      const startDateParam = searchParams.get('startDate');
      const endDateParam = searchParams.get('endDate');

      // Default to last 30 days
      const endDate = endDateParam ? new Date(endDateParam) : new Date();
      const startDate = startDateParam
        ? new Date(startDateParam)
        : new Date(endDate.getTime() - 30 * 24 * 60 * 60 * 1000);

      // Get summary metrics
      const summary = await getAnalyticsSummary(req.shop.id, startDate, endDate);

      // Get daily breakdown
      const dailyResult = await query<{
        date: Date;
        impressions: number;
        adds: number;
        revenue: number;
      }>(
        `SELECT
          date,
          SUM(impressions) as impressions,
          SUM(adds) as adds,
          SUM(revenue) as revenue
        FROM analytics_daily
        WHERE shop_id = $1 AND date BETWEEN $2 AND $3
        GROUP BY date
        ORDER BY date ASC`,
        [req.shop.id, startDate, endDate]
      );

      // Get top performing products
      const topProductsResult = await query<{
        product_id: string;
        title: string;
        impressions: number;
        adds: number;
        revenue: number;
        conversion_rate: number;
      }>(
        `SELECT
          up.id as product_id,
          up.title,
          SUM(ad.impressions) as impressions,
          SUM(ad.adds) as adds,
          SUM(ad.revenue) as revenue,
          CASE
            WHEN SUM(ad.impressions) > 0
            THEN ROUND((SUM(ad.adds)::decimal / SUM(ad.impressions)::decimal * 100), 2)
            ELSE 0
          END as conversion_rate
        FROM upsell_products up
        LEFT JOIN analytics_daily ad ON up.id = ad.upsell_product_id
        WHERE up.shop_id = $1 AND ad.date BETWEEN $2 AND $3
        GROUP BY up.id, up.title
        HAVING SUM(ad.impressions) > 0
        ORDER BY revenue DESC
        LIMIT 10`,
        [req.shop.id, startDate, endDate]
      );

      return NextResponse.json({
        summary: {
          total_revenue: Number(summary.total_revenue) || 0,
          total_impressions: Number(summary.total_impressions) || 0,
          total_adds: Number(summary.total_adds) || 0,
          acceptance_rate: Number(summary.acceptance_rate) || 0,
          avg_order_value: Number(summary.avg_order_value) || 0,
        },
        daily: dailyResult.rows.map((row) => ({
          date: row.date,
          impressions: Number(row.impressions) || 0,
          adds: Number(row.adds) || 0,
          revenue: Number(row.revenue) || 0,
        })),
        topProducts: topProductsResult.rows.map((row) => ({
          id: row.product_id,
          title: row.title,
          impressions: Number(row.impressions) || 0,
          adds: Number(row.adds) || 0,
          revenue: Number(row.revenue) || 0,
          conversionRate: Number(row.conversion_rate) || 0,
        })),
      });
    } catch (error) {
      console.error('Error fetching analytics:', error);
      return NextResponse.json(
        { error: 'Failed to fetch analytics' },
        { status: 500 }
      );
    }
  });
}
