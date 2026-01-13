# 🚀 GitHub to Google Apps Script Auto-Deployment Setup

**Goal**: Push code to GitHub → Automatically deploys to your Google Apps Script web app

No more copying and pasting in the terrible Apps Script web editor!

---

## 📋 Prerequisites

- ✅ Existing Google Apps Script project with your web app URL
- ✅ Node.js 18+ installed
- ✅ Git and GitHub account
- ✅ 10 minutes of time

---

## 🎯 Step-by-Step Setup

### Step 1: Get Your Apps Script ID

1. Go to https://script.google.com
2. Open your **MedWard** project (the one with your web app)
3. Click the **⚙️ Project Settings** icon on the left
4. Find and copy the **Script ID** (looks like: `AKfycbz...`)

**Your Script ID**: `_________________` (write it down!)

---

### Step 2: Install clasp (Command Line Tool)

```bash
# Install clasp globally
npm install -g @google/clasp

# Verify installation
clasp --version
```

---

### Step 3: Login to Google Apps Script

```bash
# This opens a browser for authorization
clasp login
```

- Click "Allow" to authorize clasp
- This creates `~/.clasprc.json` with your credentials

---

### Step 4: Update .clasp.json with Your Script ID

Open `.clasp.json` in the project root and replace the Script ID:

```json
{
  "scriptId": "PASTE_YOUR_SCRIPT_ID_HERE",
  "rootDir": "google-apps-script",
  "fileExtension": "gs"
}
```

**Example**:
```json
{
  "scriptId": "AKfycbz5I5uGmK3f-_k7pi9HMsW1YMANS8NGnC8-kIDxcEB1vesYXpmwNHRnQRGX_GqV19iWJw",
  "rootDir": "google-apps-script",
  "fileExtension": "gs"
}
```

---

### Step 5: Test Manual Deployment First

Before setting up automatic deployment, test that it works manually:

```bash
# From project root directory
cd /path/to/Ward-rounds

# Push files to Apps Script
clasp push

# You should see:
# └─ google-apps-script/Code.gs
# └─ google-apps-script/API.gs
# └─ google-apps-script/Index.html
# └─ google-apps-script/Styles.html
# └─ google-apps-script/Script.html
# └─ google-apps-script/appsscript.json
# Pushed 6 files.
```

If this works, you're ready for automatic deployment! 🎉

---

### Step 6: Set Up GitHub Secrets

For automatic deployment, you need to add credentials to GitHub:

#### 6.1: Get Your clasp Credentials

```bash
# Mac/Linux:
cat ~/.clasprc.json

# Windows:
type %USERPROFILE%\.clasprc.json
```

Copy the **entire content** of this file. It looks like:
```json
{
  "token": {
    "access_token": "ya29.a0...",
    "refresh_token": "1//...",
    "scope": "...",
    "token_type": "Bearer",
    "expiry_date": 1234567890
  },
  "oauth2ClientSettings": {
    "clientId": "...",
    "clientSecret": "...",
    "redirectUri": "..."
  },
  "isLocalCreds": false
}
```

#### 6.2: Add Secrets to GitHub

1. Go to your GitHub repository: https://github.com/balhaddad-sys/Ward-rounds
2. Click **Settings** (top right)
3. In left sidebar: **Secrets and variables** → **Actions**
4. Click **New repository secret**

**Add Secret #1:**
- Name: `CLASP_CREDENTIALS`
- Value: Paste the entire content of `.clasprc.json`
- Click **Add secret**

**Add Secret #2:**
- Name: `APPS_SCRIPT_ID`
- Value: Your Script ID (from Step 1)
- Click **Add secret**

---

### Step 7: Enable Apps Script API

1. Go to: https://script.google.com/home/usersettings
2. Toggle **ON**: "Google Apps Script API"

---

### Step 8: Test Automatic Deployment

Now when you push to the `main` branch, it will automatically deploy!

```bash
# Make a small test change
cd google-apps-script
echo "// Auto-deployment test" >> Code.gs

# Commit and push
git add .
git commit -m "test: Verify automatic deployment from GitHub"
git push origin main
```

#### Check Deployment Status:

1. Go to your GitHub repo
2. Click the **Actions** tab
3. You should see "Deploy to Google Apps Script" running
4. Click on it to see the progress
5. When complete, your changes are live! ✅

---

## 🎉 You're Done!

Now your workflow is:

```bash
# 1. Edit files locally in VS Code (or any editor)
vim google-apps-script/Index.html

# 2. Commit and push to GitHub
git add .
git commit -m "feat: Updated UI"
git push origin main

# 3. GitHub automatically deploys to Apps Script
# Check the Actions tab to see deployment progress

# 4. Your web app is updated!
# https://script.google.com/macros/s/YOUR_ID/exec
```

**No more web editor! No more copy-paste! 🎊**

---

## 🔧 Troubleshooting

### ❌ Error: "Could not find script"

**Solution**: Double-check your Script ID in `.clasp.json`

### ❌ Error: "User has not enabled the Apps Script API"

**Solution**: Go to https://script.google.com/home/usersettings and enable it

### ❌ Error: "Authentication failed" in GitHub Actions

**Solution**:
1. Run `clasp logout` then `clasp login` locally
2. Get new credentials from `~/.clasprc.json`
3. Update the `CLASP_CREDENTIALS` secret in GitHub

### ❌ Error: "Push failed" locally

**Solution**:
```bash
# Force push to overwrite
clasp push --force
```

### ❌ GitHub Actions workflow not triggering

**Solution**: Make sure you're pushing to the `main` branch and files in `google-apps-script/` changed

---

## 📝 Workflow File Location

The GitHub Actions workflow is in: `.github/workflows/deploy-apps-script.yml`

It triggers when:
- You push to `main` branch
- Files in `google-apps-script/` directory are modified
- You manually trigger it from the Actions tab

---

## 🔒 Security Notes

- ✅ `.clasprc.json` is in `.gitignore` (never committed)
- ✅ Credentials are stored securely in GitHub Secrets
- ✅ Only you can trigger deployments (or authorized collaborators)
- ⚠️ Keep your GitHub account secure with 2FA

---

## 💡 Pro Tips

### Edit Locally, Deploy Automatically
```bash
# Open in VS Code
code google-apps-script/

# Edit files with full IDE features:
# - Syntax highlighting
# - Auto-completion
# - Git integration
# - Multi-cursor editing
# - Find and replace across files

# Push when ready
git add .
git commit -m "Your changes"
git push origin main
```

### Quick Deploy Script
Add this to your `.bashrc` or `.zshrc`:
```bash
alias deploy-medward='git add . && git commit -m "Update MedWard" && git push origin main'
```

Then just run: `deploy-medward`

### Deploy from Any Branch
You can also test on branches:
```bash
# Create test branch
git checkout -b test/new-feature

# Make changes and push
clasp push  # Deploy directly (doesn't trigger GitHub Actions)

# When satisfied, merge to main for auto-deployment
git checkout main
git merge test/new-feature
git push origin main
```

---

## 📊 Deployment Flow Diagram

```
┌─────────────────────┐
│  Edit Code Locally  │
│  (VS Code, etc.)    │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│   git commit & push │
│   to GitHub main    │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│  GitHub Actions     │
│  Triggered          │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│  clasp push         │
│  (via workflow)     │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│  Google Apps Script │
│  Project Updated    │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│   Web App Live      │
│   (instantly!)      │
└─────────────────────┘
```

---

## ✅ Verification Checklist

Before expecting automatic deployment to work:

- [ ] Installed clasp: `npm install -g @google/clasp`
- [ ] Logged in: `clasp login`
- [ ] Updated `.clasp.json` with actual Script ID
- [ ] Tested manual push: `clasp push` (should succeed)
- [ ] Enabled Apps Script API at script.google.com/home/usersettings
- [ ] Added `CLASP_CREDENTIALS` secret to GitHub
- [ ] Added `APPS_SCRIPT_ID` secret to GitHub
- [ ] Verified secrets are correctly formatted JSON
- [ ] Pushed to `main` branch (not another branch)
- [ ] Changed files in `google-apps-script/` directory
- [ ] Checked Actions tab for deployment status

---

## 🆘 Still Need Help?

1. **Check GitHub Actions logs**: Go to Actions tab → Click failed run → Read error messages
2. **Test manually first**: If `clasp push` works locally, GitHub Actions should work too
3. **Verify secrets**: Make sure GitHub secrets are exactly as shown above
4. **Check Script ID**: Open Apps Script project settings and verify ID matches
5. **Review detailed guide**: See `google-apps-script/DEPLOY-FROM-GITHUB.md`

---

## 🎯 Quick Reference

```bash
# Manual commands (when needed)
clasp push              # Push files to Apps Script
clasp deploy            # Create new deployment
clasp open              # Open project in browser
clasp open --webapp     # Open web app URL

# Automatic deployment (preferred)
git push origin main    # That's it! Everything else is automatic
```

---

**Your Web App URL**: https://script.google.com/macros/s/AKfycbz5I5uGmK3f-_k7pi9HMsW1YMANS8NGnC8-kIDxcEB1vesYXpmwNHRnQRGX_GqV19iWJw/exec

Once setup is complete, this URL will automatically update whenever you push to GitHub! 🚀
