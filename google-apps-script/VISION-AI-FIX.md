# Vision AI Fix - Base64 Image Upload Support

## Problem Fixed

The application was failing when uploading images with the error:
```
Base64 string contains invalid characters
Input string length: 47
After removing data URL prefix, length: 25
```

This was caused by:
1. Missing `processDocument` action handler in Google Apps Script
2. No Vision AI integration for OCR
3. The deployed script was manually edited but not synced to the repository

## Solution Implemented

### 1. Added `processDocument` Action Handler

Updated `MedWardComplete.gs` to include:
- `case 'processDocument'` in the doPost switch statement (line 94-95)
- Complete `handleProcessDocument()` function (line 232-299)

### 2. Implemented Vision AI Text Extraction

Added three new functions:

#### a. `extractTextWithVisionAI()` (line 558-587)
- Main entry point for OCR
- Sanitizes base64 data (removes data URL prefix, whitespace)
- Routes to Google Cloud Vision or OpenAI GPT-4 Vision based on available API keys
- **Logs proper base64 length for debugging**

#### b. `extractTextWithGoogleVision()` (line 592-634)
- Uses Google Cloud Vision API for OCR
- Requires `GOOGLE_VISION_API_KEY` in Script Properties
- Best for accuracy and speed
- Cost-effective for high volume

#### c. `extractTextWithOpenAIVision()` (line 639-709)
- Falls back to OpenAI GPT-4 Turbo with Vision
- Uses existing `OPENAI_API_KEY`
- Works without additional API setup
- Great for medical documents (understands context)

### 3. Complete Document Processing Flow

The `handleProcessDocument()` function now:
1. Validates fileData is present and non-empty
2. Extracts text using Vision AI (step 1)
3. Interprets medical content with OpenAI (step 2)
4. Generates clinical pearls (step 3)
5. Creates teaching questions (step 4)
6. Generates SOAP presentation (step 5)
7. Returns comprehensive report with all data

## Deployment Instructions

### Step 1: Update Google Apps Script

1. Go to https://script.google.com
2. Open your MedWard project
3. Open the `MedWardComplete.gs` file (or Code.gs)
4. **Replace the entire content** with the updated file from:
   ```
   google-apps-script/MedWardComplete.gs
   ```

### Step 2: Configure API Keys

You need at least one of these API keys:

#### Option A: OpenAI Only (Recommended for Start)
1. Go to **⚙️ Project Settings** → **Script Properties**
2. Ensure you have:
   - Property: `OPENAI_API_KEY`
   - Value: `sk-proj-...` (your OpenAI API key)

This will use GPT-4 Turbo with Vision for OCR (works great for medical documents).

#### Option B: Google Cloud Vision (Best for Production)
1. Go to **⚙️ Project Settings** → **Script Properties**
2. Add both keys:
   - Property: `GOOGLE_VISION_API_KEY`
   - Value: Your Google Cloud Vision API key
   - Property: `OPENAI_API_KEY`
   - Value: `sk-proj-...` (for interpretation)

This will use Google Vision for OCR (faster, cheaper) and OpenAI for interpretation.

### Step 3: Deploy

1. Click **Deploy** → **Manage deployments**
2. If you have an existing deployment:
   - Click **✏️ Edit**
   - Select **New version**
   - Click **Deploy**
3. If creating new deployment:
   - Click **New deployment**
   - Type: **Web app**
   - Execute as: **Me**
   - Who has access: **Anyone**
   - Click **Deploy**

**Important**: Wait 30-60 seconds after deployment for changes to propagate.

### Step 4: Test

Run these tests in the Apps Script editor:

#### Test 1: Check Function Exists
```javascript
function testProcessDocument() {
  Logger.log(typeof handleProcessDocument); // Should output: "function"
  Logger.log(typeof extractTextWithVisionAI); // Should output: "function"
}
```

#### Test 2: Test with Sample Data
```javascript
function testVisionAI() {
  // Small test image (1x1 red pixel PNG)
  const testBase64 = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==";

  const testData = {
    action: 'processDocument',
    fileData: testBase64,
    documentType: 'lab',
    fileName: 'test.png'
  };

  const result = handleProcessDocument(testData);
  Logger.log(result.getContent());
}
```

### Step 5: Frontend Testing

1. Open your Next.js app at the scanner page
2. Upload a medical document image
3. Check browser console (F12) for logs
4. Verify the processing completes successfully

Expected flow:
```
[GoogleScript] Processing document...
[GoogleScript] Attempt 1/3...
[GoogleScript] Success!
```

## Troubleshooting

### Error: "Unknown action: processDocument"

**Cause**: Old script version is still deployed

**Fix**:
1. Re-deploy with **New version**
2. Wait 60 seconds
3. Hard refresh your app (Ctrl+Shift+R)

### Error: "No text detected in image"

**Causes**:
- Image is too blurry
- Text is too small
- Image is upside down or rotated

**Fix**:
- Use the image preprocessor (already implemented in frontend)
- Ensure good lighting
- Take photo from directly above

### Error: "Vision AI extraction failed"

**Causes**:
- No API keys configured
- Invalid API key
- API quota exceeded

**Fix**:
1. Check Script Properties have correct API keys
2. Verify keys are valid on their respective platforms
3. Check API usage/billing on OpenAI or Google Cloud

### Error: "Base64 string contains invalid characters"

This should now be fixed by the `extractTextWithVisionAI()` function which:
- Removes data URL prefixes
- Strips whitespace
- Validates base64 length (logs the actual length)

If you still see this error:
1. Check the log for "base64 length: X chars"
2. If length is very small (< 100 chars), the fileData is being truncated in the frontend
3. Check browser console for FileReader errors

## What Changed

### Files Modified

1. **google-apps-script/MedWardComplete.gs**
   - Added `processDocument` case to doPost switch
   - Added `handleProcessDocument()` function
   - Added `extractTextWithVisionAI()` function
   - Added `extractTextWithGoogleVision()` function
   - Added `extractTextWithOpenAIVision()` function

### Key Features

✅ **Proper base64 handling** - Sanitizes input, removes prefixes
✅ **Dual Vision AI support** - Google Cloud Vision OR OpenAI GPT-4 Vision
✅ **Comprehensive logging** - Debug base64 length, API responses
✅ **Graceful fallback** - Uses OpenAI Vision if Google Vision unavailable
✅ **Error messages** - Clear, actionable error messages
✅ **Complete pipeline** - OCR → Interpret → Pearls → Questions → Presentation

## API Costs

### OpenAI GPT-4 Turbo with Vision (per image)
- OCR: ~$0.01 per image (varies with size)
- Interpretation: ~$0.005 per request
- Pearls: ~$0.003 per request
- Questions: ~$0.003 per request
- **Total: ~$0.02 per document**

### Google Cloud Vision + OpenAI (per image)
- OCR: ~$0.0015 per image (Google Vision)
- Interpretation: ~$0.005 per request
- Pearls: ~$0.003 per request
- Questions: ~$0.003 per request
- **Total: ~$0.01 per document (50% cheaper!)**

## Support

If you encounter issues:

1. Check the **Execution log** in Google Apps Script editor
2. Check **browser console** (F12) in your app
3. Verify API keys are correctly set in Script Properties
4. Ensure you deployed a **new version** (not just saved)
5. Hard refresh your browser (Ctrl+Shift+R)

## Next Steps

1. Deploy the updated script
2. Test with a sample medical document
3. Monitor the execution logs for any errors
4. Consider setting up Google Cloud Vision for production (cost savings)
