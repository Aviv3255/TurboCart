/**
 * Storefront Ping API
 * Called by the theme extension when it loads to indicate the app is active
 */

import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

// Force dynamic rendering
export const dynamic = 'force-dynamic';

// Allow CORS from any origin (storefront)
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

export async function OPTIONS() {
  return NextResponse.json({}, { headers: corsHeaders });
}

/**
 * POST /api/storefront/ping
 * Called by the theme extension to indicate it's active
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const shopDomain = body.shop;

    if (!shopDomain) {
      return NextResponse.json(
        { error: 'Missing shop domain' },
        { status: 400, headers: corsHeaders }
      );
    }

    // Update the last_embed_ping timestamp for this shop
    await query(
      `UPDATE shops
       SET settings = COALESCE(settings, '{}'::jsonb) || jsonb_build_object('last_embed_ping', NOW()::text)
       WHERE shop_domain = $1`,
      [shopDomain]
    );

    return NextResponse.json(
      { success: true, timestamp: new Date().toISOString() },
      { headers: corsHeaders }
    );
  } catch (error) {
    console.error('Error in storefront ping:', error);
    return NextResponse.json(
      { error: 'Internal error' },
      { status: 500, headers: corsHeaders }
    );
  }
}

/**
 * GET /api/storefront/ping?shop=xxx
 * Check if the embed is active for a shop
 */
export async function GET(request: NextRequest) {
  try {
    const shop = request.nextUrl.searchParams.get('shop');

    if (!shop) {
      return NextResponse.json(
        { error: 'Missing shop parameter' },
        { status: 400, headers: corsHeaders }
      );
    }

    const result = await query<{ settings: { last_embed_ping?: string } | null }>(
      `SELECT settings FROM shops WHERE shop_domain = $1`,
      [shop]
    );

    const lastPing = result.rows[0]?.settings?.last_embed_ping;

    if (!lastPing) {
      return NextResponse.json(
        { active: false, lastPing: null },
        { headers: corsHeaders }
      );
    }

    // Consider active if pinged within last 5 minutes
    const pingTime = new Date(lastPing);
    const now = new Date();
    const diffMs = now.getTime() - pingTime.getTime();
    const active = diffMs < 5 * 60 * 1000; // 5 minutes

    return NextResponse.json(
      { active, lastPing },
      { headers: corsHeaders }
    );
  } catch (error) {
    console.error('Error checking embed status:', error);
    return NextResponse.json(
      { error: 'Internal error', active: false },
      { status: 500, headers: corsHeaders }
    );
  }
}
