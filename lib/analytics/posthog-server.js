/**
 * PostHog Server-Side Client
 * For tracking events from API routes and server-side operations
 */

import { PostHog } from 'posthog-node';

let serverPostHog = null;

/**
 * Get or initialize server-side PostHog client
 * @returns {PostHog|null} PostHog instance
 */
export function getServerPostHog() {
  if (serverPostHog) {
    return serverPostHog;
  }

  const apiKey = process.env.NEXT_PUBLIC_POSTHOG_KEY;
  const apiHost = process.env.NEXT_PUBLIC_POSTHOG_HOST || 'https://app.posthog.com';

  if (!apiKey) {
    console.warn('[PostHog Server] API key not configured. Analytics disabled.');
    return null;
  }

  try {
    serverPostHog = new PostHog(apiKey, {
      host: apiHost
    });
    console.log('[PostHog Server] Initialized successfully');
    return serverPostHog;
  } catch (error) {
    console.error('[PostHog Server] Initialization failed:', error);
    return null;
  }
}

/**
 * Track server-side event
 * @param {string} userId - User identifier (or 'anonymous')
 * @param {string} eventName - Event name
 * @param {Object} properties - Event properties
 */
export async function trackServerEvent(userId, eventName, properties = {}) {
  const client = getServerPostHog();
  if (!client) return;

  try {
    client.capture({
      distinctId: userId || 'anonymous',
      event: eventName,
      properties: {
        ...properties,
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV,
        server_side: true
      }
    });
  } catch (error) {
    console.error('[PostHog Server] Event tracking failed:', error);
  }
}

/**
 * Track server-side error
 * @param {string} userId - User identifier
 * @param {Error} error - Error object
 * @param {Object} context - Additional context
 */
export async function trackServerError(userId, error, context = {}) {
  const client = getServerPostHog();
  if (!client) {
    console.error('[PostHog Server not initialized] Error:', error, context);
    return;
  }

  try {
    client.capture({
      distinctId: userId || 'anonymous',
      event: '$exception',
      properties: {
        error_message: error.message,
        error_name: error.name,
        error_stack: error.stack,
        error_type: 'server_error',
        ...context,
        timestamp: new Date().toISOString(),
        server_side: true
      }
    });
  } catch (trackingError) {
    console.error('[PostHog Server] Error tracking failed:', trackingError);
  }
}

/**
 * Shutdown PostHog client gracefully
 */
export async function shutdownPostHog() {
  if (serverPostHog) {
    await serverPostHog.shutdown();
    serverPostHog = null;
  }
}

export default {
  getServerPostHog,
  trackServerEvent,
  trackServerError,
  shutdownPostHog
};
