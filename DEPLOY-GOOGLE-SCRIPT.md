# Deploy Complete Google Apps Script Backend

## 📋 Quick Setup (5 minutes)

### Step 1: Create New Google Apps Script Project

1. Go to https://script.google.com
2. Click **"+ New project"**
3. Name it: **"MedWard Backend v2"**

### Step 2: Copy the Complete Code

1. Delete all default code in the editor
2. Open the file: **`google-apps-script/MedWardComplete.gs`** from your repository
3. Copy **ALL the code** (it's about 550 lines)
4. Paste it into the Google Apps Script editor

### Step 3: Add Your OpenAI API Key

1. In Google Apps Script, click **⚙️ Project Settings** (gear icon on left sidebar)
2. Scroll down to **"Script Properties"**
3. Click **"Add script property"**
4. Add:
   - **Property**: `OPENAI_API_KEY`
   - **Value**: `sk-proj-...` (your actual OpenAI API key from https://platform.openai.com/api-keys)
5. Click **Save script properties**

### Step 4: Test the Setup

1. Go back to **Editor** (click `< >` icon)
2. In the top dropdown (says "Select function"), select: **`verifySetup`**
3. Click **▶ Run**
4. Click **Review permissions** when prompted
5. Choose your Google account
6. Click **Advanced** → **Go to MedWard Backend v2 (unsafe)**
7. Click **Allow**
8. Check the **Execution log** (bottom panel) - should see:
   ```
   ✓ API Key looks valid
   ✓ OpenAI connection successful
   ```

### Step 5: Deploy as Web App

1. Click **Deploy** → **New deployment**
2. Click **⚙️ Select type** → **Web app**
3. Settings:
   - **Description**: "MedWard Backend v2"
   - **Execute as**: **Me** (your email)
   - **Who has access**: **Anyone**
4. Click **Deploy**
5. Click **Authorize access**
6. Allow permissions
7. **COPY THE WEB APP URL** (looks like: `https://script.google.com/macros/s/AKfycby.../exec`)

### Step 6: Update Your Next.js App

**Option A: If URLs are the same**
If your new URL matches the old one, you're done! Just test login.

**Option B: If URL changed**
1. Open your project
2. Update these files with the new URL:
   - `app/(auth)/login/page.js` (line 6)
   - `lib/services/completeGoogleScriptFlow.js` (line 6)
3. Run: `npm run build`
4. Commit and push changes

### Step 7: Test Everything

1. Go to: https://balhaddad-sys.github.io/Ward-rounds/login/
2. Enter username: **"test"**
3. Click **"Continue"**
4. Should redirect to dashboard ✅
5. Try uploading a medical document ✅

---

## 🧪 Testing the Backend

### Test 1: Ping Test
Open browser console (F12) and run:

```javascript
fetch('YOUR-WEB-APP-URL', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ action: 'ping' })
})
.then(r => r.json())
.then(d => console.log('Ping:', d));
```

**Expected**: `{ success: true, message: "Connected to MedWard Backend", ... }`

### Test 2: Login Test
```javascript
fetch('YOUR-WEB-APP-URL', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ action: 'login', username: 'testdoctor' })
})
.then(r => r.json())
.then(d => console.log('Login:', d));
```

**Expected**: `{ success: true, token: "...", user: {...} }`

### Test 3: Interpret Test
```javascript
fetch('YOUR-WEB-APP-URL', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    action: 'interpret',
    documentType: 'lab',
    text: 'CBC: WBC 12.5, Hemoglobin 10.2, Platelets 180'
  })
})
.then(r => r.json())
.then(d => console.log('Interpret:', d));
```

**Expected**: `{ success: true, interpretation: {...}, clinicalPearls: {...}, ... }`

---

## 📊 What This Script Includes

### ✅ Complete Features

1. **Login/Authentication**
   - Simple username-based auth
   - Token generation (base64 encoded)
   - No database required

2. **Medical Interpretation**
   - OpenAI GPT-4 Turbo integration
   - Structured JSON responses
   - Multiple document types (lab, imaging, ECG, notes)

3. **Clinical Pearls**
   - 3-5 teaching points per document
   - Difficulty levels (basic/intermediate/advanced)
   - Categories (diagnosis/management/physiology/clinical_reasoning)

4. **Teaching Questions**
   - 3-5 potential attending questions
   - Detailed answers
   - Key teaching points

5. **SOAP Presentation**
   - One-liner summary
   - Subjective/Objective/Assessment/Plan format
   - Ready for ward rounds

6. **Error Handling**
   - Comprehensive logging
   - Helpful error messages
   - Automatic JSON parsing fallbacks

7. **Testing Functions**
   - `testInterpretation()` - Run all tests
   - `verifySetup()` - Check API key and connection

### 📁 Functions Reference

| Function | Purpose |
|----------|---------|
| `doGet()` | API info endpoint |
| `doPost()` | Main API router |
| `handlePing()` | Connection test |
| `handleLogin()` | User authentication |
| `handleInterpret()` | Document interpretation |
| `callOpenAI()` | OpenAI API wrapper |
| `interpretMedicalText()` | AI interpretation |
| `generateClinicalPearls()` | Teaching pearls |
| `generateTeachingQuestions()` | Attending questions |
| `generatePresentation()` | SOAP format |
| `verifySetup()` | Setup verification |
| `testInterpretation()` | Run all tests |

---

## 🔧 Troubleshooting

### Issue: "OpenAI API key not configured"

**Solution**:
1. Go to Project Settings (⚙️)
2. Check Script Properties
3. Make sure `OPENAI_API_KEY` is set to `sk-proj-...` (not "your-api-key-here")
4. Redeploy: Deploy → Manage deployments → Edit → New version → Deploy

### Issue: "Server returned 404"

**Solution**:
- The script isn't deployed as Web App yet
- Go to: Deploy → New deployment → Select type: Web app
- Make sure "Who has access" is set to **Anyone**

### Issue: "Permission denied"

**Solution**:
- Deployment might be set to "Execute as: User accessing the web app"
- Should be: "Execute as: Me"
- Redeploy with correct setting

### Issue: Login works but interpret fails

**Solution**:
1. Run `verifySetup()` function in Script Editor
2. Check Execution log for errors
3. Verify OpenAI API key is correct
4. Check you have OpenAI API credits

### Issue: Slow responses (>30 seconds)

**Normal behavior**:
- First call after deployment: ~10-15 seconds (cold start)
- Subsequent calls: ~5-10 seconds
- GPT-4 is slower than GPT-3.5 but more accurate

**To speed up**:
- Change model to `gpt-3.5-turbo` (line 15)
- Reduce `MAX_TOKENS` to 1500 (line 17)

---

## 🎯 Next Steps After Deployment

1. **Test login** in your app
2. **Upload a medical document** to test interpretation
3. **Check the logs** in Google Apps Script (View → Execution log)
4. **Monitor usage** to track API costs
5. **Share with team** once working

---

## 💰 Cost Monitoring

### OpenAI Costs (GPT-4 Turbo)
- **Input**: $10 per 1M tokens (~$0.01 per document)
- **Output**: $30 per 1M tokens (~$0.03 per document)
- **Estimated**: $0.04 per medical document interpretation

### Usage Tracking
1. Go to https://platform.openai.com/usage
2. Monitor your daily usage
3. Set up billing alerts

### Cost Optimization Tips
- Use `gpt-3.5-turbo` for non-critical interpretations ($0.001 per doc)
- Cache common results (future feature)
- Reduce `MAX_TOKENS` if responses are too long

---

## 🔒 Security Notes

### What's Secure:
✅ HTTPS connection (Google handles this)
✅ API key stored in Script Properties (encrypted)
✅ No user data stored permanently
✅ Simple token-based auth

### What's NOT Production-Ready:
⚠️ Token generation (use proper JWT for production)
⚠️ No rate limiting (add if getting abuse)
⚠️ No user database (tokens not persisted)
⚠️ "Anyone" access (okay for now, but consider auth later)

For a production app, consider:
- Proper JWT tokens
- User database (Firebase/Supabase)
- Rate limiting (cloud function)
- Environment-specific deployments

---

## 📞 Support

If you get stuck:
1. Check Execution log in Google Apps Script
2. Run `verifySetup()` function
3. Test with browser console (see Testing section)
4. Check OpenAI API status: https://status.openai.com

**Common success indicators**:
- ✅ Login redirects to dashboard
- ✅ Upload shows "Processing document..."
- ✅ Report shows interpretation, pearls, questions
- ✅ Dashboard shows recent reports

---

## 🎉 You're Done!

Once you see:
- Login working ✅
- Documents processing ✅
- Reports showing content ✅

Your MedWard app is fully operational! 🚀

Start using it for rounds and let me know if you need any adjustments.
