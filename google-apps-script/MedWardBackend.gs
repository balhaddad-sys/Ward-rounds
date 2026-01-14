/**
 * MedWard Backend - Google Apps Script
 * Handles medical document interpretation using OpenAI GPT-4
 *
 * Setup Instructions:
 * 1. Go to https://script.google.com
 * 2. Create new project: "MedWard Backend"
 * 3. Paste this code
 * 4. Set Script Properties:
 *    - OPENAI_API_KEY: Your OpenAI API key
 * 5. Deploy as Web App:
 *    - Execute as: Me
 *    - Who has access: Anyone
 * 6. Copy the Web App URL to your Next.js app
 */

// ============================================
// CONFIGURATION
// ============================================

const CONFIG = {
  OPENAI_API_KEY: PropertiesService.getScriptProperties().getProperty('OPENAI_API_KEY'),
  OPENAI_MODEL: 'gpt-4-turbo-preview',
  OPENAI_API_URL: 'https://api.openai.com/v1/chat/completions',
  MAX_TOKENS: 2000,
  TEMPERATURE: 0.7
};

// ============================================
// MAIN ENTRY POINTS
// ============================================

/**
 * Handle GET requests
 */
function doGet(e) {
  return ContentService
    .createTextOutput(JSON.stringify({
      status: 'MedWard Backend API',
      version: '1.0.0',
      endpoints: {
        interpret: 'POST with action=interpret',
        login: 'POST with action=login'
      }
    }))
    .setMimeType(ContentService.MimeType.JSON);
}

/**
 * Handle POST requests
 */
function doPost(e) {
  try {
    // Enable CORS
    const output = ContentService.createTextOutput();
    output.setMimeType(ContentService.MimeType.JSON);

    // Parse request
    const data = JSON.parse(e.postData.contents);
    const action = data.action;

    Logger.log(`[MedWard] Received action: ${action}`);

    // Route to appropriate handler
    switch (action) {
      case 'interpret':
        return handleInterpret(data);

      case 'login':
        return handleLogin(data);

      case 'processDocument':
        return handleProcessDocument(data);

      default:
        return createErrorResponse(`Unknown action: ${action}`);
    }

  } catch (error) {
    Logger.log(`[MedWard] Error: ${error.message}`);
    return createErrorResponse(error.message);
  }
}

// ============================================
// ACTION HANDLERS
// ============================================

/**
 * Handle medical document interpretation
 */
function handleInterpret(data) {
  try {
    const text = data.text;
    const documentType = data.documentType || 'general';

    if (!text || text.trim().length === 0) {
      return createErrorResponse('No text provided for interpretation');
    }

    Logger.log(`[Interpret] Processing ${documentType} document, text length: ${text.length}`);

    // Step 1: AI Interpretation
    const interpretation = interpretMedicalText(text, documentType);

    // Step 2: Generate Clinical Pearls
    const clinicalPearls = generateClinicalPearls(interpretation, documentType);

    // Step 3: Generate Teaching Questions
    const potentialQuestions = generateTeachingQuestions(interpretation, documentType);

    // Step 4: Generate SOAP Presentation
    const presentation = generatePresentation(interpretation, documentType);

    Logger.log('[Interpret] Processing complete');

    return ContentService
      .createTextOutput(JSON.stringify({
        success: true,
        interpretation: interpretation,
        clinicalPearls: clinicalPearls,
        potentialQuestions: potentialQuestions,
        presentation: presentation,
        metadata: {
          processedAt: new Date().toISOString(),
          documentType: documentType
        }
      }))
      .setMimeType(ContentService.MimeType.JSON);

  } catch (error) {
    Logger.log(`[Interpret] Error: ${error.message}`);
    return createErrorResponse(error.message);
  }
}

/**
 * Handle user login
 */
function handleLogin(data) {
  try {
    const username = data.username;

    if (!username) {
      return createErrorResponse('Username is required');
    }

    // Generate simple token (in production, use proper JWT)
    const token = Utilities.base64Encode(
      username + ':' + new Date().getTime()
    );

    return ContentService
      .createTextOutput(JSON.stringify({
        success: true,
        token: token,
        user: {
          id: Utilities.getUuid(),
          username: username,
          createdAt: new Date().toISOString()
        }
      }))
      .setMimeType(ContentService.MimeType.JSON);

  } catch (error) {
    return createErrorResponse(error.message);
  }
}

/**
 * Handle complete document processing (OCR + Interpretation)
 */
function handleProcessDocument(data) {
  try {
    // For now, this assumes OCR is done client-side
    // If you want server-side OCR, integrate Google Cloud Vision API here
    return handleInterpret(data);
  } catch (error) {
    return createErrorResponse(error.message);
  }
}

// ============================================
// OPENAI INTEGRATION
// ============================================

/**
 * Call OpenAI API
 */
function callOpenAI(messages, temperature = CONFIG.TEMPERATURE, maxTokens = CONFIG.MAX_TOKENS) {
  if (!CONFIG.OPENAI_API_KEY || CONFIG.OPENAI_API_KEY === 'your-api-key-here') {
    throw new Error('OpenAI API key not configured. Set OPENAI_API_KEY in Script Properties.');
  }

  const payload = {
    model: CONFIG.OPENAI_MODEL,
    messages: messages,
    temperature: temperature,
    max_tokens: maxTokens
  };

  const options = {
    method: 'post',
    contentType: 'application/json',
    headers: {
      'Authorization': `Bearer ${CONFIG.OPENAI_API_KEY}`
    },
    payload: JSON.stringify(payload),
    muteHttpExceptions: true
  };

  const response = UrlFetchApp.fetch(CONFIG.OPENAI_API_URL, options);
  const result = JSON.parse(response.getContentText());

  if (response.getResponseCode() !== 200) {
    throw new Error(`OpenAI API error: ${result.error?.message || 'Unknown error'}`);
  }

  return result.choices[0].message.content;
}

// ============================================
// MEDICAL INTERPRETATION
// ============================================

/**
 * Interpret medical text using OpenAI
 */
function interpretMedicalText(text, documentType) {
  const systemPrompt = getSystemPrompt(documentType);
  const userPrompt = `Please interpret this medical ${documentType} report:\n\n${text}`;

  const messages = [
    { role: 'system', content: systemPrompt },
    { role: 'user', content: userPrompt }
  ];

  const response = callOpenAI(messages);

  // Parse JSON response
  try {
    return JSON.parse(response);
  } catch (e) {
    // If not valid JSON, wrap in structure
    return {
      summary: response,
      findings: [],
      criticalAlerts: [],
      recommendations: []
    };
  }
}

/**
 * Generate clinical pearls
 */
function generateClinicalPearls(interpretation, documentType) {
  const prompt = `Based on this medical interpretation, generate 3-5 high-yield clinical teaching pearls:

${JSON.stringify(interpretation, null, 2)}

Return as JSON array with format:
{
  "pearls": [
    {
      "pearl": "Teaching point text",
      "relevance": "Why this is important",
      "difficulty": "basic|intermediate|advanced",
      "category": "diagnosis|management|physiology|clinical_reasoning"
    }
  ]
}`;

  const messages = [
    {
      role: 'system',
      content: 'You are a medical educator creating clinical teaching pearls for ward rounds.'
    },
    { role: 'user', content: prompt }
  ];

  const response = callOpenAI(messages, 0.8);

  try {
    return JSON.parse(response);
  } catch (e) {
    return {
      pearls: [
        {
          pearl: response,
          relevance: 'Clinical teaching point',
          difficulty: 'intermediate',
          category: 'clinical_reasoning'
        }
      ]
    };
  }
}

/**
 * Generate teaching questions
 */
function generateTeachingQuestions(interpretation, documentType) {
  const prompt = `Based on this medical case, generate 3-5 potential attending questions that might be asked on ward rounds:

${JSON.stringify(interpretation, null, 2)}

Return as JSON array with format:
{
  "questions": [
    {
      "question": "Question text",
      "answer": "Detailed answer",
      "teachingPoint": "Key learning point",
      "difficulty": "basic|intermediate|advanced"
    }
  ]
}`;

  const messages = [
    {
      role: 'system',
      content: 'You are an attending physician asking teaching questions on ward rounds.'
    },
    { role: 'user', content: prompt }
  ];

  const response = callOpenAI(messages, 0.7);

  try {
    return JSON.parse(response);
  } catch (e) {
    return {
      questions: [
        {
          question: response,
          answer: 'See interpretation above',
          teachingPoint: 'Clinical correlation',
          difficulty: 'intermediate'
        }
      ]
    };
  }
}

/**
 * Generate SOAP presentation
 */
function generatePresentation(interpretation, documentType) {
  const summary = interpretation.summary || '';
  const findings = interpretation.findings || [];

  return {
    oneLiner: generateOneLiner(interpretation),
    subjective: summary,
    objective: findings.map(f => f.finding).join('; '),
    assessment: interpretation.criticalAlerts?.join('; ') || 'See findings above',
    plan: interpretation.recommendations?.join('; ') || 'Continue current management'
  };
}

/**
 * Generate one-liner for presentation
 */
function generateOneLiner(interpretation) {
  const summary = interpretation.summary || '';
  const firstSentence = summary.split('.')[0];
  return firstSentence.substring(0, 200);
}

// ============================================
// SYSTEM PROMPTS
// ============================================

/**
 * Get system prompt based on document type
 */
function getSystemPrompt(documentType) {
  const basePrompt = `You are an expert medical AI assistant helping medical students and residents interpret ${documentType} reports.

Your responses must be in valid JSON format with this structure:
{
  "summary": "Brief 2-3 sentence summary",
  "findings": [
    {
      "finding": "Specific finding",
      "status": "normal|abnormal|critical",
      "significance": "Clinical significance"
    }
  ],
  "criticalAlerts": ["Any critical findings that need immediate attention"],
  "differentialConsiderations": ["Possible diagnoses to consider"],
  "recommendations": ["Next steps in management"]
}

Focus on:
- Clear, concise language
- Clinical relevance
- Actionable recommendations
- Highlight critical/abnormal findings`;

  const typeSpecific = {
    'lab': '\n\nFor lab results, focus on:\n- Compare values to normal ranges\n- Identify trends\n- Clinical correlation\n- Urgent findings',
    'imaging': '\n\nFor imaging reports, focus on:\n- Key anatomical findings\n- Comparison to prior studies\n- Clinical correlation\n- Need for follow-up',
    'note': '\n\nFor clinical notes, focus on:\n- Patient presentation\n- Key history and physical findings\n- Assessment and plan\n- Follow-up needs',
    'ecg': '\n\nFor ECG reports, focus on:\n- Rate and rhythm\n- Axis and intervals\n- Ischemic changes\n- Urgent findings'
  };

  return basePrompt + (typeSpecific[documentType] || '');
}

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Create error response
 */
function createErrorResponse(message) {
  return ContentService
    .createTextOutput(JSON.stringify({
      success: false,
      error: message,
      timestamp: new Date().toISOString()
    }))
    .setMimeType(ContentService.MimeType.JSON);
}

/**
 * Test function - call this manually to test the setup
 */
function testInterpretation() {
  const testData = {
    action: 'interpret',
    documentType: 'lab',
    text: 'CBC: WBC 12.5, Hemoglobin 10.2, Platelets 180'
  };

  const result = handleInterpret(testData);
  Logger.log(result.getContent());
}
