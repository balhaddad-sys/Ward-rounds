# Fix Login Issue - Action Required

## Problem
The login was failing because the Google Apps Script backend didn't have a handler for the 'login' action in the `doPost` function.

## What I Fixed

### 1. Updated Google Apps Script Backend (`google-apps-script/Code.gs`)
Added login handler to the doPost switch statement:

```javascript
case 'login':
  // User login/registration
  Logger.log('Login request for: ' + requestData.username);
  const loginResult = loginUser(requestData.username);

  return output.setContent(JSON.stringify(loginResult));
```

### 2. Fixed Login Page (`app/(auth)/login/page.js`)
- Simplified authentication to use only Google Apps Script (removed broken local API fallback)
- Fixed to use POST with JSON payload instead of GET with query params
- Added better error messages and logging
- Added input validation

## ✅ What You Need To Do

**You must update your Google Apps Script deployment with the new Code.gs file:**

### Step 1: Open Your Google Apps Script
1. Go to https://script.google.com
2. Find your "MedWard Backend" project (the one with your deployment URL)

### Step 2: Update Code.gs
1. Open the `Code.gs` file
2. Find line ~315 where it says:
   ```javascript
   switch (action) {
     case 'ping':
       ...
     case 'interpret':
   ```

3. Add the login case **after 'ping' and before 'interpret'**:
   ```javascript
   switch (action) {
     case 'ping':
       // Connection test
       return output.setContent(JSON.stringify({
         success: true,
         message: 'Connected to Google Apps Script',
         timestamp: new Date().toISOString()
       }));

     case 'login':
       // User login/registration
       Logger.log('Login request for: ' + requestData.username);
       const loginResult = loginUser(requestData.username);

       return output.setContent(JSON.stringify(loginResult));

     case 'interpret':
       // ... rest of the code
   ```

### Step 3: Deploy
1. Click **Deploy** → **Manage deployments**
2. Click the **Edit** button (pencil icon) on your active deployment
3. Change **Version** to "New version"
4. Add description: "Add login handler"
5. Click **Deploy**

**Important**: You don't need a new URL - just update the existing deployment!

### Step 4: Test Login
1. Go to your app: https://balhaddad-sys.github.io/Ward-rounds/login/
2. Enter any username (e.g., "testuser")
3. Click "Continue"
4. Should redirect to dashboard ✅

## Alternative: Copy Entire Updated File

If you prefer, you can copy the entire updated `Code.gs` file from your repository:
- File location: `google-apps-script/Code.gs`
- Lines 324-329 contain the new login handler

## How Login Works Now

```
User enters username
    ↓
Next.js sends POST request:
{
  "action": "login",
  "username": "testuser"
}
    ↓
Google Apps Script doPost receives request
    ↓
Checks action = "login"
    ↓
Calls loginUser(username)
    ↓
Creates/finds user in Google Sheets
    ↓
Generates token
    ↓
Returns: { success: true, token: "...", user: {...} }
    ↓
Next.js stores token in localStorage
    ↓
Redirects to dashboard ✅
```

## Testing Checklist

After updating Google Apps Script:
- [ ] Login page loads
- [ ] Enter username "test"
- [ ] Click Continue
- [ ] Should see "Connecting..." briefly
- [ ] Should redirect to dashboard
- [ ] Dashboard shows your username

## If Still Fails

1. Open browser console (F12)
2. Try to login
3. Look for console messages starting with `[Login]`
4. Send me the error message

Common issues:
- **"Server returned 404"**: Google Apps Script not deployed as Web App
- **"Invalid JSON"**: Old deployment still active (update deployment)
- **"Unknown action: login"**: Code.gs wasn't updated correctly
- **CORS error**: Make sure deployment is set to "Anyone" can access

## What Changed

**Before** (broken):
- Login page tried GET request with query params
- Google Apps Script had no 'login' case in doPost
- Result: "Unknown action: login" error

**After** (fixed):
- Login page sends POST with JSON: `{ action: 'login', username: '...' }`
- Google Apps Script has 'login' case that calls loginUser()
- Result: Login works! ✅

---

Once you update Google Apps Script, login should work perfectly!
