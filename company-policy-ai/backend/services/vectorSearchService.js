import Chunk from '../models/Chunk.js';

const DEFAULT_LIMIT = 5;
const DEFAULT_NUM_CANDIDATES = 100;

/**
 * Searches the MongoDB 'chunks' collection for the most similar chunks using Atlas Vector Search.
 * 
 * @param {number[]} queryVector - The 1536-dimensional query embedding.
 * @param {Object} options - Search options.
 * @param {number} options.limit - Max number of chunks to return (default: 5).
 * @param {number} options.numCandidates - Number of candidates to consider (default: 100).
 * @returns {Promise<Object[]>} - The most relevant chunks with their similarity scores.
 */
export const searchSimilarChunks = async (queryVector, options = {}) => {
  if (!queryVector || !Array.isArray(queryVector) || queryVector.length !== 1536) {
    throw new Error('Invalid query vector: must be a 1536-dimensional array.');
  }

  const limit = options.limit || DEFAULT_LIMIT;
  const numCandidates = options.numCandidates || DEFAULT_NUM_CANDIDATES;

  try {
    const vectorSearchStage = {
      index: 'vector_index',
      path: 'embedding',
      queryVector: queryVector,
      numCandidates: numCandidates,
      // Fetch more candidates when we'll filter post-search
      limit: options.filter ? Math.min(numCandidates, 100) : limit,
    };

    const pipeline = [
      {
        $vectorSearch: vectorSearchStage,
      },
      {
        $project: {
          _id: 1,
          documentId: 1,
          text: 1,
          pageStart: 1,
          pageEnd: 1,
          chunkNumber: 1,
          score: {
            $meta: 'vectorSearchScore',
          },
        },
      },
    ];

    // Apply access-control post-filter as a $match stage (safe alternative to Atlas index filter)
    if (options.filter && options.filter.documentId && options.filter.documentId.$in) {
      pipeline.push({
        $match: {
          documentId: { $in: options.filter.documentId.$in },
        },
      });
    }

    // Enforce final result limit after filtering
    pipeline.push({ $limit: limit });

    const results = await Chunk.aggregate(pipeline);
    return results;
  } catch (error) {
    console.error('[Vector Search Error]:', error.message);
    console.error('[Vector Search Error - Full]:', error);
    throw new Error(`Failed to execute vector search: ${error.message}`);
  }
};
