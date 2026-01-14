/**
 * Test script for Login Failure Analyzer
 *
 * This script demonstrates the analyzer's functionality and can be run
 * in a browser console or Node.js environment with appropriate mocking.
 */

// Mock localStorage for testing
if (typeof localStorage === 'undefined') {
  global.localStorage = {
    _data: {},
    setItem: function(key, value) {
      this._data[key] = value;
    },
    getItem: function(key) {
      return this._data[key] || null;
    },
    removeItem: function(key) {
      delete this._data[key];
    },
    clear: function() {
      this._data = {};
    }
  };
}

// Mock navigator for testing
if (typeof navigator === 'undefined') {
  global.navigator = {
    onLine: true,
    userAgent: 'Test Browser',
    platform: 'Test Platform',
    language: 'en-US',
    cookieEnabled: true,
    doNotTrack: '1',
    connection: {
      effectiveType: '4g',
      downlink: 10,
      rtt: 50
    }
  };
}

// Import analyzer functions (adjust path as needed)
// In browser: Use ES6 import
// In Node: Use require or import with appropriate setup

/**
 * Test 1: Network Error
 */
async function testNetworkError() {
  console.log('\n📋 Test 1: Network Error');
  console.log('='.repeat(50));

  const { captureLoginFailure } = require('../lib/analytics/login-failure-analyzer');

  const error = new TypeError('Failed to fetch');
  error.stack = 'TypeError: Failed to fetch\n    at fetch (http://localhost:3000/...)';

  const failure = await captureLoginFailure({
    error,
    response: null,
    url: 'https://script.google.com/macros/s/.../exec',
    requestOptions: {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'login', username: 'testuser' })
    },
    username: 'testuser',
    timing: {
      start: Date.now() - 5000,
      duration: 5000
    }
  });

  console.log('✅ Captured:', failure.id);
  console.log('   Category:', failure.category);
  console.log('   Duration:', failure.timing.duration, 'ms');
  console.log('   Network online:', failure.network.online);

  return failure;
}

/**
 * Test 2: CORS Error
 */
async function testCORSError() {
  console.log('\n📋 Test 2: CORS Error');
  console.log('='.repeat(50));

  const { captureLoginFailure } = require('../lib/analytics/login-failure-analyzer');

  const error = new TypeError('Failed to fetch due to CORS policy');
  error.stack = 'TypeError: Failed to fetch due to CORS policy';

  const failure = await captureLoginFailure({
    error,
    response: null,
    url: 'https://script.google.com/macros/s/.../exec',
    requestOptions: {
      method: 'POST',
      mode: 'cors',
      credentials: 'omit'
    },
    username: 'testuser',
    timing: {
      start: Date.now() - 2000,
      duration: 2000
    }
  });

  console.log('✅ Captured:', failure.id);
  console.log('   Category:', failure.category);
  console.log('   Request mode:', failure.request.mode);

  return failure;
}

/**
 * Test 3: Server Error
 */
async function testServerError() {
  console.log('\n📋 Test 3: Server Error (500)');
  console.log('='.repeat(50));

  const { captureLoginFailure } = require('../lib/analytics/login-failure-analyzer');

  const error = new Error('Server returned 500: Internal Server Error');

  const mockResponse = {
    status: 500,
    statusText: 'Internal Server Error',
    ok: false,
    headers: new Map([
      ['content-type', 'application/json'],
      ['server', 'Google Apps Script']
    ]),
    redirected: false,
    type: 'basic',
    url: 'https://script.google.com/macros/s/.../exec'
  };

  const failure = await captureLoginFailure({
    error,
    response: mockResponse,
    url: 'https://script.google.com/macros/s/.../exec',
    requestOptions: {
      method: 'POST'
    },
    username: 'testuser',
    timing: {
      start: Date.now() - 3000,
      duration: 3000
    }
  });

  console.log('✅ Captured:', failure.id);
  console.log('   Category:', failure.category);
  console.log('   Response status:', failure.response.status);
  console.log('   Response type:', failure.response.type);

  return failure;
}

/**
 * Test 4: Timeout Error
 */
async function testTimeoutError() {
  console.log('\n📋 Test 4: Timeout Error');
  console.log('='.repeat(50));

  const { captureLoginFailure } = require('../lib/analytics/login-failure-analyzer');

  const error = new Error('Request timeout after 30 seconds');
  error.name = 'AbortError';

  const failure = await captureLoginFailure({
    error,
    response: null,
    url: 'https://script.google.com/macros/s/.../exec',
    requestOptions: {
      method: 'POST'
    },
    username: 'testuser',
    timing: {
      start: Date.now() - 35000,
      duration: 35000
    }
  });

  console.log('✅ Captured:', failure.id);
  console.log('   Category:', failure.category);
  console.log('   Duration:', failure.timing.duration, 'ms');

  return failure;
}

/**
 * Test 5: Rate Limit Error
 */
async function testRateLimitError() {
  console.log('\n📋 Test 5: Rate Limit Error (429)');
  console.log('='.repeat(50));

  const { captureLoginFailure } = require('../lib/analytics/login-failure-analyzer');

  const error = new Error('Too many requests');

  const mockResponse = {
    status: 429,
    statusText: 'Too Many Requests',
    ok: false,
    headers: new Map([
      ['retry-after', '60'],
      ['x-ratelimit-limit', '5'],
      ['x-ratelimit-remaining', '0']
    ]),
    redirected: false,
    type: 'basic',
    url: 'https://script.google.com/macros/s/.../exec'
  };

  const failure = await captureLoginFailure({
    error,
    response: mockResponse,
    url: 'https://script.google.com/macros/s/.../exec',
    requestOptions: {
      method: 'POST'
    },
    username: 'testuser',
    timing: {
      start: Date.now() - 1000,
      duration: 1000
    }
  });

  console.log('✅ Captured:', failure.id);
  console.log('   Category:', failure.category);
  console.log('   Retry after:', failure.response.headers['retry-after'], 's');

  return failure;
}

/**
 * Test 6: Pattern Analysis
 */
function testPatternAnalysis() {
  console.log('\n📋 Test 6: Pattern Analysis');
  console.log('='.repeat(50));

  const { analyzeFailurePatterns } = require('../lib/analytics/login-failure-analyzer');

  const patterns = analyzeFailurePatterns();

  console.log('📊 Analysis Results:');
  console.log('   Total failures:', patterns.totalFailures);
  console.log('   By category:', patterns.byCategory);
  console.log('   Network issues:', patterns.networkIssues);
  console.log('   Avg duration:', patterns.timing.average, 'ms');
  console.log('   Max duration:', patterns.timing.max, 'ms');
  console.log('   Top errors:', patterns.topErrors.length);
  console.log('   Recommendations:', patterns.recommendations.length);

  patterns.recommendations.forEach((rec, i) => {
    console.log(`   ${i + 1}. [${rec.priority}] ${rec.issue}`);
  });

  return patterns;
}

/**
 * Test 7: Diagnostic Report
 */
function testDiagnosticReport() {
  console.log('\n📋 Test 7: Diagnostic Report');
  console.log('='.repeat(50));

  const {
    getStoredFailures,
    generateDiagnosticReport
  } = require('../lib/analytics/login-failure-analyzer');

  const failures = getStoredFailures();

  if (failures.length === 0) {
    console.log('⚠️  No failures to diagnose');
    return null;
  }

  const report = generateDiagnosticReport(failures[failures.length - 1].id);

  console.log('🩺 Diagnostic Report:');
  console.log('   Failure ID:', report.failure.id);
  console.log('   Category:', report.failure.category);
  console.log('   Severity:', report.diagnosis.severity);
  console.log('   Root cause:', report.diagnosis.rootCause);
  console.log('   Technical details:');
  report.diagnosis.technicalDetails.forEach(detail => {
    console.log('     -', detail);
  });
  console.log('   Suggested fixes:', report.suggestedFixes.length);
  console.log('   Context:');
  console.log('     Total failures:', report.context.totalFailures);
  console.log('     Similar failures:', report.context.similarFailures);
  console.log('     Recent (1hr):', report.context.recentFailures);

  return report;
}

/**
 * Test 8: Statistics
 */
function testStatistics() {
  console.log('\n📋 Test 8: Statistics');
  console.log('='.repeat(50));

  const { getFailureStatistics } = require('../lib/analytics/login-failure-analyzer');

  const stats = getFailureStatistics();

  console.log('📈 Statistics:');
  console.log('   Total:', stats.summary.total);
  console.log('   Last 24h:', stats.summary.last24Hours);
  console.log('   Last hour:', stats.summary.lastHour);
  console.log('   Health score:', stats.healthScore, '/100');
  console.log('   Categories:', Object.keys(stats.patterns.byCategory).length);

  return stats;
}

/**
 * Test 9: Clear Failures
 */
function testClearFailures() {
  console.log('\n📋 Test 9: Clear Failures');
  console.log('='.repeat(50));

  const {
    getStoredFailures,
    clearStoredFailures
  } = require('../lib/analytics/login-failure-analyzer');

  const beforeCount = getStoredFailures().length;
  console.log('   Before:', beforeCount, 'failures');

  clearStoredFailures();

  const afterCount = getStoredFailures().length;
  console.log('   After:', afterCount, 'failures');
  console.log('   ✅ Cleared successfully');

  return { before: beforeCount, after: afterCount };
}

/**
 * Run all tests
 */
async function runAllTests() {
  console.log('\n🧪 Login Failure Analyzer Test Suite');
  console.log('='.repeat(50));

  try {
    // Capture various failures
    await testNetworkError();
    await testCORSError();
    await testServerError();
    await testTimeoutError();
    await testRateLimitError();

    // Analyze
    testPatternAnalysis();
    testDiagnosticReport();
    testStatistics();

    // Cleanup
    testClearFailures();

    console.log('\n✅ All tests completed successfully!');
  } catch (error) {
    console.error('\n❌ Test failed:', error);
    console.error(error.stack);
  }
}

// Export for use in other files
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    testNetworkError,
    testCORSError,
    testServerError,
    testTimeoutError,
    testRateLimitError,
    testPatternAnalysis,
    testDiagnosticReport,
    testStatistics,
    testClearFailures,
    runAllTests
  };
}

// Run tests if executed directly
if (require.main === module) {
  runAllTests();
}

/**
 * Browser Console Quick Test
 *
 * Copy and paste this into your browser console while on the login page:
 *
 * ```javascript
 * // Import analyzer
 * import { captureLoginFailure } from '@/lib/analytics/login-failure-analyzer';
 *
 * // Simulate a network error
 * const error = new TypeError('Failed to fetch');
 * await captureLoginFailure({
 *   error,
 *   response: null,
 *   url: location.href,
 *   requestOptions: { method: 'POST' },
 *   username: 'testuser',
 *   timing: { start: Date.now() - 5000, duration: 5000 }
 * });
 *
 * // View failures
 * import { getStoredFailures, analyzeFailurePatterns } from '@/lib/analytics/login-failure-analyzer';
 * console.log('Failures:', getStoredFailures());
 * console.log('Analysis:', analyzeFailurePatterns());
 *
 * // Navigate to dashboard
 * window.location.href = '/admin/login-failures';
 * ```
 */
