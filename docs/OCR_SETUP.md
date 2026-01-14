# OCR Configuration Guide

This application supports two OCR methods for extracting text from medical documents:

## 1. Client-Side OCR (Tesseract.js) ✅ Default

**Status:** Always available, no configuration needed

**Pros:**
- Works immediately without setup
- No API costs
- Privacy-preserving (processing happens in browser)
- No server required

**Cons:**
- Lower accuracy than cloud-based solutions
- Slower processing
- Limited to simpler documents

**Usage:** Automatically used as fallback when Google Cloud Vision is not configured.

---

## 2. Server-Side OCR (Google Cloud Vision API) 🎯 Recommended

**Status:** Optional, requires Google Cloud credentials

**Pros:**
- Superior accuracy for medical documents
- Faster processing
- Better handling of complex layouts
- Confidence scoring per word

**Cons:**
- Requires Google Cloud account setup
- Small API costs (very affordable)
- Requires environment configuration

### Setup Instructions

#### Step 1: Create Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project (or select existing)
3. Enable the **Cloud Vision API**:
   - Navigate to "APIs & Services" > "Library"
   - Search for "Cloud Vision API"
   - Click "Enable"

#### Step 2: Create Service Account

1. Go to "IAM & Admin" > "Service Accounts"
2. Click "Create Service Account"
3. Name it: `medward-ocr` (or your preferred name)
4. Grant role: **"Cloud Vision AI Service Agent"**
5. Click "Create and Continue"

#### Step 3: Generate Credentials

1. Click on the created service account
2. Go to "Keys" tab
3. Click "Add Key" > "Create new key"
4. Choose format: **JSON**
5. Download the key file (save it securely!)

#### Step 4: Configure Environment

You have two options:

##### Option A: JSON String (Recommended for Production/Docker)

1. Open the downloaded JSON file
2. Copy the entire JSON content
3. Create `.env.local` file in project root:

```bash
GOOGLE_CLOUD_CREDENTIALS='{"type":"service_account","project_id":"your-project","private_key_id":"...","private_key":"-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n","client_email":"medward-ocr@your-project.iam.gserviceaccount.com",...}'
```

**Important:** The entire JSON must be on one line, wrapped in single quotes.

##### Option B: File Path (Easier for Local Development)

1. Save the downloaded JSON file to a secure location
2. Add to `.env.local`:

```bash
GOOGLE_APPLICATION_CREDENTIALS=/path/to/your/service-account-key.json
```

#### Step 5: Verify Setup

1. Restart your development server:
   ```bash
   npm run dev
   ```

2. Check API status:
   ```bash
   curl http://localhost:3000/api/ocr
   ```

3. You should see:
   ```json
   {
     "status": "online",
     "services": {
       "googleCloudVision": {
         "available": true,
         "configured": true
       }
     }
   }
   ```

---

## How It Works

### Automatic Selection

The application automatically chooses the best OCR method:

```
1. Try Google Cloud Vision API
   ├─ Success? ✓ Use high-quality results
   └─ Failed/Not configured? → Fall back to Tesseract.js
```

### In the Console

You'll see logs indicating which method is being used:

**Google Cloud Vision:**
```
[Scanner] Attempting server-side OCR with Google Cloud Vision...
[Scanner] ✓ Using Google Cloud Vision API
[Scanner] OCR complete using google-cloud-vision, confidence: 0.98
```

**Tesseract.js Fallback:**
```
[Scanner] ⚠ Server-side OCR not available, falling back to client-side Tesseract.js
[Scanner] Using client-side Tesseract.js OCR...
[Scanner] OCR complete using tesseract-js, confidence: 0.85
```

---

## Cost Estimates

Google Cloud Vision pricing (as of 2024):

- **First 1,000 requests/month:** FREE
- **1,001 - 5,000,000:** $1.50 per 1,000 requests
- **Medical documents typical usage:** ~$0.0015 per scan

Example: 100 scans/month = **$0.15/month** (likely FREE under free tier)

[View Current Pricing](https://cloud.google.com/vision/pricing)

---

## Troubleshooting

### Error: "Server-side OCR not configured"

**Solution:** Google Cloud credentials not set. Either:
1. Configure credentials (see setup above), OR
2. Use client-side Tesseract.js (works automatically)

### Error: "Google Cloud Vision credentials not configured"

**Cause:** Environment variable not found or malformed

**Fix:**
1. Verify `.env.local` exists in project root
2. Check variable name: `GOOGLE_CLOUD_CREDENTIALS` or `GOOGLE_APPLICATION_CREDENTIALS`
3. Ensure JSON is valid (use JSON validator)
4. Restart server after changes

### Error: "Permission denied" or "API not enabled"

**Fix:**
1. Go to Cloud Console > APIs & Services > Library
2. Search "Cloud Vision API"
3. Ensure it's ENABLED for your project
4. Check service account has correct role

### Low Confidence Scores

**Tips for better results:**
- Use good lighting (avoid shadows)
- Ensure document is flat and in focus
- Use higher resolution images
- Avoid glare on the document
- Try both portrait and landscape orientations

---

## Security Best Practices

1. **Never commit credentials to git**
   - `.env.local` is in `.gitignore`
   - Never share credentials publicly

2. **Rotate keys regularly**
   - Create new service account keys every 90 days
   - Delete old keys from Google Cloud Console

3. **Limit service account permissions**
   - Only grant "Cloud Vision AI Service Agent" role
   - Don't use project owner credentials

4. **Monitor usage**
   - Check Google Cloud Console for API usage
   - Set up billing alerts

---

## Need Help?

- **Google Cloud Vision Docs:** https://cloud.google.com/vision/docs
- **Tesseract.js Docs:** https://tesseract.projectnaptha.com/
- **Project Issues:** https://github.com/your-repo/issues

---

## Summary

| Feature | Tesseract.js | Google Cloud Vision |
|---------|-------------|---------------------|
| **Setup Required** | None | Yes (credentials) |
| **Accuracy** | Good | Excellent |
| **Speed** | Slower | Fast |
| **Cost** | Free | ~$0.0015/scan |
| **Privacy** | Client-side | Server processes |
| **Availability** | Always | With setup |

**Recommendation:** Set up Google Cloud Vision for production use, Tesseract.js works great for development and testing!
