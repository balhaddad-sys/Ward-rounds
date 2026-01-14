/**
 * Post Hoc Login Failure Analyzer
 * Captures, stores, and analyzes login fetch failures for debugging and monitoring
 */

// Error categories for classification
const ERROR_CATEGORIES = {
  NETWORK: 'NETWORK',
  CORS: 'CORS',
  TIMEOUT: 'TIMEOUT',
  SERVER_ERROR: 'SERVER_ERROR',
  RATE_LIMIT: 'RATE_LIMIT',
  PARSE_ERROR: 'PARSE_ERROR',
  VALIDATION: 'VALIDATION',
  UNKNOWN: 'UNKNOWN'
};

// Storage key for client-side failure logs
const STORAGE_KEY = 'medward_login_failures';

/**
 * Categorizes an error based on its properties
 */
function categorizeError(error, response, timing) {
  // CORS errors
  if (error.message.includes('CORS') ||
      error.message.includes('Cross-Origin') ||
      error.name === 'TypeError' && !response) {
    return ERROR_CATEGORIES.CORS;
  }

  // Network errors
  if (error.message.includes('Failed to fetch') ||
      error.message.includes('NetworkError') ||
      error.message.includes('Network request failed') ||
      error.name === 'TypeError' && error.message.includes('fetch')) {
    return ERROR_CATEGORIES.NETWORK;
  }

  // Timeout errors
  if (error.message.includes('timeout') ||
      error.message.includes('aborted') ||
      (timing && timing.duration > 30000)) {
    return ERROR_CATEGORIES.TIMEOUT;
  }

  // Rate limiting
  if (response?.status === 429 ||
      error.message.includes('Too many requests') ||
      error.message.includes('rate limit')) {
    return ERROR_CATEGORIES.RATE_LIMIT;
  }

  // Server errors
  if (response?.status >= 500) {
    return ERROR_CATEGORIES.SERVER_ERROR;
  }

  // Parse errors
  if (error.name === 'SyntaxError' ||
      error.message.includes('JSON') ||
      error.message.includes('parse')) {
    return ERROR_CATEGORIES.PARSE_ERROR;
  }

  // Validation errors
  if (response?.status === 400 ||
      error.message.includes('validation') ||
      error.message.includes('invalid')) {
    return ERROR_CATEGORIES.VALIDATION;
  }

  return ERROR_CATEGORIES.UNKNOWN;
}

/**
 * Detects user's network conditions
 */
async function detectNetworkConditions() {
  const conditions = {
    online: typeof navigator !== 'undefined' ? navigator.onLine : true,
    effectiveType: 'unknown',
    downlink: null,
    rtt: null
  };

  if (typeof navigator !== 'undefined' && navigator.connection) {
    const conn = navigator.connection;
    conditions.effectiveType = conn.effectiveType || 'unknown';
    conditions.downlink = conn.downlink || null;
    conditions.rtt = conn.rtt || null;
  }

  return conditions;
}

/**
 * Captures browser and environment information
 */
function captureEnvironmentInfo() {
  if (typeof window === 'undefined') return {};

  return {
    userAgent: navigator.userAgent,
    platform: navigator.platform,
    language: navigator.language,
    cookiesEnabled: navigator.cookieEnabled,
    doNotTrack: navigator.doNotTrack,
    screenResolution: `${window.screen.width}x${window.screen.height}`,
    viewport: `${window.innerWidth}x${window.innerHeight}`,
    timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    timestamp: new Date().toISOString(),
    localTime: new Date().toLocaleString()
  };
}

/**
 * Analyzes the request details
 */
function analyzeRequest(url, options) {
  return {
    url,
    method: options?.method || 'GET',
    headers: options?.headers ? Object.keys(options.headers) : [],
    hasBody: !!options?.body,
    bodySize: options?.body ? options.body.length : 0,
    credentials: options?.credentials || 'omit',
    mode: options?.mode || 'cors',
    cache: options?.cache || 'default'
  };
}

/**
 * Main failure capture function
 */
export async function captureLoginFailure({
  error,
  response = null,
  url,
  requestOptions,
  username = null,
  timing = {}
}) {
  const startTime = timing.start || Date.now();
  const endTime = Date.now();
  const duration = endTime - startTime;

  const category = categorizeError(error, response, { duration });
  const networkConditions = await detectNetworkConditions();
  const environment = captureEnvironmentInfo();
  const requestAnalysis = analyzeRequest(url, requestOptions);

  const failureRecord = {
    id: `failure_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    timestamp: new Date().toISOString(),
    category,

    // Error details
    error: {
      message: error.message,
      name: error.name,
      stack: error.stack,
      cause: error.cause?.message
    },

    // Response details (if available)
    response: response ? {
      status: response.status,
      statusText: response.statusText,
      headers: Object.fromEntries(response.headers?.entries() || []),
      ok: response.ok,
      redirected: response.redirected,
      type: response.type,
      url: response.url
    } : null,

    // Request details
    request: requestAnalysis,

    // Timing information
    timing: {
      duration,
      start: startTime,
      end: endTime
    },

    // Network conditions
    network: networkConditions,

    // Environment
    environment,

    // User context
    user: {
      username,
      hadPreviousToken: typeof localStorage !== 'undefined' ?
        !!localStorage.getItem('medward_token') : false
    }
  };

  // Store client-side
  storeFailureClientSide(failureRecord);

  // Log to server-side audit (if possible)
  try {
    if (typeof window !== 'undefined') {
      // Send to server for persistent logging
      await sendFailureToServer(failureRecord);
    }
  } catch (serverError) {
    console.warn('[FailureAnalyzer] Could not send to server:', serverError.message);
  }

  return failureRecord;
}

/**
 * Stores failure in client-side storage
 */
function storeFailureClientSide(failureRecord) {
  if (typeof localStorage === 'undefined') return;

  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    const failures = stored ? JSON.parse(stored) : [];

    // Keep only last 50 failures
    failures.push(failureRecord);
    if (failures.length > 50) {
      failures.shift();
    }

    localStorage.setItem(STORAGE_KEY, JSON.stringify(failures));
    console.info('[FailureAnalyzer] Captured failure:', failureRecord.id);
  } catch (e) {
    console.error('[FailureAnalyzer] Storage error:', e);
  }
}

/**
 * Sends failure to server for persistent logging
 * Note: This is disabled for static deployments (GitHub Pages)
 */
async function sendFailureToServer(failureRecord) {
  // Skip server logging for static exports
  if (typeof window !== 'undefined' && window.location.hostname.includes('github.io')) {
    console.info('[FailureAnalyzer] Static deployment detected, skipping server logging');
    return;
  }

  // Non-blocking server logging for dynamic deployments
  fetch('/api/analytics/login-failures', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(failureRecord),
    keepalive: true // Ensures delivery even if page closes
  }).catch(err => {
    console.warn('[FailureAnalyzer] Server logging failed:', err.message);
  });
}

/**
 * Retrieves all stored failures from client-side
 */
export function getStoredFailures() {
  if (typeof localStorage === 'undefined') return [];

  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch (e) {
    console.error('[FailureAnalyzer] Retrieval error:', e);
    return [];
  }
}

/**
 * Clears stored failures
 */
export function clearStoredFailures() {
  if (typeof localStorage === 'undefined') return;
  localStorage.removeItem(STORAGE_KEY);
}

/**
 * Analyzes patterns in stored failures
 */
export function analyzeFailurePatterns(failures = null) {
  const data = failures || getStoredFailures();

  if (data.length === 0) {
    return {
      totalFailures: 0,
      analysis: 'No failures recorded'
    };
  }

  // Count by category
  const byCategory = data.reduce((acc, f) => {
    acc[f.category] = (acc[f.category] || 0) + 1;
    return acc;
  }, {});

  // Count by response status
  const byStatus = data.reduce((acc, f) => {
    if (f.response?.status) {
      acc[f.response.status] = (acc[f.response.status] || 0) + 1;
    }
    return acc;
  }, {});

  // Network conditions analysis
  const networkIssues = data.filter(f => !f.network.online).length;
  const slowNetwork = data.filter(f =>
    f.network.effectiveType === 'slow-2g' ||
    f.network.effectiveType === '2g'
  ).length;

  // Timing analysis
  const durations = data.map(f => f.timing.duration).filter(d => d);
  const avgDuration = durations.length > 0 ?
    durations.reduce((a, b) => a + b, 0) / durations.length : 0;
  const maxDuration = durations.length > 0 ? Math.max(...durations) : 0;

  // Time-based patterns
  const failuresByHour = data.reduce((acc, f) => {
    const hour = new Date(f.timestamp).getHours();
    acc[hour] = (acc[hour] || 0) + 1;
    return acc;
  }, {});

  // Most common errors
  const errorMessages = data.reduce((acc, f) => {
    acc[f.error.message] = (acc[f.error.message] || 0) + 1;
    return acc;
  }, {});

  const topErrors = Object.entries(errorMessages)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([msg, count]) => ({ message: msg, count }));

  // Generate recommendations
  const recommendations = generateRecommendations({
    byCategory,
    networkIssues,
    slowNetwork,
    avgDuration,
    maxDuration
  });

  return {
    totalFailures: data.length,
    dateRange: {
      first: data[0]?.timestamp,
      last: data[data.length - 1]?.timestamp
    },
    byCategory,
    byStatus,
    networkIssues,
    slowNetwork,
    timing: {
      average: Math.round(avgDuration),
      max: maxDuration
    },
    failuresByHour,
    topErrors,
    recommendations
  };
}

/**
 * Generates recommendations based on failure patterns
 */
function generateRecommendations(patterns) {
  const recommendations = [];

  // Network issues
  if (patterns.networkIssues > 0) {
    recommendations.push({
      priority: 'HIGH',
      issue: 'Network connectivity issues detected',
      suggestion: 'Implement offline detection and retry logic with exponential backoff'
    });
  }

  // CORS issues
  if (patterns.byCategory.CORS > 2) {
    recommendations.push({
      priority: 'HIGH',
      issue: 'Multiple CORS errors detected',
      suggestion: 'Verify Google Apps Script CORS configuration and ensure correct Access-Control headers'
    });
  }

  // Timeout issues
  if (patterns.byCategory.TIMEOUT > 0 || patterns.maxDuration > 30000) {
    recommendations.push({
      priority: 'MEDIUM',
      issue: 'Request timeouts or slow responses',
      suggestion: 'Implement request timeout handling and optimize backend performance'
    });
  }

  // Server errors
  if (patterns.byCategory.SERVER_ERROR > 0) {
    recommendations.push({
      priority: 'HIGH',
      issue: 'Server errors (5xx) detected',
      suggestion: 'Investigate backend logs and implement proper error handling on server'
    });
  }

  // Rate limiting
  if (patterns.byCategory.RATE_LIMIT > 0) {
    recommendations.push({
      priority: 'MEDIUM',
      issue: 'Rate limiting triggered',
      suggestion: 'Implement retry-after header handling and inform users of rate limits'
    });
  }

  // Slow network
  if (patterns.slowNetwork > 0) {
    recommendations.push({
      priority: 'LOW',
      issue: 'Slow network connections detected',
      suggestion: 'Optimize request payload size and consider implementing request compression'
    });
  }

  // High average duration
  if (patterns.avgDuration > 5000) {
    recommendations.push({
      priority: 'MEDIUM',
      issue: 'High average request duration',
      suggestion: 'Profile and optimize backend response time, consider caching strategies'
    });
  }

  return recommendations;
}

/**
 * Generates a detailed diagnostic report
 */
export function generateDiagnosticReport(failureId = null) {
  const failures = getStoredFailures();

  if (failures.length === 0) {
    return 'No failures to analyze';
  }

  const targetFailure = failureId ?
    failures.find(f => f.id === failureId) :
    failures[failures.length - 1];

  if (!targetFailure) {
    return 'Failure not found';
  }

  const patterns = analyzeFailurePatterns(failures);

  return {
    failure: targetFailure,
    context: {
      totalFailures: failures.length,
      similarFailures: failures.filter(f =>
        f.category === targetFailure.category
      ).length,
      recentFailures: failures.filter(f => {
        const diff = new Date(targetFailure.timestamp) - new Date(f.timestamp);
        return Math.abs(diff) < 3600000; // Within 1 hour
      }).length
    },
    patterns,
    diagnosis: diagnoseFault(targetFailure),
    suggestedFixes: getSuggestedFixes(targetFailure)
  };
}

/**
 * Diagnoses the root cause of a specific failure
 */
function diagnoseFault(failure) {
  const diagnosis = {
    category: failure.category,
    severity: 'UNKNOWN',
    rootCause: 'Unknown',
    technicalDetails: []
  };

  switch (failure.category) {
    case ERROR_CATEGORIES.NETWORK:
      diagnosis.severity = 'HIGH';
      diagnosis.rootCause = 'Network connectivity issue';
      diagnosis.technicalDetails = [
        `User was ${failure.network.online ? 'online' : 'offline'}`,
        `Connection type: ${failure.network.effectiveType}`,
        `Request duration: ${failure.timing.duration}ms`,
        'Possible causes: DNS failure, firewall, network interruption'
      ];
      break;

    case ERROR_CATEGORIES.CORS:
      diagnosis.severity = 'HIGH';
      diagnosis.rootCause = 'Cross-Origin Resource Sharing (CORS) policy violation';
      diagnosis.technicalDetails = [
        'Browser blocked the request due to CORS policy',
        `Request mode: ${failure.request.mode}`,
        `Request credentials: ${failure.request.credentials}`,
        'Check Access-Control-Allow-Origin header on server'
      ];
      break;

    case ERROR_CATEGORIES.TIMEOUT:
      diagnosis.severity = 'MEDIUM';
      diagnosis.rootCause = 'Request timeout';
      diagnosis.technicalDetails = [
        `Request took ${failure.timing.duration}ms`,
        `Network RTT: ${failure.network.rtt}ms`,
        'Server may be overloaded or unresponsive'
      ];
      break;

    case ERROR_CATEGORIES.SERVER_ERROR:
      diagnosis.severity = 'HIGH';
      diagnosis.rootCause = `Server error (${failure.response?.status})`;
      diagnosis.technicalDetails = [
        `Status: ${failure.response?.status} ${failure.response?.statusText}`,
        'Backend service encountered an error',
        'Check server logs for details'
      ];
      break;

    case ERROR_CATEGORIES.RATE_LIMIT:
      diagnosis.severity = 'LOW';
      diagnosis.rootCause = 'Rate limit exceeded';
      diagnosis.technicalDetails = [
        'Too many requests in short time period',
        `Retry-After: ${failure.response?.headers['retry-after'] || 'not specified'}`,
        'Implement exponential backoff'
      ];
      break;

    case ERROR_CATEGORIES.PARSE_ERROR:
      diagnosis.severity = 'MEDIUM';
      diagnosis.rootCause = 'Response parsing failed';
      diagnosis.technicalDetails = [
        'Server returned invalid JSON',
        `Response type: ${failure.response?.type}`,
        'Check response content-type header'
      ];
      break;

    case ERROR_CATEGORIES.VALIDATION:
      diagnosis.severity = 'LOW';
      diagnosis.rootCause = 'Request validation failed';
      diagnosis.technicalDetails = [
        'Invalid request parameters',
        `Username provided: ${!!failure.user.username}`,
        'Check input validation logic'
      ];
      break;

    default:
      diagnosis.severity = 'UNKNOWN';
      diagnosis.rootCause = failure.error.message;
      diagnosis.technicalDetails = [
        `Error: ${failure.error.name}`,
        `Message: ${failure.error.message}`
      ];
  }

  return diagnosis;
}

/**
 * Provides suggested fixes for a specific failure
 */
function getSuggestedFixes(failure) {
  const fixes = [];

  switch (failure.category) {
    case ERROR_CATEGORIES.NETWORK:
      fixes.push({
        fix: 'Implement retry logic with exponential backoff',
        code: `
const maxRetries = 3;
let attempt = 0;
while (attempt < maxRetries) {
  try {
    const response = await fetch(url, options);
    return response;
  } catch (error) {
    attempt++;
    if (attempt >= maxRetries) throw error;
    await new Promise(r => setTimeout(r, Math.pow(2, attempt) * 1000));
  }
}`
      });
      fixes.push({
        fix: 'Add offline detection',
        code: `
if (!navigator.onLine) {
  throw new Error('No internet connection. Please check your network.');
}`
      });
      break;

    case ERROR_CATEGORIES.CORS:
      fixes.push({
        fix: 'Ensure Google Apps Script returns proper CORS headers',
        code: `
function doPost(e) {
  const output = ContentService.createTextOutput(
    JSON.stringify({success: true})
  );
  output.setMimeType(ContentService.MimeType.JSON);
  output.setHeader('Access-Control-Allow-Origin', '*');
  output.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  return output;
}`
      });
      fixes.push({
        fix: 'Use credentials: "include" if needed',
        code: `
const response = await fetch(url, {
  ...options,
  credentials: 'include',
  mode: 'cors'
});`
      });
      break;

    case ERROR_CATEGORIES.TIMEOUT:
      fixes.push({
        fix: 'Add request timeout handling',
        code: `
const controller = new AbortController();
const timeoutId = setTimeout(() => controller.abort(), 30000);

try {
  const response = await fetch(url, {
    ...options,
    signal: controller.signal
  });
  clearTimeout(timeoutId);
  return response;
} catch (error) {
  if (error.name === 'AbortError') {
    throw new Error('Request timeout after 30 seconds');
  }
  throw error;
}`
      });
      break;

    case ERROR_CATEGORIES.SERVER_ERROR:
      fixes.push({
        fix: 'Add proper server-side error handling',
        code: `
try {
  // Your server logic
} catch (error) {
  console.error('Server error:', error);
  return NextResponse.json(
    { error: 'Internal server error', details: error.message },
    { status: 500 }
  );
}`
      });
      break;

    case ERROR_CATEGORIES.RATE_LIMIT:
      fixes.push({
        fix: 'Handle rate limiting with retry-after',
        code: `
if (response.status === 429) {
  const retryAfter = response.headers.get('Retry-After');
  const waitTime = retryAfter ? parseInt(retryAfter) * 1000 : 60000;
  await new Promise(r => setTimeout(r, waitTime));
  return fetch(url, options); // Retry
}`
      });
      break;

    default:
      fixes.push({
        fix: 'Add comprehensive error handling',
        code: `
try {
  const response = await fetch(url, options);
  if (!response.ok) {
    throw new Error(\`Server returned \${response.status}\`);
  }
  const data = await response.json();
  return data;
} catch (error) {
  console.error('Request failed:', error);
  throw error;
}`
      });
  }

  return fixes;
}

/**
 * Export statistics for monitoring
 */
export function getFailureStatistics(timeRange = null) {
  const failures = getStoredFailures();

  let filtered = failures;
  if (timeRange) {
    const cutoff = Date.now() - timeRange;
    filtered = failures.filter(f => new Date(f.timestamp) > cutoff);
  }

  const patterns = analyzeFailurePatterns(filtered);

  return {
    summary: {
      total: filtered.length,
      last24Hours: failures.filter(f => {
        const age = Date.now() - new Date(f.timestamp);
        return age < 86400000;
      }).length,
      lastHour: failures.filter(f => {
        const age = Date.now() - new Date(f.timestamp);
        return age < 3600000;
      }).length
    },
    patterns,
    healthScore: calculateHealthScore(patterns)
  };
}

/**
 * Calculates a health score (0-100) based on failure patterns
 */
function calculateHealthScore(patterns) {
  if (patterns.totalFailures === 0) return 100;

  let score = 100;

  // Deduct for each category
  score -= (patterns.byCategory.NETWORK || 0) * 10;
  score -= (patterns.byCategory.CORS || 0) * 15;
  score -= (patterns.byCategory.SERVER_ERROR || 0) * 20;
  score -= (patterns.byCategory.TIMEOUT || 0) * 5;
  score -= (patterns.byCategory.RATE_LIMIT || 0) * 3;

  return Math.max(0, Math.min(100, score));
}

export { ERROR_CATEGORIES };
