# MedWard Deployment Guide for GitHub Pages

## 🚀 Your App Uses Google Apps Script Backend

Your app is configured for **GitHub Pages** with **Google Apps Script** backend.

## ✅ How It Works Now

When users upload pictures on your deployed app:

1. **Browser OCR** (Tesseract.js) extracts text from image
2. **Google Apps Script** receives the extracted text
3. **OpenAI** (via your Google Script) interprets the medical content
4. **Results** are displayed to user

## 🔍 Why "No Content" Happens

Your **Google Apps Script** needs to handle the `interpret` action. Check your script:

```javascript
function doPost(e) {
  const data = JSON.parse(e.postData.contents);

  if (data.action === 'interpret') {
    const text = data.text;              // Extracted text from OCR
    const documentType = data.documentType;  // 'lab', 'imaging', etc.

    // ⚠️ THIS IS THE KEY PART - You need OpenAI API here
    const interpretation = interpretWithOpenAI(text, documentType);

    return ContentService.createTextOutput(JSON.stringify({
      success: true,
      interpretation: interpretation,
      clinicalPearls: generatePearls(interpretation),
      potentialQuestions: generateQuestions(interpretation)
    })).setMimeType(ContentService.MimeType.JSON);
  }
}
```

## 📋 Quick Fix Steps

### 1. Check Your Google Apps Script

Visit: https://script.google.com/

Find your MedWard project and verify:
- ✅ OpenAI API key is configured
- ✅ `interpret` action handler exists
- ✅ Script is deployed as Web App
- ✅ Access set to "Anyone"

### 2. Test Your Google Script

```bash
# Test with curl:
curl -X POST "https://script.google.com/macros/s/AKfycbz5I5uGmK3f-_k7pi9HMsW1YMANS8NGnC8-kIDxcEB1vesYXpmwNHRnQRGX_GqV19iWJw/exec" \
  -H "Content-Type: application/json" \
  -d '{"action":"interpret","documentType":"lab","text":"WBC 12.5 Hgb 10.2"}'
```

You should get back JSON with interpretation, pearls, and questions.

### 3. Deploy to GitHub Pages

```bash
# Build static files
npm run build

# Commit and push
git add docs/
git commit -m "Deploy to GitHub Pages"
git push origin main
```

## 🧪 Test the Full Flow

1. Go to: `https://balhaddad-sys.github.io/Ward-rounds/`
2. Click Login → enter username
3. Go to Scanner → upload medical image
4. Watch browser console (F12) for logs:
   ```
   [Google Script Flow] Using local OCR + Google Script AI...
   [Google Script Flow] OCR complete. Sending to Google Script for AI analysis...
   [Google Script Flow] Processing complete!
   ```

## 📊 Expected Response Structure

Your Google Script should return:

```json
{
  "success": true,
  "interpretation": {
    "summary": "Complete blood count showing leukocytosis...",
    "findings": [
      {
        "finding": "WBC 12.5 (elevated)",
        "status": "abnormal",
        "significance": "Possible infection or inflammation"
      }
    ],
    "criticalAlerts": [],
    "recommendations": ["Repeat CBC in 24-48 hours"]
  },
  "clinicalPearls": {
    "pearls": [
      {
        "pearl": "Leukocytosis differential includes infection, stress, medications",
        "relevance": "Essential for narrowing differential",
        "difficulty": "basic"
      }
    ]
  },
  "potentialQuestions": {
    "questions": [
      {
        "question": "What are the most common causes of leukocytosis?",
        "answer": "Infection, stress response, medications (steroids)",
        "teachingPoint": "Always correlate with clinical picture"
      }
    ]
  }
}
```

## 🐛 Debugging Checklist

If uploads show no content:

- [ ] Check browser console (F12) for errors
- [ ] Verify Google Script URL is correct
- [ ] Test Google Script with curl/Postman
- [ ] Check Google Script execution logs
- [ ] Verify OpenAI API key in Google Script
- [ ] Ensure Google Script is published as Web App
- [ ] Check Google Script quotas (20k/day free tier)

## 💡 Pro Tips

1. **Cache in Google Sheets**: Store frequent interpretations to save API costs
2. **Monitor Quotas**: Google Apps Script has daily limits
3. **Error Handling**: Always return `{success: false, error: "message"}` on failure
4. **Logs**: Use `Logger.log()` in Google Script for debugging

---

**Need Help?** Check your Google Script logs first! Most issues are in the backend.
