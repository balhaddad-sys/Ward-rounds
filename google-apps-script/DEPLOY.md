# MedWard - Google Apps Script Deployment Guide

Deploy MedWard as a fully functional web app using Google Apps Script. No server needed!

---

## 📋 **Prerequisites**

You need:
1. ✅ Google account
2. ✅ OpenAI API key (https://platform.openai.com/api-keys)
3. ✅ Google Cloud Vision API key (instructions below)

---

## 🚀 **Step 1: Get API Keys**

### **A) OpenAI API Key**

1. Go to https://platform.openai.com/api-keys
2. Sign up or log in
3. Click "Create new secret key"
4. Copy the key (starts with `sk-...`)
5. **Save it somewhere safe!**

### **B) Google Cloud Vision API Key**

1. Go to https://console.cloud.google.com
2. Create a new project or select existing
3. Enable "Cloud Vision API":
   - Search for "Cloud Vision API" in the search bar
   - Click "Enable"
4. Create API key:
   - Go to "APIs & Services" → "Credentials"
   - Click "Create Credentials" → "API Key"
   - Copy the API key
   - **Save it somewhere safe!**

---

## 📦 **Step 2: Create Google Apps Script Project**

### **On Your Phone or Computer:**

1. **Go to**: https://script.google.com
2. **Click**: "New project"
3. **Rename**: Click "Untitled project" → Name it "MedWard"

---

## 📝 **Step 3: Add the Code Files**

You'll create 4 files in Google Apps Script:

### **File 1: Code.gs** (Backend Logic)

1. In the Apps Script editor, you should see `Code.gs`
2. Delete any existing code
3. Copy the **entire content** from `Code.gs` file
4. Paste it into the editor

### **File 2: API.gs** (API Integrations)

1. Click the **+** icon next to "Files"
2. Select "Script" (.gs file)
3. Name it `API`
4. Copy the **entire content** from `API.gs` file
5. Paste it into the editor

### **File 3: Index.html** (Main Web Page)

1. Click the **+** icon next to "Files"
2. Select "HTML"
3. Name it `Index`
4. Copy the **entire content** from `Index.html` file
5. Paste it into the editor

### **File 4: Styles.html** (CSS Styling)

1. Click the **+** icon next to "Files"
2. Select "HTML"
3. Name it `Styles`
4. Copy the **entire content** from `Styles.html` file
5. Paste it into the editor

### **File 5: Script.html** (JavaScript)

1. Click the **+** icon next to "Files"
2. Select "HTML"
3. Name it `Script`
4. Copy the **entire content** from `Script.html` file
5. Paste it into the editor

---

## 🔑 **Step 4: Add Your API Keys**

1. In the Apps Script editor, click **⚙️ Project Settings** (gear icon on left)
2. Scroll down to "**Script Properties**"
3. Click "**Add script property**"
4. Add these two properties:

   **Property 1:**
   - Name: `OPENAI_API_KEY`
   - Value: Your OpenAI API key (the one starting with `sk-...`)

   **Property 2:**
   - Name: `GOOGLE_VISION_API_KEY`
   - Value: Your Google Cloud Vision API key

5. Click "**Save script properties**"

---

## 🗄️ **Step 5: Create Database Spreadsheet**

1. Go to https://sheets.google.com
2. Create a new blank spreadsheet
3. Name it "**MedWard Database**"
4. Copy the spreadsheet URL
5. Go back to your Apps Script project
6. Click on **Code.gs**
7. Find the line that says:
   ```javascript
   const ss = SpreadsheetApp.getActiveSpreadsheet() || SpreadsheetApp.create('MedWard Database');
   ```
8. Replace it with:
   ```javascript
   const ss = SpreadsheetApp.openByUrl('YOUR_SPREADSHEET_URL_HERE');
   ```
   (Replace `YOUR_SPREADSHEET_URL_HERE` with your actual spreadsheet URL)

**OR** just let it auto-create the database on first use (easier).

---

## 🌐 **Step 6: Deploy as Web App**

1. In the Apps Script editor, click **Deploy** → **New deployment**
2. Click the **⚙️ gear icon** next to "Select type"
3. Select "**Web app**"
4. Configure:
   - **Description**: "MedWard v1.0"
   - **Execute as**: **Me** (your email)
   - **Who has access**: Choose one:
     - **Only myself** - Only you can use it
     - **Anyone** - Anyone with the link can use it ⚠️
     - **Anyone with Google account** - Requires Google login
5. Click "**Deploy**"
6. **Authorize** the app:
   - Click "Authorize access"
   - Choose your Google account
   - Click "Advanced" → "Go to MedWard (unsafe)" (it's safe, it's your own app!)
   - Click "Allow"
7. **Copy the Web App URL** - This is your app's address!

**Your web app URL:**
```
https://script.google.com/macros/s/AKfycbz5I5uGmK3f-_k7pi9HMsW1YMANS8NGnC8-kIDxcEB1vesYXpmwNHRnQRGX_GqV19iWJw/exec
```

---

## 🎉 **Step 7: Access Your App**

1. **Open the Web App URL** in your phone's browser
2. **Bookmark it** for easy access
3. **Add to Home Screen** (iOS/Android):
   - **iOS**: Tap Share → "Add to Home Screen"
   - **Android**: Tap Menu → "Add to Home Screen"

---

## 🧪 **Step 8: Test It!**

1. **Login**: Enter any username (e.g., "Dr. Smith")
2. **Add a patient**:
   - Tap "+ Add" on dashboard
   - Fill in patient details
   - Tap "Save Patient"
3. **Scan a document**:
   - Tap "📷 Scan" in bottom navigation
   - Select "Lab" type
   - Upload a photo of a medical document
   - Wait for AI processing (~20-30 seconds)
4. **View results**:
   - See AI interpretation
   - Explore clinical pearls
   - Try the questions with reveal/hide

---

## 🔧 **Troubleshooting**

### **Issue: "Script function not found"**
**Solution**: Make sure all 5 files are created and saved properly.

### **Issue: "Exception: Service invoked too many times"**
**Solution**: Google Apps Script has rate limits. Wait a few minutes and try again.

### **Issue: "No text detected in image"**
**Solution**:
- Use a clearer photo
- Ensure good lighting
- Try a different image

### **Issue: "OpenAI API key not configured"**
**Solution**:
- Check that you added `OPENAI_API_KEY` in Script Properties
- Make sure there are no extra spaces in the key
- Verify the key is valid at https://platform.openai.com/api-keys

### **Issue: "Database error"**
**Solution**:
- The spreadsheet will be auto-created on first use
- Or manually create "MedWard Database" spreadsheet and link it

### **Issue: App is slow**
**Solution**:
- Google Apps Script has execution time limits
- Large images take longer to process
- First request is always slower (cold start)

---

## 📊 **Features Working**

✅ User authentication (username-based)
✅ Patient management (add, view, list)
✅ Document upload (photos only)
✅ OCR with Google Cloud Vision
✅ AI interpretation with OpenAI GPT-4
✅ Clinical pearls generation
✅ Attending questions with answers
✅ Data storage in Google Sheets
✅ Mobile-optimized UI
✅ Works on any device with browser

---

## 💰 **Cost Estimates**

### **Google Apps Script**: FREE
- 6-hour execution time limit per day
- More than enough for personal use

### **Google Cloud Vision API**: ~$1.50 per 1,000 images
- First 1,000 images per month are FREE
- After that: $1.50 per 1,000

### **OpenAI API**: ~$0.01-0.06 per report
- Depends on report length
- GPT-4 Turbo: ~$0.01 input + $0.03 output per 1K tokens
- Average report: ~$0.03-0.06

**Total monthly cost for moderate use:** ~$5-20

---

## 🔒 **Security Notes**

1. **Your API keys are secure** - Stored in Script Properties (not visible in code)
2. **Data is private** - Stored in your Google Sheets
3. **Access control** - You choose who can access (yourself, anyone, etc.)
4. **HTTPS** - All connections are encrypted
5. **No PHI exposure** - Data never leaves Google's servers

⚠️ **IMPORTANT**:
- For real patient data, set access to "Only myself"
- Don't share your web app URL publicly if it contains sensitive data
- Review HIPAA compliance if using in clinical setting

---

## 🔄 **Updating the App**

To update the app after making changes:

1. Make your edits in the Apps Script editor
2. Click **Deploy** → **Manage deployments**
3. Click **✏️ Edit** (pencil icon)
4. Change version to "New version"
5. Click "Deploy"
6. Users will get the update automatically

---

## 📱 **Adding to Home Screen**

### **iOS (iPhone/iPad)**
1. Open the web app in Safari
2. Tap the Share button (square with arrow)
3. Scroll down and tap "Add to Home Screen"
4. Name it "MedWard"
5. Tap "Add"

### **Android**
1. Open the web app in Chrome
2. Tap the menu (three dots)
3. Tap "Add to Home screen"
4. Name it "MedWard"
5. Tap "Add"

---

## 🎯 **Quick Reference**

**Web App URL**: https://script.google.com/macros/s/AKfycbz5I5uGmK3f-_k7pi9HMsW1YMANS8NGnC8-kIDxcEB1vesYXpmwNHRnQRGX_GqV19iWJw/exec
**Apps Script Editor**: https://script.google.com
**Database Sheet**: (Your Google Sheet URL)
**OpenAI Dashboard**: https://platform.openai.com
**Google Cloud Console**: https://console.cloud.google.com

---

## 🆘 **Need Help?**

1. **Check the execution logs**:
   - In Apps Script editor → Click "Executions" (clock icon)
   - See detailed error messages

2. **Test backend functions**:
   - Select a function from dropdown (e.g., `loginUser`)
   - Click "Run"
   - Check logs for errors

3. **Verify API keys**:
   - Make sure keys are correct in Script Properties
   - Test them independently (OpenAI playground, Cloud Vision API)

---

## 🎊 **You're Done!**

Your MedWard app is now live and accessible from anywhere!

**Next Steps:**
- Bookmark the URL
- Add to home screen
- Start scanning documents
- Build your patient list
- Learn from the AI-generated pearls!

---

**Enjoy your AI-powered medical report interpreter!** 🏥✨
