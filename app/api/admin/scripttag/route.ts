/**
 * ScriptTag API - Backup method to inject TurboCart into storefront
 * This works even if App Embed is not manually enabled
 */

import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/shopify/middleware';

export const dynamic = 'force-dynamic';

const SCRIPT_URL = 'https://turbocart.onrender.com/api/storefront/inject.js';

/**
 * GET - Check if ScriptTag exists
 */
export async function GET(request: NextRequest) {
  return withAuth(request, async (req) => {
    try {
      if (!req.shop) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }

      const response = await fetch(
        `https://${req.shop.shop_domain}/admin/api/2024-01/script_tags.json`,
        {
          headers: {
            'X-Shopify-Access-Token': req.shop.access_token,
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.ok) {
        throw new Error(`Shopify API error: ${response.status}`);
      }

      const data = await response.json();
      const turbocartScript = data.script_tags?.find(
        (st: { src: string }) => st.src.includes('turbocart')
      );

      return NextResponse.json({
        exists: !!turbocartScript,
        scriptTag: turbocartScript || null,
      });
    } catch (error) {
      console.error('Error checking script tag:', error);
      return NextResponse.json(
        { error: 'Failed to check script tag' },
        { status: 500 }
      );
    }
  });
}

/**
 * POST - Create ScriptTag (backup injection method)
 */
export async function POST(request: NextRequest) {
  return withAuth(request, async (req) => {
    try {
      if (!req.shop) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }

      // First, check if script tag already exists
      const checkResponse = await fetch(
        `https://${req.shop.shop_domain}/admin/api/2024-01/script_tags.json`,
        {
          headers: {
            'X-Shopify-Access-Token': req.shop.access_token,
            'Content-Type': 'application/json',
          },
        }
      );

      if (checkResponse.ok) {
        const checkData = await checkResponse.json();
        const existing = checkData.script_tags?.find(
          (st: { src: string }) => st.src.includes('turbocart')
        );

        if (existing) {
          return NextResponse.json({
            success: true,
            message: 'ScriptTag already exists',
            scriptTag: existing,
          });
        }
      }

      // Create new script tag
      const response = await fetch(
        `https://${req.shop.shop_domain}/admin/api/2024-01/script_tags.json`,
        {
          method: 'POST',
          headers: {
            'X-Shopify-Access-Token': req.shop.access_token,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            script_tag: {
              event: 'onload',
              src: SCRIPT_URL,
              display_scope: 'online_store',
            },
          }),
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Shopify API error: ${response.status} - ${errorText}`);
      }

      const data = await response.json();

      return NextResponse.json({
        success: true,
        message: 'ScriptTag created successfully',
        scriptTag: data.script_tag,
      });
    } catch (error) {
      console.error('Error creating script tag:', error);
      return NextResponse.json(
        { error: 'Failed to create script tag', details: (error as Error).message },
        { status: 500 }
      );
    }
  });
}

/**
 * DELETE - Remove ScriptTag
 */
export async function DELETE(request: NextRequest) {
  return withAuth(request, async (req) => {
    try {
      if (!req.shop) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }

      // Find existing script tag
      const checkResponse = await fetch(
        `https://${req.shop.shop_domain}/admin/api/2024-01/script_tags.json`,
        {
          headers: {
            'X-Shopify-Access-Token': req.shop.access_token,
            'Content-Type': 'application/json',
          },
        }
      );

      if (!checkResponse.ok) {
        throw new Error(`Shopify API error: ${checkResponse.status}`);
      }

      const checkData = await checkResponse.json();
      const existing = checkData.script_tags?.find(
        (st: { src: string }) => st.src.includes('turbocart')
      );

      if (!existing) {
        return NextResponse.json({
          success: true,
          message: 'No ScriptTag found to delete',
        });
      }

      // Delete the script tag
      const deleteResponse = await fetch(
        `https://${req.shop.shop_domain}/admin/api/2024-01/script_tags/${existing.id}.json`,
        {
          method: 'DELETE',
          headers: {
            'X-Shopify-Access-Token': req.shop.access_token,
          },
        }
      );

      if (!deleteResponse.ok) {
        throw new Error(`Failed to delete: ${deleteResponse.status}`);
      }

      return NextResponse.json({
        success: true,
        message: 'ScriptTag deleted successfully',
      });
    } catch (error) {
      console.error('Error deleting script tag:', error);
      return NextResponse.json(
        { error: 'Failed to delete script tag' },
        { status: 500 }
      );
    }
  });
}
