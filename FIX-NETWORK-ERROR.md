# Fix NetworkError - Google Apps Script CORS Issue

## 🔴 Problem: NetworkError when attempting to fetch resource

This happens when the browser blocks the request to Google Apps Script due to CORS (Cross-Origin Resource Sharing) policy.

## ✅ Quick Fix (3 Steps)

### Step 1: Verify Google Apps Script Deployment

1. Go to https://script.google.com
2. Open your project
3. Click **Deploy** → **Manage deployments**
4. Check these settings:

   **CRITICAL - Must be exactly:**
   - ✅ **Execute as**: Me (your email)
   - ✅ **Who has access**: **Anyone** ← MOST IMPORTANT!

   If it says "Only myself" or anything else, **this is your problem**.

5. If settings are wrong:
   - Click **Edit** (pencil icon)
   - Change "Who has access" to **Anyone**
   - Click **Deploy**

### Step 2: Test the Backend Directly

Open a new browser tab and paste your Google Apps Script URL:

```
https://script.google.com/macros/s/AKfycbz5I5uGmK3f-_k7pi9HMsW1YMANS8NGnC8-kIDxcEB1vesYXpmwNHRnQRGX_GqV19iWJw/exec
```

**Expected Result:**
You should see JSON like:
```json
{
  "status": "MedWard Backend API",
  "version": "2.0.0",
  "endpoints": { ... }
}
```

**If you see:**
- ❌ "Script function not found" → Deploy as Web App
- ❌ "Authorization required" → Change "Who has access" to "Anyone"
- ❌ Blank page → Script has errors, check Execution log
- ✅ JSON response → Backend is working! Issue is in frontend.

### Step 3: Test with CURL (Alternative)

If browser test works but app doesn't, test with CURL:

```bash
curl -X POST "YOUR-URL" \
  -H "Content-Type: application/json" \
  -d '{"action":"ping"}'
```

**Expected:**
```json
{"success":true,"message":"Connected to MedWard Backend"}
```

---

## 🔧 Common Solutions

### Solution A: Redeploy with Correct Settings

**The issue is usually wrong deployment settings.**

1. Go to Google Apps Script
2. **Deploy** → **Manage deployments**
3. Click **Archive** on old deployment (if any)
4. **Deploy** → **New deployment**
5. Type: **Web app**
6. Settings:
   - Description: "MedWard v2"
   - Execute as: **Me**
   - Who has access: **Anyone** ← KEY!
7. Click **Deploy**
8. **Authorize** if prompted
9. **Copy the new URL**

### Solution B: Clear Browser Cache

Sometimes the browser caches the CORS error:

1. Open DevTools (F12)
2. Right-click the refresh button
3. Choose **"Empty Cache and Hard Reload"**
4. Try login again

### Solution C: Check Browser Console

1. Open your app
2. Press **F12** (DevTools)
3. Go to **Console** tab
4. Try to login
5. Look for error messages

**Common errors:**

| Error Message | Solution |
|---------------|----------|
| `Failed to fetch` | Deployment not set to "Anyone" |
| `NetworkError` | CORS issue - check deployment settings |
| `404 Not Found` | Wrong URL or script not deployed |
| `Authorization required` | Change "Who has access" to "Anyone" |
| `Script function not found` | Deploy as Web App, not Test deployment |

### Solution D: Use Test Deployment URL

**IMPORTANT:** Make sure you're using the **Web App URL**, not the **Test deployment URL**.

❌ **Wrong** (Test URL):
```
https://script.google.com/macros/s/.../dev
```

✅ **Correct** (Web App URL):
```
https://script.google.com/macros/s/.../exec
```

---

## 🧪 Debugging Steps

### 1. Test Backend Directly

**Open in new tab:**
```
YOUR-GOOGLE-SCRIPT-URL
```

**Should show:**
```json
{
  "status": "MedWard Backend API",
  "version": "2.0.0",
  ...
}
```

### 2. Test with Browser Console

**Open Console (F12) and run:**

```javascript
fetch('YOUR-GOOGLE-SCRIPT-URL', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ action: 'ping' })
})
.then(r => {
  console.log('Status:', r.status);
  return r.json();
})
.then(d => console.log('Data:', d))
.catch(e => console.error('Error:', e));
```

**Expected output:**
```
Status: 200
Data: {success: true, message: "Connected to MedWard Backend", ...}
```

**If you see NetworkError:**
- Check deployment settings (see Solution A)
- Make sure "Who has access" is set to **Anyone**

### 3. Check Network Tab

1. F12 → **Network** tab
2. Try to login
3. Look for the request to Google Apps Script
4. Click on it
5. Check **Headers** and **Response**

**Red flags:**
- Status: (failed) → CORS issue
- Status: 403 Forbidden → Not authorized
- Status: 404 Not Found → Wrong URL

---

## 🎯 Step-by-Step Diagnosis

### Is the backend deployed?

**Test:** Open backend URL in browser

- ✅ Shows JSON → Backend deployed
- ❌ Shows error → Not deployed correctly

### Is "Who has access" set to "Anyone"?

**Check:** Deploy → Manage deployments

- ✅ Says "Anyone" → Correct
- ❌ Says "Only myself" → **This is the issue!**

### Is the URL correct in your app?

**Check files:**
- `app/(auth)/login/page.js` (line 6)
- `lib/services/completeGoogleScriptFlow.js` (line 6)

Should be:
```javascript
const API_URL = 'https://script.google.com/macros/s/.../exec';
```

### Can you test with CURL?

```bash
curl -X POST "YOUR-URL" \
  -H "Content-Type: application/json" \
  -d '{"action":"ping"}'
```

- ✅ Returns JSON → Backend works
- ❌ Returns error → Backend issue

---

## 🚀 Final Solution (Most Common)

**90% of the time, this fixes it:**

1. Go to https://script.google.com
2. Open your project
3. **Deploy** → **Manage deployments**
4. Click **Edit** (pencil icon)
5. Change "Who has access" to **Anyone**
6. Click **Deploy**
7. Clear browser cache (Ctrl+Shift+Delete)
8. Try login again

---

## 📞 Still Not Working?

If none of the above works, provide:

1. **Backend URL Test Result:**
   - Open your Google Script URL in browser
   - Copy what you see

2. **Browser Console Error:**
   - F12 → Console tab
   - Try to login
   - Copy the full error message

3. **Network Tab Info:**
   - F12 → Network tab
   - Try to login
   - Find the failed request
   - Copy Status and Response

4. **Deployment Settings Screenshot:**
   - Deploy → Manage deployments
   - Screenshot showing "Who has access" setting

This will help identify the exact issue!

---

## 💡 Pro Tips

### Tip 1: Use Incognito Mode
Test in incognito/private window to rule out cache/extension issues.

### Tip 2: Check Script Execution Log
In Google Apps Script:
- View → Execution log
- Try to login from your app
- Check if requests are reaching the script

### Tip 3: Test the Old URL
If you deployed a new script, make sure your app is using the new URL, not the old one.

### Tip 4: Verify OPENAI_API_KEY
Even if deployment is correct, check that `OPENAI_API_KEY` is set in Script Properties.

---

## ✅ Success Checklist

Once fixed, you should see:

- [ ] Backend URL in browser shows JSON (not error)
- [ ] Login redirects to dashboard
- [ ] No errors in browser console
- [ ] Upload shows "Processing document..."
- [ ] Reports show interpretation/pearls/questions

If all above work, you're good to go! 🎉
