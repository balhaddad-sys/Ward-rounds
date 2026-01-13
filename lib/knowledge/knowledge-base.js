import { getKnowledgeDatabase } from '../storage/database.js';
import { generateEmbedding, cosineSimilarity } from '../ai/openai-client.js';

/**
 * Knowledge Base for self-learning system
 * Stores and retrieves previous interpretations to reduce API costs
 */
export class KnowledgeBase {
  constructor() {
    this.db = getKnowledgeDatabase();
  }

  /**
   * Store a new knowledge entry
   * @param {string} category - Category (lab, imaging, note, etc.)
   * @param {string} topic - Topic/keyword
   * @param {string} query - Original query/text
   * @param {string} response - AI response (JSON stringified)
   * @param {number} confidence - Initial confidence score
   * @returns {Promise<number>} - Entry ID
   */
  async store(category, topic, query, response, confidence = 0.8) {
    try {
      // Generate embedding for semantic search
      const embedding = await generateEmbedding(query);
      const embeddingJson = JSON.stringify(embedding);

      const stmt = this.db.prepare(`
        INSERT INTO knowledge (category, topic, query, response, embedding, confidence, usage_count, created_at, last_used)
        VALUES (?, ?, ?, ?, ?, ?, 0, datetime('now'), datetime('now'))
      `);

      const result = stmt.run(category, topic, query, response, embeddingJson, confidence);
      console.log(`[KnowledgeBase] Stored new entry: ${topic} (ID: ${result.lastInsertRowid})`);

      return result.lastInsertRowid;
    } catch (error) {
      console.error('[KnowledgeBase] Store error:', error);
      throw error;
    }
  }

  /**
   * Search for similar entries using semantic similarity
   * @param {string} query - Search query
   * @param {string} category - Category filter
   * @param {number} threshold - Similarity threshold (0-1)
   * @param {number} limit - Maximum results
   * @returns {Promise<Array>} - Matching entries with similarity scores
   */
  async search(query, category, threshold = 0.85, limit = 5) {
    try {
      // Generate embedding for query
      const queryEmbedding = await generateEmbedding(query);

      // Get all entries in category
      const stmt = this.db.prepare(`
        SELECT id, topic, query, response, embedding, confidence, usage_count, created_at, last_used
        FROM knowledge
        WHERE category = ?
        ORDER BY confidence DESC, usage_count DESC
        LIMIT 50
      `);

      const entries = stmt.all(category);

      // Calculate similarity scores
      const results = [];
      for (const entry of entries) {
        const entryEmbedding = JSON.parse(entry.embedding);
        const similarity = cosineSimilarity(queryEmbedding, entryEmbedding);

        if (similarity >= threshold) {
          results.push({
            ...entry,
            similarity,
            response: JSON.parse(entry.response)
          });
        }
      }

      // Sort by similarity and limit results
      results.sort((a, b) => b.similarity - a.similarity);
      const topResults = results.slice(0, limit);

      console.log(`[KnowledgeBase] Found ${topResults.length} matches above threshold ${threshold}`);

      return topResults;
    } catch (error) {
      console.error('[KnowledgeBase] Search error:', error);
      return [];
    }
  }

  /**
   * Increment usage count for an entry
   * @param {number} id - Entry ID
   */
  incrementUsage(id) {
    const stmt = this.db.prepare(`
      UPDATE knowledge
      SET usage_count = usage_count + 1,
          last_used = datetime('now')
      WHERE id = ?
    `);
    stmt.run(id);
  }

  /**
   * Update confidence score based on feedback
   * @param {number} id - Entry ID
   * @param {number} feedbackScore - Feedback score (0-1)
   */
  updateConfidence(id, feedbackScore) {
    // Use exponential moving average: new = 0.7 * old + 0.3 * feedback
    const stmt = this.db.prepare(`
      UPDATE knowledge
      SET confidence = confidence * 0.7 + ? * 0.3
      WHERE id = ?
    `);
    stmt.run(feedbackScore, id);
  }

  /**
   * Get statistics about the knowledge base
   * @returns {Object} - Statistics
   */
  getStats() {
    const totalStmt = this.db.prepare('SELECT COUNT(*) as count FROM knowledge');
    const total = totalStmt.get().count;

    const categoryStmt = this.db.prepare(`
      SELECT category, COUNT(*) as count
      FROM knowledge
      GROUP BY category
    `);
    const byCategory = categoryStmt.all();

    const avgConfidenceStmt = this.db.prepare('SELECT AVG(confidence) as avg FROM knowledge');
    const avgConfidence = avgConfidenceStmt.get().avg || 0;

    const totalUsageStmt = this.db.prepare('SELECT SUM(usage_count) as total FROM knowledge');
    const totalUsage = totalUsageStmt.get().total || 0;

    const topEntriesStmt = this.db.prepare(`
      SELECT topic, usage_count, confidence
      FROM knowledge
      ORDER BY usage_count DESC
      LIMIT 10
    `);
    const topEntries = topEntriesStmt.all();

    return {
      totalEntries: total,
      byCategory,
      averageConfidence: avgConfidence,
      totalUsage,
      topEntries,
      estimatedApiCallsSaved: totalUsage
    };
  }

  /**
   * Clean up low-quality or unused entries
   * @param {number} minConfidence - Minimum confidence to keep
   * @param {number} daysUnused - Days since last use
   * @returns {number} - Number of entries deleted
   */
  cleanup(minConfidence = 0.3, daysUnused = 90) {
    const stmt = this.db.prepare(`
      DELETE FROM knowledge
      WHERE confidence < ?
         OR (usage_count = 0 AND julianday('now') - julianday(created_at) > ?)
    `);

    const result = stmt.run(minConfidence, daysUnused);
    console.log(`[KnowledgeBase] Cleaned up ${result.changes} entries`);

    return result.changes;
  }

  /**
   * Full-text search using FTS5
   * @param {string} searchQuery - Search query
   * @param {number} limit - Maximum results
   * @returns {Array} - Matching entries
   */
  fullTextSearch(searchQuery, limit = 10) {
    const stmt = this.db.prepare(`
      SELECT k.id, k.category, k.topic, k.query, k.response, k.confidence, k.usage_count
      FROM knowledge_fts fts
      JOIN knowledge k ON k.id = fts.rowid
      WHERE knowledge_fts MATCH ?
      ORDER BY rank
      LIMIT ?
    `);

    const results = stmt.all(searchQuery, limit);
    return results.map(r => ({
      ...r,
      response: JSON.parse(r.response)
    }));
  }
}

// Singleton instance
let knowledgeBaseInstance = null;

export function getKnowledgeBase() {
  if (!knowledgeBaseInstance) {
    knowledgeBaseInstance = new KnowledgeBase();
  }
  return knowledgeBaseInstance;
}

export default KnowledgeBase;
