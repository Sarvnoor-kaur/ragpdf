import { generateEmbedding } from './geminiService.js';
import { searchSimilarChunks } from './vectorSearchService.js';

/**
 * Handles the complete semantic search flow: 
 * Validation -> Embedding Generation -> Vector Search
 * 
 * @param {string} query - The user's search query.
 * @param {Object} options - Search configuration options.
 * @returns {Promise<Object[]>} - Array of relevant chunks.
 */
export const searchDocuments = async (query, options = {}) => {
  if (!query || typeof query !== 'string') {
    throw new Error('Search query must be a valid string.');
  }

  const trimmedQuery = query.trim();
  if (trimmedQuery.length < 3) {
    throw new Error('Search query must be at least 3 characters long.');
  }
  if (trimmedQuery.length > 500) {
    throw new Error('Search query must not exceed 500 characters.');
  }

  try {
    // 1. Generate embedding for the query
    const queryVector = await generateEmbedding(trimmedQuery);

    // 2. Perform vector search in MongoDB
    const results = await searchSimilarChunks(queryVector, options);

    return results;
  } catch (error) {
    console.error('[Search Service Error]:', error.message);
    throw error;
  }
};
