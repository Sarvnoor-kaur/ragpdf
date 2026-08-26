import Document from '../models/Document.js';
import { generateEmbedding } from './geminiService.js';
import { searchSimilarChunks } from './vectorSearchService.js';

/**
 * Handles the complete semantic search flow with access control: 
 * User Permissions -> Authorized Doc IDs -> Embedding -> Filtered Vector Search
 * 
 * @param {string} query - The user's search query.
 * @param {Object} options - Search configuration options.
 * @param {Object} user - The authenticated user object (from req.user).
 * @returns {Promise<Object[]>} - Array of relevant authorized chunks.
 */
export const searchDocuments = async (query, options = {}, user = null) => {
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
    let authorizedDocIds = null;
    if (user && user.role !== 'admin') {
      const docQuery = {
        status: 'ready',
        allowedRoles: user.role,
        $or: [{ department: 'General' }, { department: user.department }],
      };
      if (user.role === 'hr') {
        docQuery.$or = [{ department: 'HR' }, { department: 'General' }, { department: user.department }];
      }

      const authorizedDocs = await Document.find(docQuery).select('_id').lean();

      authorizedDocIds = authorizedDocs.map((d) => d._id);

      if (authorizedDocIds.length === 0) {
        return [];
      }
    }

    const searchOptions = { ...options };
    if (authorizedDocIds && authorizedDocIds.length > 0) {
      searchOptions.filter = { documentId: { $in: authorizedDocIds } };
    }

    // 1. Generate embedding for the query
    const queryVector = await generateEmbedding(trimmedQuery);

    // 2. Perform vector search in MongoDB
    const results = await searchSimilarChunks(queryVector, searchOptions);

    if (authorizedDocIds && authorizedDocIds.length > 0) {
      const idSet = new Set(authorizedDocIds.map((id) => id.toString()));
      return results.filter((chunk) => idSet.has(chunk.documentId.toString()));
    }

    return results;
  } catch (error) {
    console.error('[Search Service Error]:', error.message);
    throw error;
  }
};
