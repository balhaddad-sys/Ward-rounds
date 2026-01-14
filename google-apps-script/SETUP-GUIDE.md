# Google Apps Script Setup Guide

## 📋 Complete Setup Instructions

Follow these steps to set up your MedWard backend using Google Apps Script.

---

## Step 1: Create Google Apps Script Project

1. **Go to Google Apps Script**
   - Visit: https://script.google.com
   - Sign in with your Google account

2. **Create New Project**
   - Click **"New Project"**
   - Name it: **"MedWard Backend"**

---

## Step 2: Add the Code

1. **Copy the code**
   - Open file: `google-apps-script/MedWardBackend.gs`
   - Copy all the code (Ctrl+A, Ctrl+C)

2. **Paste into Google Script**
   - In your Google Apps Script project
   - Select all existing code and replace it
   - Paste the MedWard backend code
   - Click **"Save"** (Ctrl+S)

---

## Step 3: Configure OpenAI API Key

### Get Your OpenAI API Key

1. Go to: https://platform.openai.com/api-keys
2. Click **"Create new secret key"**
3. Copy the key (starts with `sk-`)

### Add to Script Properties

1. In Google Apps Script, click **Project Settings** (gear icon)
2. Scroll to **"Script Properties"**
3. Click **"Add script property"**
4. Enter:
   - **Property**: `OPENAI_API_KEY`
   - **Value**: `sk-your-actual-api-key-here`
5. Click **"Save script properties"**

---

## Step 4: Deploy as Web App

1. **Click Deploy**
   - Click **"Deploy"** → **"New deployment"**

2. **Configure Deployment**
   - Click **"Select type"** → Choose **"Web app"**
   - Settings:
     - **Description**: "MedWard Backend API v1.0"
     - **Execute as**: **Me** (your-email@gmail.com)
     - **Who has access**: **Anyone**

3. **Deploy**
   - Click **"Deploy"**
   - Review permissions if prompted
   - Click **"Authorize access"**
   - Select your Google account
   - Click **"Allow"**

4. **Copy Web App URL**
   - After deployment, you'll see a URL like:
     ```
     https://script.google.com/macros/s/AKfycbz...../exec
     ```
   - **IMPORTANT**: Copy this entire URL

---

## Step 5: Test Your Deployment

### Option A: Test in Browser

Open your Web App URL in a browser:
```
https://script.google.com/macros/s/YOUR-DEPLOYMENT-ID/exec
```

You should see:
```json
{
  "status": "MedWard Backend API",
  "version": "1.0.0",
  "endpoints": {
    "interpret": "POST with action=interpret",
    "login": "POST with action=login"
  }
}
```

### Option B: Test with curl

```bash
# Test interpretation endpoint
curl -X POST "YOUR-WEB-APP-URL" \
  -H "Content-Type: application/json" \
  -d '{
    "action": "interpret",
    "documentType": "lab",
    "text": "CBC: WBC 12.5 (elevated), Hemoglobin 10.2 (low), Platelets 180 (normal)"
  }'
```

**Expected Response:**
```json
{
  "success": true,
  "interpretation": {
    "summary": "Complete blood count showing leukocytosis and anemia...",
    "findings": [
      {
        "finding": "WBC 12.5 (elevated)",
        "status": "abnormal",
        "significance": "Suggests infection or inflammatory process"
      }
    ],
    "criticalAlerts": [],
    "recommendations": ["Repeat CBC", "Check differential"]
  },
  "clinicalPearls": { ... },
  "potentialQuestions": { ... }
}
```

### Option C: Test in Script Editor

1. In Google Apps Script, select function: **`testInterpretation`**
2. Click **Run** ▶️
3. Check **Execution log** (View → Logs)
4. Should see JSON response with interpretation

---

## Step 6: Update Your Next.js App

### Update the Google Script URL

1. **Open your repository**
2. **Edit file**: `lib/services/googleScript.js`
3. **Replace the URL** on line 6:
   ```javascript
   const GOOGLE_SCRIPT_URL = 'YOUR-NEW-WEB-APP-URL-HERE';
   ```

4. **Commit and push:**
   ```bash
   git add lib/services/googleScript.js
   git commit -m "Update Google Apps Script URL"
   git push origin main
   ```

---

## Step 7: Deploy to GitHub Pages

```bash
# Build static files
npm run build

# Commit built files
git add docs/
git commit -m "Deploy to GitHub Pages"
git push origin main
```

Your app will be live at:
```
https://balhaddad-sys.github.io/Ward-rounds/
```

---

## 🧪 End-to-End Testing

1. **Visit your deployed app**
   ```
   https://balhaddad-sys.github.io/Ward-rounds/
   ```

2. **Login**
   - Click "Login"
   - Enter any username (e.g., "doctor123")
   - Click "Continue"

3. **Upload a test image**
   - Go to "Scanner"
   - Upload a medical lab report image
   - Watch for processing steps

4. **Check browser console** (F12)
   ```
   [Scanner] Using auto-detect processing flow...
   [Google Script Flow] Using local OCR + Google Script AI...
   [Google Script Flow] OCR complete. Sending to Google Script...
   [Google Script Flow] Processing complete!
   ```

5. **View results**
   - Should see interpretation
   - Clinical pearls
   - Teaching questions
   - SOAP presentation

---

## 🐛 Troubleshooting

### Issue: "OpenAI API key not configured"

**Solution:**
- Check Script Properties in Google Apps Script
- Verify `OPENAI_API_KEY` is set correctly
- Make sure you saved the properties

### Issue: "Authorization required"

**Solution:**
1. Go to Google Apps Script
2. Click Deploy → Manage deployments
3. Click ✏️ (Edit)
4. Change "Who has access" to **"Anyone"**
5. Click "Deploy"

### Issue: No response from Google Script

**Solution:**
1. Check Executions log in Google Apps Script
2. Look for errors
3. Common issues:
   - API key not set
   - Exceeded OpenAI quota
   - Rate limits hit

### Issue: CORS errors in browser

**Solution:**
- Google Apps Script handles CORS automatically
- Make sure script is deployed as **Web App**
- Access must be set to **"Anyone"**

### Check Execution Logs

1. In Google Apps Script editor
2. Click **"Executions"** (clock icon on left)
3. View recent executions
4. Click any execution to see detailed logs
5. Look for errors or issues

---

## 💰 Cost Information

### OpenAI API Costs (GPT-4 Turbo)

Typical per-upload costs:
- **Interpretation**: $0.01 - $0.03
- **Clinical Pearls**: $0.01 - $0.02
- **Questions**: $0.01 - $0.02
- **Total per report**: ~$0.03 - $0.07

### Google Apps Script Quotas (Free Tier)

- **Executions**: 20,000/day
- **URL Fetch calls**: 20,000/day
- **Email quota**: 100/day

**More than enough for typical usage!**

---

## 🔒 Security Best Practices

1. **Never share your Web App URL publicly**
   - Only use in your Next.js app
   - Don't post in public repositories

2. **Monitor usage**
   - Check OpenAI usage dashboard
   - Set spending limits in OpenAI

3. **Rotate API keys regularly**
   - Every 3-6 months
   - Immediately if compromised

4. **Use deployment versions**
   - Create new deployment for major changes
   - Keep old version as backup

---

## 📊 Monitoring

### Check Google Script Executions

1. Open Google Apps Script
2. Click **"Executions"**
3. View:
   - Total executions today
   - Success rate
   - Error logs
   - Execution time

### Check OpenAI Usage

1. Go to: https://platform.openai.com/usage
2. View:
   - Daily API usage
   - Token consumption
   - Costs

---

## 🔄 Updating the Script

When you need to update the code:

1. **Edit the script** in Google Apps Script
2. **Save** (Ctrl+S)
3. **Create new deployment**:
   - Deploy → Manage deployments
   - Click ✏️ next to current deployment
   - Version: **New version**
   - Description: What changed
   - Click **Deploy**

**URL stays the same - no need to update Next.js app!**

---

## ✅ Checklist

- [ ] Created Google Apps Script project
- [ ] Pasted MedWardBackend.gs code
- [ ] Set OPENAI_API_KEY in Script Properties
- [ ] Deployed as Web App (Execute as: Me, Access: Anyone)
- [ ] Tested with curl/browser
- [ ] Updated Next.js app with new URL
- [ ] Deployed to GitHub Pages
- [ ] Tested end-to-end flow

---

## 🎉 Success!

Once all steps are complete, your MedWard app will:

✅ Extract text from uploaded images (browser OCR)
✅ Send to Google Apps Script backend
✅ Process with OpenAI GPT-4
✅ Generate interpretations, pearls, and questions
✅ Display formatted results to users

**Your medical document interpreter is now live!** 🏥
