/**
 * Bug Analyzer
 * Analyzes error patterns from PostHog data to identify and categorize bugs
 */

import { getServerPostHog } from './posthog-server.js';

/**
 * Bug severity levels
 */
export const BugSeverity = {
  CRITICAL: 'critical',
  HIGH: 'high',
  MEDIUM: 'medium',
  LOW: 'low'
};

/**
 * Bug categories
 */
export const BugCategory = {
  OCR: 'ocr',
  AI: 'ai',
  NETWORK: 'network',
  VALIDATION: 'validation',
  RENDERING: 'rendering',
  API: 'api',
  UNKNOWN: 'unknown'
};

/**
 * Analyze bug patterns from error events
 * @param {Array} errorEvents - Array of error events from PostHog
 * @returns {Object} Analysis results with patterns and recommendations
 */
export function analyzeBugPatterns(errorEvents) {
  if (!errorEvents || errorEvents.length === 0) {
    return {
      totalErrors: 0,
      patterns: [],
      recommendations: [],
      summary: 'No errors to analyze'
    };
  }

  const patterns = [];
  const errorGroups = groupErrorsByType(errorEvents);

  // Analyze each error group
  for (const [errorType, errors] of Object.entries(errorGroups)) {
    const pattern = analyzeErrorGroup(errorType, errors);
    if (pattern) {
      patterns.push(pattern);
    }
  }

  // Sort by frequency and severity
  patterns.sort((a, b) => {
    const severityWeight = { critical: 4, high: 3, medium: 2, low: 1 };
    const aScore = (severityWeight[a.severity] || 0) * a.frequency;
    const bScore = (severityWeight[b.severity] || 0) * b.frequency;
    return bScore - aScore;
  });

  // Generate recommendations
  const recommendations = generateRecommendations(patterns);

  return {
    totalErrors: errorEvents.length,
    uniqueErrorTypes: patterns.length,
    patterns,
    recommendations,
    timeRange: {
      start: errorEvents[0]?.timestamp,
      end: errorEvents[errorEvents.length - 1]?.timestamp
    },
    summary: generateSummary(patterns)
  };
}

/**
 * Group errors by error message/type
 * @param {Array} errorEvents - Error events
 * @returns {Object} Grouped errors
 */
function groupErrorsByType(errorEvents) {
  const groups = {};

  errorEvents.forEach(event => {
    const errorMsg = event.properties?.error_message || 'Unknown error';
    const key = normalizeErrorMessage(errorMsg);

    if (!groups[key]) {
      groups[key] = [];
    }
    groups[key].push(event);
  });

  return groups;
}

/**
 * Normalize error message for grouping
 * @param {string} message - Error message
 * @returns {string} Normalized message
 */
function normalizeErrorMessage(message) {
  // Remove specific values, IDs, timestamps
  return message
    .replace(/\d+/g, 'N')
    .replace(/[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}/gi, 'UUID')
    .replace(/https?:\/\/[^\s]+/gi, 'URL')
    .toLowerCase()
    .trim();
}

/**
 * Analyze a group of similar errors
 * @param {string} errorType - Error type/message
 * @param {Array} errors - Array of similar errors
 * @returns {Object} Pattern analysis
 */
function analyzeErrorGroup(errorType, errors) {
  const firstError = errors[0];
  const category = categorizeError(firstError);
  const severity = determineSeverity(errors, category);

  // Extract common context
  const contexts = errors.map(e => e.properties || {});
  const commonContext = findCommonContext(contexts);

  // Find affected users
  const affectedUsers = new Set(errors.map(e => e.distinct_id).filter(Boolean));

  return {
    errorType,
    category,
    severity,
    frequency: errors.length,
    affectedUsers: affectedUsers.size,
    firstOccurrence: errors[0].timestamp,
    lastOccurrence: errors[errors.length - 1].timestamp,
    commonContext,
    sampleError: {
      message: firstError.properties?.error_message,
      stack: firstError.properties?.error_stack?.split('\n').slice(0, 3).join('\n')
    },
    trend: calculateTrend(errors)
  };
}

/**
 * Categorize error based on properties
 * @param {Object} error - Error event
 * @returns {string} Category
 */
function categorizeError(error) {
  const props = error.properties || {};
  const message = (props.error_message || '').toLowerCase();
  const category = props.category?.toLowerCase();

  if (category === 'ocr' || message.includes('ocr') || message.includes('tesseract') || message.includes('vision')) {
    return BugCategory.OCR;
  }
  if (category === 'ai' || message.includes('openai') || message.includes('gpt') || message.includes('interpretation')) {
    return BugCategory.AI;
  }
  if (message.includes('network') || message.includes('fetch') || message.includes('timeout')) {
    return BugCategory.NETWORK;
  }
  if (message.includes('validation') || message.includes('invalid') || message.includes('required')) {
    return BugCategory.VALIDATION;
  }
  if (message.includes('render') || message.includes('component') || message.includes('react')) {
    return BugCategory.RENDERING;
  }
  if (message.includes('api') || message.includes('endpoint') || message.includes('route')) {
    return BugCategory.API;
  }

  return BugCategory.UNKNOWN;
}

/**
 * Determine severity based on frequency and impact
 * @param {Array} errors - Array of errors
 * @param {string} category - Error category
 * @returns {string} Severity level
 */
function determineSeverity(errors, category) {
  const frequency = errors.length;
  const affectedUsers = new Set(errors.map(e => e.distinct_id)).size;

  // Critical if affects many users or very frequent
  if (affectedUsers > 10 || frequency > 50) {
    return BugSeverity.CRITICAL;
  }

  // High if OCR/AI failure (core functionality)
  if ((category === BugCategory.OCR || category === BugCategory.AI) && frequency > 5) {
    return BugSeverity.HIGH;
  }

  // Medium if moderate frequency
  if (frequency > 10 || affectedUsers > 3) {
    return BugSeverity.MEDIUM;
  }

  return BugSeverity.LOW;
}

/**
 * Find common context across errors
 * @param {Array} contexts - Array of error contexts
 * @returns {Object} Common context properties
 */
function findCommonContext(contexts) {
  if (contexts.length === 0) return {};

  const commonKeys = {};

  // Find keys that appear in all contexts
  Object.keys(contexts[0]).forEach(key => {
    const values = contexts.map(c => c[key]).filter(Boolean);
    if (values.length === contexts.length) {
      // Check if all values are the same
      const uniqueValues = [...new Set(values)];
      if (uniqueValues.length === 1) {
        commonKeys[key] = uniqueValues[0];
      } else if (uniqueValues.length <= 3) {
        commonKeys[key] = uniqueValues;
      }
    }
  });

  return commonKeys;
}

/**
 * Calculate error trend
 * @param {Array} errors - Array of errors
 * @returns {string} Trend (increasing, stable, decreasing)
 */
function calculateTrend(errors) {
  if (errors.length < 3) return 'stable';

  const midpoint = Math.floor(errors.length / 2);
  const firstHalf = errors.slice(0, midpoint);
  const secondHalf = errors.slice(midpoint);

  const firstAvg = firstHalf.length;
  const secondAvg = secondHalf.length;

  if (secondAvg > firstAvg * 1.5) return 'increasing';
  if (secondAvg < firstAvg * 0.5) return 'decreasing';
  return 'stable';
}

/**
 * Generate recommendations based on patterns
 * @param {Array} patterns - Bug patterns
 * @returns {Array} Recommendations
 */
function generateRecommendations(patterns) {
  const recommendations = [];

  patterns.forEach(pattern => {
    switch (pattern.category) {
      case BugCategory.OCR:
        if (pattern.severity === BugSeverity.CRITICAL || pattern.severity === BugSeverity.HIGH) {
          recommendations.push({
            priority: 'high',
            category: pattern.category,
            issue: pattern.errorType,
            recommendation: 'Implement retry logic for OCR failures and improve error handling',
            action: 'Add exponential backoff and fallback to alternative OCR method'
          });
        }
        break;

      case BugCategory.AI:
        if (pattern.frequency > 10) {
          recommendations.push({
            priority: 'high',
            category: pattern.category,
            issue: pattern.errorType,
            recommendation: 'Check OpenAI API rate limits and implement request queuing',
            action: 'Add rate limiting and smart caching to reduce API calls'
          });
        }
        break;

      case BugCategory.NETWORK:
        recommendations.push({
          priority: 'medium',
          category: pattern.category,
          issue: pattern.errorType,
          recommendation: 'Improve network error handling and add offline support',
          action: 'Implement service worker caching and retry mechanisms'
        });
        break;

      case BugCategory.VALIDATION:
        recommendations.push({
          priority: 'low',
          category: pattern.category,
          issue: pattern.errorType,
          recommendation: 'Add client-side validation before API calls',
          action: 'Implement input validation and user-friendly error messages'
        });
        break;
    }
  });

  return recommendations;
}

/**
 * Generate summary of bug patterns
 * @param {Array} patterns - Bug patterns
 * @returns {string} Summary text
 */
function generateSummary(patterns) {
  if (patterns.length === 0) {
    return 'No significant bug patterns detected';
  }

  const critical = patterns.filter(p => p.severity === BugSeverity.CRITICAL).length;
  const high = patterns.filter(p => p.severity === BugSeverity.HIGH).length;
  const categories = [...new Set(patterns.map(p => p.category))];

  let summary = `Found ${patterns.length} bug pattern(s). `;

  if (critical > 0) {
    summary += `${critical} critical issue(s) require immediate attention. `;
  }
  if (high > 0) {
    summary += `${high} high-priority issue(s) detected. `;
  }

  summary += `Main affected areas: ${categories.join(', ')}.`;

  return summary;
}

/**
 * Get bug statistics
 * @param {Array} errorEvents - Error events
 * @returns {Object} Statistics
 */
export function getBugStats(errorEvents) {
  const analysis = analyzeBugPatterns(errorEvents);

  const bySeverity = {
    critical: analysis.patterns.filter(p => p.severity === BugSeverity.CRITICAL).length,
    high: analysis.patterns.filter(p => p.severity === BugSeverity.HIGH).length,
    medium: analysis.patterns.filter(p => p.severity === BugSeverity.MEDIUM).length,
    low: analysis.patterns.filter(p => p.severity === BugSeverity.LOW).length
  };

  const byCategory = {};
  Object.values(BugCategory).forEach(cat => {
    byCategory[cat] = analysis.patterns.filter(p => p.category === cat).length;
  });

  return {
    total: analysis.totalErrors,
    uniquePatterns: analysis.uniqueErrorTypes,
    bySeverity,
    byCategory,
    topIssues: analysis.patterns.slice(0, 5),
    recommendations: analysis.recommendations
  };
}

export default {
  analyzeBugPatterns,
  getBugStats,
  BugSeverity,
  BugCategory
};
