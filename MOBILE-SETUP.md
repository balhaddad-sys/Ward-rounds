# 📱 Mobile Setup - Auto Deploy from GitHub

## You're Almost Done! Just 2 Steps from Your Phone:

Your code is ready to auto-deploy. You just need to add 2 secrets to GitHub (takes 2 minutes from your phone).

---

## Step 1: Get Your Script ID ✅

**Already done!** Your Script ID is configured:
```
AKfycbz5I5uGmK3f-_k7pi9HMsW1YMANS8NGnC8-kIDxcEB1vesYXpmwNHRnQRGX_GqV19iWJw
```

---

## Step 2: Add GitHub Secrets (From Your Phone)

### 2.1: Go to Repository Settings

On your phone browser:
1. Open: https://github.com/balhaddad-sys/Ward-rounds/settings/secrets/actions
2. Or: GitHub app → Your repo → Settings → Secrets and variables → Actions

### 2.2: Add First Secret

Click **"New repository secret"**

**Name:** `APPS_SCRIPT_ID`

**Value:** (copy this exactly)
```
AKfycbz5I5uGmK3f-_k7pi9HMsW1YMANS8NGnC8-kIDxcEB1vesYXpmwNHRnQRGX_GqV19iWJw
```

Click **"Add secret"**

### 2.3: Add Second Secret (Credentials)

This is the authentication token. You'll need to get this from a computer later, OR you can skip this and I'll help you set up a different deployment method.

**For now, skip this step** - we'll set up a simpler deployment method that doesn't need credentials.

---

## Alternative: Direct GitHub Integration (Simpler!)

Since you're on mobile, let's use GitHub's built-in integration with Google Apps Script instead.

I'll create a different workflow that uses GitHub's deploy action. Stand by...
