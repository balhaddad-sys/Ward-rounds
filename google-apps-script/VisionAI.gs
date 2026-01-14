/**
 * Vision AI Integration for MedWard
 * Handles Google Cloud Vision API for OCR and image interpretation
 */

/**
 * Sanitize base64 string - remove data URL prefix, whitespace, and URL encoding
 * @param {string} base64String - The base64 string to sanitize
 * @returns {string} Clean base64 string
 */
function sanitizeBase64(base64String) {
  if (!base64String || typeof base64String !== 'string') {
    throw new Error('Invalid base64 string: input is empty or not a string');
  }

  Logger.log('=== sanitizeBase64 function ===');
  Logger.log('Input string length: ' + base64String.length);
  Logger.log('Input starts with: ' + base64String.substring(0, 50) + '...');

  let cleaned = base64String;

  // Remove data URL prefix if present (e.g., "data:image/png;base64,")
  if (cleaned.includes('base64,')) {
    Logger.log('Input contains comma: true');
    cleaned = cleaned.split('base64,')[1];
    Logger.log('After removing data URL prefix, length: ' + cleaned.length);
  }

  // Remove all whitespace characters (spaces, newlines, tabs, etc.)
  cleaned = cleaned.replace(/\s+/g, '');
  Logger.log('After removing whitespace, length: ' + cleaned.length);

  // Remove URL encoding artifacts (like %20, %2B, etc.)
  try {
    cleaned = decodeURIComponent(cleaned);
    Logger.log('After removing URL encoding, length: ' + cleaned.length);
  } catch (e) {
    // If decoding fails, continue with current string
    Logger.log('URL decoding not needed or failed: ' + e.message);
  }

  // Validate base64 characters (only A-Z, a-z, 0-9, +, /, and = for padding)
  const base64Regex = /^[A-Za-z0-9+/]*={0,2}$/;
  if (!base64Regex.test(cleaned)) {
    Logger.log('Invalid base64 characters detected. Length: ' + cleaned.length);
    Logger.log('First 100 chars: ' + cleaned.substring(0, 100));
    Logger.log('Last 50 chars: ' + cleaned.substring(Math.max(0, cleaned.length - 50)));
    throw new Error('Base64 string contains invalid characters');
  }

  // Check minimum length (a valid image should be at least a few KB)
  if (cleaned.length < 1000) {
    Logger.log('WARNING: Base64 string seems too short for a valid image: ' + cleaned.length + ' characters');
    Logger.log('Full base64: ' + cleaned);
    throw new Error('Base64 string too short - expected at least 1000 characters for a valid image, got ' + cleaned.length);
  }

  Logger.log('Sanitization complete. Final length: ' + cleaned.length);
  return cleaned;
}

/**
 * Process image with Google Cloud Vision AI
 * @param {string} imageData - Base64 encoded image data
 * @param {string} documentType - Type of medical document
 * @returns {Object} OCR result with extracted text
 */
function processImageWithVisionAI(imageData, documentType) {
  try {
    Logger.log('=== processImageWithVisionAI ===');
    Logger.log('Document type: ' + documentType);
    Logger.log('Image data length (raw): ' + imageData.length);

    // Get API key from Script Properties
    const visionApiKey = PropertiesService.getScriptProperties().getProperty('GOOGLE_VISION_API_KEY');

    if (!visionApiKey) {
      throw new Error('Google Vision API key not configured. Add GOOGLE_VISION_API_KEY to Script Properties.');
    }

    // Sanitize the base64 data
    Logger.log('Sanitizing base64 data...');
    const cleanBase64 = sanitizeBase64(imageData);
    Logger.log('Sanitized base64 length: ' + cleanBase64.length);

    // Prepare Vision API request
    const visionUrl = 'https://vision.googleapis.com/v1/images:annotate?key=' + visionApiKey;

    const requestPayload = {
      requests: [{
        image: {
          content: cleanBase64
        },
        features: [
          {
            type: 'DOCUMENT_TEXT_DETECTION',
            maxResults: 1
          }
        ],
        imageContext: {
          languageHints: ['en']
        }
      }]
    };

    Logger.log('Calling Vision API...');
    const visionOptions = {
      method: 'post',
      contentType: 'application/json',
      payload: JSON.stringify(requestPayload),
      muteHttpExceptions: true
    };

    const visionResponse = UrlFetchApp.fetch(visionUrl, visionOptions);
    const responseCode = visionResponse.getResponseCode();
    Logger.log('Vision API response code: ' + responseCode);

    if (responseCode !== 200) {
      const errorText = visionResponse.getContentText();
      Logger.log('Vision API error response: ' + errorText);
      throw new Error('Vision API error (' + responseCode + '): ' + errorText);
    }

    const visionResult = JSON.parse(visionResponse.getContentText());

    // Extract text from Vision API response
    if (!visionResult.responses || !visionResult.responses[0]) {
      throw new Error('Invalid Vision API response format');
    }

    const response = visionResult.responses[0];

    // Check for errors in the response
    if (response.error) {
      throw new Error('Vision API error: ' + JSON.stringify(response.error));
    }

    // Extract full text
    if (!response.fullTextAnnotation || !response.fullTextAnnotation.text) {
      Logger.log('No text detected in image');
      return {
        success: false,
        error: 'No text detected in the image. Please ensure the image contains readable text.'
      };
    }

    const extractedText = response.fullTextAnnotation.text;
    const confidence = response.fullTextAnnotation.pages && response.fullTextAnnotation.pages[0]
      ? response.fullTextAnnotation.pages[0].confidence || 0.85
      : 0.85;

    Logger.log('Text extraction successful');
    Logger.log('Extracted text length: ' + extractedText.length);
    Logger.log('Confidence: ' + confidence);

    return {
      success: true,
      text: extractedText,
      confidence: confidence,
      metadata: {
        imageSize: cleanBase64.length,
        detectionType: 'DOCUMENT_TEXT_DETECTION'
      }
    };

  } catch (error) {
    Logger.log('Vision AI error: ' + error.toString());
    Logger.log('Stack: ' + (error.stack || 'No stack trace'));
    return {
      success: false,
      error: error.toString()
    };
  }
}

/**
 * Handle image interpretation request (OCR + AI analysis)
 * @param {Object} requestData - Request data containing imageData and documentType
 * @returns {ContentService.TextOutput} JSON response
 */
function handleImageInterpret(requestData) {
  try {
    Logger.log('=== handleImageInterpret ===');

    const imageData = requestData.imageData || requestData.fileData;
    const documentType = requestData.documentType || 'general';

    if (!imageData) {
      return createErrorResponse('No image data provided. Please include imageData or fileData in the request.');
    }

    Logger.log('Image data in handleInterpret - length: ' + imageData.length);
    Logger.log('Image data in handleInterpret - first 100 chars: ' + imageData.substring(0, 100));
    Logger.log('Document type: ' + documentType);

    // Step 1: OCR with Vision AI
    Logger.log('Processing image with Vision AI (direct upload)...');
    const ocrResult = processImageWithVisionAI(imageData, documentType);

    if (!ocrResult.success) {
      return createErrorResponse('OCR failed: ' + ocrResult.error);
    }

    Logger.log('OCR successful, text length: ' + ocrResult.text.length);

    // Step 2: AI Interpretation
    Logger.log('Interpreting text with OpenAI...');
    const interpretation = interpretMedicalText(ocrResult.text, documentType);

    if (!interpretation || typeof interpretation !== 'object') {
      throw new Error('Invalid interpretation result');
    }

    // Step 3: Generate Clinical Pearls
    Logger.log('Generating clinical pearls...');
    const clinicalPearls = generateClinicalPearls(interpretation, documentType);

    // Step 4: Generate Teaching Questions
    Logger.log('Generating teaching questions...');
    const potentialQuestions = generateTeachingQuestions(interpretation, documentType);

    // Step 5: Generate Presentation
    Logger.log('Generating presentation...');
    const presentation = generatePresentation(interpretation, documentType);

    Logger.log('Image interpretation complete!');

    return ContentService
      .createTextOutput(JSON.stringify({
        success: true,
        reportId: Utilities.getUuid(),
        extractedText: ocrResult.text,
        ocrConfidence: ocrResult.confidence,
        interpretation: interpretation,
        clinicalPearls: clinicalPearls,
        potentialQuestions: potentialQuestions,
        presentation: presentation,
        metadata: {
          processedAt: new Date().toISOString(),
          documentType: documentType,
          ocrMetadata: ocrResult.metadata
        }
      }))
      .setMimeType(ContentService.MimeType.JSON);

  } catch (error) {
    Logger.log('handleImageInterpret error: ' + error.toString());
    Logger.log('Stack: ' + (error.stack || 'No stack trace'));
    return createErrorResponse('Image interpretation failed: ' + error.toString());
  }
}

/**
 * Test function for image interpretation
 * NOTE: When testing, make sure to provide the FULL base64 string, not a truncated version
 */
function testImageInterpret() {
  Logger.log('=== testImageInterpret ===');

  // For testing, you would call this with actual image data:
  // const testData = {
  //   action: 'interpretImage',
  //   imageData: 'data:image/png;base64,iVBORw0KGgo...[FULL_BASE64_STRING_HERE]...',
  //   documentType: 'lab'
  // };

  Logger.log('To test image interpretation:');
  Logger.log('1. Capture the full base64 string from your frontend (should be thousands of characters)');
  Logger.log('2. Call handleImageInterpret with the complete base64 data');
  Logger.log('3. Check that the sanitizeBase64 function validates the length (min 1000 chars)');

  // Example of what NOT to do (truncated data):
  const badExample = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUg...'; // Only 47 chars - TOO SHORT!
  Logger.log('BAD example length: ' + badExample.length + ' (will fail validation)');

  // A real image would be much longer:
  Logger.log('A typical small image: ~10,000-50,000 base64 characters');
  Logger.log('A typical document scan: ~50,000-200,000 base64 characters');
}
