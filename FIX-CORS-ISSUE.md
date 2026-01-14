# 🔧 Fix CORS Issue - Update Your Google Apps Script

Your backend is working, but there's a CORS (Cross-Origin) issue preventing the browser from making POST requests.

## ✅ Quick Fix

Update your Google Apps Script with this modified `doPost` function:

### Open Your Script

1. Go to https://script.google.com
2. Open your MedWard project
3. Find the `doPost` function (around line 40)

### Replace the doPost Function

**Find this:**
```javascript
function doPost(e) {
  try {
    Logger.log('[MedWard] Received POST request');

    // Parse request
    let requestData;
    try {
      requestData = JSON.parse(e.postData.contents);
```

**Replace with:**
```javascript
function doPost(e) {
  try {
    Logger.log('[MedWard] Received POST request');
    Logger.log('[MedWard] Headers: ' + JSON.stringify(e.parameter));

    // Parse request - handle both JSON and URL parameters
    let requestData;
    try {
      if (e.postData && e.postData.contents) {
        requestData = JSON.parse(e.postData.contents);
      } else if (e.parameter) {
        // Fallback to URL parameters
        requestData = e.parameter;
      } else {
        throw new Error('No data provided');
      }
```

### Redeploy

1. Click **Deploy** → **Manage deployments**
2. Click **Edit** (pencil icon)
3. Change **Version** to "New version"
4. Click **Deploy**
5. Wait 10 seconds

### Test Again

Try logging in: https://balhaddad-sys.github.io/Ward-rounds/login/

---

## Alternative: Use URL Parameters Instead of JSON

If the above doesn't work, we can change the frontend to use URL parameters instead of JSON (which avoids CORS preflight entirely).

Let me know if you want me to implement the alternative approach!

---

## 🧪 Test in Console

After updating and redeploying, test with:

```javascript
fetch('https://script.google.com/macros/s/AKfycbwWYEiLB0bdOfLt9bSizC9vLL0a-Zut52DqSjNgd6roAk7sdQ8cI0MzHsP2mk66JwK5/exec', {
  method: 'POST',
  body: JSON.stringify({action: 'login', username: 'test'})
})
.then(r => r.json())
.then(d => console.log('✅', d))
.catch(e => console.error('❌', e));
```

**Expected:**
```
✅ {success: true, token: "...", user: {...}}
```

---

**Which would you prefer:**
1. Update Google Apps Script with the fix above
2. Or should I change the frontend to avoid CORS issues?

Let me know and I'll help you complete the fix! 🚀
