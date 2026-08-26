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
    const pipeline = [
      {
        $vectorSearch: {
          index: 'vector_index',
          path: 'embedding',
          queryVector: queryVector,
          numCandidates: numCandidates,
          limit: limit,
        },
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

    const results = await Chunk.aggregate(pipeline);
    return results;
  } catch (error) {
    console.error('[Vector Search Error]:', error.message);
    throw new Error('Failed to execute vector search. Ensure the vector_index is created and READY in Atlas.');
  }
};
