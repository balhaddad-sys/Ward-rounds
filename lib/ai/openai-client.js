import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

const DEFAULT_MODEL = process.env.OPENAI_MODEL || 'gpt-4-turbo-preview';

/**
 * Generate a completion using OpenAI GPT-4
 * @param {string} systemPrompt - System instructions
 * @param {string} userPrompt - User message
 * @param {Object} options - Additional options
 * @returns {Promise<Object>} - Response with content and usage stats
 */
export async function generateCompletion(systemPrompt, userPrompt, options = {}) {
  const {
    model = DEFAULT_MODEL,
    temperature = 0.7,
    maxTokens = 2000,
    responseFormat = null
  } = options;

  try {
    const messages = [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt }
    ];

    const completionOptions = {
      model,
      messages,
      temperature,
      max_tokens: maxTokens
    };

    // Add JSON mode if requested
    if (responseFormat === 'json') {
      completionOptions.response_format = { type: 'json_object' };
    }

    const completion = await openai.chat.completions.create(completionOptions);

    return {
      content: completion.choices[0].message.content,
      usage: {
        promptTokens: completion.usage.prompt_tokens,
        completionTokens: completion.usage.completion_tokens,
        totalTokens: completion.usage.total_tokens
      },
      model: completion.model,
      finishReason: completion.choices[0].finish_reason
    };
  } catch (error) {
    console.error('[OpenAI] Error:', error);
    throw new Error(`OpenAI API Error: ${error.message}`);
  }
}

/**
 * Interpret a medical report
 * @param {string} reportText - Extracted text from medical report
 * @param {string} reportType - Type of report (lab, imaging, note, etc.)
 * @param {Object} context - Additional context
 * @returns {Promise<Object>} - Structured interpretation
 */
export async function interpretMedicalReport(reportText, reportType, context = {}) {
  const systemPrompt = `You are an expert medical AI assistant specializing in interpreting medical reports for ward presentations.

Your role is to:
1. Analyze medical reports accurately and comprehensively
2. Identify critical findings and abnormalities
3. Provide clinical context and significance
4. Suggest differential diagnoses when appropriate
5. Highlight teaching points for medical education

Always respond in JSON format with the structure:
{
  "summary": "Brief 2-3 sentence summary",
  "findings": [{"finding": "...", "value": "...", "reference": "...", "status": "normal|abnormal|critical", "significance": "..."}],
  "criticalAlerts": ["..."],
  "differentialConsiderations": ["..."],
  "recommendedActions": ["..."],
  "additionalNotes": "..."
}

Be accurate, concise, and clinically relevant.`;

  const userPrompt = `Report Type: ${reportType}
${context.patientAge ? `Patient Age: ${context.patientAge}` : ''}
${context.relevantHistory ? `Relevant History: ${context.relevantHistory}` : ''}

Report Text:
${reportText}

Please provide a comprehensive interpretation of this ${reportType} report.`;

  const response = await generateCompletion(systemPrompt, userPrompt, {
    responseFormat: 'json',
    temperature: 0.3, // Lower temperature for medical accuracy
    maxTokens: 2000
  });

  return JSON.parse(response.content);
}

/**
 * Generate clinical pearls from a medical report
 * @param {Object} interpretation - Report interpretation
 * @param {string} reportType - Type of report
 * @returns {Promise<Object>} - Clinical pearls
 */
export async function generateClinicalPearls(interpretation, reportType) {
  const systemPrompt = `You are a medical educator creating teaching points for ward rounds.

Generate 3-5 high-yield clinical pearls based on the findings. Each pearl should be:
- Clinically relevant and actionable
- Appropriate for medical students and residents
- Evidence-based when possible
- Memorable and practical

Respond in JSON format:
{
  "pearls": [
    {
      "pearl": "The teaching point",
      "relevance": "Why this matters clinically",
      "difficulty": "basic|intermediate|advanced",
      "category": "diagnosis|management|physiology|clinical_reasoning"
    }
  ]
}`;

  const userPrompt = `Report Type: ${reportType}

Summary: ${interpretation.summary}

Key Findings:
${interpretation.findings?.slice(0, 5).map(f => `- ${f.finding}: ${f.significance}`).join('\n')}

Generate clinical pearls for teaching rounds.`;

  const response = await generateCompletion(systemPrompt, userPrompt, {
    responseFormat: 'json',
    temperature: 0.7,
    maxTokens: 1500
  });

  return JSON.parse(response.content);
}

/**
 * Generate potential attending questions
 * @param {Object} interpretation - Report interpretation
 * @param {string} reportType - Type of report
 * @returns {Promise<Object>} - Questions with answers
 */
export async function generateAttendingQuestions(interpretation, reportType) {
  const systemPrompt = `You are an attending physician preparing questions for teaching rounds.

Generate 3-5 questions that an attending might ask, with detailed answers and teaching points.

Questions should:
- Test clinical reasoning and knowledge application
- Be appropriate difficulty for residents
- Include both factual recall and critical thinking
- Relate directly to the case findings

Respond in JSON format:
{
  "questions": [
    {
      "question": "The question",
      "answer": "Detailed answer",
      "teachingPoint": "Key educational takeaway",
      "difficulty": "basic|intermediate|advanced",
      "category": "diagnosis|management|mechanism|differential"
    }
  ]
}`;

  const userPrompt = `Report Type: ${reportType}

Summary: ${interpretation.summary}

Critical Findings:
${interpretation.criticalAlerts?.join('\n') || 'None'}

Key Abnormalities:
${interpretation.findings?.filter(f => f.status !== 'normal').slice(0, 5).map(f => `- ${f.finding}`).join('\n')}

Generate attending-level questions for rounds.`;

  const response = await generateCompletion(systemPrompt, userPrompt, {
    responseFormat: 'json',
    temperature: 0.8,
    maxTokens: 2000
  });

  return JSON.parse(response.content);
}

/**
 * Generate embeddings for text (for knowledge base similarity search)
 * @param {string} text - Text to embed
 * @returns {Promise<Array<number>>} - Embedding vector
 */
export async function generateEmbedding(text) {
  try {
    const response = await openai.embeddings.create({
      model: 'text-embedding-3-small',
      input: text
    });

    return response.data[0].embedding;
  } catch (error) {
    console.error('[OpenAI] Embedding error:', error);
    throw new Error(`Embedding generation failed: ${error.message}`);
  }
}

/**
 * Calculate cosine similarity between two vectors
 * @param {Array<number>} a - First vector
 * @param {Array<number>} b - Second vector
 * @returns {number} - Similarity score (0-1)
 */
export function cosineSimilarity(a, b) {
  if (a.length !== b.length) {
    throw new Error('Vectors must have the same length');
  }

  let dotProduct = 0;
  let normA = 0;
  let normB = 0;

  for (let i = 0; i < a.length; i++) {
    dotProduct += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }

  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}

export default {
  generateCompletion,
  interpretMedicalReport,
  generateClinicalPearls,
  generateAttendingQuestions,
  generateEmbedding,
  cosineSimilarity
};
