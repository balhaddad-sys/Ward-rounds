# File Contents for Google Apps Script

Use this guide to copy the correct content into each Apps Script file.

---

## 📄 Index File Content

**Apps Script file name**: `Index` (HTML file, NOT script file)

**Copy from**: `google-apps-script/Index.html` (225 lines)

**How to view locally**:
```bash
cat google-apps-script/Index.html
```

**First few lines should be**:
```html
<!DOCTYPE html>
<html>
<head>
    <base target="_top">
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
    <title>MedWard - Medical Report Interpreter</title>
    <?!= HtmlService.createHtmlOutputFromFile('Styles').getContent(); ?>
</head>
<body>
    <div id="app">
        <!-- Loading Screen -->
        <div id="loading" class="view active loading-screen">
```

**Last few lines should be**:
```html
    <?!= HtmlService.createHtmlOutputFromFile('Script').getContent(); ?>
</body>
</html>
```

---

## 🎨 Styles File Content

**Apps Script file name**: `Styles` (HTML file)

**Copy from**: `google-apps-script/Styles.html` (589 lines)

**How to view locally**:
```bash
cat google-apps-script/Styles.html
```

**First few lines should be**:
```html
<style>
    * {
        margin: 0;
        padding: 0;
        box-sizing: border-box;
        -webkit-tap-highlight-color: transparent;
    }

    :root {
        --primary: #0066CC;
```

**Last few lines should be**:
```css
    .hint {
        font-size: 0.85rem;
        color: var(--text-secondary);
    }
</style>
```

---

## ⚙️ Script File Content

**Apps Script file name**: `Script` (HTML file)

**Copy from**: `google-apps-script/Script.html` (380 lines)

**How to view locally**:
```bash
cat google-apps-script/Script.html
```

**First few lines should be**:
```html
<script>
    // Global state
    let currentUser = null;
    let currentPatient = null;
    let currentReportType = 'lab';
    let currentImageData = null;

    // Initialize app
    document.addEventListener('DOMContentLoaded', function() {
```

**Last few lines should be**:
```javascript
    });
    }
</script>
```

---

## 📝 Code.gs Content

**Apps Script file name**: `Code.gs` (Script file)

**Copy from**: `google-apps-script/Code.gs`

**How to view locally**:
```bash
cat google-apps-script/Code.gs
```

**First lines should be**:
```javascript
/**
 * MedWard - Google Apps Script Backend
 * Main entry point for web app
 */

/**
 * Serves the main web app
 */
function doGet() {
  return HtmlService.createHtmlOutputFromFile('Index')
    .setTitle('MedWard - Medical Report Interpreter')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL)
    .addMetaTag('viewport', 'width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no');
}
```

---

## 🔧 API.gs Content

**Apps Script file name**: `API.gs` (Script file)

**Copy from**: `google-apps-script/API.gs`

**How to view locally**:
```bash
cat google-apps-script/API.gs
```

---

## 📋 Copy Instructions

### Option 1: Copy from Local Files
1. Open each file in a text editor
2. Select All (Ctrl+A / Cmd+A)
3. Copy (Ctrl+C / Cmd+C)
4. Paste into corresponding Apps Script file

### Option 2: Use Command Line
```bash
# Navigate to the directory
cd google-apps-script

# View file content (then copy from terminal)
cat Index.html
cat Styles.html
cat Script.html
```

### Option 3: Direct from GitHub
If you've pushed to GitHub, you can view and copy from:
```
https://github.com/balhaddad-sys/Ward-rounds/tree/main/google-apps-script
```

---

## ✅ Verification Checklist

After pasting content, verify:

- [ ] **Index**: File starts with `<!DOCTYPE html>` and ends with `</html>`
- [ ] **Styles**: File starts with `<style>` and ends with `</style>`
- [ ] **Script**: File starts with `<script>` and ends with `</script>`
- [ ] **Code.gs**: File starts with `function doGet()`
- [ ] **API.gs**: File contains API helper functions
- [ ] All files saved (Ctrl+S)
- [ ] No syntax errors shown in editor

---

## 🎯 File Type Summary

| File Name | Type in Apps Script | Icon | Extension Visible? |
|-----------|-------------------|------|-------------------|
| Code.gs | Script | 📝 | Yes (.gs) |
| API.gs | Script | 📝 | Yes (.gs) |
| Index | HTML | 📄 | No |
| Styles | HTML | 📄 | No |
| Script | HTML | 📄 | No |

**Remember**:
- HTML files = created with "+" → "HTML" → name WITHOUT .html
- Script files = created with "+" → "Script" → name WITH .gs
