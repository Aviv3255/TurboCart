/**
 * Webhook registration module
 * Registers webhooks with Shopify after app installation
 */

import { getAuthConfig } from './auth';

interface WebhookSubscription {
  topic: string;
  uri: string;
}

// All webhooks that need to be registered
const WEBHOOKS: WebhookSubscription[] = [
  { topic: 'APP_UNINSTALLED', uri: '/api/webhooks/app/uninstalled' },
  { topic: 'PRODUCTS_CREATE', uri: '/api/webhooks/products-create' },
  { topic: 'PRODUCTS_UPDATE', uri: '/api/webhooks/products-update' },
  { topic: 'PRODUCTS_DELETE', uri: '/api/webhooks/products-delete' },
  { topic: 'ORDERS_CREATE', uri: '/api/webhooks/orders-create' },
  // GDPR webhooks
  { topic: 'CUSTOMERS_DATA_REQUEST', uri: '/api/webhooks/gdpr/data-request' },
  { topic: 'CUSTOMERS_REDACT', uri: '/api/webhooks/gdpr/customers-redact' },
  { topic: 'SHOP_REDACT', uri: '/api/webhooks/gdpr/shop-redact' },
];

/**
 * Register all required webhooks for the shop
 */
export async function registerWebhooks(
  shop: string,
  accessToken: string
): Promise<{ success: boolean; errors: string[] }> {
  const config = getAuthConfig();
  const errors: string[] = [];

  console.log('[Webhooks] Starting webhook registration for:', shop);
  console.log('[Webhooks] App URL:', config.appUrl);

  for (const webhook of WEBHOOKS) {
    try {
      const callbackUrl = `${config.appUrl}${webhook.uri}`;
      console.log(`[Webhooks] Registering ${webhook.topic} -> ${callbackUrl}`);

      const response = await fetch(`https://${shop}/admin/api/2024-01/graphql.json`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Shopify-Access-Token': accessToken,
        },
        body: JSON.stringify({
          query: `
            mutation webhookSubscriptionCreate($topic: WebhookSubscriptionTopic!, $webhookSubscription: WebhookSubscriptionInput!) {
              webhookSubscriptionCreate(topic: $topic, webhookSubscription: $webhookSubscription) {
                webhookSubscription {
                  id
                  topic
                  endpoint {
                    ... on WebhookHttpEndpoint {
                      callbackUrl
                    }
                  }
                }
                userErrors {
                  field
                  message
                }
              }
            }
          `,
          variables: {
            topic: webhook.topic,
            webhookSubscription: {
              callbackUrl,
              format: 'JSON',
            },
          },
        }),
      });

      if (!response.ok) {
        const error = await response.text();
        console.error(`[Webhooks] Failed to register ${webhook.topic}:`, error);
        errors.push(`${webhook.topic}: ${error}`);
        continue;
      }

      const data = await response.json();

      if (data.errors) {
        console.error(`[Webhooks] GraphQL errors for ${webhook.topic}:`, data.errors);
        errors.push(`${webhook.topic}: ${JSON.stringify(data.errors)}`);
        continue;
      }

      const result = data.data?.webhookSubscriptionCreate;
      if (result?.userErrors?.length > 0) {
        // Check if it's just a "already exists" error
        const isAlreadyExists = result.userErrors.some(
          (e: { message: string }) => e.message.includes('already exists')
        );
        if (isAlreadyExists) {
          console.log(`[Webhooks] ${webhook.topic} already registered`);
        } else {
          console.error(`[Webhooks] User errors for ${webhook.topic}:`, result.userErrors);
          errors.push(`${webhook.topic}: ${result.userErrors.map((e: { message: string }) => e.message).join(', ')}`);
        }
        continue;
      }

      console.log(`[Webhooks] Successfully registered ${webhook.topic}`);
    } catch (error) {
      console.error(`[Webhooks] Exception registering ${webhook.topic}:`, error);
      errors.push(`${webhook.topic}: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  const success = errors.length === 0;
  console.log(`[Webhooks] Registration complete. Success: ${success}, Errors: ${errors.length}`);

  return { success, errors };
}

/**
 * List all webhook subscriptions for a shop
 */
export async function listWebhooks(
  shop: string,
  accessToken: string
): Promise<Array<{ id: string; topic: string; callbackUrl: string }>> {
  const response = await fetch(`https://${shop}/admin/api/2024-01/graphql.json`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Shopify-Access-Token': accessToken,
    },
    body: JSON.stringify({
      query: `
        query {
          webhookSubscriptions(first: 50) {
            edges {
              node {
                id
                topic
                endpoint {
                  ... on WebhookHttpEndpoint {
                    callbackUrl
                  }
                }
              }
            }
          }
        }
      `,
    }),
  });

  if (!response.ok) {
    throw new Error(`Failed to list webhooks: ${await response.text()}`);
  }

  const data = await response.json();

  if (data.errors) {
    throw new Error(`GraphQL errors: ${JSON.stringify(data.errors)}`);
  }

  return data.data.webhookSubscriptions.edges.map((edge: {
    node: {
      id: string;
      topic: string;
      endpoint: { callbackUrl: string };
    };
  }) => ({
    id: edge.node.id,
    topic: edge.node.topic,
    callbackUrl: edge.node.endpoint.callbackUrl,
  }));
}
