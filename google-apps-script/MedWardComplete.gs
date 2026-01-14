/**
 * MedWard Complete Backend - Google Apps Script
 * All-in-one medical document interpretation system
 *
 * Setup:
 * 1. Create new Google Apps Script project
 * 2. Copy this entire file
 * 3. Set Script Properties:
 *    - OPENAI_API_KEY: Your OpenAI API key
 * 4. Deploy as Web App:
 *    - Execute as: Me
 *    - Who has access: Anyone
 * 5. Copy the Web App URL to your Next.js app
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
 * Handle GET requests - Shows API info
 */
function doGet(e) {
  return ContentService
    .createTextOutput(JSON.stringify({
      status: 'MedWard Backend API',
      version: '2.0.0',
      timestamp: new Date().toISOString(),
      endpoints: {
        login: 'POST with action=login, username',
        interpret: 'POST with action=interpret, text, documentType',
        ping: 'POST with action=ping'
      },
      setup: {
        apiKeyConfigured: !!CONFIG.OPENAI_API_KEY && CONFIG.OPENAI_API_KEY !== 'your-api-key-here'
      }
    }))
    .setMimeType(ContentService.MimeType.JSON);
}

/**
 * Handle POST requests - Main API endpoint
 */
function doPost(e) {
  try {
    Logger.log('[MedWard] Received POST request');

    // Parse request
    let requestData;
    try {
      requestData = JSON.parse(e.postData.contents);
    } catch (parseError) {
      Logger.log('[MedWard] JSON parse error: ' + parseError);
      return createErrorResponse('Invalid JSON payload: ' + parseError.message);
    }

    const action = requestData.action;
    Logger.log('[MedWard] Action: ' + action);

    // Route to appropriate handler
    switch (action) {
      case 'ping':
        return handlePing();

      case 'login':
        return handleLogin(requestData);

      case 'interpret':
        return handleInterpret(requestData);

      default:
        return createErrorResponse('Unknown action: ' + action);
    }

  } catch (error) {
    Logger.log('[MedWard] Fatal error: ' + error);
    Logger.log('[MedWard] Stack: ' + error.stack);
    return createErrorResponse('Server error: ' + error.message);
  }
}

// ============================================
// ACTION HANDLERS
// ============================================

/**
 * Handle ping - Connection test
 */
function handlePing() {
  Logger.log('[Ping] Connection test');

  return ContentService
    .createTextOutput(JSON.stringify({
      success: true,
      message: 'Connected to MedWard Backend',
      timestamp: new Date().toISOString(),
      apiKeyConfigured: !!CONFIG.OPENAI_API_KEY && CONFIG.OPENAI_API_KEY.length > 20
    }))
    .setMimeType(ContentService.MimeType.JSON);
}

/**
 * Handle login - User authentication
 */
function handleLogin(data) {
  try {
    const username = data.username;

    if (!username || username.trim().length === 0) {
      return createErrorResponse('Username is required');
    }

    Logger.log('[Login] User: ' + username);

    // Generate token (simple base64 encoding - for production use JWT)
    const timestamp = new Date().getTime();
    const payload = username + '|' + timestamp;
    const token = Utilities.base64Encode(payload);

    // Generate user ID
    const userId = Utilities.getUuid();

    Logger.log('[Login] Success - Token generated');

    return ContentService
      .createTextOutput(JSON.stringify({
        success: true,
        token: token,
        user: {
          id: userId,
          username: username.trim(),
          createdAt: new Date().toISOString()
        }
      }))
      .setMimeType(ContentService.MimeType.JSON);

  } catch (error) {
    Logger.log('[Login] Error: ' + error);
    return createErrorResponse('Login failed: ' + error.message);
  }
}

/**
 * Handle interpret - Medical document interpretation
 */
function handleInterpret(data) {
  try {
    const text = data.text;
    const documentType = data.documentType || 'lab';

    if (!text || text.trim().length === 0) {
      return createErrorResponse('No text provided for interpretation');
    }

    Logger.log('[Interpret] Document type: ' + documentType + ', text length: ' + text.length);

    // Check API key
    if (!CONFIG.OPENAI_API_KEY || CONFIG.OPENAI_API_KEY === 'your-api-key-here') {
      Logger.log('[Interpret] ERROR: OpenAI API key not configured');
      return createErrorResponse('OpenAI API key not configured. Please add OPENAI_API_KEY to Script Properties.');
    }

    // Step 1: AI Interpretation
    Logger.log('[Interpret] Step 1: Calling OpenAI for interpretation...');
    const interpretation = interpretMedicalText(text, documentType);

    // Step 2: Generate Clinical Pearls
    Logger.log('[Interpret] Step 2: Generating clinical pearls...');
    const clinicalPearls = generateClinicalPearls(interpretation, documentType);

    // Step 3: Generate Teaching Questions
    Logger.log('[Interpret] Step 3: Generating teaching questions...');
    const potentialQuestions = generateTeachingQuestions(interpretation, documentType);

    // Step 4: Generate SOAP Presentation
    Logger.log('[Interpret] Step 4: Generating presentation...');
    const presentation = generatePresentation(interpretation, documentType);

    Logger.log('[Interpret] Complete!');

    return ContentService
      .createTextOutput(JSON.stringify({
        success: true,
        interpretation: interpretation,
        clinicalPearls: clinicalPearls,
        potentialQuestions: potentialQuestions,
        presentation: presentation,
        metadata: {
          processedAt: new Date().toISOString(),
          documentType: documentType,
          textLength: text.length
        }
      }))
      .setMimeType(ContentService.MimeType.JSON);

  } catch (error) {
    Logger.log('[Interpret] Error: ' + error);
    Logger.log('[Interpret] Stack: ' + error.stack);
    return createErrorResponse('Interpretation failed: ' + error.message);
  }
}

// ============================================
// OPENAI INTEGRATION
// ============================================

/**
 * Call OpenAI API
 */
function callOpenAI(messages, temperature, maxTokens) {
  temperature = temperature || CONFIG.TEMPERATURE;
  maxTokens = maxTokens || CONFIG.MAX_TOKENS;

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
      'Authorization': 'Bearer ' + CONFIG.OPENAI_API_KEY
    },
    payload: JSON.stringify(payload),
    muteHttpExceptions: true
  };

  Logger.log('[OpenAI] Calling API...');
  const response = UrlFetchApp.fetch(CONFIG.OPENAI_API_URL, options);
  const responseCode = response.getResponseCode();

  Logger.log('[OpenAI] Response code: ' + responseCode);

  if (responseCode !== 200) {
    const errorText = response.getContentText();
    Logger.log('[OpenAI] Error response: ' + errorText);
    throw new Error('OpenAI API error (' + responseCode + '): ' + errorText);
  }

  const result = JSON.parse(response.getContentText());

  if (!result.choices || !result.choices[0] || !result.choices[0].message) {
    throw new Error('Invalid OpenAI response format');
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
  const userPrompt = 'Please interpret this medical ' + documentType + ' report:\n\n' + text;

  const messages = [
    { role: 'system', content: systemPrompt },
    { role: 'user', content: userPrompt }
  ];

  const response = callOpenAI(messages, 0.3, 2000);

  // Try to parse as JSON
  try {
    return JSON.parse(response);
  } catch (e) {
    Logger.log('[Interpret] Response not JSON, wrapping...');
    // If not JSON, wrap in structure
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
  const prompt = 'Based on this medical interpretation, generate 3-5 high-yield clinical teaching pearls:\n\n' +
    JSON.stringify(interpretation, null, 2) +
    '\n\nReturn as JSON array with format:\n' +
    '{\n' +
    '  "pearls": [\n' +
    '    {\n' +
    '      "pearl": "Teaching point text",\n' +
    '      "relevance": "Why this is important",\n' +
    '      "difficulty": "basic|intermediate|advanced",\n' +
    '      "category": "diagnosis|management|physiology|clinical_reasoning"\n' +
    '    }\n' +
    '  ]\n' +
    '}';

  const messages = [
    {
      role: 'system',
      content: 'You are a medical educator creating clinical teaching pearls for ward rounds. Return valid JSON only.'
    },
    { role: 'user', content: prompt }
  ];

  const response = callOpenAI(messages, 0.8, 1500);

  try {
    return JSON.parse(response);
  } catch (e) {
    Logger.log('[Pearls] Response not JSON, wrapping...');
    return {
      pearls: [
        {
          pearl: response.substring(0, 500),
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
  const prompt = 'Based on this medical case, generate 3-5 potential attending questions that might be asked on ward rounds:\n\n' +
    JSON.stringify(interpretation, null, 2) +
    '\n\nReturn as JSON array with format:\n' +
    '{\n' +
    '  "questions": [\n' +
    '    {\n' +
    '      "question": "Question text",\n' +
    '      "answer": "Detailed answer",\n' +
    '      "teachingPoint": "Key learning point",\n' +
    '      "difficulty": "basic|intermediate|advanced"\n' +
    '    }\n' +
    '  ]\n' +
    '}';

  const messages = [
    {
      role: 'system',
      content: 'You are an attending physician asking teaching questions on ward rounds. Return valid JSON only.'
    },
    { role: 'user', content: prompt }
  ];

  const response = callOpenAI(messages, 0.7, 1500);

  try {
    return JSON.parse(response);
  } catch (e) {
    Logger.log('[Questions] Response not JSON, wrapping...');
    return {
      questions: [
        {
          question: response.substring(0, 500),
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
    objective: findings.map(function(f) { return f.finding || f.value || ''; }).join('; '),
    assessment: (interpretation.criticalAlerts || []).join('; ') || 'See findings above',
    plan: (interpretation.recommendations || interpretation.recommendedActions || []).join('; ') || 'Continue current management'
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
  const basePrompt = 'You are an expert medical AI assistant helping medical students and residents interpret ' + documentType + ' reports.\n\n' +
    'Your responses must be in valid JSON format with this structure:\n' +
    '{\n' +
    '  "summary": "Brief 2-3 sentence summary",\n' +
    '  "findings": [\n' +
    '    {\n' +
    '      "finding": "Specific finding",\n' +
    '      "status": "normal|abnormal|critical",\n' +
    '      "significance": "Clinical significance"\n' +
    '    }\n' +
    '  ],\n' +
    '  "criticalAlerts": ["Any critical findings that need immediate attention"],\n' +
    '  "differentialConsiderations": ["Possible diagnoses to consider"],\n' +
    '  "recommendations": ["Next steps in management"]\n' +
    '}\n\n' +
    'Focus on:\n' +
    '- Clear, concise language\n' +
    '- Clinical relevance\n' +
    '- Actionable recommendations\n' +
    '- Highlight critical/abnormal findings';

  const typeSpecific = {
    'lab': '\n\nFor lab results, focus on:\n- Compare values to normal ranges\n- Identify trends\n- Clinical correlation\n- Urgent findings',
    'imaging': '\n\nFor imaging reports, focus on:\n- Key anatomical findings\n- Comparison to prior studies\n- Clinical correlation\n- Need for follow-up',
    'note': '\n\nFor clinical notes, focus on:\n- Patient presentation\n- Key history and physical findings\n- Assessment and plan\n- Follow-up needs',
    'ecg': '\n\nFor ECG reports, focus on:\n- Rate and rhythm\n- Axis and intervals\n- Ischemic changes\n- Urgent findings',
    'general': '\n\nProvide comprehensive medical interpretation with focus on clinical significance and next steps.'
  };

  return basePrompt + (typeSpecific[documentType] || typeSpecific['general']);
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
 * Test function - Run this manually to verify setup
 */
function testInterpretation() {
  Logger.log('=== MedWard Test ===');

  // Test 1: Ping
  Logger.log('\nTest 1: Ping');
  const pingResult = handlePing();
  Logger.log('Ping result: ' + pingResult.getContent());

  // Test 2: Login
  Logger.log('\nTest 2: Login');
  const loginResult = handleLogin({ username: 'testuser' });
  Logger.log('Login result: ' + loginResult.getContent());

  // Test 3: Interpret
  Logger.log('\nTest 3: Interpret');
  const testData = {
    action: 'interpret',
    documentType: 'lab',
    text: 'CBC: WBC 12.5 (H), Hemoglobin 10.2 (L), Platelets 180, MCV 78 (L)'
  };

  const interpretResult = handleInterpret(testData);
  Logger.log('Interpret result: ' + interpretResult.getContent());

  Logger.log('\n=== Tests Complete ===');
}

/**
 * Setup verification function
 */
function verifySetup() {
  Logger.log('=== Setup Verification ===');

  // Check API key
  const apiKey = CONFIG.OPENAI_API_KEY;
  Logger.log('API Key configured: ' + (!!apiKey && apiKey.length > 20));

  if (!apiKey || apiKey === 'your-api-key-here') {
    Logger.log('⚠️  ERROR: OpenAI API key not configured!');
    Logger.log('   Go to Project Settings → Script Properties');
    Logger.log('   Add property: OPENAI_API_KEY = sk-...');
    return;
  }

  Logger.log('✓ API Key looks valid');

  // Test OpenAI connection
  try {
    Logger.log('\nTesting OpenAI connection...');
    const messages = [
      { role: 'system', content: 'You are a test assistant.' },
      { role: 'user', content: 'Respond with just "OK" if you can read this.' }
    ];

    const response = callOpenAI(messages, 0.5, 50);
    Logger.log('✓ OpenAI connection successful');
    Logger.log('  Response: ' + response);

  } catch (error) {
    Logger.log('⚠️  ERROR: OpenAI connection failed');
    Logger.log('   ' + error.message);
  }

  Logger.log('\n=== Verification Complete ===');
}
