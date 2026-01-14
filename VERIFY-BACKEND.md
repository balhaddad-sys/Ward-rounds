# Verify Your Google Apps Script Backend

Your Google Apps Script is already deployed at:
```
https://script.google.com/macros/s/AKfycbz5I5uGmK3f-_k7pi9HMsW1YMANS8NGnC8-kIDxcEB1vesYXpmwNHRnQRGX_GqV19iWJw/exec
```

## Quick Verification Steps

### 1. Check if OpenAI API Key is Configured

Go to your Google Apps Script project:
1. Open https://script.google.com
2. Find your "MedWard Backend" project
3. Click **Project Settings** (gear icon)
4. Look for **Script Properties**
5. Verify you have: `OPENAI_API_KEY` set to `sk-...`

**If missing**: Add it now using your OpenAI API key from https://platform.openai.com/api-keys

### 2. Test the Backend (Browser Console)

Open your browser console (F12) and run:

```javascript
// Test 1: Ping
fetch('https://script.google.com/macros/s/AKfycbz5I5uGmK3f-_k7pi9HMsW1YMANS8NGnC8-kIDxcEB1vesYXpmwNHRnQRGX_GqV19iWJw/exec', {
  method: 'POST',
  headers: {'Content-Type': 'application/json'},
  body: JSON.stringify({action: 'ping'})
})
.then(r => r.json())
.then(d => console.log('Ping result:', d))
.catch(e => console.error('Error:', e));

// Test 2: Interpret lab results
fetch('https://script.google.com/macros/s/AKfycbz5I5uGmK3f-_k7pi9HMsW1YMANS8NGnC8-kIDxcEB1vesYXpmwNHRnQRGX_GqV19iWJw/exec', {
  method: 'POST',
  headers: {'Content-Type': 'application/json'},
  body: JSON.stringify({
    action: 'interpret',
    documentType: 'lab',
    text: 'CBC: WBC 12.5, Hemoglobin 10.2, Platelets 180'
  })
})
.then(r => r.json())
.then(d => console.log('Interpretation result:', d))
.catch(e => console.error('Error:', e));
```

### 3. Expected Results

**Test 1 (Ping)**:
```json
{
  "success": true,
  "message": "Connected to Google Apps Script",
  "timestamp": "2026-01-14T..."
}
```

**Test 2 (Interpret)**:
```json
{
  "success": true,
  "interpretation": {
    "summary": "...",
    "findings": [...],
    "criticalAlerts": [...],
    "recommendations": [...]
  }
}
```

### 4. If You See Errors

**Error: "OpenAI API key not configured"**
- Go to Script Properties and add `OPENAI_API_KEY`

**Error: "Invalid request"**
- Check the deployment is set to "Anyone" can access
- Go to Deploy → Manage deployments → Edit → Who has access: **Anyone**

**Error: No response / timeout**
- The script might not be deployed as Web App
- Go to Deploy → New deployment → Select type: **Web app**

## Your Existing Deployment

Your current Google Apps Script has:

### Files:
- **Code.gs** - Main entry point, handles doPost requests
- **API.gs** - OpenAI GPT-4 and Google Vision API integration
- **Index.html** - Web interface (optional)

### Supported Actions:
- `ping` - Test connection
- `interpret` - Interpret medical text with OpenAI
- `generatePearls` - Generate clinical teaching pearls
- `generateQuestions` - Generate attending questions
- `saveReport` - Save to Google Sheets
- `uploadFile` - Upload to Google Drive

### API Keys Needed:
- `OPENAI_API_KEY` (Required) - For GPT-4 interpretation
- `GOOGLE_VISION_API_KEY` (Optional) - For server-side OCR
- `DRIVE_FOLDER_ID` (Optional) - For file uploads

## Alternative: Use New MedWardBackend.gs

I also created a **simplified single-file backend** at:
```
google-apps-script/MedWardBackend.gs
```

This is a cleaner version that:
- ✅ Single file (easier to manage)
- ✅ Better error handling
- ✅ More detailed logging
- ✅ Improved prompts for medical interpretation
- ✅ Returns all data in one call (interpretation + pearls + questions)

To use it:
1. Create a **new** Google Apps Script project (or replace existing Code.gs)
2. Copy code from `google-apps-script/MedWardBackend.gs`
3. Set `OPENAI_API_KEY` in Script Properties
4. Deploy as Web App
5. Update the URL in your Next.js app

## Current Status

✅ Your Google Apps Script URL is configured in your Next.js app
✅ Your existing deployment has OpenAI integration
⚠️ **Action needed**: Verify `OPENAI_API_KEY` is set in Script Properties
⚠️ **Action needed**: Test using browser console (see Test 2 above)

Once verified, your "no content" issue should be resolved!
