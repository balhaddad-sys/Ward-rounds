/**
 * MedWard - API Integration Functions
 * Handles OpenAI and Google Cloud Vision API calls
 */

/**
 * Get API keys from Script Properties
 */
function getApiKey(keyName) {
  const scriptProperties = PropertiesService.getScriptProperties();
  return scriptProperties.getProperty(keyName);
}

/**
 * Extract text from image using Google Cloud Vision API
 */
function extractTextFromImage(imageData) {
  try {
    const apiKey = getApiKey('GOOGLE_VISION_API_KEY');
    if (!apiKey) {
      return { success: false, error: 'Google Vision API key not configured' };
    }

    // Remove data URL prefix if present
    let base64Image = imageData;
    if (imageData.includes('base64,')) {
      base64Image = imageData.split('base64,')[1];
    }

    const url = 'https://vision.googleapis.com/v1/images:annotate?key=' + apiKey;
    const payload = {
      requests: [{
        image: {
          content: base64Image
        },
        features: [{
          type: 'DOCUMENT_TEXT_DETECTION'
        }]
      }]
    };

    const options = {
      method: 'post',
      contentType: 'application/json',
      payload: JSON.stringify(payload),
      muteHttpExceptions: true
    };

    const response = UrlFetchApp.fetch(url, options);
    const result = JSON.parse(response.getContentText());

    if (result.responses && result.responses[0].fullTextAnnotation) {
      return {
        success: true,
        text: result.responses[0].fullTextAnnotation.text,
        confidence: 0.9
      };
    } else {
      return {
        success: false,
        error: 'No text detected in image'
      };
    }
  } catch (error) {
    Logger.log('Vision API Error: ' + error);
    return {
      success: false,
      error: error.toString()
    };
  }
}

/**
 * Interpret medical report using OpenAI GPT-4
 */
function interpretReport(reportText, reportType) {
  try {
    const apiKey = getApiKey('OPENAI_API_KEY');
    if (!apiKey) {
      return { success: false, error: 'OpenAI API key not configured' };
    }

    const systemPrompt = `You are an expert medical AI assistant. Analyze this ${reportType} report and provide a structured interpretation in JSON format with:
{
  "summary": "Brief 2-3 sentence summary",
  "findings": [{"finding": "test name", "value": "result", "status": "normal/abnormal/critical", "significance": "clinical meaning"}],
  "criticalAlerts": ["list of critical findings"],
  "differentialConsiderations": ["possible diagnoses"],
  "recommendedActions": ["next steps"]
}`;

    const url = 'https://api.openai.com/v1/chat/completions';
    const payload = {
      model: 'gpt-4-turbo-preview',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: reportText }
      ],
      response_format: { type: 'json_object' },
      temperature: 0.3,
      max_tokens: 2000
    };

    const options = {
      method: 'post',
      contentType: 'application/json',
      headers: {
        'Authorization': 'Bearer ' + apiKey
      },
      payload: JSON.stringify(payload),
      muteHttpExceptions: true
    };

    const response = UrlFetchApp.fetch(url, options);
    const result = JSON.parse(response.getContentText());

    if (result.choices && result.choices[0]) {
      return {
        success: true,
        data: JSON.parse(result.choices[0].message.content)
      };
    } else {
      return {
        success: false,
        error: result.error ? result.error.message : 'Unknown error'
      };
    }
  } catch (error) {
    Logger.log('OpenAI API Error: ' + error);
    return {
      success: false,
      error: error.toString()
    };
  }
}

/**
 * Generate clinical pearls
 */
function generateClinicalPearls(interpretation) {
  try {
    const apiKey = getApiKey('OPENAI_API_KEY');
    if (!apiKey) {
      return { success: false, error: 'OpenAI API key not configured' };
    }

    const systemPrompt = `You are a medical educator. Generate 3-5 clinical pearls based on the findings. Return JSON:
{
  "pearls": [
    {
      "pearl": "teaching point",
      "relevance": "why it matters",
      "difficulty": "basic/intermediate/advanced",
      "category": "diagnosis/management/physiology"
    }
  ]
}`;

    const url = 'https://api.openai.com/v1/chat/completions';
    const payload = {
      model: 'gpt-4-turbo-preview',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: JSON.stringify(interpretation) }
      ],
      response_format: { type: 'json_object' },
      temperature: 0.7,
      max_tokens: 1500
    };

    const options = {
      method: 'post',
      contentType: 'application/json',
      headers: {
        'Authorization': 'Bearer ' + apiKey
      },
      payload: JSON.stringify(payload),
      muteHttpExceptions: true
    };

    const response = UrlFetchApp.fetch(url, options);
    const result = JSON.parse(response.getContentText());

    if (result.choices && result.choices[0]) {
      return {
        success: true,
        data: JSON.parse(result.choices[0].message.content)
      };
    } else {
      return {
        success: false,
        error: 'Could not generate pearls'
      };
    }
  } catch (error) {
    Logger.log('Pearls generation error: ' + error);
    return {
      success: false,
      error: error.toString()
    };
  }
}

/**
 * Generate attending questions
 */
function generateQuestions(interpretation) {
  try {
    const apiKey = getApiKey('OPENAI_API_KEY');
    if (!apiKey) {
      return { success: false, error: 'OpenAI API key not configured' };
    }

    const systemPrompt = `You are an attending physician. Generate 3-5 teaching questions with answers. Return JSON:
{
  "questions": [
    {
      "question": "the question",
      "answer": "detailed answer",
      "teachingPoint": "key takeaway",
      "difficulty": "basic/intermediate/advanced"
    }
  ]
}`;

    const url = 'https://api.openai.com/v1/chat/completions';
    const payload = {
      model: 'gpt-4-turbo-preview',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: JSON.stringify(interpretation) }
      ],
      response_format: { type: 'json_object' },
      temperature: 0.8,
      max_tokens: 2000
    };

    const options = {
      method: 'post',
      contentType: 'application/json',
      headers: {
        'Authorization': 'Bearer ' + apiKey
      },
      payload: JSON.stringify(payload),
      muteHttpExceptions: true
    };

    const response = UrlFetchApp.fetch(url, options);
    const result = JSON.parse(response.getContentText());

    if (result.choices && result.choices[0]) {
      return {
        success: true,
        data: JSON.parse(result.choices[0].message.content)
      };
    } else {
      return {
        success: false,
        error: 'Could not generate questions'
      };
    }
  } catch (error) {
    Logger.log('Questions generation error: ' + error);
    return {
      success: false,
      error: error.toString()
    };
  }
}
