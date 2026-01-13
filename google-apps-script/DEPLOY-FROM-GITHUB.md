# Deploy Google Apps Script from GitHub

This guide explains how to deploy your MedWard Google Apps Script directly from GitHub using `clasp` (Command Line Apps Script Projects).

---

## 🚀 Benefits of GitHub Deployment

- ✅ **Version Control**: All changes tracked in GitHub
- ✅ **Automatic Deployment**: Push to main branch = auto deploy
- ✅ **No Manual Copy-Paste**: Deploy directly from your code editor
- ✅ **Team Collaboration**: Multiple developers can contribute
- ✅ **Rollback Capability**: Revert to any previous version

---

## 📋 Prerequisites

1. **Node.js 18+** installed on your machine
2. **Google Account** with access to Apps Script
3. **GitHub Account** with this repository
4. **Existing Apps Script Project** (or create new one)

---

## 🛠️ Setup (One-Time Configuration)

### Step 1: Install clasp

```bash
# Install clasp globally
npm install -g @google/clasp

# Verify installation
clasp --version
```

### Step 2: Login to Google Account

```bash
# Login to your Google account
clasp login

# This will open a browser window
# Authorize clasp to access your Google Apps Script projects
```

This creates a `.clasprc.json` file in your home directory with your credentials.

### Step 3: Get Your Script ID

#### Option A: From Existing Apps Script Project
1. Go to https://script.google.com
2. Open your MedWard project
3. Click **Project Settings** (gear icon)
4. Copy the **Script ID**

#### Option B: Create New Apps Script Project
```bash
# Create a new Apps Script project
cd google-apps-script
clasp create --type webapp --title "MedWard"

# This will create .clasp.json with your script ID
```

### Step 4: Update .clasp.json

Edit `.clasp.json` in the project root:

```json
{
  "scriptId": "YOUR_ACTUAL_SCRIPT_ID_HERE",
  "rootDir": "google-apps-script",
  "fileExtension": "gs"
}
```

Replace `YOUR_ACTUAL_SCRIPT_ID_HERE` with your actual Script ID.

### Step 5: Configure File Extensions

The `.clasp.json` file tells clasp:
- `scriptId`: Which Apps Script project to deploy to
- `rootDir`: Where your Apps Script files are located
- `fileExtension`: Use `.gs` for script files (HTML files use their extensions)

---

## 📤 Manual Deployment (Command Line)

### Push Code to Apps Script

```bash
# Navigate to project root
cd /path/to/Ward-rounds

# Push all files to Apps Script
clasp push

# Force push (overwrite everything)
clasp push --force
```

### Deploy as Web App

```bash
# Create a new deployment
clasp deploy --description "Version 1.0"

# Create deployment with specific version
clasp deploy -V 2 --description "Version 2.0 - Bug fixes"

# List all deployments
clasp deployments

# Update existing deployment
clasp deploy -i <DEPLOYMENT_ID> --description "Updated version"
```

### View Your Web App

```bash
# Open the Apps Script project in browser
clasp open

# Open the web app URL
clasp open --webapp
```

### Pull Changes from Apps Script

If you made changes in the Apps Script editor and want to pull them:

```bash
# Pull changes from Apps Script to local
clasp pull
```

---

## 🤖 Automatic Deployment via GitHub Actions

### Step 1: Get Your clasp Credentials

```bash
# Your credentials are in ~/.clasprc.json
# On Mac/Linux:
cat ~/.clasprc.json

# On Windows:
type %USERPROFILE%\.clasprc.json
```

Copy the entire content of this file.

### Step 2: Add GitHub Secrets

1. Go to your GitHub repository
2. Click **Settings** → **Secrets and variables** → **Actions**
3. Click **New repository secret**

Add these secrets:

**Secret 1: CLASP_CREDENTIALS**
- Name: `CLASP_CREDENTIALS`
- Value: Paste the entire content of `.clasprc.json`

**Secret 2: APPS_SCRIPT_ID**
- Name: `APPS_SCRIPT_ID`
- Value: Your Apps Script project ID (from .clasp.json)

### Step 3: Enable GitHub Actions

The workflow file is already created at `.github/workflows/deploy-apps-script.yml`

It will automatically deploy when:
- You push to the `main` branch
- Files in `google-apps-script/` directory are changed
- You manually trigger it from the Actions tab

### Step 4: Test Automatic Deployment

```bash
# Make a small change
cd google-apps-script
echo "// Test deployment" >> Code.gs

# Commit and push
git add .
git commit -m "test: Verify automatic deployment"
git push origin main
```

Go to **Actions** tab in GitHub to see the deployment progress.

---

## 📁 File Structure for clasp

Your directory structure should be:

```
Ward-rounds/
├── .clasp.json              # clasp configuration (project root)
├── .github/
│   └── workflows/
│       └── deploy-apps-script.yml  # GitHub Actions workflow
└── google-apps-script/
    ├── appsscript.json      # Apps Script manifest
    ├── Code.gs              # Backend logic
    ├── API.gs               # API integrations
    ├── Index.html           # Main UI
    ├── Styles.html          # CSS styling
    └── Script.html          # JavaScript
```

### Important Notes:

- `.clasp.json` must be at project root (not in google-apps-script/)
- `rootDir` in `.clasp.json` points to `google-apps-script/`
- HTML files keep `.html` extension locally
- clasp automatically handles HTML files in Apps Script

---

## 🔄 Workflow Options

### Option 1: Full GitHub Automation
```bash
# Work locally → Push to GitHub → Auto-deploys to Apps Script
git add .
git commit -m "feat: Add new feature"
git push origin main
# Deployment happens automatically via GitHub Actions
```

### Option 2: Manual clasp Deployment
```bash
# Work locally → Deploy directly to Apps Script
clasp push
clasp deploy --description "Manual deployment"
```

### Option 3: Hybrid Approach
```bash
# Work locally → Test with clasp → Push to GitHub
clasp push          # Test on Apps Script
# If working, commit to GitHub
git add .
git commit -m "feat: Working feature"
git push origin main
```

---

## 🔧 Troubleshooting

### Error: "User has not enabled the Apps Script API"

**Solution**:
1. Visit: https://script.google.com/home/usersettings
2. Enable "Google Apps Script API"
3. Try `clasp login` again

### Error: "Could not find script"

**Solution**:
- Check that `scriptId` in `.clasp.json` is correct
- Run `clasp open` to verify you can access the project
- Make sure you're logged in: `clasp login`

### Error: "Manifest file has been updated"

**Solution**:
```bash
# Pull the latest manifest from Apps Script
clasp pull --only appsscript.json
```

### Error: "Push failed"

**Solution**:
```bash
# Force push to overwrite everything
clasp push --force
```

### GitHub Actions: "Authentication failed"

**Solution**:
1. Regenerate `.clasprc.json`: `clasp logout` then `clasp login`
2. Update `CLASP_CREDENTIALS` secret in GitHub
3. Make sure secret is valid JSON format

---

## 📝 clasp Commands Reference

### Project Management
```bash
clasp login              # Login to Google account
clasp logout             # Logout from Google account
clasp create             # Create new Apps Script project
clasp open               # Open project in browser
clasp open --webapp      # Open web app URL
```

### Code Sync
```bash
clasp push               # Push local files to Apps Script
clasp push --force       # Force push (overwrite)
clasp push --watch       # Watch for changes and auto-push
clasp pull               # Pull files from Apps Script to local
```

### Deployment
```bash
clasp deploy                           # Create new deployment
clasp deploy --description "v1.0"      # Deploy with description
clasp deploy -i <ID> -d "Update"       # Update existing deployment
clasp deployments                      # List all deployments
clasp undeploy <DEPLOYMENT_ID>         # Remove a deployment
```

### Other
```bash
clasp version           # Create new version
clasp versions          # List all versions
clasp logs              # View execution logs
clasp run <function>    # Run a function
```

---

## 🎯 Best Practices

### 1. Use Branches for Development
```bash
# Create feature branch
git checkout -b feature/new-feature

# Work on feature
# ...make changes...

# Push and test with clasp
clasp push

# When ready, merge to main (triggers auto-deploy)
git checkout main
git merge feature/new-feature
git push origin main
```

### 2. Use Deployment Descriptions
```bash
# Good: Descriptive deployment messages
clasp deploy --description "v1.2.0 - Added patient export feature"

# Bad: No description
clasp deploy
```

### 3. Test Before Auto-Deploy
```bash
# Option 1: Test on separate branch
git checkout -b test/feature
clasp push  # Test manually
# If good, merge to main for auto-deploy

# Option 2: Use manual deployment first
clasp push
clasp deploy --description "Testing new feature"
# If good, commit to GitHub
```

### 4. Keep .clasprc.json Secure
```bash
# NEVER commit .clasprc.json to GitHub
# It's already in .gitignore

# Store in GitHub Secrets for CI/CD
# Use separate Google account for production
```

---

## 📊 Deployment Comparison

| Method | Speed | Automation | Version Control | Team-Friendly |
|--------|-------|------------|-----------------|---------------|
| **Manual (Web UI)** | Slow | ❌ None | ❌ No | ❌ No |
| **clasp (Manual)** | Fast | ⚠️ Semi | ✅ Yes | ⚠️ Partial |
| **GitHub Actions** | Fast | ✅ Full | ✅ Yes | ✅ Yes |

---

## 🔐 Security Notes

### Protect Your Credentials
- ✅ `.clasprc.json` is in `.gitignore`
- ✅ Store credentials as GitHub Secrets
- ✅ Use separate Google account for production
- ✅ Rotate credentials periodically

### Script Access
- Web app access: `ANYONE_ANONYMOUS` (configured in `appsscript.json`)
- Script access: Only you can edit via clasp
- Collaborators need explicit permission

---

## 📚 Additional Resources

- **clasp Documentation**: https://github.com/google/clasp
- **Apps Script API**: https://developers.google.com/apps-script/api
- **GitHub Actions**: https://docs.github.com/actions
- **Apps Script Guide**: https://developers.google.com/apps-script/guides/clasp

---

## ✅ Quick Start Checklist

- [ ] Install Node.js 18+
- [ ] Install clasp: `npm install -g @google/clasp`
- [ ] Login: `clasp login`
- [ ] Get Script ID from Apps Script project
- [ ] Update `.clasp.json` with your Script ID
- [ ] Test manual push: `clasp push`
- [ ] Test manual deploy: `clasp deploy`
- [ ] Add GitHub secrets (CLASP_CREDENTIALS, APPS_SCRIPT_ID)
- [ ] Push to main branch and verify auto-deployment
- [ ] Access your web app URL

---

## 🎉 You're Ready!

Now you can:
1. Edit code locally in your favorite editor
2. Push to GitHub
3. Auto-deploy to Google Apps Script
4. Share the web app URL with users

**Web App URL**: https://script.google.com/macros/s/AKfycbz5I5uGmK3f-_k7pi9HMsW1YMANS8NGnC8-kIDxcEB1vesYXpmwNHRnQRGX_GqV19iWJw/exec
