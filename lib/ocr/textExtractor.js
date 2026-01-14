/**
 * OCR Text Extraction using Tesseract.js
 * Extracts text from medical documents (images/PDFs)
 */

import { createWorker } from 'tesseract.js';

/**
 * Extract text from an image file using OCR
 * @param {File|Blob} file - The image file to process
 * @returns {Promise<{text: string, confidence: number}>}
 */
export async function extractTextFromImage(file) {
  let worker = null;

  try {
    console.log('[OCR] Starting text extraction...');
    console.log('[OCR] File type:', file.type, 'Size:', file.size, 'bytes');

    // Create worker with proper configuration
    worker = await createWorker('eng', 1, {
      logger: (m) => {
        if (m.status === 'recognizing text') {
          console.log(`[OCR] Progress: ${Math.round(m.progress * 100)}%`);
        } else if (m.status === 'loading tesseract core') {
          console.log('[OCR] Loading Tesseract core...');
        } else if (m.status === 'initializing tesseract') {
          console.log('[OCR] Initializing Tesseract...');
        } else if (m.status === 'initializing api') {
          console.log('[OCR] Initializing API...');
        } else if (m.status === 'loading language traineddata') {
          console.log('[OCR] Loading language data...');
        }
      },
      // Configure worker path for CDN
      workerPath: 'https://cdn.jsdelivr.net/npm/tesseract.js@5.1.1/dist/worker.min.js',
      langPath: 'https://tessdata.projectnaptha.com/4.0.0',
      corePath: 'https://cdn.jsdelivr.net/npm/tesseract.js-core@5.0.0/tesseract-core.wasm.js'
    });

    console.log('[OCR] Worker initialized, starting recognition...');

    const { data } = await worker.recognize(file);

    console.log('[OCR] Extraction complete');
    console.log(`[OCR] Confidence: ${data.confidence}%`);
    console.log(`[OCR] Text length: ${data.text?.length || 0} characters`);
    console.log(`[OCR] Words detected: ${data.words?.length || 0}`);

    // Check if any text was actually detected
    if (!data.text || data.text.trim().length === 0) {
      console.warn('[OCR] No text detected in image');
      await worker.terminate();
      return {
        text: '',
        confidence: 0,
        words: 0,
        lines: 0,
        error: 'No text detected in image. Please ensure the image is clear and contains readable text.'
      };
    }

    await worker.terminate();

    return {
      text: data.text,
      confidence: data.confidence / 100, // Convert to 0-1 scale
      words: data.words?.length || 0,
      lines: data.lines?.length || 0
    };
  } catch (error) {
    console.error('[OCR] Error:', error);
    console.error('[OCR] Error stack:', error.stack);

    // Clean up worker if it was created
    if (worker) {
      try {
        await worker.terminate();
      } catch (terminateError) {
        console.error('[OCR] Error terminating worker:', terminateError);
      }
    }

    throw new Error(`Failed to extract text: ${error.message}`);
  }
}

/**
 * Extract text from PDF file
 * @param {File|Buffer} file - The PDF file
 * @returns {Promise<{text: string, confidence: number}>}
 */
async function extractTextFromPDF(file) {
  try {
    console.log('[PDF] Starting PDF text extraction...');

    // Dynamic import pdf-parse (works in both browser and Node.js)
    const pdfParse = (await import('pdf-parse')).default;

    // Convert file to buffer if needed
    let buffer;
    if (file instanceof Buffer) {
      buffer = file;
    } else {
      const arrayBuffer = await file.arrayBuffer();
      buffer = Buffer.from(arrayBuffer);
    }

    const data = await pdfParse(buffer);

    console.log('[PDF] Extraction complete');
    console.log(`[PDF] Pages: ${data.numpages}`);
    console.log(`[PDF] Text length: ${data.text?.length || 0} characters`);

    return {
      text: data.text,
      confidence: 0.95, // PDFs have high text extraction confidence
      pages: data.numpages,
      info: data.info
    };
  } catch (error) {
    console.error('[PDF] Error:', error);
    throw new Error(`Failed to extract PDF text: ${error.message}`);
  }
}

/**
 * Process a file and extract relevant medical information
 * @param {File|Buffer} file - The document file
 * @param {string} fileType - MIME type of the file
 * @param {string} documentType - Type of document (lab, imaging, note, etc.)
 * @returns {Promise<Object>}
 */
export async function processDocument(file, fileType, documentType = 'general') {
  console.log(`[OCR] Processing ${documentType} document...`);

  let extractionResult;

  // Handle PDFs
  if (fileType === 'application/pdf' || (typeof file === 'object' && file.type === 'application/pdf')) {
    extractionResult = await extractTextFromPDF(file);
  } else {
    // Handle images with OCR
    extractionResult = await extractTextFromImage(file);
  }

  // Parse based on document type
  const parsed = parseByDocumentType(extractionResult.text, documentType);

  return {
    fullText: extractionResult.text,
    rawText: extractionResult.text, // Alias for compatibility
    confidence: extractionResult.confidence,
    type: documentType,
    structuredData: parsed,
    parsed, // Alias for compatibility
    metadata: {
      fileName: file.name || 'document',
      fileSize: file.size || (file.length || 0),
      fileType: fileType || file.type,
      pages: extractionResult.pages,
      extractedAt: new Date().toISOString()
    }
  };
}

/**
 * Parse extracted text based on document type
 * @param {string} text - Raw OCR text
 * @param {string} type - Document type
 * @returns {Object}
 */
function parseByDocumentType(text, type) {
  const lines = text.split('\n').filter(line => line.trim());

  switch (type) {
    case 'lab':
      return parseLabResults(lines);
    case 'imaging':
      return parseImagingReport(lines);
    case 'note':
      return parseClinicalNote(lines);
    default:
      return { lines, summary: text.substring(0, 200) };
  }
}

/**
 * Parse lab results
 */
function parseLabResults(lines) {
  const results = [];

  // Simple pattern matching for lab values
  const labPattern = /([A-Za-z\s]+)\s*[:-]?\s*([\d.]+)\s*([a-zA-Z/%]+)?/;

  lines.forEach(line => {
    const match = line.match(labPattern);
    if (match) {
      results.push({
        test: match[1].trim(),
        value: match[2],
        unit: match[3] || '',
        raw: line
      });
    }
  });

  return {
    type: 'lab',
    results,
    totalTests: results.length
  };
}

/**
 * Parse imaging report
 */
function parseImagingReport(lines) {
  let findings = [];
  let impression = '';

  let inFindings = false;
  let inImpression = false;

  lines.forEach(line => {
    const lower = line.toLowerCase();

    if (lower.includes('findings') || lower.includes('technique')) {
      inFindings = true;
      inImpression = false;
    } else if (lower.includes('impression') || lower.includes('conclusion')) {
      inImpression = true;
      inFindings = false;
    } else if (inFindings && line.trim()) {
      findings.push(line.trim());
    } else if (inImpression && line.trim()) {
      impression += line.trim() + ' ';
    }
  });

  return {
    type: 'imaging',
    findings,
    impression: impression.trim(),
    lineCount: lines.length
  };
}

/**
 * Parse clinical note
 */
function parseClinicalNote(lines) {
  const sections = {
    subjective: [],
    objective: [],
    assessment: [],
    plan: []
  };

  let currentSection = null;

  lines.forEach(line => {
    const lower = line.toLowerCase();

    if (lower.includes('subjective') || lower.includes('history')) {
      currentSection = 'subjective';
    } else if (lower.includes('objective') || lower.includes('physical exam')) {
      currentSection = 'objective';
    } else if (lower.includes('assessment') || lower.includes('diagnosis')) {
      currentSection = 'assessment';
    } else if (lower.includes('plan') || lower.includes('treatment')) {
      currentSection = 'plan';
    } else if (currentSection && line.trim()) {
      sections[currentSection].push(line.trim());
    }
  });

  return {
    type: 'note',
    sections,
    format: 'SOAP'
  };
}

export default {
  extractTextFromImage,
  processDocument
};
