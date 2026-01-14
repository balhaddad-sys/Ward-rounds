# MedWard Setup Guide

## 🔍 Issue: "No Content" When Uploading Pictures

**Root Cause:** API keys are not configured in `.env.local`

## ✅ Solution: Add Your API Keys

### Step 1: Get Your OpenAI API Key

1. Go to https://platform.openai.com/api-keys
2. Click "Create new secret key"
3. Copy the key (it starts with `sk-`)

### Step 2: Configure Environment Variables

Edit `/home/user/Ward-rounds/.env.local`:

```bash
# REQUIRED: Add your OpenAI API key here
OPENAI_API_KEY=sk-your-actual-openai-api-key-here

# OPTIONAL: Google Cloud Vision (for better OCR)
# If not provided, system will use Tesseract.js fallback
GOOGLE_CLOUD_CREDENTIALS={"type":"service_account",...}
```

### Step 3: Restart Development Server

```bash
# Stop current server (Ctrl+C)
# Then restart:
npm run dev
```

### Step 4: Test Upload

1. Open http://localhost:3000
2. Login with any username (e.g., "test")
3. Go to `/scanner`
4. Upload a test image (medical document screenshot)
5. Watch the browser console (F12) for detailed logs

## 🧪 Diagnostic Tools

### Quick Diagnostic Page
Visit http://localhost:3000/debug-upload to check:
- ✅ Authentication status
- ✅ API connectivity
- ✅ Upload endpoint availability
- ✅ Local storage state

### Browser Console Logs
Open Developer Tools (F12) → Console to see:
```
[Scanner] Uploading document to API...
[Scanner] File details: {name, type, size, reportType}
[Scanner] Response status: 200
[Scanner] Upload complete: {success, hasReport, ...}
```

### Server Logs
Check terminal running `npm run dev` for:
```
[Upload] Processing lab document...
[Upload] OCR complete. Confidence: 0.85
[Upload] AI interpretation...
[Upload] Complete! Total time: 15234ms
```

## 📋 What Happens When You Upload

1. **OCR (Text Extraction)**
   - Google Cloud Vision API (if configured)
   - Or Tesseract.js browser-based fallback
   - Extracts text from image/PDF

2. **AI Interpretation** (Requires OpenAI API Key)
   - GPT-4 analyzes the medical content
   - Generates structured interpretation
   - Identifies findings, abnormalities, critical alerts

3. **Clinical Pearls Generation**
   - Creates 3-5 teaching points
   - Categorizes by difficulty level
   - Relevant to the specific report type

4. **Teaching Questions**
   - Generates 3-5 potential attending questions
   - Includes answers and teaching points
   - Based on critical findings

5. **SOAP Presentation**
   - Formats everything into ward presentation format
   - One-liner, S/O/A/P sections
   - Ready for morning rounds

## 🐛 Troubleshooting

### Issue: "Could not extract text"
**Cause:** Image quality too low or OCR failing
**Solution:**
- Use better lighting
- Ensure text is in focus
- Try uploading file instead of camera
- Enable Google Cloud Vision API for better accuracy

### Issue: "Upload failed with status 401"
**Cause:** Not authenticated
**Solution:**
- Go to `/login` and log in again
- Check browser console for auth token

### Issue: "Upload failed with status 500"
**Cause:** Server error (likely OpenAI API issue)
**Solution:**
- Check `.env.local` has valid `OPENAI_API_KEY`
- Check OpenAI account has credits
- Check server console for error details

### Issue: Response shows success but no interpretation
**Cause:** OpenAI API call failed but not caught
**Solution:**
- Verify API key is correct
- Check OpenAI API status
- Look for error in server console

## 📊 Expected Response Structure

When upload succeeds, you should see:

```json
{
  "success": true,
  "report": {
    "id": "uuid-here",
    "extractedText": "CBC WBC 12.5...",
    "ocrConfidence": 0.92,
    "interpretation": {
      "summary": "Complete blood count showing...",
      "findings": [...],
      "criticalAlerts": [...],
      "recommendations": [...]
    },
    "clinicalPearls": {
      "pearls": [...]
    },
    "potentialQuestions": {
      "questions": [...]
    },
    "presentation": {
      "oneLiner": "...",
      "subjective": "...",
      "objective": "...",
      "assessment": "...",
      "plan": "..."
    }
  },
  "learningStats": {
    "usedCachedKnowledge": false,
    "processingTime": 15234
  }
}
```

## 🚀 Next Steps After Setup

1. **Test with Sample Documents**
   - Lab results (CBC, CMP, etc.)
   - Imaging reports (X-ray, CT, MRI)
   - Clinical notes

2. **Create Patient Records**
   - Go to `/patients`
   - Add patient info
   - Link reports to patients

3. **Review Presentations**
   - Go to `/reports`
   - View generated presentations
   - Practice ward rounds format

4. **Explore Knowledge Base**
   - Check `/dashboard` for stats
   - See how system learns over time
   - Monitor API call savings

## 💡 Tips for Best Results

1. **Image Quality**
   - Good lighting, no shadows
   - Text clearly readable
   - Proper alignment
   - High resolution (at least 1080p)

2. **Document Types**
   - Lab results work best
   - Typed reports > handwritten
   - PDFs with text > scanned images

3. **Cost Optimization**
   - System caches interpretations
   - Similar documents reuse cached results
   - Reduces OpenAI API costs over time

## 📚 Resources

- **OpenAI API**: https://platform.openai.com/docs
- **Google Cloud Vision**: https://cloud.google.com/vision/docs
- **Next.js**: https://nextjs.org/docs
- **Project GitHub**: https://github.com/balhaddad-sys/Ward-rounds

## 🔒 Security Notes

- API keys stored in `.env.local` (not committed to git)
- JWT tokens expire after 7 days
- All API calls logged in audit database
- Patient data encrypted at rest
- HIPAA-compliant architecture

---

**Need Help?** Check browser console (F12) and server logs for detailed error messages.
