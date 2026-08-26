import { searchDocuments as performSearch } from '../services/searchService.js';

// ============================================================
// GET /api/search
// Access: admin, hr, employee
// ============================================================
export const searchDocuments = async (req, res) => {
  const query = req.query.q;

  if (!query || typeof query !== 'string') {
    return res.status(400).json({
      success: false,
      message: 'A valid search query is required (e.g. ?q=your question).',
    });
  }

  if (query.trim().length < 3) {
    return res.status(400).json({
      success: false,
      message: 'Search query must be at least 3 characters long.',
    });
  }

  if (query.trim().length > 500) {
    return res.status(400).json({
      success: false,
      message: 'Search query must not exceed 500 characters.',
    });
  }

  try {
    const results = await performSearch(query.trim());

    return res.status(200).json({
      success: true,
      query: query.trim(),
      results,
    });
  } catch (error) {
    console.error('[Search Controller Error]:', error.message);
    
    // Return a generic error to the client to avoid leaking internals
    return res.status(500).json({
      success: false,
      message: 'Semantic search is temporarily unavailable or an error occurred.',
    });
  }
};
