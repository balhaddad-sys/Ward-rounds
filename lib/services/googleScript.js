/**
 * Google Apps Script Integration
 * Connects to the deployed Google Apps Script for AI interpretation
 */

const GOOGLE_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbxJfUS-CHHi3I9zq5f2WTtaK4s0fqNRM3_FZejsoGDwKL9I4fqdn_P-RKZFIsvw-8PiqA/exec';

/**
 * Call Google Apps Script with OCR results
 * @param {Object} ocrResult - The OCR extraction result
 * @param {string} documentType - Type of document (lab, imaging, note, etc.)
 * @returns {Promise<Object>} AI interpretation from Google Script
 */
export async function interpretWithGoogleScript(ocrResult, documentType = 'general') {
  try {
    console.log('[Google Script] Sending request...');

    // Prepare the payload
    const payload = {
      action: 'interpret',
      documentType: documentType,
      text: ocrResult.rawText || ocrResult.text,
      metadata: {
        confidence: ocrResult.confidence,
        fileName: ocrResult.metadata?.fileName,
        extractedAt: new Date().toISOString()
      }
    };

    // Call Google Apps Script
    const response = await fetch(GOOGLE_SCRIPT_URL, {
      method: 'POST',
      mode: 'cors',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      throw new Error(`Google Script returned ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    console.log('[Google Script] Response received:', data);

    return data;

  } catch (error) {
    console.error('[Google Script] Error:', error);
    throw error;
  }
}

/**
 * Generate clinical pearls using Google Script
 * @param {Object} interpretation - The interpretation result
 * @returns {Promise<Object>} Clinical pearls
 */
export async function generatePearlsWithGoogleScript(interpretation) {
  try {
    console.log('[Google Script] Generating pearls...');

    const payload = {
      action: 'generatePearls',
      interpretation: interpretation
    };

    const response = await fetch(GOOGLE_SCRIPT_URL, {
      method: 'POST',
      mode: 'cors',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      throw new Error(`Google Script returned ${response.status}`);
    }

    const data = await response.json();
    console.log('[Google Script] Pearls received');

    return data;

  } catch (error) {
    console.error('[Google Script] Error generating pearls:', error);
    throw error;
  }
}

/**
 * Generate teaching questions using Google Script
 * @param {Object} interpretation - The interpretation result
 * @returns {Promise<Object>} Teaching questions
 */
export async function generateQuestionsWithGoogleScript(interpretation) {
  try {
    console.log('[Google Script] Generating questions...');

    const payload = {
      action: 'generateQuestions',
      interpretation: interpretation
    };

    const response = await fetch(GOOGLE_SCRIPT_URL, {
      method: 'POST',
      mode: 'cors',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      throw new Error(`Google Script returned ${response.status}`);
    }

    const data = await response.json();
    console.log('[Google Script] Questions received');

    return data;

  } catch (error) {
    console.error('[Google Script] Error generating questions:', error);
    throw error;
  }
}

/**
 * Upload file to Google Drive via Google Script
 * @param {File} file - The file to upload
 * @returns {Promise<Object>} Upload result with Drive file ID
 */
export async function uploadToGoogleDrive(file) {
  try {
    console.log('[Google Script] Uploading to Google Drive...');

    // Convert file to base64
    const reader = new FileReader();
    const base64Promise = new Promise((resolve, reject) => {
      reader.onload = () => resolve(reader.result.split(',')[1]);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });

    const base64Data = await base64Promise;

    const payload = {
      action: 'uploadFile',
      fileName: file.name,
      fileType: file.type,
      fileData: base64Data
    };

    const response = await fetch(GOOGLE_SCRIPT_URL, {
      method: 'POST',
      mode: 'cors',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      throw new Error(`Google Script returned ${response.status}`);
    }

    const data = await response.json();
    console.log('[Google Script] File uploaded successfully');

    return data;

  } catch (error) {
    console.error('[Google Script] Error uploading file:', error);
    throw error;
  }
}

/**
 * Save report to Google Sheets via Google Script
 * @param {Object} report - The complete report object
 * @returns {Promise<Object>} Save result
 */
export async function saveReportToSheets(report) {
  try {
    console.log('[Google Script] Saving to Google Sheets...');

    const payload = {
      action: 'saveReport',
      report: {
        id: report.id,
        title: report.title,
        type: report.type,
        patientName: report.patientName,
        patientMrn: report.patientMrn,
        extractedText: report.extractedText,
        ocrConfidence: report.ocrConfidence,
        interpretation: report.interpretation,
        date: report.date
      }
    };

    const response = await fetch(GOOGLE_SCRIPT_URL, {
      method: 'POST',
      mode: 'cors',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      throw new Error(`Google Script returned ${response.status}`);
    }

    const data = await response.json();
    console.log('[Google Script] Report saved to Sheets');

    return data;

  } catch (error) {
    console.error('[Google Script] Error saving to Sheets:', error);
    throw error;
  }
}

/**
 * Test connection to Google Apps Script
 * @returns {Promise<Object>} Connection test result
 */
export async function testConnection() {
  try {
    console.log('[Google Script] Testing connection...');

    const payload = {
      action: 'ping',
      timestamp: new Date().toISOString()
    };

    const response = await fetch(GOOGLE_SCRIPT_URL, {
      method: 'POST',
      mode: 'cors',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      throw new Error(`Connection failed: ${response.status}`);
    }

    const data = await response.json();
    console.log('[Google Script] Connection successful:', data);

    return {
      success: true,
      message: 'Connected to Google Apps Script',
      data
    };

  } catch (error) {
    console.error('[Google Script] Connection failed:', error);
    return {
      success: false,
      message: error.message,
      error
    };
  }
}

export default {
  interpretWithGoogleScript,
  generatePearlsWithGoogleScript,
  generateQuestionsWithGoogleScript,
  uploadToGoogleDrive,
  saveReportToSheets,
  testConnection
};
