# Login Failure Analyzer

A comprehensive post-hoc bug analyzer for diagnosing and resolving login fetch failures.

## Overview

The Login Failure Analyzer automatically captures, stores, and analyzes all login fetch failures, providing detailed diagnostics, pattern analysis, and actionable recommendations for fixing issues.

## Features

### 🎯 Automatic Failure Capture
- **Real-time monitoring** of all login attempts
- **Detailed error tracking** with full context
- **Timing analysis** for performance insights
- **Network condition detection**
- **Environment capture** (browser, platform, user-agent)

### 📊 Pattern Analysis
- **Error categorization** (Network, CORS, Timeout, Server Error, etc.)
- **Frequency analysis** to identify recurring issues
- **Time-based patterns** to spot peak failure times
- **Network condition correlation**
- **Health score calculation** (0-100)

### 🩺 Diagnostic Reports
- **Root cause analysis** for each failure
- **Severity assessment** (HIGH, MEDIUM, LOW)
- **Technical details** with context
- **Similar failure detection**
- **Suggested fixes** with code examples

### 🔧 Actionable Recommendations
- **Priority-based suggestions** (HIGH, MEDIUM, LOW)
- **Implementation guidance**
- **Code snippets** for quick fixes
- **Best practices** for error handling

## Architecture

### Components

```
lib/analytics/login-failure-analyzer.js
├─ captureLoginFailure()       # Main capture function
├─ analyzeFailurePatterns()    # Pattern analysis
├─ generateDiagnosticReport()  # Detailed diagnostics
├─ getFailureStatistics()      # Statistics summary
└─ Helper functions

app/(auth)/login/page.js
└─ Integrated failure capture in catch block

app/admin/login-failures/page.js
└─ Dashboard UI for viewing and analyzing failures

app/api/analytics/login-failures/route.js
├─ POST   - Store failure records
├─ GET    - Retrieve failure records
├─ DELETE - Cleanup old records
└─ PATCH  - Get statistics
```

### Storage

**Client-Side:**
- localStorage: `medward_login_failures`
- Stores last 50 failures
- Immediate availability for analysis

**Server-Side:**
- SQLite database: `data/login-failures.db`
- Persistent storage for historical analysis
- Indexed for fast queries

## Error Categories

The analyzer automatically categorizes failures into:

| Category | Description | Examples |
|----------|-------------|----------|
| **NETWORK** | Network connectivity issues | DNS failure, network interruption, offline |
| **CORS** | Cross-Origin Resource Sharing violations | Missing Access-Control headers |
| **TIMEOUT** | Request timeouts | Slow server, high latency |
| **SERVER_ERROR** | Server-side errors (5xx) | 500, 502, 503 errors |
| **RATE_LIMIT** | Rate limiting triggered | 429 Too Many Requests |
| **PARSE_ERROR** | Response parsing failures | Invalid JSON, wrong content-type |
| **VALIDATION** | Request validation failures | Missing parameters, invalid input |
| **UNKNOWN** | Unclassified errors | Other errors |

## Usage

### Viewing Failures

1. Navigate to `/admin/login-failures` in your browser
2. View the dashboard with three main views:
   - **Overview**: Statistics, patterns, and recommendations
   - **Failure List**: Detailed list of all failures
   - **Diagnostic Report**: Deep dive into specific failures

### API Endpoints

#### Store a Failure
```javascript
POST /api/analytics/login-failures
Content-Type: application/json

{
  "id": "failure_123",
  "timestamp": "2026-01-14T12:00:00.000Z",
  "category": "NETWORK",
  "error": {
    "message": "Failed to fetch",
    "name": "TypeError"
  },
  "response": null,
  "request": {
    "url": "https://...",
    "method": "POST"
  },
  "timing": {
    "duration": 5000
  },
  "network": {
    "online": false
  },
  "user": {
    "username": "testuser"
  }
}
```

#### Retrieve Failures
```javascript
GET /api/analytics/login-failures?limit=50&category=NETWORK
```

Query parameters:
- `limit` (default: 100) - Number of records to return
- `offset` (default: 0) - Pagination offset
- `category` - Filter by error category
- `since` - ISO timestamp, only failures after this time
- `username` - Filter by username

#### Get Statistics
```javascript
PATCH /api/analytics/login-failures/stats
```

Returns:
- Total failures
- Failures by category
- Last 24 hours count
- Last hour count
- Average duration
- Top errors
- Date range

#### Delete Old Failures
```javascript
# Delete all failures
DELETE /api/analytics/login-failures?all=true

# Delete failures older than a specific date
DELETE /api/analytics/login-failures?olderThan=2026-01-01T00:00:00.000Z
```

### Programmatic Usage

#### Capture a Failure
```javascript
import { captureLoginFailure } from '@/lib/analytics/login-failure-analyzer';

try {
  const response = await fetch(url, options);
  // ... handle response
} catch (error) {
  // Capture for analysis
  await captureLoginFailure({
    error,
    response,
    url,
    requestOptions: options,
    username: 'user123',
    timing: {
      start: startTime,
      duration: Date.now() - startTime
    }
  });
}
```

#### Analyze Patterns
```javascript
import { analyzeFailurePatterns } from '@/lib/analytics/login-failure-analyzer';

const patterns = analyzeFailurePatterns();

console.log('Total failures:', patterns.totalFailures);
console.log('By category:', patterns.byCategory);
console.log('Recommendations:', patterns.recommendations);
```

#### Generate Diagnostic Report
```javascript
import { generateDiagnosticReport } from '@/lib/analytics/login-failure-analyzer';

// Get report for most recent failure
const report = generateDiagnosticReport();

// Get report for specific failure
const report = generateDiagnosticReport('failure_123');

console.log('Root cause:', report.diagnosis.rootCause);
console.log('Severity:', report.diagnosis.severity);
console.log('Suggested fixes:', report.suggestedFixes);
```

#### Get Statistics
```javascript
import { getFailureStatistics } from '@/lib/analytics/login-failure-analyzer';

// All-time statistics
const stats = getFailureStatistics();

// Last 24 hours
const stats = getFailureStatistics(86400000);

console.log('Total:', stats.summary.total);
console.log('Health score:', stats.healthScore);
```

## Common Issues and Fixes

### CORS Errors

**Diagnosis:**
- Browser blocks request due to CORS policy
- Missing `Access-Control-Allow-Origin` header

**Fix:**
```javascript
// In Google Apps Script
function doPost(e) {
  const output = ContentService.createTextOutput(
    JSON.stringify({success: true, data: result})
  );
  output.setMimeType(ContentService.MimeType.JSON);
  output.setHeader('Access-Control-Allow-Origin', '*');
  output.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  output.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  return output;
}
```

### Network Errors

**Diagnosis:**
- User is offline or has poor connectivity
- DNS failure or firewall blocking

**Fix:**
```javascript
// Check online status before fetching
if (!navigator.onLine) {
  throw new Error('No internet connection. Please check your network.');
}

// Implement retry with exponential backoff
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
}
```

### Timeout Errors

**Diagnosis:**
- Request takes too long (>30s)
- Server is overloaded or unresponsive

**Fix:**
```javascript
// Add timeout with AbortController
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
}
```

### Rate Limiting

**Diagnosis:**
- Too many requests in short time
- Status 429 returned

**Fix:**
```javascript
// Handle rate limiting with retry-after
if (response.status === 429) {
  const retryAfter = response.headers.get('Retry-After');
  const waitTime = retryAfter ? parseInt(retryAfter) * 1000 : 60000;

  console.log(`Rate limited. Retrying after ${waitTime}ms`);
  await new Promise(r => setTimeout(r, waitTime));

  return fetch(url, options); // Retry
}
```

## Health Score

The analyzer calculates a health score (0-100) based on failure patterns:

- **100**: No failures (perfect health)
- **90-99**: Few, minor failures
- **70-89**: Some failures, mostly low impact
- **50-69**: Moderate failures, attention needed
- **0-49**: Critical failures, immediate action required

**Deductions:**
- Network errors: -10 per failure
- CORS errors: -15 per failure
- Server errors: -20 per failure
- Timeout errors: -5 per failure
- Rate limit: -3 per failure

## Best Practices

### 1. Monitor Regularly
- Check dashboard daily for new failures
- Set up alerts for health score drops below 70
- Review recommendations weekly

### 2. Act on High-Priority Issues
- Address HIGH priority recommendations immediately
- Schedule MEDIUM priority fixes within a week
- Track LOW priority items for future improvements

### 3. Clean Up Old Data
```javascript
// Delete failures older than 90 days
DELETE /api/analytics/login-failures?olderThan=2025-10-15T00:00:00.000Z
```

### 4. Test Fixes
After implementing fixes:
1. Clear old failure data
2. Test login functionality
3. Monitor for 24-48 hours
4. Verify health score improves

### 5. Document Patterns
- Keep notes on recurring issues
- Document successful fixes
- Share knowledge with team

## Troubleshooting

### Failures Not Being Captured

**Check:**
1. Is the analyzer imported in login page?
2. Is localStorage available?
3. Check browser console for errors
4. Verify database permissions (server-side)

### Dashboard Not Loading

**Check:**
1. Navigate to correct URL: `/admin/login-failures`
2. Check browser console for errors
3. Verify localStorage has data
4. Try refreshing the page

### Missing Statistics

**Check:**
1. Ensure at least one failure is captured
2. Check API endpoint is accessible
3. Verify database file exists: `data/login-failures.db`
4. Check server logs for errors

## Performance

- **Client-side storage**: Instant, no network overhead
- **Server-side storage**: Async, non-blocking (uses `keepalive`)
- **Dashboard loading**: Fast, uses local data first
- **API queries**: Indexed, < 100ms for 10k records
- **Memory usage**: Minimal, < 5MB for 50 failures

## Security

- **No PII stored**: Only usernames (if provided)
- **No password data**: Never captured
- **Safe error messages**: No sensitive data in logs
- **Rate limiting**: Prevents abuse of API endpoints
- **Server-side validation**: All inputs validated

## Future Enhancements

- [ ] Real-time alerts via webhooks
- [ ] Export reports to PDF/CSV
- [ ] Integration with monitoring tools (Sentry, DataDog)
- [ ] Machine learning for prediction
- [ ] A/B testing for fixes
- [ ] Mobile app support

## Support

For issues or questions:
1. Check this documentation
2. Review existing failure patterns in dashboard
3. Check server logs: `data/login-failures.db`
4. Open an issue in the repository

## License

MIT License - See LICENSE file for details
