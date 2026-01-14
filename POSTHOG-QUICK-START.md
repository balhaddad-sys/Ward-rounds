# PostHog Bug Analyzer - Quick Start

## 🎉 What You Got

Your MedWard app now has **enterprise-level bug tracking and analytics** powered by PostHog!

### ✅ Features Now Available:

1. **Automatic Error Tracking** - Every error is captured with full context
2. **Session Recordings** - Watch exactly what users did before errors
3. **Event Tracking** - Track logins, uploads, OCR, interpretations
4. **Performance Monitoring** - See how fast your app is
5. **Debug Panel** - Real-time event viewer during development
6. **Error Boundary** - Catches React errors automatically

## 🚀 5-Minute Setup

### 1. Create PostHog Account (2 minutes)

1. Go to **https://posthog.com**
2. Click **"Get started - free"**
3. Sign up (email or GitHub)
4. Create project: **"MedWard"**

### 2. Get Your API Key (1 minute)

1. In PostHog dashboard, click **Settings** (⚙️)
2. Go to **Project settings**
3. Copy **Project API Key** (starts with `phc_`)

### 3. Add to Your App (1 minute)

Edit `.env.local` (or create it):

```bash
NEXT_PUBLIC_POSTHOG_KEY=phc_YOUR_KEY_HERE
NEXT_PUBLIC_POSTHOG_HOST=https://app.posthog.com
```

### 4. Test It Works (1 minute)

```bash
npm run dev
```

1. Open http://localhost:3000
2. Look for **purple 📊 button** in bottom-right
3. Click it → see tracked events!

## 🧪 Quick Test

### Test Error Tracking:

1. Login to your app
2. Try something that causes an error
3. Go to PostHog → **Insights** → Event: `$exception`
4. See your error with full stack trace!

### Test Session Recording:

1. Use your app for 30 seconds
2. Go to PostHog → **Session recordings**
3. Find your session → Click play
4. Watch yourself using the app!

## 📊 What's Being Tracked

### Automatically:
- ✅ All JavaScript errors
- ✅ Page views
- ✅ Button clicks
- ✅ Form submissions

### Custom Events:
- ✅ Login success/failure
- ✅ Document uploads
- ✅ OCR processing
- ✅ AI interpretation
- ✅ Batch uploads
- ✅ Performance metrics

## 🎯 Using the Debug Panel (Development)

The **purple 📊 button** in development shows:

- Real-time events as they happen
- Event properties and metadata
- Session recording link
- Export events as JSON

Perfect for debugging!

## 📱 How to Use PostHog Dashboard

### View Errors:
1. **Insights** → **New insight**
2. Event: `$exception`
3. See all errors

### View Session Recordings:
1. **Session recordings** in sidebar
2. Click any recording
3. Watch, see console, network requests

### Create Dashboard:
1. **Dashboards** → **New dashboard**
2. Add insights:
   - Login success rate
   - Upload success rate
   - Error rate over time
   - Most used features

## 💡 Pro Tips

### 1. Set Up Alerts

PostHog → Settings → Webhooks:
- Get notified when errors spike
- Alert on failed logins
- Monitor performance drops

### 2. Filter Noisy Events

If too many events:
- Settings → Data Management
- Add filters to exclude

### 3. Privacy Mode

Don't want to record everything?

Edit `lib/analytics/posthog.js`:
```javascript
mask_all_text: true, // Masks all text in recordings
session_recording: { enabled: false } // Disable recordings
```

## 🐛 Example: Debugging "Upload Failed"

**Scenario**: User reports "upload doesn't work"

**Old way**:
- Ask user what they did
- Try to reproduce
- Guess what went wrong
- Maybe fix it?

**New way with PostHog**:
1. Go to PostHog → Session recordings
2. Filter by event: `document_upload_failed`
3. Find their session
4. Watch exactly what they did
5. See the error in console
6. Fix the actual problem!

## 📊 Free Tier Limits

**PostHog Cloud Free Tier:**
- 1 million events/month
- 5,000 session recordings/month
- Unlimited users

More than enough for a medical app! If you exceed:
- Paid plan: $0.00031 per event
- Or self-host for free

## 🚨 Troubleshooting

### Events Not Showing?

**Check:**
1. API key is correct in `.env.local`
2. Rebuilt app after adding key: `npm run dev`
3. No browser extensions blocking PostHog
4. Check browser console for errors

### Session Recordings Not Working?

**Check:**
1. Recording enabled in PostHog project settings
2. Clear browser cache
3. Wait 1-2 minutes for recording to process

### Debug Panel Not Showing?

**This is normal!**
- Debug panel only shows in **development** (`npm run dev`)
- Not visible in production (by design)

## 🎓 Next Steps

**Week 1:**
- Set up PostHog account ✅
- Add API key ✅
- Test with debug panel ✅

**Week 2:**
- Create custom dashboard
- Set up error alerts
- Review first week of data

**Month 1:**
- Watch session recordings of errors
- Identify patterns in failures
- Fix top 5 issues

## 📖 Full Documentation

For advanced features, see:
- **POSTHOG-SETUP.md** - Complete setup guide
- **lib/analytics/posthog.js** - All tracking functions
- **lib/hooks/usePostHogTracking.js** - React hook examples

## 💰 Cost

**Development/Testing**: FREE
**Production (typical medical app)**: FREE (under 1M events/month)
**Large scale**: ~$300/month for 1M events

Compare to enterprise bug tracking:
- Sentry: $26-$80/month
- DataDog: $15-$31 per host/month
- LogRocket: $99-$299/month

PostHog gives you **all of this** in one tool!

---

## ✨ You're Done!

Your app now has:
- ✅ Automatic bug tracking
- ✅ Session replay
- ✅ Performance monitoring
- ✅ User analytics
- ✅ Error alerting

All for **FREE** with PostHog's open-source platform.

**Start tracking bugs like a pro!** 🚀

---

**Questions?**
- PostHog Docs: https://posthog.com/docs
- Community: https://posthog.com/community
- Your code: `lib/analytics/posthog.js`
