/**
 * Complete Document Processing Flow using Google Apps Script
 * This handles the entire pipeline: OCR → Interpretation → Pearls → Questions → Presentation
 */

import { fileToBase64, isValidBase64, getFileInfo } from '@/lib/utils/base64';

const GOOGLE_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbwWYEiLB0bdOfLt9bSizC9vLL0a-Zut52DqSjNgd6roAk7sdQ8cI0MzHsP2mk66JwK5/exec';

/**
 * Process document using Google Apps Script end-to-end
 * @param {File} file - The document file (image or PDF)
 * @param {string} reportType - Type of report (lab, imaging, note, etc.)
 * @returns {Promise<Object>} Complete report with interpretation, pearls, questions, and presentation
 */
export async function processDocumentWithGoogleScript(file, reportType = 'lab') {
  try {
    console.log('[Google Script Flow] Starting complete document processing...');

    // Step 1: Convert file to base64
    console.log('[Google Script Flow] Converting file to base64...');
    const base64Data = await fileToBase64(file);

    // Step 2: Send to Google Script for complete processing
    console.log('[Google Script Flow] Sending to Google Script API...');
    const payload = {
      action: 'processDocument',
      documentType: reportType,
      fileName: file.name,
      fileType: file.type,
      fileSize: file.size,
      fileData: base64Data
    };

    const response = await fetch(GOOGLE_SCRIPT_URL, {
      method: 'POST',
      mode: 'no-cors', // GitHub Pages doesn't support CORS, Google Script handles it
      headers: {
        'Content-Type': 'text/plain', // Use text/plain for no-cors mode
      },
      body: JSON.stringify(payload)
    });

    // With no-cors, we can't read the response directly
    // Google Script needs to return success via a different mechanism
    // or we use GET with query params for the response
    console.log('[Google Script Flow] Request sent, fetching result...');

    // Alternative: Use GET to fetch result by ID
    // For now, try to parse response
    let data;
    try {
      data = await response.json();
    } catch (e) {
      // If no-cors blocks us, use alternative approach
      console.log('[Google Script Flow] Using alternative fetch method...');

      // Convert to GET request with URL params
      const getUrl = `${GOOGLE_SCRIPT_URL}?action=processDocument&documentType=${reportType}`;
      const getResponse = await fetch(getUrl, {
        method: 'POST',
        body: JSON.stringify({ fileName: file.name, fileData: base64Data })
      });
      data = await getResponse.json();
    }

    console.log('[Google Script Flow] Processing complete!', data);

    // Ensure data has expected structure
    if (!data.success) {
      throw new Error(data.error || 'Processing failed');
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
    console.error('[Google Script Flow] Error:', error);
    throw error;
  }
}

/**
 * Process using local browser-based OCR + Google Script AI
 * This is a fallback that does OCR locally, then sends text to Google Script
 */
export async function processWithLocalOCR(file, reportType = 'lab') {
  try {
    console.log('[Google Script Flow] Using local OCR + Google Script AI...');

    // Step 1: Local OCR
    const { processDocument } = await import('@/lib/ocr/textExtractor');
    const ocrResult = await processDocument(file, file.type, reportType);

    console.log('[Google Script Flow] OCR complete. Sending to Google Script for AI analysis...');

    // Step 2: Send extracted text to Google Script
    const payload = {
      action: 'interpret',
      documentType: reportType,
      text: ocrResult.fullText,
      metadata: {
        confidence: ocrResult.confidence,
        fileName: file.name
      }
    };

    const response = await fetch(GOOGLE_SCRIPT_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      throw new Error(`Google Script returned ${response.status}`);
    }

    const data = await response.json();

    if (!data.success) {
      throw new Error(data.error || 'AI processing failed');
    }

    // Step 3: Generate presentation locally
    const { generatePresentation } = await import('@/lib/presentation/generator');
    const presentation = generatePresentation({
      reportType,
      extractedText: ocrResult.fullText,
      ocrConfidence: ocrResult.confidence,
      structuredData: ocrResult.structuredData,
      interpretation: data.interpretation,
      clinicalPearls: data.clinicalPearls,
      potentialQuestions: data.potentialQuestions
    });

    return {
      success: true,
      report: {
        id: Date.now().toString(),
        type: reportType,
        fileName: file.name,
        extractedText: ocrResult.fullText,
        ocrConfidence: ocrResult.confidence,
        structuredData: ocrResult.structuredData,
        interpretation: data.interpretation,
        clinicalPearls: data.clinicalPearls,
        potentialQuestions: data.potentialQuestions,
        presentation,
        source: 'google_script',
        createdAt: new Date().toISOString()
      }
    };

  } catch (error) {
    console.error('[Google Script Flow] Error in local OCR flow:', error);
    throw error;
  }
}

// Note: fileToBase64 is now imported from @/lib/utils/base64

/**
 * Auto-detect best processing method
 * Uses local API if available (dev), otherwise Google Script (production)
 */
export async function processDocumentAuto(file, reportType = 'lab') {
  // Check if running in development (local API available)
  const isDev = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';

  if (isDev) {
    console.log('[Auto] Using local API (development mode)');
    // Try local API first
    try {
      const token = localStorage.getItem('medward_token');
      if (!token) {
        throw new Error('No auth token');
      }

      const formData = new FormData();
      formData.append('document', file);
      formData.append('reportType', reportType);

      const response = await fetch('/api/documents/upload', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formData
      });

      if (response.ok) {
        return await response.json();
      }
      throw new Error('Local API failed');
    } catch (error) {
      console.warn('[Auto] Local API failed, falling back to Google Script');
    }
  }

  // Production: Use Google Script
  console.log('[Auto] Using Google Script (production mode)');
  return await processWithLocalOCR(file, reportType);
}
