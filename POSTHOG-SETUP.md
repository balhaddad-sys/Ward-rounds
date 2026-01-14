# PostHog Bug Analyzer Setup Guide

## 🎯 What is PostHog?

PostHog is an open-source product analytics platform that helps you:
- **Track bugs and errors** automatically
- **View session recordings** to see exactly what users did
- **Analyze user behavior** to understand how features are used
- **Monitor performance** metrics
- **Debug production issues** without reproducing them locally

## ✅ Features Implemented

### 1. **Automatic Error Tracking**
- All errors are automatically captured
- Stack traces sent to PostHog
- Context includes: URL, user info, timestamp

### 2. **Session Recording**
- Records user sessions (optional)
- Replay exactly what users did before an error
- Great for debugging "it doesn't work" reports

### 3. **Event Tracking**
- Login success/failure
- Document uploads
- OCR processing
- API calls
- User actions (clicks, form submissions)

### 4. **Performance Monitoring**
- Page load times
- API response times
- OCR processing duration

### 5. **Real-Time Debug Panel** (Development Only)
- See all tracked events in real-time
- Export events as JSON
- View session recording link

## 🚀 Setup Instructions

### Step 1: Create PostHog Account

1. Go to https://posthog.com
2. Click "Get started - free"
3. Choose:
   - **PostHog Cloud** (easiest, recommended)
   - OR **Self-hosted** (if you want complete control)

### Step 2: Create Project

1. After signing up, create a new project
2. Name it: "MedWard"
3. Click "Create project"

### Step 3: Get Your API Key

1. In PostHog dashboard, click **Settings** (gear icon)
2. Go to **Project** → **Project settings**
3. Copy your **Project API Key** (starts with `phc_`)

### Step 4: Add to Your App

1. Open your project
2. Edit `.env.local` (or create it):

```bash
# PostHog Configuration
NEXT_PUBLIC_POSTHOG_KEY=phc_your_actual_api_key_here
NEXT_PUBLIC_POSTHOG_HOST=https://app.posthog.com
```

3. Save the file
4. Restart your development server

### Step 5: Deploy

After updating `.env.local`, rebuild and deploy:

```bash
npm run build
git add docs/
git commit -m "Deploy with PostHog tracking"
git push
```

**For GitHub Pages:**
You'll need to add the environment variables to your build process. GitHub Pages builds statically, so PostHog will only work client-side (which is fine!).

## 🧪 Testing

### Test 1: Check Debug Panel (Development)

1. Run your app locally: `npm run dev`
2. Open http://localhost:3000/login
3. Look for purple 📊 button in bottom-right corner
4. Click it to see tracked events

### Test 2: Trigger an Error

1. Login to your app
2. Try to upload an invalid file
3. Check debug panel - should see error event
4. Go to PostHog dashboard - error should appear

### Test 3: View Session Recording

1. In debug panel, click "View Session Recording"
2. Should open PostHog showing your session
3. Click play to watch what you did

## 📊 Using PostHog Dashboard

### View Errors

1. Go to PostHog dashboard
2. Click **Insights** → **New insight**
3. Event: `$exception`
4. See all errors with details

### View Session Recordings

1. Click **Session recordings** in sidebar
2. Click any recording to watch
3. See console logs, network requests, errors

### Create Custom Dashboards

1. Click **Dashboards** → **New dashboard**
2. Add insights:
   - **Login Success Rate**: `login_success` vs `login_failed`
   - **Upload Success Rate**: `document_upload_success` vs `document_upload_failed`
   - **Error Rate**: `$exception` over time
   - **Most Used Features**: `feature_used` grouped by feature

## 🎯 Tracked Events

### Authentication
- `login_success` - User logged in successfully
- `login_failed` - Login attempt failed
- `logout` - User logged out

### Document Processing
- `document_upload_start` - Upload initiated
- `document_upload_success` - Upload completed
- `document_upload_failed` - Upload failed
- `document_ocr_start` - OCR processing started
- `document_ocr_success` - OCR completed
- `document_ocr_failed` - OCR failed
- `document_interpret_start` - AI interpretation started
- `document_interpret_success` - Interpretation completed
- `document_interpret_failed` - Interpretation failed

### Batch Processing
- `batch_upload_start` - Multiple files upload started
- `batch_upload_complete` - Batch processing done
- `batch_file_processed` - Individual file in batch processed

### Errors
- `$exception` - Any JavaScript error
- `api_error` - API call failed
- `network_error` - Network request failed
- `parsing_error` - JSON/data parsing failed

### Performance
- `page_load_time` - How long pages take to load
- `api_response_time` - API latency
- `ocr_processing_time` - OCR duration

## 🔧 Advanced Configuration

### Disable Session Recording

If you don't want session recordings (privacy concerns):

Edit `lib/analytics/posthog.js`:

```javascript
session_recording: {
  enabled: false, // Set to false
  recordCrossOriginIframes: false
}
```

### Mask Sensitive Data

To automatically mask all text in recordings:

```javascript
mask_all_text: true, // Set to true
```

### Production Only

To disable PostHog in development:

```javascript
export function initPostHog() {
  if (process.env.NODE_ENV !== 'production') return;
  // ... rest of init code
}
```

## 📱 Mobile App Support

PostHog works on mobile browsers! Session recordings and events work the same on:
- iOS Safari
- Chrome Mobile
- Android browsers

## 💰 Pricing

**PostHog Cloud:**
- **Free tier**: 1 million events/month
- Session recordings: 5,000/month free
- More than enough for most medical apps

**Self-hosted:**
- Completely free
- Requires server setup

## 🐛 Debugging PostHog

### Issue: Events Not Showing

**Check:**
1. API key is correct in `.env.local`
2. App is rebuilt after adding env vars
3. No browser extensions blocking PostHog
4. Check browser console for errors

### Issue: Session Recordings Not Working

**Check:**
1. Session recording enabled in PostHog project settings
2. `session_recording.enabled: true` in config
3. Clear browser cache

### Issue: Too Many Events

**Solution:**
Filter events in PostHog:
1. Settings → Project → Data Management
2. Add filters to exclude certain events

## 🎓 Best Practices

### 1. Track What Matters
Focus on:
- Errors and failures
- Critical user flows (login, upload, interpret)
- Performance bottlenecks

### 2. Add Context to Errors

```javascript
trackError(error, {
  context: 'document_upload',
  fileName: file.name,
  fileSize: file.size,
  step: 'ocr_processing'
});
```

### 3. Use Consistent Event Names

We use `EVENTS` constants:
```javascript
import { trackEvent, EVENTS } from '@/lib/analytics/posthog';

trackEvent(EVENTS.DOCUMENT_UPLOAD_SUCCESS, { ... });
```

### 4. Review Errors Weekly

Set up weekly routine:
1. Check PostHog for new errors
2. Watch session recordings of failed uploads
3. Fix issues and deploy

## 📊 Example Queries

### Login Success Rate

```
Events: login_success, login_failed
Visualization: Ratio
Time range: Last 7 days
```

### Most Common Errors

```
Event: $exception
Group by: error_message
Visualization: Bar chart
Time range: Last 30 days
```

### Average Upload Time

```
Event: document_upload_success
Property: processing_time
Visualization: Average
Time range: Last 7 days
```

## 🚀 Next Steps

1. ✅ Set up PostHog account
2. ✅ Add API key to `.env.local`
3. ✅ Test in development (check debug panel)
4. ✅ Deploy to production
5. ✅ Create custom dashboard
6. ✅ Set up alerts for errors
7. ✅ Review session recordings weekly

## 📞 Support

**PostHog Documentation**: https://posthog.com/docs
**PostHog Community**: https://posthog.com/community
**Issues**: https://github.com/PostHog/posthog/issues

---

**Your app now has enterprise-level bug tracking!** 🎉

Every error is captured, every user session can be replayed, and you have full visibility into how your app is performing in production.
