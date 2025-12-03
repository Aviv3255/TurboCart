import { NextResponse } from 'next/server';
import { readFileSync } from 'fs';
import { join } from 'path';

export async function GET() {
  try {
    // Read the turbocart.css file from the extensions folder
    const cssPath = join(process.cwd(), 'extensions', 'turbocart-upsells', 'assets', 'turbocart.css');
    const cssContent = readFileSync(cssPath, 'utf-8');

    return new NextResponse(cssContent, {
      headers: {
        'Content-Type': 'text/css',
        'Access-Control-Allow-Origin': '*',
        'Cache-Control': 'public, max-age=300', // 5 min cache
      },
    });
  } catch (error) {
    console.error('[inject.css] Error:', error);
    return new NextResponse('/* TurboCart styles not found */', {
      status: 500,
      headers: {
        'Content-Type': 'text/css',
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
