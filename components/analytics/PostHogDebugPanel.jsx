'use client';

import { useState, useEffect } from 'react';
import { getPostHog } from '@/lib/analytics/posthog';

/**
 * PostHog Debug Panel
 * Shows tracked events in real-time (development only)
 */
export function PostHogDebugPanel() {
  const [events, setEvents] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const [sessionUrl, setSessionUrl] = useState('');

  useEffect(() => {
    if (process.env.NODE_ENV !== 'development') return;

    // Get PostHog instance
    const ph = getPostHog();
    if (!ph) return;

    // Get session replay URL
    try {
      const sessionId = ph.get_session_id();
      if (sessionId) {
        setSessionUrl(`https://app.posthog.com/recording/${sessionId}`);
      }
    } catch (error) {
      console.error('[Debug] Failed to get session URL:', error);
    }

    // Intercept PostHog capture calls
    const originalCapture = ph.capture.bind(ph);
    ph.capture = function(eventName, properties) {
      // Add to debug panel
      setEvents(prev => [{
        eventName,
        properties,
        timestamp: new Date().toISOString()
      }, ...prev].slice(0, 50)); // Keep last 50 events

      // Call original
      return originalCapture(eventName, properties);
    };
  }, []);

  if (process.env.NODE_ENV !== 'development') {
    return null;
  }

  return (
    <>
      {/* Toggle Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-4 right-4 z-50 w-14 h-14 bg-purple-600 text-white rounded-full shadow-2xl flex items-center justify-center hover:bg-purple-700 transition-colors"
        title="PostHog Debug Panel"
      >
        📊
      </button>

      {/* Debug Panel */}
      {isOpen && (
        <div className="fixed bottom-20 right-4 z-50 w-96 max-h-[600px] bg-white rounded-2xl shadow-2xl border-2 border-gray-200 overflow-hidden flex flex-col">
          {/* Header */}
          <div className="bg-purple-600 text-white p-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-2xl">📊</span>
              <div>
                <h3 className="font-bold">PostHog Debug</h3>
                <p className="text-xs text-purple-100">{events.length} events tracked</p>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="text-white hover:bg-purple-700 rounded-lg p-1"
            >
              ✕
            </button>
          </div>

          {/* Session Info */}
          {sessionUrl && (
            <div className="p-3 bg-purple-50 border-b border-purple-200">
              <a
                href={sessionUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-purple-700 hover:text-purple-900 underline flex items-center gap-1"
              >
                🎥 View Session Recording →
              </a>
            </div>
          )}

          {/* Actions */}
          <div className="p-3 bg-gray-50 border-b border-gray-200 flex gap-2">
            <button
              onClick={() => setEvents([])}
              className="text-xs px-3 py-1 bg-gray-200 hover:bg-gray-300 rounded-lg font-medium"
            >
              Clear
            </button>
            <button
              onClick={() => {
                const data = JSON.stringify(events, null, 2);
                const blob = new Blob([data], { type: 'application/json' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `posthog-events-${Date.now()}.json`;
                a.click();
              }}
              className="text-xs px-3 py-1 bg-purple-200 hover:bg-purple-300 rounded-lg font-medium"
            >
              Export JSON
            </button>
          </div>

          {/* Events List */}
          <div className="flex-1 overflow-y-auto p-4 space-y-2">
            {events.length === 0 ? (
              <div className="text-center text-gray-400 py-8">
                <span className="text-4xl block mb-2">👀</span>
                <p className="text-sm">No events yet</p>
                <p className="text-xs">Interact with the app to see tracked events</p>
              </div>
            ) : (
              events.map((event, index) => (
                <div
                  key={index}
                  className="bg-gray-50 rounded-lg p-3 border border-gray-200 hover:bg-gray-100 transition-colors"
                >
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <span className="font-mono text-sm font-semibold text-purple-700">
                      {event.eventName}
                    </span>
                    <span className="text-xs text-gray-500">
                      {new Date(event.timestamp).toLocaleTimeString()}
                    </span>
                  </div>
                  {event.properties && Object.keys(event.properties).length > 0 && (
                    <details className="mt-2">
                      <summary className="cursor-pointer text-xs text-gray-600 hover:text-gray-900">
                        Properties ({Object.keys(event.properties).length})
                      </summary>
                      <pre className="mt-2 text-xs bg-white p-2 rounded border border-gray-300 overflow-x-auto">
                        {JSON.stringify(event.properties, null, 2)}
                      </pre>
                    </details>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </>
  );
}
