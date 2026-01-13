import { getKnowledgeBase } from './knowledge-base.js';
import {
  interpretMedicalReport,
  generateClinicalPearls,
  generateAttendingQuestions
} from '../ai/openai-client.js';

/**
 * Smart Responder - Orchestrates between knowledge base and OpenAI
 * Implements the self-learning system to reduce API costs
 */
class SmartResponder {
  constructor() {
    this.knowledgeBase = getKnowledgeBase();
    this.similarityThreshold = 0.85;
  }

  /**
   * Get response with smart caching
   * First checks knowledge base, falls back to OpenAI if needed
   * @param {string} query - Query text
   * @param {string} category - Category (lab, imaging, note, pearls, questions)
   * @param {Object} context - Additional context
   * @returns {Promise<Object>} - Response with source information
   */
  async getResponse(query, category, context = {}) {
    console.log(`[SmartResponder] Processing ${category} query...`);

    // Search knowledge base first
    const cachedResults = await this.knowledgeBase.search(
      query,
      category,
      this.similarityThreshold,
      3
    );

    // If we found a high-confidence match, use it
    if (cachedResults.length > 0 && cachedResults[0].similarity >= this.similarityThreshold) {
      const match = cachedResults[0];
      console.log(
        `[SmartResponder] Using cached knowledge (similarity: ${match.similarity.toFixed(3)}, ` +
        `confidence: ${match.confidence.toFixed(3)})`
      );

      // Increment usage count
      this.knowledgeBase.incrementUsage(match.id);

      return {
        response: match.response,
        source: 'knowledge_base',
        confidence: match.confidence,
        similarity: match.similarity,
        usageCount: match.usage_count + 1,
        apiCallSaved: true
      };
    }

    // No good match found, use OpenAI
    console.log('[SmartResponder] No cached match found, using OpenAI API...');

    let response;
    try {
      if (category === 'pearls') {
        const interpretationData = typeof query === 'string' ? JSON.parse(query) : query;
        response = await generateClinicalPearls(interpretationData, context.reportType || 'general');
      } else if (category === 'questions') {
        const interpretationData = typeof query === 'string' ? JSON.parse(query) : query;
        response = await generateAttendingQuestions(interpretationData, context.reportType || 'general');
      } else {
        // Interpret medical report
        response = await interpretMedicalReport(query, category, context);
      }

      // Store in knowledge base for future use
      const topic = this.extractTopic(query, category);
      await this.knowledgeBase.store(
        category,
        topic,
        query,
        JSON.stringify(response),
        0.8 // Initial confidence
      );

      return {
        response,
        source: 'openai_api',
        confidence: 0.8,
        similarity: 1.0,
        usageCount: 1,
        apiCallSaved: false
      };
    } catch (error) {
      console.error('[SmartResponder] Error getting response:', error);
      throw error;
    }
  }

  /**
   * Extract topic/keywords from query for categorization
   * @param {string} query - Query text
   * @param {string} category - Category
   * @returns {string} - Extracted topic
   */
  extractTopic(query, category) {
    // Simple keyword extraction - in production, could use NLP
    const text = query.toLowerCase();

    // Common medical terms to look for
    const keywords = [
      'sodium', 'potassium', 'glucose', 'hemoglobin', 'wbc', 'platelets',
      'creatinine', 'bun', 'ast', 'alt', 'bilirubin', 'troponin',
      'ct scan', 'mri', 'x-ray', 'ultrasound', 'echocardiogram',
      'chest pain', 'shortness of breath', 'fever', 'hypertension',
      'diabetes', 'copd', 'chf', 'mi', 'stroke', 'pneumonia'
    ];

    for (const keyword of keywords) {
      if (text.includes(keyword)) {
        return keyword;
      }
    }

    // Fallback to category
    return category;
  }

  /**
   * Submit feedback to improve confidence scores
   * @param {number} entryId - Knowledge base entry ID
   * @param {boolean} helpful - Whether the response was helpful
   * @param {number} rating - Rating 1-5 (optional)
   */
  async submitFeedback(entryId, helpful, rating = null) {
    const feedbackScore = helpful ? (rating ? rating / 5 : 0.9) : 0.3;
    this.knowledgeBase.updateConfidence(entryId, feedbackScore);
    console.log(`[SmartResponder] Updated confidence for entry ${entryId}: ${feedbackScore}`);
  }

  /**
   * Get learning statistics
   * @returns {Object} - Statistics about the learning system
   */
  getStats() {
    const stats = this.knowledgeBase.getStats();
    return {
      ...stats,
      similarityThreshold: this.similarityThreshold,
      estimatedCostSavings: this.calculateCostSavings(stats.estimatedApiCallsSaved)
    };
  }

  /**
   * Calculate estimated cost savings
   * @param {number} apiCallsSaved - Number of API calls saved
   * @returns {Object} - Cost savings breakdown
   */
  calculateCostSavings(apiCallsSaved) {
    // Rough estimates based on GPT-4 pricing
    const avgTokensPerCall = 2000; // Average prompt + completion
    const costPer1kTokens = 0.03; // GPT-4 average cost
    const totalTokensSaved = apiCallsSaved * avgTokensPerCall;
    const dollarsaved = (totalTokensSaved / 1000) * costPer1kTokens;

    return {
      apiCallsSaved,
      totalTokensSaved,
      estimatedDollarsSaved: dollarsSaved.toFixed(2),
      savingsPercentage: apiCallsSaved > 0 ?
        ((apiCallsSaved / (apiCallsSaved + 100)) * 100).toFixed(1) : 0
    };
  }

  /**
   * Perform maintenance on knowledge base
   * @returns {Object} - Maintenance results
   */
  performMaintenance() {
    console.log('[SmartResponder] Performing knowledge base maintenance...');

    const deletedCount = this.knowledgeBase.cleanup(0.3, 90);
    const stats = this.getStats();

    return {
      deletedEntries: deletedCount,
      remainingEntries: stats.totalEntries,
      averageConfidence: stats.averageConfidence
    };
  }
}

// Singleton instance
let smartResponderInstance = null;

export function getSmartResponder() {
  if (!smartResponderInstance) {
    smartResponderInstance = new SmartResponder();
  }
  return smartResponderInstance;
}

// Export singleton as default
export const smartResponder = getSmartResponder();

export default SmartResponder;
