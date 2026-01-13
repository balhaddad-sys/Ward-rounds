# 🏥 MedWard - Google Apps Script Version

**Full-featured medical report interpreter that runs entirely on Google Apps Script!**

No server, no hosting costs, no complex setup. Just copy, paste, and deploy.

---

## ✨ Features

✅ **AI-Powered**: GPT-4 interpretation of medical reports
✅ **OCR**: Google Cloud Vision text extraction
✅ **Clinical Pearls**: Auto-generated teaching points
✅ **Questions**: Attending-level Q&A
✅ **Patient Management**: Track multiple patients
✅ **Mobile-First**: Optimized for phones and tablets
✅ **Free Hosting**: Runs on Google's infrastructure
✅ **Secure**: Data stored in your private Google Sheets

---

## 📁 Files Included

```
google-apps-script/
├── Code.gs           # Backend logic (login, patients, reports)
├── API.gs            # OpenAI & Google Vision API calls
├── Index.html        # Main web app interface
├── Styles.html       # CSS styling
├── Script.html       # JavaScript functionality
├── DEPLOY.md         # Detailed deployment guide
└── README.md         # This file
```

---

## 🌐 Live Deployment

**Deployed Web App URL:**
```
https://script.google.com/macros/s/AKfycbz5I5uGmK3f-_k7pi9HMsW1YMANS8NGnC8-kIDxcEB1vesYXpmwNHRnQRGX_GqV19iWJw/exec
```

> Access the live MedWard application directly at the URL above, or follow the deployment steps below to create your own instance.

---

## 🚀 Quick Start (5 Minutes)

### **1. Get API Keys**
- **OpenAI**: https://platform.openai.com/api-keys
- **Google Vision**: https://console.cloud.google.com (enable Cloud Vision API)

### **2. Create Apps Script Project**
1. Go to https://script.google.com
2. Click "New project"
3. Copy all 5 files into the project

### **3. Add API Keys**
1. Click ⚙️ Project Settings
2. Add Script Properties:
   - `OPENAI_API_KEY` = your OpenAI key
   - `GOOGLE_VISION_API_KEY` = your Vision API key

### **4. Deploy**
1. Click **Deploy** → **New deployment**
2. Select "Web app"
3. Set access level
4. Click "Deploy"
5. Copy your web app URL

### **5. Use It!**
Open the URL on your phone and start interpreting reports!

---

## 📖 Full Documentation

See **[DEPLOY.md](DEPLOY.md)** for:
- Detailed step-by-step instructions
- Troubleshooting guide
- Security notes
- Cost estimates
- How to add to home screen

---

## 💡 How It Works

```
User → Upload Image → Google Apps Script
                          ↓
                    Google Vision API (OCR)
                          ↓
                    OpenAI GPT-4 (Interpretation)
                          ↓
                    Clinical Pearls + Questions
                          ↓
                    Google Sheets (Storage)
                          ↓
                    Results to User
```

---

## 🔋 **What's Included**

### **Frontend (HTML/CSS/JS)**
- Mobile-responsive UI
- Patient management interface
- Document scanner
- Results viewer with tabs
- Clinical pearls display
- Interactive Q&A

### **Backend (Google Apps Script)**
- User authentication
- Patient CRUD operations
- Document processing pipeline
- OCR integration
- AI interpretation
- Data storage

### **Database**
- Google Sheets for storage
- Auto-created on first use
- Three tables: users, patients, reports

---

## 💰 Costs

- **Google Apps Script**: FREE
- **Google Vision API**: First 1,000 images/month FREE, then $1.50/1K
- **OpenAI GPT-4**: ~$0.03-0.06 per report

**Total for personal use**: ~$5-20/month

---

## 🔒 Security

- API keys stored securely in Script Properties
- Data never leaves Google's servers
- Choose your own access level (private/public)
- All connections use HTTPS

---

## 📱 Mobile Installation

Add to your phone's home screen:

**iOS**: Safari → Share → "Add to Home Screen"
**Android**: Chrome → Menu → "Add to Home screen"

---

## 🎯 Use Cases

- **Medical Students**: Learn clinical reasoning
- **Residents**: Quick pre-rounds prep
- **Attendings**: Teaching rounds questions
- **Personal**: Track your own lab results

---

## ⚡ Performance

- First load: ~5-10 seconds (cold start)
- Subsequent: ~2-3 seconds
- OCR: ~3-5 seconds
- AI interpretation: ~10-20 seconds per report

---

## 🛠️ Tech Stack

- **Frontend**: HTML5, CSS3, Vanilla JavaScript
- **Backend**: Google Apps Script (JavaScript)
- **OCR**: Google Cloud Vision API
- **AI**: OpenAI GPT-4 Turbo
- **Database**: Google Sheets
- **Hosting**: Google Apps Script Web App

---

## 📝 License

MIT License - Use freely for personal and educational purposes

---

## ⚠️ Disclaimer

**Medical Disclaimer**: This tool is for educational purposes only. Always verify AI-generated interpretations with clinical expertise.

**Data Privacy**: For real patient data, ensure HIPAA compliance and proper security measures.

---

## 🆘 Support

**Issues?**
1. **See [TROUBLESHOOTING.md](TROUBLESHOOTING.md)** for common errors and solutions
2. Check DEPLOY.md troubleshooting section
3. Review Apps Script execution logs
4. Verify API keys are correct
5. Ensure HTML files are named correctly (Index, Styles, Script - without .html)

**Questions?**
- See DEPLOY.md for detailed instructions
- Check [TROUBLESHOOTING.md](TROUBLESHOOTING.md) for specific error fixes
- Check execution logs for errors
- Verify all files are properly created

---

## 🎉 Ready to Deploy!

Follow **[DEPLOY.md](DEPLOY.md)** for complete instructions.

**Your AI-powered medical report interpreter awaits!** 🚀
