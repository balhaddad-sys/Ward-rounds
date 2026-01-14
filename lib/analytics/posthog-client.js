/**
 * PostHog Analytics Client
 * Tracks events, errors, and user behavior for bug analysis
 */

import posthog from 'posthog-js';

let isInitialized = false;

/**
 * Initialize PostHog client (browser-side only)
 */
export function initPostHog() {
  if (typeof window === 'undefined' || isInitialized) {
    return;
  }

  const apiKey = process.env.NEXT_PUBLIC_POSTHOG_KEY;
  const apiHost = process.env.NEXT_PUBLIC_POSTHOG_HOST || 'https://app.posthog.com';

  if (!apiKey) {
    console.warn('[PostHog] API key not configured. Analytics disabled.');
    return;
  }

  try {
    posthog.init(apiKey, {
      api_host: apiHost,
      autocapture: true,
      capture_pageview: true,
      capture_pageleave: true,
      persistence: 'localStorage',
      session_recording: {
        recordCrossOriginIframes: false
      },
      loaded: (posthog) => {
        if (process.env.NODE_ENV === 'development') {
          posthog.debug();
        }
      }
    });

    isInitialized = true;
    console.log('[PostHog] Initialized successfully');
  } catch (error) {
    console.error('[PostHog] Initialization failed:', error);
  }
}

/**
 * Track a custom event
 * @param {string} eventName - Name of the event
 * @param {Object} properties - Event properties
 */
export function trackEvent(eventName, properties = {}) {
  if (!isInitialized) return;

  try {
    posthog.capture(eventName, {
      ...properties,
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV
    });
  } catch (error) {
    console.error('[PostHog] Event tracking failed:', error);
  }
}

/**
 * Track an error or exception
 * @param {Error} error - The error object
 * @param {Object} context - Additional context
 */
export function trackError(error, context = {}) {
  if (!isInitialized) {
    console.error('[PostHog not initialized] Error:', error, context);
    return;
  }

  try {
    const errorData = {
      error_message: error.message,
      error_name: error.name,
      error_stack: error.stack,
      error_type: 'javascript_error',
      ...context,
      timestamp: new Date().toISOString(),
      url: typeof window !== 'undefined' ? window.location.href : 'unknown',
      user_agent: typeof navigator !== 'undefined' ? navigator.userAgent : 'unknown'
    };

    posthog.capture('$exception', errorData);
    console.error('[PostHog] Error tracked:', error.message, context);
  } catch (trackingError) {
    console.error('[PostHog] Error tracking failed:', trackingError);
  }
}

/**
 * Track OCR-related events
 * @param {string} stage - OCR stage (start, complete, failed)
 * @param {Object} data - OCR data
 */
export function trackOCR(stage, data = {}) {
  trackEvent(`ocr_${stage}`, {
    ocr_method: data.method,
    ocr_confidence: data.confidence,
    file_type: data.fileType,
    file_size: data.fileSize,
    text_length: data.textLength,
    processing_time: data.processingTime,
    error_message: data.error,
    category: 'ocr'
  });
}

/**
 * Track AI interpretation events
 * @param {string} stage - AI stage (start, complete, failed)
 * @param {Object} data - AI data
 */
export function trackAI(stage, data = {}) {
  trackEvent(`ai_${stage}`, {
    ai_provider: data.provider,
    ai_model: data.model,
    document_type: data.documentType,
    processing_time: data.processingTime,
    findings_count: data.findingsCount,
    confidence: data.confidence,
    error_message: data.error,
    category: 'ai'
  });
}

/**
 * Track user interactions
 * @param {string} action - User action
 * @param {Object} data - Action data
 */
export function trackUserAction(action, data = {}) {
  trackEvent(`user_${action}`, {
    ...data,
    category: 'user_action'
  });
}

/**
 * Identify a user
 * @param {string} userId - Unique user identifier
 * @param {Object} properties - User properties
 */
export function identifyUser(userId, properties = {}) {
  if (!isInitialized) return;

  try {
    posthog.identify(userId, properties);
    console.log('[PostHog] User identified:', userId);
  } catch (error) {
    console.error('[PostHog] User identification failed:', error);
  }
}

/**
 * Reset user session (on logout)
 */
export function resetUser() {
  if (!isInitialized) return;

  try {
    posthog.reset();
    console.log('[PostHog] User session reset');
  } catch (error) {
    console.error('[PostHog] Reset failed:', error);
  }
}

/**
 * Track page view
 * @param {string} pageName - Name of the page
 * @param {Object} properties - Page properties
 */
export function trackPageView(pageName, properties = {}) {
  if (!isInitialized) return;

  try {
    posthog.capture('$pageview', {
      page_name: pageName,
      ...properties
    });
  } catch (error) {
    console.error('[PostHog] Page view tracking failed:', error);
  }
}

/**
 * Get PostHog instance (for advanced usage)
 * @returns {Object} PostHog instance
 */
export function getPostHog() {
  return isInitialized ? posthog : null;
}

export default {
  initPostHog,
  trackEvent,
  trackError,
  trackOCR,
  trackAI,
  trackUserAction,
  identifyUser,
  resetUser,
  trackPageView,
  getPostHog
};
