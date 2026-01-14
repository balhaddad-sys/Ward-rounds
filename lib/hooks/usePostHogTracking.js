/**
 * Custom React Hook for PostHog Tracking
 * Simplifies event tracking in components
 */

import { useCallback } from 'react';
import { trackEvent, trackError, trackPerformance, EVENTS } from '@/lib/analytics/posthog';

export function usePostHogTracking() {
  // Track document upload
  const trackUpload = useCallback((status, details = {}) => {
    const eventMap = {
      start: EVENTS.DOCUMENT_UPLOAD_START,
      success: EVENTS.DOCUMENT_UPLOAD_SUCCESS,
      failed: EVENTS.DOCUMENT_UPLOAD_FAILED
    };

    trackEvent(eventMap[status] || EVENTS.DOCUMENT_UPLOAD_START, details);
  }, []);

  // Track OCR processing
  const trackOCR = useCallback((status, details = {}) => {
    const eventMap = {
      start: EVENTS.DOCUMENT_OCR_START,
      success: EVENTS.DOCUMENT_OCR_SUCCESS,
      failed: EVENTS.DOCUMENT_OCR_FAILED
    };

    trackEvent(eventMap[status], details);
  }, []);

  // Track interpretation
  const trackInterpretation = useCallback((status, details = {}) => {
    const eventMap = {
      start: EVENTS.DOCUMENT_INTERPRET_START,
      success: EVENTS.DOCUMENT_INTERPRET_SUCCESS,
      failed: EVENTS.DOCUMENT_INTERPRET_FAILED
    };

    trackEvent(eventMap[status], details);
  }, []);

  // Track batch upload
  const trackBatch = useCallback((status, details = {}) => {
    const eventMap = {
      start: EVENTS.BATCH_UPLOAD_START,
      complete: EVENTS.BATCH_UPLOAD_COMPLETE,
      file_processed: EVENTS.BATCH_FILE_PROCESSED
    };

    trackEvent(eventMap[status], details);
  }, []);

  // Track feature usage
  const trackFeature = useCallback((featureName, details = {}) => {
    trackEvent(EVENTS.FEATURE_USED, {
      feature: featureName,
      ...details
    });
  }, []);

  // Track button click
  const trackClick = useCallback((buttonName, details = {}) => {
    trackEvent(EVENTS.BUTTON_CLICKED, {
      button: buttonName,
      ...details
    });
  }, []);

  // Track error with context
  const trackErrorWithContext = useCallback((error, context = {}) => {
    trackError(error, context);
  }, []);

  // Track timing/performance
  const trackTiming = useCallback((metric, startTime, details = {}) => {
    const duration = Date.now() - startTime;
    trackPerformance(metric, duration, details);
    return duration;
  }, []);

  return {
    trackUpload,
    trackOCR,
    trackInterpretation,
    trackBatch,
    trackFeature,
    trackClick,
    trackError: trackErrorWithContext,
    trackTiming,
    // Raw tracking functions
    track: trackEvent,
    EVENTS
  };
}

// Example usage:
/*
import { usePostHogTracking } from '@/lib/hooks/usePostHogTracking';

function MyComponent() {
  const { trackUpload, trackFeature, trackTiming } = usePostHogTracking();

  const handleUpload = async (file) => {
    const startTime = Date.now();

    try {
      trackUpload('start', { fileName: file.name, fileSize: file.size });

      // ... upload logic ...

      trackUpload('success', { fileName: file.name, fileSize: file.size });
      trackTiming('upload_duration', startTime, { fileName: file.name });

    } catch (error) {
      trackUpload('failed', { error: error.message, fileName: file.name });
    }
  };

  return <button onClick={() => trackFeature('camera_capture')}>Capture</button>;
}
*/
