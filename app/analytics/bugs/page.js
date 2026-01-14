'use client';

import { useState, useEffect } from 'react';
import { initPostHog } from '@/lib/analytics/posthog-client';

export default function BugAnalyticsPage() {
  const [loading, setLoading] = useState(true);
  const [bugData, setBugData] = useState(null);
  const [error, setError] = useState(null);
  const [timeRange, setTimeRange] = useState(7);

  useEffect(() => {
    initPostHog();
    fetchBugData();
  }, [timeRange]);

  const fetchBugData = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/analytics/bugs?days=${timeRange}`);
      const data = await response.json();

      if (response.ok) {
        setBugData(data);
      } else {
        setError(data.error || 'Failed to fetch bug data');
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const getSeverityColor = (severity) => {
    switch (severity) {
      case 'critical': return 'bg-red-100 text-red-800 border-red-300';
      case 'high': return 'bg-orange-100 text-orange-800 border-orange-300';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      case 'low': return 'bg-blue-100 text-blue-800 border-blue-300';
      default: return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  const getCategoryEmoji = (category) => {
    switch (category) {
      case 'ocr': return '📷';
      case 'ai': return '🤖';
      case 'network': return '🌐';
      case 'validation': return '✅';
      case 'rendering': return '🎨';
      case 'api': return '🔌';
      default: return '❓';
    }
  };

  if (loading && !bugData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading bug analytics...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
          <span className="text-6xl mb-4 block">⚠️</span>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Error Loading Data</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={fetchBugData}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => window.location.href = '/Ward-rounds/dashboard/'}
                className="text-gray-600 hover:text-gray-900 transition-colors"
              >
                ← Back
              </button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">🐛 Bug Analytics</h1>
                <p className="text-sm text-gray-500">PostHog Error Tracking & Analysis</p>
              </div>
            </div>
            <select
              value={timeRange}
              onChange={(e) => setTimeRange(parseInt(e.target.value))}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value={1}>Last 24 hours</option>
              <option value={7}>Last 7 days</option>
              <option value={30}>Last 30 days</option>
              <option value={90}>Last 90 days</option>
            </select>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-sm p-6 border-l-4 border-red-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Total Errors</p>
                <p className="text-3xl font-bold text-gray-900">{bugData?.stats?.total || 0}</p>
              </div>
              <span className="text-4xl">⚠️</span>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6 border-l-4 border-orange-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Critical Issues</p>
                <p className="text-3xl font-bold text-gray-900">{bugData?.stats?.bySeverity?.critical || 0}</p>
              </div>
              <span className="text-4xl">🔥</span>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6 border-l-4 border-yellow-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Unique Patterns</p>
                <p className="text-3xl font-bold text-gray-900">{bugData?.stats?.uniquePatterns || 0}</p>
              </div>
              <span className="text-4xl">🔍</span>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6 border-l-4 border-blue-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">High Priority</p>
                <p className="text-3xl font-bold text-gray-900">{bugData?.stats?.bySeverity?.high || 0}</p>
              </div>
              <span className="text-4xl">📊</span>
            </div>
          </div>
        </div>

        {/* Summary */}
        {bugData?.analysis?.summary && (
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-8">
            <div className="flex gap-3">
              <span className="text-2xl">💡</span>
              <div>
                <h3 className="font-semibold text-gray-900 mb-1">Analysis Summary</h3>
                <p className="text-gray-700">{bugData.analysis.summary}</p>
              </div>
            </div>
          </div>
        )}

        {/* Bug Patterns */}
        <div className="bg-white rounded-xl shadow-sm p-6 mb-8">
          <h2 className="text-xl font-bold text-gray-900 mb-4">🔍 Bug Patterns</h2>

          {bugData?.analysis?.patterns?.length > 0 ? (
            <div className="space-y-4">
              {bugData.analysis.patterns.map((pattern, idx) => (
                <div
                  key={idx}
                  className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3 flex-1">
                      <span className="text-3xl">{getCategoryEmoji(pattern.category)}</span>
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-900">{pattern.errorType}</h3>
                        <p className="text-sm text-gray-600 mt-1">{pattern.sampleError?.message}</p>
                      </div>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${getSeverityColor(pattern.severity)}`}>
                      {pattern.severity}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <span className="text-gray-600">Frequency:</span>
                      <span className="ml-2 font-semibold text-gray-900">{pattern.frequency}x</span>
                    </div>
                    <div>
                      <span className="text-gray-600">Affected Users:</span>
                      <span className="ml-2 font-semibold text-gray-900">{pattern.affectedUsers}</span>
                    </div>
                    <div>
                      <span className="text-gray-600">Category:</span>
                      <span className="ml-2 font-semibold text-gray-900">{pattern.category}</span>
                    </div>
                    <div>
                      <span className="text-gray-600">Trend:</span>
                      <span className="ml-2 font-semibold text-gray-900">{pattern.trend}</span>
                    </div>
                  </div>

                  {pattern.sampleError?.stack && (
                    <details className="mt-3">
                      <summary className="cursor-pointer text-sm text-blue-600 hover:text-blue-700">
                        Show stack trace
                      </summary>
                      <pre className="mt-2 p-3 bg-gray-100 rounded text-xs overflow-x-auto">
                        {pattern.sampleError.stack}
                      </pre>
                    </details>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-center py-8">No bug patterns detected 🎉</p>
          )}
        </div>

        {/* Recommendations */}
        {bugData?.recommendations?.length > 0 && (
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">💡 Recommendations</h2>
            <div className="space-y-3">
              {bugData.recommendations.map((rec, idx) => (
                <div
                  key={idx}
                  className="border-l-4 border-blue-500 bg-blue-50 p-4 rounded-r-lg"
                >
                  <div className="flex items-center gap-2 mb-2">
                    <span className={`px-2 py-1 rounded text-xs font-semibold ${
                      rec.priority === 'high' ? 'bg-red-100 text-red-800' :
                      rec.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-blue-100 text-blue-800'
                    }`}>
                      {rec.priority} priority
                    </span>
                    <span className="text-sm text-gray-600">{rec.category}</span>
                  </div>
                  <h3 className="font-semibold text-gray-900 mb-1">{rec.recommendation}</h3>
                  <p className="text-sm text-gray-700">{rec.action}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Note */}
        {bugData?.message && (
          <div className="mt-8 bg-yellow-50 border border-yellow-200 rounded-xl p-4">
            <p className="text-sm text-yellow-800">
              <strong>Note:</strong> {bugData.message}
            </p>
          </div>
        )}
      </main>
    </div>
  );
}
