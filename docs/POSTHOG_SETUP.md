# PostHog Bug Analyzer Setup Guide

Comprehensive error tracking and bug analysis system powered by PostHog.

## 📊 What's Included

### 1. **Automatic Error Tracking**
- Client-side JavaScript errors
- OCR failures and low confidence scans
- AI/GPT API errors and rate limits
- Network timeouts and API failures
- React component errors (Error Boundary)

### 2. **Bug Pattern Analysis**
- Automatic grouping of similar errors
- Severity classification (Critical, High, Medium, Low)
- Category detection (OCR, AI, Network, Validation, etc.)
- Trend analysis (increasing, stable, decreasing)
- Affected user count

### 3. **Intelligent Recommendations**
- Actionable fixes based on error patterns
- Priority-based recommendations
- Category-specific solutions

### 4. **Visual Dashboard**
- Real-time bug analytics
- Error frequency charts
- Severity breakdown
- Stack trace viewer

---

## 🚀 Quick Setup

### Step 1: Create PostHog Account

1. Go to [PostHog](https://app.posthog.com/signup)
2. Create a free account (10,000 events/month free)
3. Create a new project

### Step 2: Get Your API Key

1. Navigate to **Project Settings** → **Project API Key**
2. Copy your project API key (starts with `phc_`)

### Step 3: Configure Environment

Add to `.env.local`:

```bash
NEXT_PUBLIC_POSTHOG_KEY=phc_your_api_key_here
# Optional: If self-hosting PostHog
# NEXT_PUBLIC_POSTHOG_HOST=https://your-posthog-instance.com
```

### Step 4: Restart Development Server

```bash
npm run dev
```

### Step 5: Verify Setup

1. Trigger an error (upload invalid image, etc.)
2. Check browser console for: `[PostHog] Error tracked:`
3. Visit PostHog dashboard to see events

---

## 📈 Features

### Automatic Tracking

The system automatically tracks:

#### **OCR Events**
- `ocr_start` - When OCR processing begins
- `ocr_complete` - Successful text extraction
- `ocr_failed` - OCR failure with context
- `ocr_low_confidence` - Low confidence warnings

```javascript
trackOCR('complete', {
  method: 'google-cloud-vision',
  confidence: 0.98,
  fileType: 'image/jpeg',
  fileSize: 2457600,
  textLength: 1234,
  processingTime: 2340
});
```

#### **AI Events**
- `ai_start` - AI interpretation begins
- `ai_complete` - Successful interpretation
- `ai_failed` - AI/GPT errors

```javascript
trackAI('complete', {
  provider: 'openai_gpt4',
  documentType: 'lab',
  processingTime: 3200,
  findingsCount: 8,
  usedAI: true
});
```

#### **Errors**
- All JavaScript exceptions
- Network failures
- Validation errors
- Component crashes

```javascript
trackError(error, {
  page: 'scanner',
  file_type: 'image/jpeg',
  processing_time: 5000
});
```

### Manual Tracking

Add custom events:

```javascript
import { trackEvent, trackUserAction } from '@/lib/analytics/posthog-client';

// Custom event
trackEvent('report_generated', {
  documentType: 'lab',
  pearls_count: 5
});

// User action
trackUserAction('button_click', {
  button_name: 'generate_presentation'
});
```

---

## 🐛 Bug Dashboard

Access the bug analytics dashboard:

```
http://localhost:3000/analytics/bugs
```

### Features

1. **Summary Cards**
   - Total errors
   - Critical issues
   - Unique patterns
   - High priority bugs

2. **Bug Patterns**
   - Grouped by error type
   - Severity indicators
   - Frequency and trend data
   - Affected user count
   - Stack traces

3. **Smart Recommendations**
   - Priority-based fixes
   - Category-specific solutions
   - Actionable next steps

4. **Time Range Filters**
   - Last 24 hours
   - Last 7 days
   - Last 30 days
   - Last 90 days

---

## 🔍 Bug Analyzer

### How It Works

1. **Collects Error Events** from PostHog
2. **Groups Similar Errors** by normalizing messages
3. **Analyzes Patterns**:
   - Frequency
   - Affected users
   - Time trends
   - Common context

4. **Categorizes** into:
   - 📷 OCR
   - 🤖 AI
   - 🌐 Network
   - ✅ Validation
   - 🎨 Rendering
   - 🔌 API

5. **Determines Severity**:
   - **Critical**: >10 users or >50 occurrences
   - **High**: Core functionality (OCR/AI) with >5 occurrences
   - **Medium**: >10 occurrences or >3 users
   - **Low**: Everything else

6. **Generates Recommendations** with actionable fixes

### API Endpoint

```bash
GET /api/analytics/bugs?days=7&limit=100
```

Response:
```json
{
  "success": true,
  "dateRange": {
    "start": "2026-01-07T00:00:00.000Z",
    "end": "2026-01-14T00:00:00.000Z",
    "days": 7
  },
  "analysis": {
    "totalErrors": 10,
    "uniqueErrorTypes": 3,
    "patterns": [...],
    "recommendations": [...],
    "summary": "Found 3 bug pattern(s). 1 critical issue(s) require immediate attention."
  },
  "stats": {
    "total": 10,
    "uniquePatterns": 3,
    "bySeverity": {
      "critical": 1,
      "high": 1,
      "medium": 1,
      "low": 0
    },
    "byCategory": {
      "ocr": 5,
      "ai": 3,
      "network": 2
    }
  }
}
```

---

## 🔧 Advanced Configuration

### User Identification

Track users across sessions:

```javascript
import { identifyUser } from '@/lib/analytics/posthog-client';

identifyUser('user_123', {
  email: 'doctor@hospital.com',
  role: 'physician',
  department: 'internal_medicine'
});
```

### Session Recording

PostHog can record user sessions for debugging:

```javascript
// Already enabled in posthog-client.js
session_recording: {
  recordCrossOriginIframes: false
}
```

### Feature Flags

Use PostHog feature flags for gradual rollouts:

```javascript
import { getPostHog } from '@/lib/analytics/posthog-client';

const posthog = getPostHog();
if (posthog?.isFeatureEnabled('new-ocr-engine')) {
  // Use new OCR engine
}
```

---

## 📊 PostHog Dashboard

### Recommended Views

1. **Errors Dashboard**
   - Filter events: `$exception`
   - Group by: `error_message`
   - Chart type: Time series

2. **OCR Performance**
   - Filter events: `ocr_complete`
   - Metric: Average `ocr_confidence`
   - Group by: `ocr_method`

3. **AI Usage**
   - Filter events: `ai_complete`
   - Metric: Count
   - Group by: `ai_provider`

4. **User Funnel**
   - Scanner page view
   - OCR complete
   - AI complete
   - Report saved

---

## 🛠️ Troubleshooting

### PostHog Not Tracking

**Issue**: No events showing in PostHog

**Solutions**:
1. Check API key in `.env.local`
2. Verify browser console: `[PostHog] Initialized successfully`
3. Check PostHog project is active
4. Disable ad blockers (may block PostHog)

### Missing Events

**Issue**: Some events not appearing

**Solutions**:
1. Check event quotas (free: 10k/month)
2. Verify `initPostHog()` called before tracking
3. Check browser network tab for failed requests

### Dashboard Shows "PostHog not configured"

**Issue**: API endpoint returns error

**Solutions**:
1. Add `NEXT_PUBLIC_POSTHOG_KEY` to `.env.local`
2. Restart development server
3. Key must start with `phc_`

---

## 💰 Pricing

### PostHog Cloud (Free Tier)

- **10,000 events/month** - FREE
- Unlimited team members
- 1 year data retention
- All features included

### Typical Usage

For a medical app with **100 scans/day**:

**Events per scan:**
- 1x OCR start
- 1x OCR complete
- 1x AI start
- 1x AI complete
- 1x Page view
- ~0.5x Errors (occasional)

**Total**: ~5.5 events/scan × 100 scans/day × 30 days = **16,500 events/month**

**Cost**: $15-20/month (after free tier)

[View Pricing](https://posthog.com/pricing)

---

## 🔒 Privacy & Security

### Data Collection

PostHog tracks:
- ✅ Error messages and stack traces
- ✅ User actions (anonymized by default)
- ✅ Performance metrics
- ❌ PHI/PII (automatically filtered)

### HIPAA Compliance

For healthcare apps:
1. Use PostHog **Business plan** ($450/month)
2. Sign BAA (Business Associate Agreement)
3. Enable PHI filtering
4. Self-host (optional)

### Self-Hosting

Host PostHog on your infrastructure:

```bash
docker-compose up -d
```

[Self-Hosting Guide](https://posthog.com/docs/self-host)

---

## 📚 Integration Examples

### Track Report Generation

```javascript
// When report is saved
trackEvent('report_saved', {
  document_type: 'lab',
  ocr_method: 'google-cloud-vision',
  ai_provider: 'openai_gpt4',
  findings_count: 8,
  pearls_count: 5,
  questions_count: 3
});
```

### Track User Satisfaction

```javascript
// When user rates result
trackEvent('user_feedback', {
  rating: 5,
  report_id: '12345',
  helpful: true
});
```

### Track Performance

```javascript
// Track slow operations
trackEvent('performance_warning', {
  operation: 'ocr_processing',
  duration_ms: 8500,
  threshold_ms: 5000
});
```

---

## 🎯 Best Practices

1. **Don't Over-Track**
   - Track meaningful events only
   - Avoid tracking every click
   - Focus on errors and key actions

2. **Add Context**
   - Include relevant metadata
   - Add user IDs when available
   - Track file types, sizes, etc.

3. **Regular Monitoring**
   - Check dashboard weekly
   - Set up error alerts
   - Review recommendations

4. **Act on Insights**
   - Fix critical bugs first
   - Implement recommendations
   - Track fix effectiveness

---

## 🆘 Support

- **PostHog Docs**: https://posthog.com/docs
- **Community Slack**: https://posthog.com/slack
- **GitHub Issues**: https://github.com/PostHog/posthog/issues

---

## 📝 Summary

PostHog Bug Analyzer provides:

✅ **Automatic error tracking** across the application
✅ **Intelligent pattern detection** and categorization
✅ **Actionable recommendations** for fixes
✅ **Visual dashboard** for monitoring
✅ **Privacy-focused** analytics
✅ **Free tier** for development

Get started in **5 minutes** - just add your API key and start tracking!
