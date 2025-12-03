/**
 * Inject.js - Serves the full TurboCart script
 * Loads the complete turbocart.js from assets
 */

import { NextRequest, NextResponse } from 'next/server';
import { readFileSync } from 'fs';
import { join } from 'path';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    // Read the full turbocart.js file
    const jsPath = join(process.cwd(), 'extensions', 'turbocart-upsells', 'assets', 'turbocart.js');
    const jsContent = readFileSync(jsPath, 'utf-8');

    return new NextResponse(jsContent, {
      headers: {
        'Content-Type': 'application/javascript',
        'Cache-Control': 'public, max-age=300',
        'Access-Control-Allow-Origin': '*',
      },
    });
  } catch (error) {
    console.error('[inject.js] Error loading script:', error);

    // Fallback to a minimal working script
    const fallbackScript = `
(function() {
  console.log('[TurboCart] Fallback script loaded');
  console.error('[TurboCart] Main script failed to load');
})();
`;

    return new NextResponse(fallbackScript, {
      headers: {
        'Content-Type': 'application/javascript',
        'Access-Control-Allow-Origin': '*',
      },
    });
  }
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}
