/**
 * PostHog Analytics & Bug Tracking Configuration
 * Tracks user events, errors, and performance metrics
 */

import posthog from 'posthog-js';

// PostHog Configuration
const POSTHOG_KEY = process.env.NEXT_PUBLIC_POSTHOG_KEY || 'phc_YOUR_PROJECT_API_KEY';
const POSTHOG_HOST = process.env.NEXT_PUBLIC_POSTHOG_HOST || 'https://app.posthog.com';

let isInitialized = false;

/**
 * Initialize PostHog
 */
export function initPostHog() {
  if (typeof window === 'undefined' || isInitialized) return;

  try {
    posthog.init(POSTHOG_KEY, {
      api_host: POSTHOG_HOST,

      // Features
      autocapture: true, // Auto-capture clicks, form submissions, etc.
      capture_pageview: true, // Track page views
      capture_pageleave: true, // Track when users leave

      // Session Recording
      session_recording: {
        enabled: true,
        recordCrossOriginIframes: false
      },

      // Performance
      enable_recording_console_log: true, // Capture console logs
      disable_session_recording: false,

      // Privacy
      mask_all_text: false, // Set to true to mask sensitive data
      mask_all_element_attributes: false,

      // Debugging
      loaded: (ph) => {
        console.log('[PostHog] Initialized successfully');
        if (process.env.NODE_ENV === 'development') {
          console.log('[PostHog] Debug mode enabled');
        }
      }
    });

    isInitialized = true;

    // Set user properties if available
    const user = getUserFromStorage();
    if (user) {
      identifyUser(user);
    }

  } catch (error) {
    console.error('[PostHog] Initialization failed:', error);
  }
}

/**
 * Get PostHog instance
 */
export function getPostHog() {
  return posthog;
}

/**
 * Track a custom event
 */
export function trackEvent(eventName, properties = {}) {
  if (!isInitialized) return;

  try {
    posthog.capture(eventName, {
      ...properties,
      timestamp: new Date().toISOString(),
      url: window.location.href,
      userAgent: navigator.userAgent
    });

    if (process.env.NODE_ENV === 'development') {
      console.log(`[PostHog] Event: ${eventName}`, properties);
    }
  } catch (error) {
    console.error('[PostHog] Track event failed:', error);
  }
}

/**
 * Identify user
 */
export function identifyUser(user) {
  if (!isInitialized || !user) return;

  try {
    posthog.identify(
      user.id || user.username,
      {
        username: user.username,
        email: user.email,
        createdAt: user.createdAt,
        role: user.role || 'user'
      }
    );

    console.log('[PostHog] User identified:', user.username);
  } catch (error) {
    console.error('[PostHog] Identify user failed:', error);
  }
}

/**
 * Track page view
 */
export function trackPageView(pageName, properties = {}) {
  trackEvent('$pageview', {
    page: pageName,
    ...properties
  });
}

/**
 * Track error
 */
export function trackError(error, context = {}) {
  if (!isInitialized) return;

  try {
    const errorData = {
      error_message: error.message,
      error_name: error.name,
      error_stack: error.stack,
      error_type: error.constructor.name,
      ...context,
      timestamp: new Date().toISOString(),
      url: window.location.href,
      userAgent: navigator.userAgent
    };

    posthog.capture('$exception', errorData);

    console.error('[PostHog] Error tracked:', errorData);
  } catch (err) {
    console.error('[PostHog] Track error failed:', err);
  }
}

/**
 * Track performance metric
 */
export function trackPerformance(metric, value, properties = {}) {
  trackEvent('performance_metric', {
    metric,
    value,
    ...properties
  });
}

/**
 * Track user action
 */
export function trackAction(action, properties = {}) {
  trackEvent('user_action', {
    action,
    ...properties
  });
}

/**
 * Track feature usage
 */
export function trackFeature(featureName, properties = {}) {
  trackEvent('feature_used', {
    feature: featureName,
    ...properties
  });
}

/**
 * Reset user (on logout)
 */
export function resetUser() {
  if (!isInitialized) return;

  try {
    posthog.reset();
    console.log('[PostHog] User reset (logged out)');
  } catch (error) {
    console.error('[PostHog] Reset failed:', error);
  }
}

/**
 * Set user properties
 */
export function setUserProperty(key, value) {
  if (!isInitialized) return;

  try {
    posthog.people.set({ [key]: value });
  } catch (error) {
    console.error('[PostHog] Set user property failed:', error);
  }
}

/**
 * Helper: Get user from localStorage
 */
function getUserFromStorage() {
  try {
    const userStr = localStorage.getItem('medward_user');
    return userStr ? JSON.parse(userStr) : null;
  } catch {
    return null;
  }
}

// Event types for consistency
export const EVENTS = {
  // Authentication
  LOGIN_SUCCESS: 'login_success',
  LOGIN_FAILED: 'login_failed',
  LOGOUT: 'logout',

  // Document Processing
  DOCUMENT_UPLOAD_START: 'document_upload_start',
  DOCUMENT_UPLOAD_SUCCESS: 'document_upload_success',
  DOCUMENT_UPLOAD_FAILED: 'document_upload_failed',
  DOCUMENT_OCR_START: 'document_ocr_start',
  DOCUMENT_OCR_SUCCESS: 'document_ocr_success',
  DOCUMENT_OCR_FAILED: 'document_ocr_failed',
  DOCUMENT_INTERPRET_START: 'document_interpret_start',
  DOCUMENT_INTERPRET_SUCCESS: 'document_interpret_success',
  DOCUMENT_INTERPRET_FAILED: 'document_interpret_failed',

  // Batch Processing
  BATCH_UPLOAD_START: 'batch_upload_start',
  BATCH_UPLOAD_COMPLETE: 'batch_upload_complete',
  BATCH_FILE_PROCESSED: 'batch_file_processed',

  // Reports
  REPORT_VIEWED: 'report_viewed',
  REPORT_DELETED: 'report_deleted',
  REPORT_SHARED: 'report_shared',

  // Features
  CAMERA_USED: 'camera_used',
  FILE_UPLOAD_USED: 'file_upload_used',
  IMAGE_PREPROCESSING_USED: 'image_preprocessing_used',

  // Errors
  API_ERROR: 'api_error',
  NETWORK_ERROR: 'network_error',
  PARSING_ERROR: 'parsing_error',
  GENERIC_ERROR: 'generic_error',

  // Performance
  PAGE_LOAD_TIME: 'page_load_time',
  API_RESPONSE_TIME: 'api_response_time',
  OCR_PROCESSING_TIME: 'ocr_processing_time',

  // User Actions
  BUTTON_CLICKED: 'button_clicked',
  FORM_SUBMITTED: 'form_submitted',
  SEARCH_PERFORMED: 'search_performed',
  FILTER_APPLIED: 'filter_applied'
};

export default {
  init: initPostHog,
  track: trackEvent,
  trackError,
  trackPerformance,
  trackAction,
  trackFeature,
  trackPageView,
  identify: identifyUser,
  reset: resetUser,
  setUserProperty,
  EVENTS
};
