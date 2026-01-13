import vision from '@google-cloud/vision';

let client = null;

/**
 * Get Google Cloud Vision client
 * @returns {vision.ImageAnnotatorClient} - Vision client
 */
function getVisionClient() {
  if (client) return client;

  // Initialize with credentials from environment
  if (process.env.GOOGLE_CLOUD_CREDENTIALS) {
    const credentials = JSON.parse(process.env.GOOGLE_CLOUD_CREDENTIALS);
    client = new vision.ImageAnnotatorClient({
      credentials
    });
  } else if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
    // Use file-based credentials
    client = new vision.ImageAnnotatorClient();
  } else {
    throw new Error('Google Cloud Vision credentials not configured');
  }

  return client;
}

/**
 * Process a document image with OCR
 * @param {Buffer} imageBuffer - Image buffer
 * @param {string} reportType - Type of report (lab, imaging, note, etc.)
 * @returns {Promise<Object>} - OCR results with extracted text and structured data
 */
export async function processDocument(imageBuffer, reportType = 'general') {
  try {
    const visionClient = getVisionClient();

    console.log(`[Vision] Processing ${reportType} document...`);

    // Perform document text detection
    const [result] = await visionClient.documentTextDetection(imageBuffer);
    const fullTextAnnotation = result.fullTextAnnotation;

    if (!fullTextAnnotation) {
      console.warn('[Vision] No text detected in document');
      return {
        fullText: '',
        pages: [],
        structuredData: null,
        confidence: 0,
        error: 'No text detected'
      };
    }

    // Extract full text
    const fullText = fullTextAnnotation.text;

    // Calculate average confidence
    const confidences = fullTextAnnotation.pages.flatMap(page =>
      page.blocks.flatMap(block =>
        block.paragraphs.flatMap(para =>
          para.words.map(word => word.confidence || 0)
        )
      )
    );
    const avgConfidence = confidences.length > 0
      ? confidences.reduce((a, b) => a + b, 0) / confidences.length
      : 0;

    console.log(`[Vision] Text extracted. Length: ${fullText.length}, Confidence: ${avgConfidence.toFixed(3)}`);

    // Extract structured data based on report type
    const structuredData = await extractStructuredData(fullText, reportType);

    return {
      fullText,
      pages: fullTextAnnotation.pages.length,
      structuredData,
      confidence: avgConfidence,
      language: result.textAnnotations?.[0]?.locale || 'en'
    };
  } catch (error) {
    console.error('[Vision] OCR error:', error);
    throw new Error(`OCR processing failed: ${error.message}`);
  }
}

/**
 * Extract structured data from text based on report type
 * @param {string} text - Full extracted text
 * @param {string} reportType - Type of report
 * @returns {Promise<Object>} - Structured data
 */
async function extractStructuredData(text, reportType) {
  switch (reportType) {
    case 'lab':
      return extractLabData(text);
    case 'imaging':
      return extractImagingData(text);
    case 'note':
      return extractNoteData(text);
    case 'ecg':
      return extractECGData(text);
    default:
      return null;
  }
}

/**
 * Extract lab results from text
 * @param {string} text - Lab report text
 * @returns {Object} - Structured lab data
 */
function extractLabData(text) {
  const results = [];
  const lines = text.split('\n');

  // Common lab test patterns
  const patterns = [
    // Pattern: TestName Value Unit (RefRange)
    /([A-Za-z][A-Za-z\s\(\)]+?)\s+([\d.]+)\s*([a-zA-Z/%]+)?\s*(?:\(([^)]+)\))?/gi,
    // Pattern: TestName: Value
    /([A-Za-z][A-Za-z\s]+):\s*([\d.]+)\s*([a-zA-Z/%]+)?/gi
  ];

  for (const line of lines) {
    for (const pattern of patterns) {
      const matches = [...line.matchAll(pattern)];
      for (const match of matches) {
        const testName = match[1]?.trim();
        const value = match[2];
        const unit = match[3] || '';
        const refRange = match[4] || '';

        if (testName && value && testName.length < 50) {
          results.push({
            test: testName,
            value: parseFloat(value),
            unit: unit.trim(),
            referenceRange: refRange.trim(),
            rawText: match[0]
          });
        }
      }
    }
  }

  return {
    type: 'lab',
    results: results.slice(0, 50), // Limit to 50 results
    timestamp: extractTimestamp(text),
    patientInfo: extractPatientInfo(text)
  };
}

/**
 * Extract imaging report data
 * @param {string} text - Imaging report text
 * @returns {Object} - Structured imaging data
 */
function extractImagingData(text) {
  // Look for common imaging sections
  const sections = {
    technique: extractSection(text, ['technique', 'technical', 'exam']),
    findings: extractSection(text, ['findings', 'impression', 'conclusion']),
    indication: extractSection(text, ['indication', 'reason', 'clinical']),
    comparison: extractSection(text, ['comparison', 'compared to', 'prior'])
  };

  return {
    type: 'imaging',
    ...sections,
    timestamp: extractTimestamp(text),
    patientInfo: extractPatientInfo(text),
    modality: extractModality(text)
  };
}

/**
 * Extract clinical note data
 * @param {string} text - Clinical note text
 * @returns {Object} - Structured note data
 */
function extractNoteData(text) {
  return {
    type: 'note',
    subjective: extractSection(text, ['subjective', 'history', 'hpi', 'chief complaint']),
    objective: extractSection(text, ['objective', 'physical exam', 'vitals', 'examination']),
    assessment: extractSection(text, ['assessment', 'impression', 'diagnosis']),
    plan: extractSection(text, ['plan', 'management', 'treatment']),
    timestamp: extractTimestamp(text),
    patientInfo: extractPatientInfo(text)
  };
}

/**
 * Extract ECG data
 * @param {string} text - ECG report text
 * @returns {Object} - Structured ECG data
 */
function extractECGData(text) {
  return {
    type: 'ecg',
    rate: extractValue(text, ['rate', 'hr', 'heart rate'], /(\d+)\s*bpm/i),
    rhythm: extractValue(text, ['rhythm'], /rhythm[:\s]+([^\n.]+)/i),
    axis: extractValue(text, ['axis'], /axis[:\s]+([^\n.]+)/i),
    intervals: {
      pr: extractValue(text, ['pr interval'], /pr[:\s]+(\d+)\s*ms/i),
      qrs: extractValue(text, ['qrs'], /qrs[:\s]+(\d+)\s*ms/i),
      qt: extractValue(text, ['qt interval', 'qtc'], /qtc?[:\s]+(\d+)\s*ms/i)
    },
    findings: extractSection(text, ['findings', 'interpretation', 'impression']),
    timestamp: extractTimestamp(text),
    patientInfo: extractPatientInfo(text)
  };
}

/**
 * Extract a section of text based on headers
 * @param {string} text - Full text
 * @param {Array<string>} headers - Possible header names
 * @returns {string} - Extracted section
 */
function extractSection(text, headers) {
  const lines = text.split('\n');
  let inSection = false;
  let sectionText = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const lowerLine = line.toLowerCase();

    // Check if this line is a section header
    const isHeader = headers.some(h => lowerLine.includes(h.toLowerCase()));

    if (isHeader) {
      inSection = true;
      continue;
    }

    // Check if we've hit a new section (line in all caps or ends with colon)
    if (inSection && (line.match(/^[A-Z\s]+:/) || line.match(/^[A-Z\s]{10,}$/))) {
      break;
    }

    if (inSection && line.trim()) {
      sectionText.push(line);
    }
  }

  return sectionText.join('\n').trim();
}

/**
 * Extract a specific value from text
 * @param {string} text - Full text
 * @param {Array<string>} keywords - Keywords to search for
 * @param {RegExp} pattern - Pattern to match value
 * @returns {string|null} - Extracted value
 */
function extractValue(text, keywords, pattern) {
  const lines = text.split('\n');

  for (const line of lines) {
    const lowerLine = line.toLowerCase();
    if (keywords.some(k => lowerLine.includes(k.toLowerCase()))) {
      const match = line.match(pattern);
      if (match) {
        return match[1];
      }
    }
  }

  return null;
}

/**
 * Extract timestamp from text
 * @param {string} text - Full text
 * @returns {string|null} - Extracted timestamp
 */
function extractTimestamp(text) {
  // Look for common date/time formats
  const patterns = [
    /(\d{1,2}\/\d{1,2}\/\d{2,4})/,  // MM/DD/YYYY
    /(\d{4}-\d{2}-\d{2})/,          // YYYY-MM-DD
    /([A-Z][a-z]+\s+\d{1,2},?\s+\d{4})/ // Month DD, YYYY
  ];

  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match) {
      return match[1];
    }
  }

  return null;
}

/**
 * Extract patient information from text
 * @param {string} text - Full text
 * @returns {Object} - Patient info
 */
function extractPatientInfo(text) {
  return {
    mrn: extractValue(text, ['mrn', 'medical record', 'patient id'], /(?:mrn|medical record|patient id)[:\s]*([A-Z0-9]+)/i),
    name: extractValue(text, ['patient name', 'name'], /(?:patient name|name)[:\s]*([A-Z][a-z]+(?:\s+[A-Z][a-z]+)+)/i),
    dob: extractValue(text, ['dob', 'date of birth', 'birth date'], /(?:dob|date of birth)[:\s]*(\d{1,2}\/\d{1,2}\/\d{2,4})/i)
  };
}

/**
 * Extract imaging modality
 * @param {string} text - Full text
 * @returns {string|null} - Modality
 */
function extractModality(text) {
  const modalities = ['CT', 'MRI', 'X-RAY', 'ULTRASOUND', 'PET', 'ECHO', 'FLUOROSCOPY'];
  const upperText = text.toUpperCase();

  for (const modality of modalities) {
    if (upperText.includes(modality)) {
      return modality;
    }
  }

  return null;
}

// Export singleton client
export const visionClient = {
  processDocument
};

export default visionClient;
