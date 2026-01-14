'use client';

import { useState, useEffect } from 'react';
import {
  getStoredFailures,
  clearStoredFailures,
  analyzeFailurePatterns,
  generateDiagnosticReport,
  getFailureStatistics
} from '@/lib/analytics/login-failure-analyzer';

export default function LoginFailuresAnalyzer() {
  const [failures, setFailures] = useState([]);
  const [patterns, setPatterns] = useState(null);
  const [statistics, setStatistics] = useState(null);
  const [selectedFailure, setSelectedFailure] = useState(null);
  const [diagnosticReport, setDiagnosticReport] = useState(null);
  const [view, setView] = useState('overview'); // overview, list, diagnostic

  useEffect(() => {
    loadData();
  }, []);

  const loadData = () => {
    const storedFailures = getStoredFailures();
    setFailures(storedFailures);

    if (storedFailures.length > 0) {
      setPatterns(analyzeFailurePatterns(storedFailures));
      setStatistics(getFailureStatistics());
    }
  };

  const handleClearFailures = () => {
    if (confirm('Are you sure you want to clear all failure records?')) {
      clearStoredFailures();
      loadData();
    }
  };

  const handleViewDiagnostic = (failureId) => {
    const report = generateDiagnosticReport(failureId);
    setDiagnosticReport(report);
    setSelectedFailure(failureId);
    setView('diagnostic');
  };

  const getCategoryColor = (category) => {
    const colors = {
      NETWORK: 'bg-red-100 text-red-800 border-red-300',
      CORS: 'bg-orange-100 text-orange-800 border-orange-300',
      TIMEOUT: 'bg-yellow-100 text-yellow-800 border-yellow-300',
      SERVER_ERROR: 'bg-purple-100 text-purple-800 border-purple-300',
      RATE_LIMIT: 'bg-blue-100 text-blue-800 border-blue-300',
      PARSE_ERROR: 'bg-pink-100 text-pink-800 border-pink-300',
      VALIDATION: 'bg-gray-100 text-gray-800 border-gray-300',
      UNKNOWN: 'bg-gray-100 text-gray-600 border-gray-300'
    };
    return colors[category] || colors.UNKNOWN;
  };

  const getPriorityColor = (priority) => {
    const colors = {
      HIGH: 'bg-red-600 text-white',
      MEDIUM: 'bg-yellow-600 text-white',
      LOW: 'bg-blue-600 text-white'
    };
    return colors[priority] || 'bg-gray-600 text-white';
  };

  const getSeverityColor = (severity) => {
    const colors = {
      HIGH: 'text-red-600',
      MEDIUM: 'text-yellow-600',
      LOW: 'text-blue-600',
      UNKNOWN: 'text-gray-600'
    };
    return colors[severity] || colors.UNKNOWN;
  };

  const formatDuration = (ms) => {
    if (ms < 1000) return `${ms}ms`;
    return `${(ms / 1000).toFixed(2)}s`;
  };

  const formatTimestamp = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleString();
  };

  const getHealthScoreColor = (score) => {
    if (score >= 90) return 'text-green-600 bg-green-50';
    if (score >= 70) return 'text-yellow-600 bg-yellow-50';
    if (score >= 50) return 'text-orange-600 bg-orange-50';
    return 'text-red-600 bg-red-50';
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                🔍 Login Failure Analyzer
              </h1>
              <p className="text-gray-600">
                Post-hoc analysis of login fetch failures
              </p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={loadData}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                🔄 Refresh
              </button>
              <button
                onClick={handleClearFailures}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                disabled={failures.length === 0}
              >
                🗑️ Clear All
              </button>
            </div>
          </div>
        </div>

        {/* View Tabs */}
        <div className="mb-6 flex gap-2">
          <button
            onClick={() => setView('overview')}
            className={`px-6 py-3 rounded-lg font-medium transition-colors ${
              view === 'overview'
                ? 'bg-blue-600 text-white'
                : 'bg-white text-gray-600 hover:bg-gray-50'
            }`}
          >
            📊 Overview
          </button>
          <button
            onClick={() => setView('list')}
            className={`px-6 py-3 rounded-lg font-medium transition-colors ${
              view === 'list'
                ? 'bg-blue-600 text-white'
                : 'bg-white text-gray-600 hover:bg-gray-50'
            }`}
          >
            📋 Failure List ({failures.length})
          </button>
          {diagnosticReport && (
            <button
              onClick={() => setView('diagnostic')}
              className={`px-6 py-3 rounded-lg font-medium transition-colors ${
                view === 'diagnostic'
                  ? 'bg-blue-600 text-white'
                  : 'bg-white text-gray-600 hover:bg-gray-50'
              }`}
            >
              🩺 Diagnostic Report
            </button>
          )}
        </div>

        {/* No Failures */}
        {failures.length === 0 && (
          <div className="bg-white rounded-xl p-12 text-center shadow-sm">
            <div className="text-6xl mb-4">✅</div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              No Login Failures Recorded
            </h2>
            <p className="text-gray-600">
              All login attempts have been successful, or no attempts have been made yet.
            </p>
          </div>
        )}

        {/* Overview */}
        {failures.length > 0 && view === 'overview' && statistics && patterns && (
          <div className="space-y-6">
            {/* Statistics Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-white rounded-xl p-6 shadow-sm">
                <div className="text-sm text-gray-600 mb-1">Total Failures</div>
                <div className="text-3xl font-bold text-gray-900">
                  {statistics.summary.total}
                </div>
              </div>
              <div className="bg-white rounded-xl p-6 shadow-sm">
                <div className="text-sm text-gray-600 mb-1">Last 24 Hours</div>
                <div className="text-3xl font-bold text-orange-600">
                  {statistics.summary.last24Hours}
                </div>
              </div>
              <div className="bg-white rounded-xl p-6 shadow-sm">
                <div className="text-sm text-gray-600 mb-1">Last Hour</div>
                <div className="text-3xl font-bold text-red-600">
                  {statistics.summary.lastHour}
                </div>
              </div>
              <div className="bg-white rounded-xl p-6 shadow-sm">
                <div className="text-sm text-gray-600 mb-1">Health Score</div>
                <div
                  className={`text-3xl font-bold ${
                    getHealthScoreColor(statistics.healthScore).split(' ')[0]
                  }`}
                >
                  {statistics.healthScore}/100
                </div>
              </div>
            </div>

            {/* Categories */}
            <div className="bg-white rounded-xl p-6 shadow-sm">
              <h2 className="text-xl font-bold text-gray-900 mb-4">
                Failures by Category
              </h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {Object.entries(patterns.byCategory).map(([category, count]) => (
                  <div
                    key={category}
                    className={`px-4 py-3 rounded-lg border-2 ${getCategoryColor(
                      category
                    )}`}
                  >
                    <div className="text-sm font-medium">{category}</div>
                    <div className="text-2xl font-bold">{count}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Top Errors */}
            <div className="bg-white rounded-xl p-6 shadow-sm">
              <h2 className="text-xl font-bold text-gray-900 mb-4">
                Most Common Errors
              </h2>
              <div className="space-y-3">
                {patterns.topErrors.map((error, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
                  >
                    <div className="flex-1 font-mono text-sm text-gray-800">
                      {error.message}
                    </div>
                    <div className="ml-4 px-3 py-1 bg-red-600 text-white rounded-full text-sm font-bold">
                      {error.count}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Timing Analysis */}
            <div className="bg-white rounded-xl p-6 shadow-sm">
              <h2 className="text-xl font-bold text-gray-900 mb-4">
                Request Timing
              </h2>
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-blue-50 rounded-lg">
                  <div className="text-sm text-gray-600 mb-1">
                    Average Duration
                  </div>
                  <div className="text-2xl font-bold text-blue-600">
                    {formatDuration(patterns.timing.average)}
                  </div>
                </div>
                <div className="p-4 bg-purple-50 rounded-lg">
                  <div className="text-sm text-gray-600 mb-1">
                    Max Duration
                  </div>
                  <div className="text-2xl font-bold text-purple-600">
                    {formatDuration(patterns.timing.max)}
                  </div>
                </div>
              </div>
            </div>

            {/* Recommendations */}
            {patterns.recommendations.length > 0 && (
              <div className="bg-white rounded-xl p-6 shadow-sm">
                <h2 className="text-xl font-bold text-gray-900 mb-4">
                  🎯 Recommendations
                </h2>
                <div className="space-y-3">
                  {patterns.recommendations.map((rec, idx) => (
                    <div
                      key={idx}
                      className="p-4 bg-yellow-50 border-l-4 border-yellow-400 rounded-r-lg"
                    >
                      <div className="flex items-start gap-3">
                        <span
                          className={`px-2 py-1 rounded text-xs font-bold ${getPriorityColor(
                            rec.priority
                          )}`}
                        >
                          {rec.priority}
                        </span>
                        <div className="flex-1">
                          <div className="font-bold text-gray-900 mb-1">
                            {rec.issue}
                          </div>
                          <div className="text-sm text-gray-700">
                            {rec.suggestion}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Failure List */}
        {failures.length > 0 && view === 'list' && (
          <div className="bg-white rounded-xl shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Timestamp
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Category
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Error
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Duration
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Network
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {[...failures].reverse().map((failure) => (
                    <tr key={failure.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 text-sm text-gray-900">
                        {formatTimestamp(failure.timestamp)}
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-medium border ${getCategoryColor(
                            failure.category
                          )}`}
                        >
                          {failure.category}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-700 max-w-xs truncate">
                        {failure.error.message}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">
                        {formatDuration(failure.timing.duration)}
                      </td>
                      <td className="px-6 py-4 text-sm">
                        {failure.network.online ? (
                          <span className="text-green-600">🟢 Online</span>
                        ) : (
                          <span className="text-red-600">🔴 Offline</span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <button
                          onClick={() => handleViewDiagnostic(failure.id)}
                          className="text-blue-600 hover:text-blue-800 font-medium text-sm"
                        >
                          🩺 Diagnose
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Diagnostic Report */}
        {view === 'diagnostic' && diagnosticReport && (
          <div className="space-y-6">
            {/* Failure Details */}
            <div className="bg-white rounded-xl p-6 shadow-sm">
              <h2 className="text-xl font-bold text-gray-900 mb-4">
                Failure Details
              </h2>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-sm text-gray-600 mb-1">Timestamp</div>
                  <div className="font-medium">
                    {formatTimestamp(diagnosticReport.failure.timestamp)}
                  </div>
                </div>
                <div>
                  <div className="text-sm text-gray-600 mb-1">Category</div>
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-medium border inline-block ${getCategoryColor(
                      diagnosticReport.failure.category
                    )}`}
                  >
                    {diagnosticReport.failure.category}
                  </span>
                </div>
                <div>
                  <div className="text-sm text-gray-600 mb-1">Duration</div>
                  <div className="font-medium">
                    {formatDuration(diagnosticReport.failure.timing.duration)}
                  </div>
                </div>
                <div>
                  <div className="text-sm text-gray-600 mb-1">Username</div>
                  <div className="font-medium">
                    {diagnosticReport.failure.user.username || 'N/A'}
                  </div>
                </div>
              </div>
            </div>

            {/* Diagnosis */}
            <div className="bg-white rounded-xl p-6 shadow-sm">
              <h2 className="text-xl font-bold text-gray-900 mb-4">
                🩺 Diagnosis
              </h2>
              <div className="space-y-4">
                <div>
                  <div className="text-sm text-gray-600 mb-1">Severity</div>
                  <div
                    className={`text-2xl font-bold ${getSeverityColor(
                      diagnosticReport.diagnosis.severity
                    )}`}
                  >
                    {diagnosticReport.diagnosis.severity}
                  </div>
                </div>
                <div>
                  <div className="text-sm text-gray-600 mb-1">Root Cause</div>
                  <div className="text-lg font-medium text-gray-900">
                    {diagnosticReport.diagnosis.rootCause}
                  </div>
                </div>
                <div>
                  <div className="text-sm text-gray-600 mb-2">
                    Technical Details
                  </div>
                  <ul className="space-y-2">
                    {diagnosticReport.diagnosis.technicalDetails.map(
                      (detail, idx) => (
                        <li
                          key={idx}
                          className="flex items-start gap-2 text-sm text-gray-700"
                        >
                          <span className="text-blue-600 mt-1">▪</span>
                          <span>{detail}</span>
                        </li>
                      )
                    )}
                  </ul>
                </div>
              </div>
            </div>

            {/* Context */}
            <div className="bg-white rounded-xl p-6 shadow-sm">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Context</h2>
              <div className="grid grid-cols-3 gap-4">
                <div className="p-4 bg-gray-50 rounded-lg">
                  <div className="text-sm text-gray-600 mb-1">
                    Total Failures
                  </div>
                  <div className="text-2xl font-bold text-gray-900">
                    {diagnosticReport.context.totalFailures}
                  </div>
                </div>
                <div className="p-4 bg-orange-50 rounded-lg">
                  <div className="text-sm text-gray-600 mb-1">
                    Similar Failures
                  </div>
                  <div className="text-2xl font-bold text-orange-600">
                    {diagnosticReport.context.similarFailures}
                  </div>
                </div>
                <div className="p-4 bg-red-50 rounded-lg">
                  <div className="text-sm text-gray-600 mb-1">
                    Recent (1hr)
                  </div>
                  <div className="text-2xl font-bold text-red-600">
                    {diagnosticReport.context.recentFailures}
                  </div>
                </div>
              </div>
            </div>

            {/* Suggested Fixes */}
            <div className="bg-white rounded-xl p-6 shadow-sm">
              <h2 className="text-xl font-bold text-gray-900 mb-4">
                🔧 Suggested Fixes
              </h2>
              <div className="space-y-6">
                {diagnosticReport.suggestedFixes.map((fix, idx) => (
                  <div key={idx} className="border rounded-lg p-4">
                    <div className="font-bold text-gray-900 mb-3">
                      {idx + 1}. {fix.fix}
                    </div>
                    <div className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto">
                      <pre className="text-sm">
                        <code>{fix.code.trim()}</code>
                      </pre>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Error Stack */}
            {diagnosticReport.failure.error.stack && (
              <div className="bg-white rounded-xl p-6 shadow-sm">
                <h2 className="text-xl font-bold text-gray-900 mb-4">
                  Stack Trace
                </h2>
                <div className="bg-red-50 p-4 rounded-lg overflow-x-auto">
                  <pre className="text-xs text-red-800 font-mono">
                    {diagnosticReport.failure.error.stack}
                  </pre>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
