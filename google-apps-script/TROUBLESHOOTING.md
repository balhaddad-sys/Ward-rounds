# Google Apps Script Troubleshooting Guide

## Common Errors and Solutions

### Error: "No HTML file named Index was found"

**Cause**: The HTML files are not properly created in your Google Apps Script project.

**Solution**:

#### 1. Check Your Files in Apps Script Editor

Go to https://script.google.com and open your MedWard project. You should see these files in the left sidebar:

```
✅ Code.gs
✅ API.gs
✅ Index (HTML file icon)
✅ Styles (HTML file icon)
✅ Script (HTML file icon)
```

**IMPORTANT**: The HTML files should be named WITHOUT the .html extension:
- ✅ Correct: `Index`
- ❌ Wrong: `Index.html`

#### 2. Create Missing HTML Files

If any HTML files are missing, create them:

1. Click the **+** icon next to "Files" in the Apps Script editor
2. Select **HTML**
3. Name it exactly: `Index` (not Index.html)
4. Copy the content from the local `Index.html` file
5. Repeat for `Styles` and `Script`

#### 3. Verify File Contents

**Index File:**
- Should contain: `<!DOCTYPE html>` and the main app structure
- Should include: `<?!= HtmlService.createHtmlOutputFromFile('Styles').getContent(); ?>`

**Styles File:**
- Should contain: `<style>` tag with all CSS

**Script File:**
- Should contain: `<script>` tag with all JavaScript

#### 4. Deploy Again

After creating all files:
1. Click **Deploy** → **Manage deployments**
2. Click the **Edit** (pencil) icon
3. Select **New version**
4. Click **Deploy**
5. Test your web app URL

---

## Other Common Issues

### Issue: "Script function not found: doGet"

**Solution**: Make sure `Code.gs` exists and contains the `doGet()` function at the top.

### Issue: "Service invoked too many times"

**Solution**: Google Apps Script has rate limits. Wait a few minutes before trying again.

### Issue: "Authorization required"

**Solution**:
1. Go to Apps Script editor
2. Click **Run** → Select `doGet` function
3. Click **Review permissions**
4. Authorize the app

### Issue: "ReferenceError: google is not defined"

**Solution**: This error appears in the browser console when testing locally. The code only works when deployed as a Google Apps Script web app.

---

## Checklist for Successful Deployment

- [ ] All 5 files created (Code.gs, API.gs, Index, Styles, Script)
- [ ] HTML files named WITHOUT .html extension
- [ ] API keys added to Script Properties (OPENAI_API_KEY, GOOGLE_VISION_API_KEY)
- [ ] Web app deployed with correct access permissions
- [ ] App authorized (Run doGet function first)
- [ ] Web app URL copied and tested

---

## Still Having Issues?

### Check Execution Logs

1. In Apps Script editor, click **Executions** (clock icon)
2. Look for error messages
3. Click on any failed execution to see details

### Test Individual Functions

1. Select a function from the dropdown (e.g., `loginUser`)
2. Click **Run**
3. Check logs for errors

### Verify Project Structure

Your Apps Script project should look like this:

```
MedWard/
├── Code.gs         (Script file with doGet function)
├── API.gs          (Script file with API functions)
├── Index           (HTML file - main UI)
├── Styles          (HTML file - CSS only)
└── Script          (HTML file - JavaScript only)
```

---

## Need More Help?

1. Check the [Google Apps Script documentation](https://developers.google.com/apps-script)
2. Review the [DEPLOY.md](DEPLOY.md) guide for step-by-step instructions
3. Ensure all prerequisites are met (API keys, permissions, etc.)

---

**Quick Fix Command Summary:**

```
1. Delete existing HTML files (if wrong names)
2. Create new HTML files:
   - Name: Index (type: HTML)
   - Name: Styles (type: HTML)
   - Name: Script (type: HTML)
3. Copy content from local files
4. Save all files (Ctrl+S / Cmd+S)
5. Deploy → Manage deployments → Edit → New version → Deploy
```
