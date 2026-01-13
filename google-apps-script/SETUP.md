# Google Apps Script Setup - Step by Step

## 🚨 CRITICAL: How to Create HTML Files in Apps Script

The error "No HTML file named Index was found" means your HTML files aren't created correctly.

---

## ✅ The Correct Way

### Step 1: Access Your Project
Go to: https://script.google.com and open your MedWard project

### Step 2: Create HTML Files (NOT Script Files!)

#### Create Index File:
1. Click the **+** icon next to "Files" in the left sidebar
2. Select **"HTML"** from the dropdown (⚠️ NOT "Script"!)
3. When prompted for name, type: `Index` (exactly, no .html)
4. Click OK
5. You should now see a file with an HTML icon (📄) named "Index"

#### Create Styles File:
1. Click the **+** icon again
2. Select **"HTML"**
3. Name it: `Styles` (no .html)
4. Click OK

#### Create Script File:
1. Click the **+** icon again
2. Select **"HTML"**
3. Name it: `Script` (no .html)
4. Click OK

### Step 3: Verify Your Files

Your files list should look like this:

```
📝 Code.gs          (Script file - purple icon)
📝 API.gs           (Script file - purple icon)
📄 Index            (HTML file - orange/white icon)
📄 Styles           (HTML file - orange/white icon)
📄 Script           (HTML file - orange/white icon)
```

**IMPORTANT**:
- ✅ HTML files have a document/page icon (📄)
- ❌ Script files have a code icon (📝)
- ✅ HTML files show "HTML" badge when you hover
- ❌ If you see .gs extension, it's WRONG!

### Step 4: Add Content to HTML Files

#### For Index file:
1. Click on "Index" in the left sidebar
2. Delete any default content
3. Go to your local file: `google-apps-script/Index.html`
4. Copy the ENTIRE content (all 225 lines)
5. Paste into the Apps Script Index file
6. Press Ctrl+S (or Cmd+S) to save

#### For Styles file:
1. Click on "Styles" in the left sidebar
2. Delete any default content
3. Go to your local file: `google-apps-script/Styles.html`
4. Copy the ENTIRE content (all 589 lines)
5. Paste into the Apps Script Styles file
6. Press Ctrl+S to save

#### For Script file:
1. Click on "Script" in the left sidebar
2. Delete any default content
3. Go to your local file: `google-apps-script/Script.html`
4. Copy the ENTIRE content (all 380 lines)
5. Paste into the Apps Script Script file
6. Press Ctrl+S to save

### Step 5: Verify Code.gs

Make sure your Code.gs file starts with:

```javascript
function doGet() {
  return HtmlService.createHtmlOutputFromFile('Index')
    .setTitle('MedWard - Medical Report Interpreter')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL)
    .addMetaTag('viewport', 'width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no');
}
```

### Step 6: Test the doGet Function

1. In the Apps Script editor, select `doGet` from the function dropdown (top toolbar)
2. Click "Run" (▶️ button)
3. If prompted for authorization, click "Review permissions" and authorize
4. Check the Execution log - it should complete without errors

### Step 7: Deploy

1. Click "Deploy" → "Manage deployments"
2. Click "Edit" (pencil icon) on your existing deployment
3. Change version to "New version"
4. Click "Deploy"
5. Copy the new web app URL
6. Test it in a new browser tab

---

## 🔍 Common Mistakes

### ❌ Wrong: Creating Script Files
- Clicking + → Script → Naming it "Index.gs"
- This creates a JavaScript file, NOT an HTML file

### ✅ Correct: Creating HTML Files
- Clicking + → HTML → Naming it "Index"
- This creates an HTML file that Apps Script can serve

### ❌ Wrong: Including .html Extension
- Naming the file "Index.html" in Apps Script
- Apps Script will look for "Index.html.html"

### ✅ Correct: No Extension
- Just name it "Index"
- Apps Script knows it's HTML from the file type

---

## 📋 Quick Checklist

Before deploying, verify:

- [ ] You have exactly 5 files
- [ ] Code.gs and API.gs are Script files (purple icon)
- [ ] Index, Styles, and Script are HTML files (document icon)
- [ ] No file has .html or .gs in its visible name
- [ ] Each HTML file has content copied from local files
- [ ] All files are saved (Ctrl+S)
- [ ] doGet function runs without errors
- [ ] API keys are set in Project Settings → Script Properties

---

## 🆘 Still Not Working?

### Check the Execution Log:
1. Click "Executions" (clock icon) in left sidebar
2. Look for recent executions
3. Click on any failed ones to see the error
4. If you still see "No HTML file named Index", the HTML file isn't created correctly

### Verify File Type:
1. Click on "Index" in the files list
2. Look at the top of the editor
3. You should see "Index.html" in the tab (Apps Script adds .html automatically in tabs)
4. The file icon should be a document/page icon, not a code icon

### Nuclear Option - Start Fresh:
1. Delete all HTML files
2. Follow Step 2 again very carefully
3. Make sure you select "HTML" not "Script"
4. Verify the icon before adding content

---

## 📝 File Content Reference

You need to copy content from these local files to your Apps Script files:

| Apps Script File | Copy From Local File | Lines | Content Type |
|-----------------|---------------------|--------|--------------|
| Index | google-apps-script/Index.html | 225 | HTML structure |
| Styles | google-apps-script/Styles.html | 589 | CSS in `<style>` tags |
| Script | google-apps-script/Script.html | 380 | JS in `<script>` tags |

**To get the content:**
```bash
# View each file locally
cat google-apps-script/Index.html
cat google-apps-script/Styles.html
cat google-apps-script/Script.html
```

Or open them in any text editor and copy all content.

---

## ✅ Success Indicators

You'll know it's working when:
- ✅ doGet function runs without errors
- ✅ Web app URL loads without "Exception" message
- ✅ You see the MedWard login screen
- ✅ No console errors about missing files

---

**Need help?** Check TROUBLESHOOTING.md or review the execution logs in Apps Script.
