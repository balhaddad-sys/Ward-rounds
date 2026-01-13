# Google Apps Script Deployment Instructions

Your Ward-rounds app is now configured to use **real OpenAI AI** through Google Apps Script! Follow these steps to deploy the updated script.

## 🚀 Quick Deployment Steps

### 1. Open Your Google Apps Script Project

Go to your Google Apps Script at: [https://script.google.com](https://script.google.com)

### 2. Update the Code

Copy and paste the updated code from these files into your Google Apps Script editor:

- **Code.gs** → Copy from `/google-apps-script/Code.gs`
- **API.gs** → Copy from `/google-apps-script/API.gs`

**IMPORTANT**: Make sure to copy the entire contents of both files, including the new `doPost` function at the bottom of Code.gs.

### 3. Configure API Keys

Click on **Project Settings** (gear icon) → **Script Properties** and add:

| Property Name | Value | Required |
|--------------|--------|----------|
| `OPENAI_API_KEY` | Your OpenAI API key | ✅ Yes |
| `GOOGLE_VISION_API_KEY` | Your Google Cloud Vision API key (optional) | ⚠️ Optional |
| `DRIVE_FOLDER_ID` | Google Drive folder ID for uploads (optional) | ⚠️ Optional |

**Where to get API keys:**
- OpenAI API Key: [https://platform.openai.com/api-keys](https://platform.openai.com/api-keys)
- Google Vision API Key: [https://console.cloud.google.com/apis/credentials](https://console.cloud.google.com/apis/credentials)

### 4. Deploy as Web App

1. Click **Deploy** → **New deployment**
2. Click the gear icon ⚙️ next to "Select type"
3. Choose **Web app**
4. Configure:
   - **Description**: "Ward-rounds OpenAI Integration"
   - **Execute as**: Me
   - **Who has access**: **Anyone** (required for the web app to call it)
5. Click **Deploy**
6. **Authorize** the script when prompted
7. Copy the **Web app URL** (it should match the one already in your Next.js app)

### 5. Verify Deployment

The deployment URL should be:
```
https://script.google.com/macros/s/AKfycbz5I5uGmK3f-_k7pi9HMsW1YMANS8NGnC8-kIDxcEB1vesYXpmwNHRnQRGX_GqV19iWJw/exec
```

If it's different, update `/lib/services/googleScript.js` line 6 with your new URL.

## ✅ What This Enables

Once deployed, your app will use **real OpenAI GPT-4** for:

- ✅ **Medical document interpretation** - Understands ANY medical document (labs, imaging, notes, prescriptions, etc.)
- ✅ **Clinical pearls generation** - AI-generated teaching points
- ✅ **Teaching questions** - Attending-style questions with answers
- ✅ **Google Sheets backup** - All reports automatically saved
- ✅ **Google Drive uploads** - Documents stored in your Drive

## 🧪 Testing the Integration

After deploying, test the connection:

1. Go to your app's dashboard
2. Open browser console (F12)
3. Run:
```javascript
import('@/lib/services/googleScript').then(m => m.testConnection())
```

You should see: `✓ Connected to Google Apps Script`

## 🐛 Troubleshooting

### "Google Script failed, falling back to mock"

**Cause**: Script not deployed or API keys missing

**Fix**:
1. Verify script is deployed as "Web app" with "Anyone" access
2. Check that `OPENAI_API_KEY` is set in Script Properties
3. Verify the deployment URL matches the one in your code

### "CORS error" or "403 Forbidden"

**Cause**: Script not set to "Anyone" access

**Fix**: Redeploy with "Who has access" set to **Anyone**

### "API key not configured"

**Cause**: Missing OpenAI API key in Script Properties

**Fix**: Add `OPENAI_API_KEY` in Project Settings → Script Properties

## 💰 OpenAI Costs

The app uses GPT-4 Turbo which costs approximately:
- **Interpretation**: ~$0.01-0.03 per document
- **Pearls**: ~$0.01 per generation
- **Questions**: ~$0.01 per generation

**Typical cost per uploaded report**: $0.03-0.05

Monitor your usage at: [https://platform.openai.com/usage](https://platform.openai.com/usage)

## 🔒 Security Notes

- ✅ API keys stored securely in Google Apps Script (not in client code)
- ✅ CORS properly configured for GitHub Pages
- ✅ No sensitive data exposed to client
- ⚠️ Anyone can call your script (they can't see your API key but they can use it)

To restrict access, you can add authentication in the `doPost` function or limit deployments to specific domains.

## 📊 Viewing Saved Reports

All reports are automatically saved to Google Sheets in your "MedWard Database" spreadsheet.

To view:
1. Go to [https://drive.google.com](https://drive.google.com)
2. Search for "MedWard Database"
3. Open the spreadsheet
4. Check the "reports" tab

---

**Need help?** Check the Google Apps Script execution logs:
1. Open your script project
2. Click **Executions** (left sidebar)
3. View recent requests and any errors
