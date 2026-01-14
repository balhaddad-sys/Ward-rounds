/**
 * Complete Document Processing Flow using Google Apps Script
 * Optimized for GitHub Pages with proper CORS handling
 */

const GOOGLE_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbxJfUS-CHHi3I9zq5f2WTtaK4s0fqNRM3_FZejsoGDwKL9I4fqdn_P-RKZFIsvw-8PiqA/exec';

/**
 * Process document using Google Apps Script with retry logic
 */
export async function processDocumentAuto(file, reportType = 'lab') {
  console.log('[GoogleScript] Processing document...');

  try {
    const base64Data = await fileToBase64(file);

    // Validate base64 data before sending
    if (!base64Data || base64Data.length < 100) {
      throw new Error(`Invalid base64 data: length is only ${base64Data ? base64Data.length : 0} characters. Expected thousands for a valid image.`);
    }

    console.log(`[GoogleScript] Base64 data prepared: ${base64Data.length} characters`);

    const payload = {
      action: 'processDocument',
      documentType: reportType,
      fileName: file.name,
      fileType: file.type,
      fileSize: file.size,
      // Send as both fileData and imageData for compatibility
      fileData: base64Data,
      imageData: base64Data
    };

    // Try with proper CORS first
    let data = await fetchWithRetry(payload);

    if (!data || !data.success) {
      throw new Error(data?.error || 'Processing failed');
    }

    return {
      success: true,
      report: {
        id: data.reportId || Date.now().toString(),
        type: reportType,
        fileName: file.name,
        extractedText: data.extractedText || '',
        ocrConfidence: data.ocrConfidence || 0.7,
        interpretation: data.interpretation || {},
        clinicalPearls: data.clinicalPearls || { pearls: [] },
        potentialQuestions: data.potentialQuestions || { questions: [] },
        presentation: data.presentation || {},
        createdAt: new Date().toISOString()
      }
    };
  } catch (error) {
    console.error('[GoogleScript] Error:', error);
    throw error;
  }
}

/**
 * Fetch with automatic retry on network errors
 */
async function fetchWithRetry(payload, maxRetries = 3) {
  let lastError;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`[GoogleScript] Attempt ${attempt}/${maxRetries}...`);

      const response = await fetch(GOOGLE_SCRIPT_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
        // Don't use no-cors - let CORS errors surface properly
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      console.log('[GoogleScript] Success!');
      return data;

    } catch (error) {
      lastError = error;
      console.warn(`[GoogleScript] Attempt ${attempt} failed:`, error.message);

      // If it's a CORS or network error, wait and retry
      if (attempt < maxRetries && (
        error.message.includes('CORS') ||
        error.message.includes('fetch') ||
        error.message.includes('NetworkError') ||
        error.message.includes('Failed to fetch')
      )) {
        const delay = Math.min(1000 * Math.pow(2, attempt - 1), 5000);
        console.log(`[GoogleScript] Retrying in ${delay}ms...`);
        await new Promise(resolve => setTimeout(resolve, delay));
        continue;
      }

      // For other errors, throw immediately
      throw error;
    }
  }

  throw lastError;
}

/**
 * Convert file to base64
 */
function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result;

      // Validate that we got a data URL
      if (!result || typeof result !== 'string') {
        reject(new Error('FileReader returned invalid result'));
        return;
      }

      // Check if it contains the base64 separator
      if (!result.includes(',')) {
        reject(new Error('FileReader result is not a valid data URL'));
        return;
      }

      // Extract base64 (everything after the comma)
      const base64 = result.split(',')[1];

      // Validate base64 is not empty
      if (!base64 || base64.length === 0) {
        reject(new Error('Base64 extraction resulted in empty string'));
        return;
      }

      // Log for debugging
      console.log(`[FileReader] Converted ${file.name}: ${base64.length} base64 characters`);

      resolve(base64);
    };
    reader.onerror = (error) => {
      console.error('[FileReader] Error reading file:', error);
      reject(new Error(`Failed to read file: ${error.message || 'Unknown error'}`));
    };
    reader.readAsDataURL(file);
  });
}

/**
 * Fallback using local OCR + Google Script AI
 */
export async function processWithLocalOCR(file, reportType = 'lab') {
  console.log('[GoogleScript] Using local OCR fallback...');

  try {
    // Dynamic import to avoid loading OCR libs unless needed
    const { extractText } = await import('@/lib/ocr/textExtractor');
    
    console.log('[GoogleScript] Extracting text locally...');
    const extractedText = await extractText(file);

    if (!extractedText || extractedText.trim().length === 0) {
      throw new Error('No text extracted from document');
    }

    console.log('[GoogleScript] Text extracted, sending to AI...');

    const payload = {
      action: 'interpretText',
      text: extractedText,
      documentType: reportType
    };

    const data = await fetchWithRetry(payload);

    return {
      success: true,
      report: {
        id: Date.now().toString(),
        type: reportType,
        fileName: file.name,
        extractedText,
        ocrConfidence: 0.8,
        interpretation: data.interpretation || {},
        clinicalPearls: data.clinicalPearls || { pearls: [] },
        potentialQuestions: data.potentialQuestions || { questions: [] },
        presentation: data.presentation || {},
        createdAt: new Date().toISOString()
      }
    };
  } catch (error) {
    console.error('[GoogleScript] Fallback error:', error);
    throw error;
  }
}

// Export for backward compatibility
export const processDocumentWithGoogleScript = processDocumentAuto;
